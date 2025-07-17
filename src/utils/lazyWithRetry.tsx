/**
 * Enhanced lazy loading with retry logic and error handling
 * Handles chunk loading failures gracefully
 */

import React, { ComponentType, lazy, Suspense } from 'react';
import { Box, CircularProgress, Button, Typography } from '@mui/material';
import { RefreshRounded } from '@mui/icons-material';

// Retry configuration
interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attemptNumber: number) => void;
}

// Loading fallback component
export const LazyLoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 400,
      gap: 2,
    }}
  >
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Error fallback component
export const LazyErrorFallback: React.FC<{
  error?: Error;
  retry?: () => void;
}> = ({ error, retry }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 400,
      gap: 2,
      p: 3,
    }}
  >
    <Typography variant="h6" color="error">
      Failed to load component
    </Typography>
    <Typography variant="body2" color="text.secondary" align="center">
      {error?.message || 'An error occurred while loading this page.'}
    </Typography>
    {retry && (
      <Button
        variant="outlined"
        startIcon={<RefreshRounded />}
        onClick={retry}
      >
        Retry
      </Button>
    )}
  </Box>
);

// Lazy load with retry logic
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: RetryConfig = {}
): React.LazyExoticComponent<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = config;
  
  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add cache busting for retries after the first attempt
        if (attempt > 0) {
          // Clear module cache
          if ('webpackChunkName' in importFn) {
            // Force webpack to reload the chunk
            delete window.__webpack_require__.cache[importFn.toString()];
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          
          // Call retry callback
          onRetry?.(attempt + 1);
        }
        
        return await importFn();
      } catch (error) {
        lastError = error as Error;
        console.error(`Failed to load component (attempt ${attempt + 1}/${maxRetries}):`, error);
        
        // Check if it's a chunk loading error
        if (error instanceof Error && error.message.includes('Loading chunk')) {
          // Try to recover by reloading the page on the last attempt
          if (attempt === maxRetries - 1) {
            // Store the current URL to return after reload
            sessionStorage.setItem('analytics_retry_url', window.location.href);
            window.location.reload();
          }
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError || new Error('Failed to load component after multiple attempts');
  });
}

// Component wrapper with error boundary
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface LazyComponentWrapperState {
  hasError: boolean;
  error: Error | null;
}

export class LazyComponentWrapper extends React.Component<
  LazyComponentWrapperProps,
  LazyComponentWrapperState
> {
  constructor(props: LazyComponentWrapperProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LazyComponentWrapperState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // Force re-render to retry loading
    this.forceUpdate();
  };

  render() {
    if (this.state.hasError) {
      return this.props.errorFallback || (
        <LazyErrorFallback
          error={this.state.error}
          retry={this.handleRetry}
        />
      );
    }

    return (
      <Suspense fallback={this.props.fallback || <LazyLoadingFallback />}>
        {this.props.children}
      </Suspense>
    );
  }
}

// HOC for lazy loaded components
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  } = {}
) {
  return (props: P) => (
    <LazyComponentWrapper
      fallback={options.fallback}
      errorFallback={options.errorFallback}
      onError={options.onError}
    >
      <Component {...props} />
    </LazyComponentWrapper>
  );
}

// Preload component utility
export async function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>
): Promise<void> {
  try {
    await importFn();
  } catch (error) {
    console.error('Failed to preload component:', error);
  }
}

// Preload multiple components
export async function preloadComponents(
  importFns: Array<() => Promise<{ default: ComponentType<any> }>>
): Promise<void> {
  await Promise.all(importFns.map(fn => preloadComponent(fn)));
}

// Route-based preloading strategy
export const createRoutePreloader = (routes: Record<string, () => Promise<{ default: ComponentType<any> }>>) => {
  const preloadedRoutes = new Set<string>();
  
  return {
    preload: async (routeName: string) => {
      if (!preloadedRoutes.has(routeName) && routes[routeName]) {
        preloadedRoutes.add(routeName);
        await preloadComponent(routes[routeName]);
      }
    },
    preloadAll: async () => {
      await preloadComponents(Object.values(routes));
    },
    isPreloaded: (routeName: string) => preloadedRoutes.has(routeName),
  };
};

// Intersection Observer for preloading on hover/visibility
export const usePreloadOnHover = (
  preloadFn: () => Promise<void>,
  delay: number = 200
) => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  
  const handleMouseEnter = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      preloadFn();
    }, delay);
  }, [preloadFn, delay]);
  
  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
};