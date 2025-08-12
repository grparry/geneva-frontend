/**
 * Configuration and error handling for analytics API
 * Migrated to use TenantApiClient for consistent tenant header injection
 */

import { BaseQueryFn, FetchArgs, FetchBaseQueryError, retry } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { createAnalyticsApiClient } from './createApiClient';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

// Create a mutex for token refresh
const mutex = new Mutex();

// Create tenant-aware analytics API client
const analyticsApiClient = createAnalyticsApiClient();

// Custom error types
export interface AnalyticsApiError {
  status: number;
  message: string;
  details?: any;
  retryAfter?: number;
}

// Rate limiting configuration
const RATE_LIMIT_STATUS = 429;
const DEFAULT_RETRY_AFTER = 5000; // 5 seconds
const MAX_RETRIES = 3;

// Custom base query using TenantApiClient
const baseQuery: BaseQueryFn<
  string | (FetchArgs & { axiosConfig?: AxiosRequestConfig }),
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  try {
    let url: string;
    let config: AxiosRequestConfig = {};
    
    if (typeof args === 'string') {
      url = args;
    } else {
      url = args.url;
      if (args.method && args.method !== 'GET') {
        config.method = args.method as any;
      }
      if (args.body) {
        config.data = args.body;
      }
      if (args.params) {
        config.params = args.params;
      }
      if (args.axiosConfig) {
        config = { ...config, ...args.axiosConfig };
      }
    }

    let response: AxiosResponse;
    const method = config.method?.toLowerCase() || 'get';
    
    switch (method) {
      case 'post':
        response = await analyticsApiClient.post(url, config.data, { params: config.params });
        break;
      case 'put':
        response = await analyticsApiClient.put(url, config.data, { params: config.params });
        break;
      case 'patch':
        response = await analyticsApiClient.patch(url, config.data, { params: config.params });
        break;
      case 'delete':
        response = await analyticsApiClient.delete(url, { params: config.params });
        break;
      default:
        response = await analyticsApiClient.get(url, { params: config.params });
    }
    
    return { data: response.data };
  } catch (axiosError: any) {
    let error: FetchBaseQueryError = {
      status: 'FETCH_ERROR',
      error: 'Request failed',
    };

    if (axiosError.response) {
      error = {
        status: axiosError.response.status,
        data: axiosError.response.data,
      };
    } else if (axiosError.request) {
      error = {
        status: 'FETCH_ERROR',
        error: 'Network error',
      };
    } else {
      error = {
        status: 'PARSING_ERROR',
        originalStatus: 0,
        data: axiosError.message,
        error: axiosError.message,
      };
    }

    return { error };
  }
};

// Base query with tenant context - no auth needed since TenantApiClient handles it
const baseQueryWithTenantContext = baseQuery;

// Add retry logic with exponential backoff
export const baseQueryWithRetry = retry(
  async (args: string | FetchArgs, api, extraOptions) => {
    const result = await baseQueryWithTenantContext(args, api, extraOptions);
    
    // Handle rate limiting
    if (result.error && result.error.status === RATE_LIMIT_STATUS) {
      const retryAfter = (result.error.data as any)?.retryAfter || DEFAULT_RETRY_AFTER;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      
      // Return error to trigger retry
      return { error: result.error };
    }
    
    // Handle other errors
    if (result.error) {
      // Transform error for better handling
      const error: AnalyticsApiError = {
        status: result.error.status as number,
        message: (result.error.data as any)?.message || 'An error occurred',
        details: result.error.data,
      };
      
      // Log error for monitoring
      console.error('[Analytics API Error]', error);
      
      // Don't retry client errors (4xx except 429)
      if (error.status >= 400 && error.status < 500 && error.status !== RATE_LIMIT_STATUS) {
        return { error: { status: 'CUSTOM_ERROR', error } };
      }
    }
    
    return result;
  },
  {
    maxRetries: MAX_RETRIES,
    backoff: async (attempt, maxRetries) => {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      console.log(`Retrying analytics API request (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    },
  }
);

// Error message formatter
export const formatAnalyticsError = (error: any): string => {
  if (error?.data?.message) {
    return error.data.message;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  switch (error?.status) {
    case 400:
      return 'Invalid request parameters';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 404:
      return 'Resource not found';
    case 429:
      return 'Too many requests, please try again later';
    case 500:
      return 'Server error, please try again later';
    case 503:
      return 'Service temporarily unavailable';
    default:
      return 'An unexpected error occurred';
  }
};

// Request timeout configuration
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Cache configuration
export const CACHE_CONFIG = {
  // KPI metrics cache for 5 minutes
  kpiMetrics: 5 * 60,
  // Cost breakdown cache for 5 minutes
  costBreakdown: 5 * 60,
  // Workflow performance cache for 5 minutes
  workflowPerformance: 5 * 60,
  // Agent performance cache for 5 minutes
  agentPerformance: 5 * 60,
  // Trends cache for 10 minutes
  trends: 10 * 60,
  // Alerts cache for 1 minute
  alerts: 60,
};

// Polling intervals for real-time data
export const POLLING_INTERVALS = {
  // Live metrics polling every 30 seconds
  liveMetrics: 30000,
  // Alerts polling every 10 seconds
  alerts: 10000,
  // KPI updates every minute
  kpiUpdates: 60000,
};

// Error recovery strategies
export const errorRecoveryStrategies = {
  // Retry with exponential backoff for server errors
  serverError: {
    shouldRetry: true,
    maxRetries: 3,
    backoffMultiplier: 2,
  },
  // Don't retry client errors
  clientError: {
    shouldRetry: false,
  },
  // Special handling for rate limits
  rateLimit: {
    shouldRetry: true,
    maxRetries: 5,
    useRetryAfterHeader: true,
  },
  // Network errors get immediate retry
  networkError: {
    shouldRetry: true,
    maxRetries: 2,
    initialDelay: 1000,
  },
};

// Export error boundary fallback component props
export interface AnalyticsErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

// Helper to determine if an error is retryable
export const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const status = error?.status || error?.originalStatus;
  
  // Network errors
  if (!status || status === 0) return true;
  
  // Server errors
  if (status >= 500) return true;
  
  // Rate limiting
  if (status === 429) return true;
  
  // Request timeout
  if (status === 408) return true;
  
  return false;
};