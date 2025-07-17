/**
 * Custom hooks for chart performance optimization
 * Implements debouncing, memoization, and lazy loading strategies
 */

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { debounce, throttle } from 'lodash';
import { useIntersectionObserver } from './useIntersectionObserver';

// Chart data processing options
interface ChartOptimizationOptions {
  debounceMs?: number;
  throttleMs?: number;
  maxDataPoints?: number;
  enableSampling?: boolean;
  enableLazyRender?: boolean;
  enableWebWorker?: boolean;
}

// Data sampling strategies
export const samplingStrategies = {
  // LTTB (Largest Triangle Three Buckets) algorithm
  lttb: (data: any[], targetSize: number) => {
    if (data.length <= targetSize) return data;
    
    const bucketSize = Math.floor((data.length - 2) / (targetSize - 2));
    const sampled = [data[0]]; // Always include first point
    
    for (let i = 0; i < targetSize - 2; i++) {
      const startIdx = (i * bucketSize) + 1;
      const endIdx = ((i + 1) * bucketSize) + 1;
      
      // Find the point with maximum area
      let maxArea = -1;
      let maxAreaIdx = startIdx;
      
      for (let j = startIdx; j < endIdx && j < data.length - 1; j++) {
        const area = Math.abs(
          (data[j].x - data[sampled.length - 1].x) * (data[endIdx].y - data[sampled.length - 1].y) -
          (data[endIdx].x - data[sampled.length - 1].x) * (data[j].y - data[sampled.length - 1].y)
        );
        
        if (area > maxArea) {
          maxArea = area;
          maxAreaIdx = j;
        }
      }
      
      sampled.push(data[maxAreaIdx]);
    }
    
    sampled.push(data[data.length - 1]); // Always include last point
    return sampled;
  },
  
  // Simple nth-point sampling
  nth: (data: any[], targetSize: number) => {
    if (data.length <= targetSize) return data;
    
    const step = Math.ceil(data.length / targetSize);
    return data.filter((_, index) => index % step === 0);
  },
  
  // Min/max preservation sampling
  minMax: (data: any[], targetSize: number, yKey: string = 'y') => {
    if (data.length <= targetSize) return data;
    
    const bucketSize = Math.ceil(data.length / targetSize);
    const sampled: any[] = [];
    
    for (let i = 0; i < data.length; i += bucketSize) {
      const bucket = data.slice(i, i + bucketSize);
      if (bucket.length === 0) continue;
      
      // Find min and max in bucket
      const sorted = [...bucket].sort((a, b) => a[yKey] - b[yKey]);
      sampled.push(sorted[0]); // Min
      if (sorted.length > 1) {
        sampled.push(sorted[sorted.length - 1]); // Max
      }
    }
    
    return sampled;
  },
};

