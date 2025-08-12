/**
 * Unified Tenant API Client for Geneva Platform
 * Ensures all API calls include proper X-Customer-ID and X-Project-ID headers
 * Based on the proven Chat API pattern
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { SUPERADMIN_CUSTOMER_ID } from '../constants/tenant';

export interface TenantContext {
  customerId: string;
  projectId: string;
}

export interface TenantApiClientConfig {
  baseURL: string;
  timeout?: number;
  tenantRequired?: boolean;
}

export class TenantApiClient {
  private client: AxiosInstance;
  private config: TenantApiClientConfig;

  constructor(config: TenantApiClientConfig) {
    this.config = {
      timeout: 30000,
      tenantRequired: true,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: Add tenant headers
    this.client.interceptors.request.use((config) => {
      const tenantContext = this.getTenantContext();
      
      if (tenantContext) {
        config.headers['X-Customer-ID'] = tenantContext.customerId;
        config.headers['X-Project-ID'] = tenantContext.projectId;
        console.log(`🏢 TenantApiClient: Added tenant headers - Customer: ${tenantContext.customerId}, Project: ${tenantContext.projectId}`);
      } else if (this.config.tenantRequired) {
        console.warn('⚠️ TenantApiClient: Missing tenant context for required endpoint:', config.url);
        // Still allow the request - let backend handle the validation
      }

      return config;
    });

    // Response interceptor: Handle tenant-related errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 400) {
          const message = error.response?.data?.detail || '';
          if (message.includes('Customer ID required') || message.includes('customer')) {
            console.error('❌ TenantApiClient: Customer context required:', message);
            // Could dispatch a store action to show tenant selection dialog
          }
        } else if (error.response?.status === 403) {
          console.error('❌ TenantApiClient: Access denied - check tenant permissions');
        } else if (error.response?.status === 404 && error.response?.data?.detail?.includes('Customer')) {
          console.error('❌ TenantApiClient: Customer not found - tenant context may be invalid');
        }
        
        return Promise.reject(error);
      }
    );
  }

  private getTenantContext(): TenantContext | null {
    try {
      // First try: Get tenant context from project store (for superadmin user selections)
      const projectStoreData = localStorage.getItem('project-store');
      if (projectStoreData) {
        const store = JSON.parse(projectStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          console.log('🏢 TenantApiClient: Using selected tenant context from localStorage');
          return {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          };
        }
      }
      
      // Fallback: Use tenant-store for detected tenant (from subdomain)
      const tenantStoreData = localStorage.getItem('tenant-store');
      if (tenantStoreData) {
        const store = JSON.parse(tenantStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          console.log('🏢 TenantApiClient: Using detected tenant context from tenant-store');
          return {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          };
        }
      }
      
      // Final fallback: If localhost and no context, use superadmin
      if (window.location.hostname === 'localhost') {
        console.log('🏢 TenantApiClient: Using localhost superadmin fallback');
        return {
          customerId: SUPERADMIN_CUSTOMER_ID,
          projectId: 'default'
        };
      }
      
    } catch (error) {
      console.warn('🏢 TenantApiClient: Failed to parse store data:', error);
    }
    
    return null;
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  // Utility method to check if tenant context is available
  hasTenantContext(): boolean {
    return this.getTenantContext() !== null;
  }

  // Get current tenant context (for debugging/logging)
  getCurrentTenantContext(): TenantContext | null {
    return this.getTenantContext();
  }

  // Direct access to axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}