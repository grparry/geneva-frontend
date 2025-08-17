import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Customer, Project } from './projectStore';

interface TenantState {
  // Only committed context - no intermediate state
  currentCustomer: Customer | null;
  currentProject: Project | null;
}

interface TenantActions {
  // Simple context management
  setCurrentContext: (customer: Customer, project: Project) => void;
  clearContext: () => void;
  
  // Multi-tab synchronization
  _initializeTabSync: () => (() => void) | undefined;
}

type TenantStore = TenantState & TenantActions;

const initialState: TenantState = {
  currentCustomer: null,
  currentProject: null,
};

/**
 * Minimal Zustand store for tenant context
 * Only handles committed context and multi-tab synchronization
 * 
 * Business logic and API calls are handled by the service layer
 * UI state is managed by React Context
 */
export const useTenantStore = create<TenantStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Set the committed context (both customer and project must be provided)
        setCurrentContext: (customer: Customer, project: Project) => {
          console.log('🏪 TenantStore: Setting committed context:', {
            customer: customer.name,
            project: project.name
          });
          
          set({
            currentCustomer: customer,
            currentProject: project
          });
          
          // Also update project-store for backward compatibility with existing APIs
          try {
            // Read existing project-store structure
            let existingProjectStore = {};
            try {
              const existing = localStorage.getItem('project-store');
              if (existing) {
                existingProjectStore = JSON.parse(existing);
              }
            } catch (e) {
              console.warn('🏪 TenantStore: Could not read existing project-store:', e);
            }
            
            // Update the project-store with the correct structure
            const projectStoreData = {
              ...existingProjectStore,
              state: {
                ...(existingProjectStore as any)?.state,
                currentCustomer: customer,
                currentProject: project
              },
              version: 0
            };
            
            localStorage.setItem('project-store', JSON.stringify(projectStoreData));
            console.log('🏪 TenantStore: Updated project-store with new context:', {
              customerId: customer.id,
              projectId: project.id,
              customerName: customer.name,
              projectName: project.name
            });
            
            // Trigger a storage event to ensure ProjectStore notices the change
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'project-store',
              newValue: JSON.stringify(projectStoreData),
              storageArea: localStorage
            }));
            console.log('🏪 TenantStore: Dispatched storage event for project-store sync');
            
          } catch (error) {
            console.warn('🏪 TenantStore: Failed to update project-store:', error);
          }
        },
        
        // Clear the committed context
        clearContext: () => {
          console.log('🏪 TenantStore: Clearing context');
          set({
            currentCustomer: null,
            currentProject: null
          });
          
          // Also clear project-store for consistency
          try {
            localStorage.removeItem('project-store');
            console.log('🏪 TenantStore: Also cleared project-store');
          } catch (error) {
            console.warn('🏪 TenantStore: Failed to clear project-store:', error);
          }
        },
        
        // Multi-tab synchronization setup
        _initializeTabSync: () => {
          if (typeof window === 'undefined') return; // Skip during SSR
          
          const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'tenant-store') {
              console.log('🏪 TenantStore: Cross-tab sync detected');
              try {
                const newState = JSON.parse(e.newValue || '{}');
                const persistedState = newState.state || newState;
                
                // Update store with new context from other tab
                set({
                  currentCustomer: persistedState.currentCustomer,
                  currentProject: persistedState.currentProject
                });
                
                // Force page refresh to reload all data with new context
                setTimeout(() => {
                  console.log('🏪 TenantStore: Reloading page for context sync');
                  window.location.reload();
                }, 100);
              } catch (error) {
                console.error('🏪 TenantStore: Failed to sync cross-tab state:', error);
              }
            }
          };
          
          window.addEventListener('storage', handleStorageChange);
          
          return () => {
            window.removeEventListener('storage', handleStorageChange);
          };
        }
      }),
      {
        name: 'tenant-store',
        // Only persist the committed context
        partialize: (state) => ({
          currentCustomer: state.currentCustomer,
          currentProject: state.currentProject
        })
      }
    ),
    { name: 'tenant-store' }
  )
);

/**
 * Simple hook to get current committed context
 */
export const useCurrentTenant = () => {
  const { currentCustomer, currentProject } = useTenantStore();
  
  return {
    customer: currentCustomer,
    project: currentProject,
    hasContext: !!(currentCustomer && currentProject),
    contextString: currentCustomer && currentProject 
      ? `${currentCustomer.name} / ${currentProject.name}`
      : null
  };
};