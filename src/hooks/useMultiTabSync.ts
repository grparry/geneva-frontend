import { useEffect } from 'react';
import { useTenantStore } from '../store/tenantStore';

/**
 * Hook to initialize multi-tab synchronization for tenant context
 * Should be called at the root level of the application
 * 
 * NOTE: This is now handled by TenantContextProvider, so this hook
 * is kept for backward compatibility but doesn't do anything.
 */
export const useMultiTabSync = () => {
  // Multi-tab sync is now handled by TenantContextProvider
  // This hook is kept for backward compatibility
  useEffect(() => {
    console.log('🔄 Multi-tab sync: Handled by TenantContextProvider');
  }, []);
};