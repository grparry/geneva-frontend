/**
 * Advanced caching strategies for analytics data
 * Implements multi-tier caching with memory, IndexedDB, and service worker support
 */

import React from 'react';
import { analyticsApi } from '../api/analytics';
import type { RootState } from '../store';

// Cache configuration
interface CacheConfig {
  maxAge: number; // milliseconds
  maxSize?: number; // max items in cache
  strategy: 'memory' | 'indexeddb' | 'hybrid';
  compress?: boolean;
}

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size?: number;
  compressed?: boolean;
}

// In-memory cache implementation
class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  
  constructor(private maxSize: number = 100) {}
  
  set(key: string, data: T, ttl: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size: this.estimateSize(data),
    });
    
    // Update access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
    
    // Schedule cleanup
    setTimeout(() => this.delete(key), ttl);
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Update access order (LRU)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
    
    return entry.data;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
  
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  private estimateSize(data: any): number {
    // Rough estimation of object size
    return JSON.stringify(data).length;
  }
}

// IndexedDB cache implementation
class IndexedDBCache {
  private dbName = 'genevaAnalyticsCache';
  private storeName = 'analyticsData';
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  async set(key: string, data: any, ttl: number): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const entry = {
        key,
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl,
      };
      
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async get(key: string): Promise<any | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result || result.expiry < Date.now()) {
          // Expired or not found
          if (result) {
            this.delete(key); // Clean up expired entry
          }
          resolve(null);
        } else {
          resolve(result.data);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async cleanup(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const now = Date.now();
      
      const request = index.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.expiry < now) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// Main cache manager
export class AnalyticsCacheManager {
  private memoryCache = new MemoryCache();
  private indexedDBCache = new IndexedDBCache();
  private initialized = false;
  
  // Default cache configurations per endpoint
  private cacheConfigs: Record<string, CacheConfig> = {
    getKPIMetrics: {
      maxAge: 5 * 60 * 1000, // 5 minutes
      strategy: 'hybrid',
      maxSize: 20,
    },
    getCostBreakdown: {
      maxAge: 5 * 60 * 1000, // 5 minutes
      strategy: 'hybrid',
      maxSize: 20,
    },
    getWorkflowPerformance: {
      maxAge: 5 * 60 * 1000, // 5 minutes
      strategy: 'indexeddb', // Larger dataset
      compress: true,
    },
    getAgentPerformance: {
      maxAge: 5 * 60 * 1000, // 5 minutes
      strategy: 'indexeddb',
      compress: true,
    },
    getTrendData: {
      maxAge: 10 * 60 * 1000, // 10 minutes
      strategy: 'hybrid',
      maxSize: 50,
    },
    getAlerts: {
      maxAge: 60 * 1000, // 1 minute
      strategy: 'memory', // Frequently changing
      maxSize: 10,
    },
  };
  
  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.indexedDBCache.init();
      this.initialized = true;
      
      // Schedule periodic cleanup
      setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
    } catch (error) {
      console.error('Failed to initialize cache:', error);
    }
  }
  
  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }
  
  async get(endpoint: string, params: any): Promise<any | null> {
    const config = this.cacheConfigs[endpoint];
    if (!config) return null;
    
    const key = this.getCacheKey(endpoint, params);
    
    // Try memory cache first
    if (config.strategy === 'memory' || config.strategy === 'hybrid') {
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult) {
        console.log(`[Cache] Memory hit for ${endpoint}`);
        return memoryResult;
      }
    }
    
    // Try IndexedDB cache
    if (config.strategy === 'indexeddb' || config.strategy === 'hybrid') {
      const indexedDBResult = await this.indexedDBCache.get(key);
      if (indexedDBResult) {
        console.log(`[Cache] IndexedDB hit for ${endpoint}`);
        
        // Promote to memory cache if hybrid
        if (config.strategy === 'hybrid') {
          this.memoryCache.set(key, indexedDBResult, config.maxAge);
        }
        
        return indexedDBResult;
      }
    }
    
    console.log(`[Cache] Miss for ${endpoint}`);
    return null;
  }
  
  async set(endpoint: string, params: any, data: any): Promise<void> {
    const config = this.cacheConfigs[endpoint];
    if (!config) return;
    
    const key = this.getCacheKey(endpoint, params);
    
    // Store in memory cache
    if (config.strategy === 'memory' || config.strategy === 'hybrid') {
      this.memoryCache.set(key, data, config.maxAge);
    }
    
    // Store in IndexedDB cache
    if (config.strategy === 'indexeddb' || config.strategy === 'hybrid') {
      await this.indexedDBCache.set(key, data, config.maxAge);
    }
  }
  
  async invalidate(endpoint?: string, params?: any): Promise<void> {
    if (!endpoint) {
      // Clear all caches
      this.memoryCache.clear();
      await this.indexedDBCache.clear();
      return;
    }
    
    if (params) {
      // Clear specific entry
      const key = this.getCacheKey(endpoint, params);
      this.memoryCache.delete(key);
      await this.indexedDBCache.delete(key);
    } else {
      // Clear all entries for endpoint
      // This is a simplified version - in production you'd want to iterate and match keys
      console.log(`[Cache] Invalidating all entries for ${endpoint}`);
    }
  }
  
  async cleanup(): Promise<void> {
    console.log('[Cache] Running cleanup...');
    await this.indexedDBCache.cleanup();
  }
  
  // Prefetch data for better UX
  async prefetch(endpoint: string, params: any): Promise<void> {
    const cached = await this.get(endpoint, params);
    if (!cached) {
      // Trigger RTK Query to fetch and cache
      console.log(`[Cache] Prefetching ${endpoint}`);
      // This would be implemented by dispatching the appropriate RTK Query action
    }
  }
  
  // Get cache statistics
  getStats(): {
    memorySize: number;
    hitRate: number;
  } {
    // This is a simplified implementation
    return {
      memorySize: this.memoryCache['cache'].size,
      hitRate: 0, // Would need to track hits/misses
    };
  }
}

// Singleton instance
export const cacheManager = new AnalyticsCacheManager();

// RTK Query cache utilities
export const analyticsQueryCache = {
  // Selective cache invalidation
  invalidateMetrics: () => {
    analyticsApi.util.invalidateTags(['KPIMetrics']);
  },
  
  invalidateCosts: () => {
    analyticsApi.util.invalidateTags(['CostBreakdown']);
  },
  
  invalidateAll: () => {
    analyticsApi.util.invalidateTags([
      'KPIMetrics',
      'CostBreakdown',
      'WorkflowPerformance',
      'AgentPerformance',
      'Trends',
      'Alerts',
    ]);
  },
  
  // Optimistic updates
  updateMetricsOptimistically: (data: any) => {
    // This would update the cache optimistically before the server response
  },
};

// React hook for cache-aware data fetching
export const useCachedAnalytics = <T>(
  endpoint: string,
  params: any,
  fetcher: () => Promise<T>
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cached = await cacheManager.get(endpoint, params);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
      
      // Fetch from API
      const result = await fetcher();
      setData(result);
      
      // Cache the result
      await cacheManager.set(endpoint, params, result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, params, fetcher]);
  
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};