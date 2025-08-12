/**
 * API Client Factory for Geneva Platform
 * Creates environment-aware TenantApiClient instances
 */

import { TenantApiClient, TenantApiClientConfig } from './TenantApiClient';

export interface ApiEnvironmentConfig {
  development: TenantApiClientConfig;
  staging: TenantApiClientConfig;
  production: TenantApiClientConfig;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';

export const apiConfig: ApiEnvironmentConfig = {
  development: {
    // Explicit customer always required - no defaults
    tenantRequired: true,
    baseURL: API_BASE + '/api',
    timeout: 30000,
    // Backend: single database with multiple customers via customer_id
  },
  staging: {
    // Explicit customer always required - no defaults  
    tenantRequired: true,
    baseURL: API_BASE + '/api',
    timeout: 30000,
    // Backend: could be single or multi-database deployment
  },
  production: {
    // Explicit customer always required - no defaults
    tenantRequired: true,
    baseURL: API_BASE + '/api',
    timeout: 30000,
    // Backend: likely multi-database deployment for better isolation
  }
};

// Environment detection
export const getCurrentEnvironment = (): keyof ApiEnvironmentConfig => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('dev')) {
    return 'staging';
  } else {
    return 'production';
  }
};

// API Client factory (always requires tenant)
export const createApiClient = (environment?: keyof ApiEnvironmentConfig): TenantApiClient => {
  const env = environment || getCurrentEnvironment();
  const config = apiConfig[env];
  
  console.log(`🏗️ Creating TenantApiClient for environment: ${env}`);
  
  return new TenantApiClient(config);
};

// Default API client instance for general use
export const defaultApiClient = createApiClient();

// Specialized API clients for different services
export const createChronosApiClient = (): TenantApiClient => {
  const env = getCurrentEnvironment();
  return new TenantApiClient({
    ...apiConfig[env],
    baseURL: API_BASE + '/chronos/deployment'
  });
};

export const createAnalyticsApiClient = (): TenantApiClient => {
  const env = getCurrentEnvironment();
  return new TenantApiClient({
    ...apiConfig[env],
    baseURL: API_BASE + '/api/analytics'
  });
};

export const createChatApiClient = (): TenantApiClient => {
  const env = getCurrentEnvironment();
  return new TenantApiClient({
    ...apiConfig[env],
    baseURL: API_BASE + '/api/chat'
  });
};