// Web Worker for data processing
const createChartWorker = () => {
  const workerCode = `
    self.onmessage = function(e) {
      const { type, data, options } = e.data;
      
      switch (type) {
        case 'process':
          // Perform heavy calculations
          const processed = data.map(item => ({
            ...item,
            // Add any intensive calculations here
            calculated: Math.sqrt(item.value * 2),
          }));
          self.postMessage({ type: 'processed', data: processed });
          break;
          
        case 'aggregate':
          // Perform aggregations
          const aggregated = data.reduce((acc, item) => {
            const key = item.category;
            if (!acc[key]) {
              acc[key] = { count: 0, sum: 0, values: [] };
            }
            acc[key].count++;
            acc[key].sum += item.value;
            acc[key].values.push(item.value);
            return acc;
          }, {});
          self.postMessage({ type: 'aggregated', data: aggregated });
          break;
      }
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

// Main optimization hook
export const useChartOptimization = <T = any>(
  data: T[],
  options: ChartOptimizationOptions = {}
) => {
  const {
    debounceMs = 300,
    throttleMs = 100,
    maxDataPoints = 1000,
    enableSampling = true,
    enableLazyRender = true,
    enableWebWorker = false,
  } = options;
  
  const [processedData, setProcessedData] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  
  // Initialize worker
  useEffect(() => {
    if (enableWebWorker && typeof Worker !== 'undefined') {
      workerRef.current = createChartWorker();
      
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'processed') {
          setProcessedData(e.data.data);
          setIsProcessing(false);
        }
      };
      
      return () => {
        workerRef.current?.terminate();
      };
    }
  }, [enableWebWorker]);
  
  // Process data with optimizations
  const processData = useCallback((rawData: T[]) => {
    setIsProcessing(true);
    
    // Apply sampling if needed
    let processed = rawData;
    if (enableSampling && rawData.length > maxDataPoints) {
      processed = samplingStrategies.lttb(rawData as any, maxDataPoints) as T[];
    }
    
    // Use web worker for heavy processing
    if (enableWebWorker && workerRef.current) {
      workerRef.current.postMessage({
        type: 'process',
        data: processed,
      });
    } else {
      setProcessedData(processed);
      setIsProcessing(false);
    }
  }, [enableSampling, maxDataPoints, enableWebWorker]);
  
  // Debounced processing
  const debouncedProcess = useMemo(
    () => debounce(processData, debounceMs),
    [processData, debounceMs]
  );
  
  // Throttled processing
  const throttledProcess = useMemo(
    () => throttle(processData, throttleMs),
    [processData, throttleMs]
  );
  
  // Process data on change
  useEffect(() => {
    if (data && data.length > 0) {
      if (debounceMs > 0) {
        debouncedProcess(data);
      } else if (throttleMs > 0) {
        throttledProcess(data);
      } else {
        processData(data);
      }
    }
    
    return () => {
      debouncedProcess.cancel();
      throttledProcess.cancel();
    };
  }, [data, debouncedProcess, throttledProcess, processData, debounceMs, throttleMs]);
  
  return {
    data: processedData,
    isProcessing,
    originalDataLength: data.length,
    processedDataLength: processedData.length,
    samplingRatio: data.length > 0 ? processedData.length / data.length : 1,
  };
};

// Lazy rendering hook for charts
export const useLazyChartRender = (
  ref: React.RefObject<HTMLElement>,
  options: {
    rootMargin?: string;
    threshold?: number;
    fallback?: React.ReactNode;
  } = {}
) => {
  const { isIntersecting } = useIntersectionObserver(ref, {
    rootMargin: options.rootMargin || '100px',
    threshold: options.threshold || 0.1,
  });
  
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (isIntersecting && !shouldRender) {
      setShouldRender(true);
    }
  }, [isIntersecting, shouldRender]);
  
  return {
    shouldRender,
    isVisible: isIntersecting,
  };
};

// Chart animation optimization hook
export const useChartAnimation = (
  enabled: boolean = true,
  duration: number = 500
) => {
  const [animationEnabled, setAnimationEnabled] = useState(enabled);
  const animationFrame = useRef<number | null>(null);
  
  useEffect(() => {
    // Disable animations during rapid updates
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setAnimationEnabled(false);
    }
    
    const handleChange = (e: MediaQueryListEvent) => {
      setAnimationEnabled(!e.matches && enabled);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enabled]);
  
  const requestAnimation = useCallback((callback: () => void) => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    animationFrame.current = requestAnimationFrame(() => {
      callback();
      animationFrame.current = null;
    });
  }, []);
  
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);
  
  return {
    animationEnabled,
    animationDuration: animationEnabled ? duration : 0,
    requestAnimation,
  };
};

// Memoized chart configuration hook
export const useChartConfig = <T extends Record<string, any>>(
  baseConfig: T,
  dependencies: any[] = []
) => {
  return useMemo(() => ({
    ...baseConfig,
    // Add performance optimizations
    animation: {
      ...baseConfig.animation,
      duration: 300,
      easing: 'easeInOutQuad',
    },
    interaction: {
      ...baseConfig.interaction,
      mode: 'nearest',
      intersect: false,
    },
    elements: {
      ...baseConfig.elements,
      line: {
        ...baseConfig.elements?.line,
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        ...baseConfig.elements?.point,
        radius: 0, // Hide points for better performance
        hitRadius: 10,
        hoverRadius: 4,
      },
    },
    plugins: {
      ...baseConfig.plugins,
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        samples: 500,
      },
    },
  }), [...dependencies]);
};

// Export all hooks and utilities
export default {
  useChartOptimization,
  useLazyChartRender,
  useChartAnimation,
  useChartConfig,
  samplingStrategies,
};