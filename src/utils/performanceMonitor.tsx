/**
 * Performance monitoring utilities for analytics
 * Tracks metrics, identifies bottlenecks, and provides optimization suggestions
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'render' | 'api' | 'interaction' | 'resource';
  severity?: 'good' | 'warning' | 'critical';
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  render: {
    good: 16, // 60 FPS
    warning: 50,
    critical: 100,
  },
  api: {
    good: 200,
    warning: 1000,
    critical: 3000,
  },
  interaction: {
    good: 100,
    warning: 300,
    critical: 500,
  },
  resource: {
    memoryUsage: {
      good: 50, // MB
      warning: 100,
      critical: 200,
    },
    bundleSize: {
      good: 500, // KB
      warning: 1000,
      critical: 2000,
    },
  },
};

// Performance observer for web vitals
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private callbacks: Set<(metrics: PerformanceMetric[]) => void> = new Set();
  private rafId: number | null = null;
  private lastFrameTime = 0;

  constructor() {
    this.initializeObservers();
    this.trackFrameRate();
  }

  // Initialize performance observers
  private initializeObservers(): void {
    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'long-task',
              value: entry.duration,
              unit: 'ms',
              timestamp: Date.now(),
              category: 'render',
              severity: this.getSeverity('render', entry.duration),
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }

      // Observe layout shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          let cls = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          if (cls > 0) {
            this.recordMetric({
              name: 'cumulative-layout-shift',
              value: cls,
              unit: 'score',
              timestamp: Date.now(),
              category: 'render',
              severity: cls < 0.1 ? 'good' : cls < 0.25 ? 'warning' : 'critical',
            });
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutShiftObserver);
      } catch (e) {
        console.warn('Layout shift observer not supported');
      }

      // Observe largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric({
            name: 'largest-contentful-paint',
            value: lastEntry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: 'render',
            severity: this.getSeverity('render', lastEntry.startTime),
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Observe first input delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'first-input-delay',
              value: (entry as any).processingStart - entry.startTime,
              unit: 'ms',
              timestamp: Date.now(),
              category: 'interaction',
              severity: this.getSeverity('interaction', (entry as any).processingStart - entry.startTime),
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }
  }

  // Track frame rate
  private trackFrameRate(): void {
    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        
        // Only record if significantly different from 60 FPS
        if (fps < 55 || fps > 65) {
          this.recordMetric({
            name: 'frame-rate',
            value: fps,
            unit: 'fps',
            timestamp: Date.now(),
            category: 'render',
            severity: fps >= 55 ? 'good' : fps >= 30 ? 'warning' : 'critical',
          });
        }
      }
      
      this.lastFrameTime = timestamp;
      this.rafId = requestAnimationFrame(measureFPS);
    };
    
    this.rafId = requestAnimationFrame(measureFPS);
  }

  // Get severity based on thresholds
  private getSeverity(category: string, value: number): 'good' | 'warning' | 'critical' {
    const thresholds = PERFORMANCE_THRESHOLDS[category as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds || typeof thresholds !== 'object') return 'good';

    if ('good' in thresholds) {
      if (value <= thresholds.good) return 'good';
      if (value <= thresholds.warning) return 'warning';
      return 'critical';
    }

    return 'good';
  }

  // Record a metric
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    // Notify callbacks
    this.notifyCallbacks();
  }

  // Track API call performance
  trackAPICall(endpoint: string, duration: number, status: number): void {
    this.recordMetric({
      name: `api-${endpoint}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'api',
      severity: status >= 400 ? 'critical' : this.getSeverity('api', duration),
    });
  }

  // Track component render time
  trackComponentRender(componentName: string, duration: number): void {
    this.recordMetric({
      name: `render-${componentName}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'render',
      severity: this.getSeverity('render', duration),
    });
  }

  // Track memory usage
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemoryMB = memory.usedJSHeapSize / 1024 / 1024;
      
      this.recordMetric({
        name: 'memory-usage',
        value: usedMemoryMB,
        unit: 'MB',
        timestamp: Date.now(),
        category: 'resource',
        severity: usedMemoryMB < 50 ? 'good' : usedMemoryMB < 100 ? 'warning' : 'critical',
      });
    }
  }

  // Get metrics summary
  getMetricsSummary(): {
    byCategory: Record<string, PerformanceMetric[]>;
    criticalIssues: PerformanceMetric[];
    averages: Record<string, number>;
  } {
    const byCategory: Record<string, PerformanceMetric[]> = {};
    const criticalIssues: PerformanceMetric[] = [];
    const sums: Record<string, { sum: number; count: number }> = {};
    
    this.metrics.forEach(metric => {
      // Group by category
      if (!byCategory[metric.category]) {
        byCategory[metric.category] = [];
      }
      byCategory[metric.category].push(metric);
      
      // Collect critical issues
      if (metric.severity === 'critical') {
        criticalIssues.push(metric);
      }
      
      // Calculate averages
      const key = `${metric.category}-${metric.name}`;
      if (!sums[key]) {
        sums[key] = { sum: 0, count: 0 };
      }
      sums[key].sum += metric.value;
      sums[key].count += 1;
    });
    
    // Calculate averages
    const averages: Record<string, number> = {};
    Object.entries(sums).forEach(([key, { sum, count }]) => {
      averages[key] = sum / count;
    });
    
    return { byCategory, criticalIssues, averages };
  }

  // Subscribe to metrics updates
  subscribe(callback: (metrics: PerformanceMetric[]) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Notify all callbacks
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback(this.metrics));
  }

  // Cleanup
  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.callbacks.clear();
    this.metrics = [];
  }

  // Export metrics
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
    this.notifyCallbacks();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [summary, setSummary] = useState(performanceMonitor.getMetricsSummary());

  useEffect(() => {
    // Subscribe to metrics updates
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setSummary(performanceMonitor.getMetricsSummary());
    });

    // Track memory usage periodically
    const memoryInterval = setInterval(() => {
      performanceMonitor.trackMemoryUsage();
    }, 10000); // Every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(memoryInterval);
    };
  }, []);

  const trackAPICall = useCallback((endpoint: string, duration: number, status: number) => {
    performanceMonitor.trackAPICall(endpoint, duration, status);
  }, []);

  const trackComponentRender = useCallback((componentName: string, duration: number) => {
    performanceMonitor.trackComponentRender(componentName, duration);
  }, []);

  const clearMetrics = useCallback(() => {
    performanceMonitor.clearMetrics();
  }, []);

  const exportMetrics = useCallback(() => {
    return performanceMonitor.exportMetrics();
  }, []);

  return {
    metrics,
    summary,
    trackAPICall,
    trackComponentRender,
    clearMetrics,
    exportMetrics,
  };
};

// HOC for component performance tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const renderStartRef = useRef<number>(0);

    useEffect(() => {
      renderStartRef.current = performance.now();
      
      return () => {
        const renderDuration = performance.now() - renderStartRef.current;
        performanceMonitor.trackComponentRender(componentName, renderDuration);
      };
    });

    return <Component {...props} />;
  };
};

// Utility to measure async operation performance
export const measurePerformance = async <T,>(
  operation: () => Promise<T>,
  name: string,
  category: 'api' | 'interaction' = 'api'
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - start;
    
    performanceMonitor.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category,
      severity: duration < 200 ? 'good' : duration < 1000 ? 'warning' : 'critical',
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    performanceMonitor.recordMetric({
      name: `${name}-error`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category,
      severity: 'critical',
    });
    
    throw error;
  }
};

export default performanceMonitor;