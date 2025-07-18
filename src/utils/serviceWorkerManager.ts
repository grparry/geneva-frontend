/**
 * Service Worker management utilities
 * Handles registration, updates, and communication
 */

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
  scope?: string;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private listeners: Set<(update: boolean) => void> = new Set();

  // Register service worker
  async register(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers are not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: config.scope || '/' }
      );

      this.registration = registration;

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              this.updateAvailable = true;
              this.notifyListeners(true);
              config.onUpdate?.(registration);
            } else {
              // First install
              config.onSuccess?.(registration);
            }
          }
        });
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Every hour

      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      config.onError?.(error as Error);
      return null;
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const success = await this.registration.unregister();
      if (success) {
        this.registration = null;
        this.updateAvailable = false;
      }
      return success;
    } catch (error) {
      console.error('Service worker unregistration failed:', error);
      return false;
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return;

    // Tell the service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload once the new service worker is active
    await this.waitForActivation();
    window.location.reload();
  }

  // Wait for service worker activation
  private async waitForActivation(): Promise<void> {
    return new Promise((resolve) => {
      const checkState = () => {
        if (this.registration?.active) {
          resolve();
        } else {
          setTimeout(checkState, 100);
        }
      };
      checkState();
    });
  }

  // Get cache size
  async getCacheSize(): Promise<number> {
    if (!this.registration?.active) return 0;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.size || 0);
      };

      if (this.registration?.active) {
        this.registration.active.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [messageChannel.port2]
        );
      } else {
        resolve(0);
      }

      // Timeout after 5 seconds
      setTimeout(() => resolve(0), 5000);
    });
  }

  // Clear all caches
  async clearCache(): Promise<boolean> {
    if (!this.registration?.active) return false;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.cleared || false);
      };

      if (this.registration?.active) {
        this.registration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      } else {
        resolve(false);
      }

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  // Subscribe to update notifications
  onUpdateAvailable(callback: (update: boolean) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately notify if update is available
    if (this.updateAvailable) {
      callback(true);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners
  private notifyListeners(updateAvailable: boolean): void {
    this.listeners.forEach(listener => listener(updateAvailable));
  }

  // Check if service worker is supported
  static isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  // Check if running in secure context (HTTPS or localhost)
  static isSecureContext(): boolean {
    return window.isSecureContext;
  }

  // Get registration status
  getStatus(): {
    registered: boolean;
    updateAvailable: boolean;
    active: boolean;
  } {
    return {
      registered: !!this.registration,
      updateAvailable: this.updateAvailable,
      active: !!this.registration?.active,
    };
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// React hook for service worker management
import { useEffect, useState } from 'react';

export const useServiceWorker = (config: ServiceWorkerConfig = {}) => {
  const [status, setStatus] = useState(serviceWorkerManager.getStatus());
  const [cacheSize, setCacheSize] = useState<number>(0);

  useEffect(() => {
    // Register service worker
    serviceWorkerManager.register(config);

    // Subscribe to updates
    const unsubscribe = serviceWorkerManager.onUpdateAvailable((updateAvailable) => {
      setStatus(prev => ({ ...prev, updateAvailable }));
    });

    // Update status periodically
    const interval = setInterval(() => {
      setStatus(serviceWorkerManager.getStatus());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Get cache size
  useEffect(() => {
    const fetchCacheSize = async () => {
      const size = await serviceWorkerManager.getCacheSize();
      setCacheSize(size);
    };

    fetchCacheSize();
    const interval = setInterval(fetchCacheSize, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  return {
    ...status,
    cacheSize,
    skipWaiting: () => serviceWorkerManager.skipWaiting(),
    clearCache: () => serviceWorkerManager.clearCache(),
    unregister: () => serviceWorkerManager.unregister(),
  };
};

// Utility to format cache size
export const formatCacheSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default serviceWorkerManager;