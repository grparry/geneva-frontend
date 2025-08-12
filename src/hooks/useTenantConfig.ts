import { useState, useEffect } from 'react';
import { SUPERADMIN_CUSTOMER_ID, TENANT_API_ENDPOINTS } from '../constants/tenant';

export interface TenantConfig {
  subdomain: string;
  customerId: string;
  isSuperadmin: boolean;
}

/**
 * Hook for detecting tenant configuration based on subdomain
 * Calls the backend /api/tenant-config endpoint to get the customer ID
 */
export const useTenantConfig = (): TenantConfig | null => {
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const detectTenant = async () => {
      try {
        // Extract subdomain from current hostname
        const hostname = window.location.hostname;
        let subdomain: string;
        
        if (hostname === 'localhost') {
          subdomain = 'localhost';
        } else {
          // For production: customer1.geneva.app → customer1
          subdomain = hostname.split('.')[0];
        }
        
        console.log('🔍 useTenantConfig: Detecting tenant for subdomain:', subdomain);
        
        // Call backend to get customer ID for this subdomain
        const response = await fetch(`${TENANT_API_ENDPOINTS.TENANT_CONFIG}?subdomain=${subdomain}`);
        
        if (!response.ok) {
          throw new Error(`Tenant config API returned ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        console.log('🔍 useTenantConfig: Backend response:', data);
        
        if (!data.customer_id) {
          throw new Error('Invalid tenant config response: missing customer_id');
        }
        
        const config: TenantConfig = {
          subdomain,
          customerId: data.customer_id,
          isSuperadmin: data.customer_id === SUPERADMIN_CUSTOMER_ID
        };
        
        console.log('🔍 useTenantConfig: Tenant detection complete:', config);
        setTenantConfig(config);
        
      } catch (error) {
        console.error('🔍 useTenantConfig: Tenant detection failed:', error);
        
        // Fallback for localhost development
        if (window.location.hostname === 'localhost') {
          console.warn('🔍 useTenantConfig: Using localhost fallback');
          setTenantConfig({
            subdomain: 'localhost',
            customerId: SUPERADMIN_CUSTOMER_ID,
            isSuperadmin: true
          });
        } else {
          // In production, we should not have a fallback
          console.error('🔍 useTenantConfig: No fallback available for production');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    detectTenant();
  }, []);
  
  if (isLoading) {
    return null; // Still loading
  }
  
  return tenantConfig;
};