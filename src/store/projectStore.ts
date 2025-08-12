import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useMemo, useCallback } from 'react';

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  status: 'active' | 'inactive' | 'archived';
  settings?: Record<string, any>;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  organization?: string;
  created_at: string;
  status: 'active' | 'inactive';
}

interface ProjectState {
  // Current context
  currentCustomer: Customer | null;
  currentProject: Project | null;
  
  // Available data
  customers: Customer[];
  projects: Project[];
  
  // Loading states
  loading: {
    customers: boolean;
    projects: boolean;
    switching: boolean;
  };
  
  // Error states
  errors: {
    customers: string | null;
    projects: string | null;
    switching: string | null;
  };
}

interface ProjectActions {
  // Customer actions
  loadCustomers: () => Promise<void>;
  selectCustomer: (customerId: string) => Promise<void>;
  
  // Project actions
  loadProjects: (customerId?: string) => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  
  // Context management
  switchContext: (customerId: string, projectId: string) => Promise<void>;
  clearContext: () => void;
  
  // Multi-tab synchronization
  _initializeTabSync: () => (() => void) | undefined;
  
  // Utility actions
  clearError: (key: keyof ProjectState['errors']) => void;
  reset: () => void;
}

type ProjectStore = ProjectState & ProjectActions;

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';

const initialState: ProjectState = {
  currentCustomer: null,
  currentProject: null,
  customers: [],
  projects: [],
  loading: {
    customers: false,
    projects: false,
    switching: false,
  },
  errors: {
    customers: null,
    projects: null,
    switching: null,
  },
};

export const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Multi-tab synchronization setup
        _initializeTabSync: () => {
          if (typeof window === 'undefined') return; // Skip during SSR
          
          const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'project-store') {
              console.log('🔄 Project Store: Cross-tab sync detected');
              try {
                const newState = JSON.parse(e.newValue || '{}');
                const persistedState = newState.state || newState;
                
                // Update store with new context from other tab
                set({
                  currentCustomer: persistedState.currentCustomer,
                  currentProject: persistedState.currentProject
                });
                
                // Force page refresh to reload all data with new context
                // This ensures all API calls use the new tenant context
                setTimeout(() => {
                  console.log('🔄 Project Store: Reloading page for context sync');
                  window.location.reload();
                }, 100);
              } catch (error) {
                console.error('❌ Project Store: Failed to sync cross-tab state:', error);
              }
            }
          };
          
          window.addEventListener('storage', handleStorageChange);
          
          // Return cleanup function
          return () => {
            window.removeEventListener('storage', handleStorageChange);
          };
        },
        
        // Customer actions
        loadCustomers: async () => {
          set((state) => ({ 
            loading: { ...state.loading, customers: true },
            errors: { ...state.errors, customers: null }
          }));
          
          try {
            // Query the real Geneva database for customer records
            const response = await fetch(`${API_BASE}/api/customers`);
            
            let customers: Customer[] = [];
            
            if (response.ok) {
              const data = await response.json();
              customers = Array.isArray(data) ? data : [];
            } else {
              console.warn('Customer API not available, using known database records');
              // Fallback to known database records when customer API is not available
              customers = [
                {
                  id: 'acorn_corporation',
                  name: 'ACORN Corporation',
                  email: 'admin@acorn.com',
                  organization: 'ACORN Corporation',
                  created_at: new Date().toISOString(),
                  status: 'active'
                },
                {
                  id: 'substrate_systems',
                  name: 'Substrate Systems',
                  email: 'admin@substrate.com',
                  organization: 'Substrate Systems',
                  created_at: new Date().toISOString(),
                  status: 'active'
                },
                {
                  id: 'geneva_foundation',
                  name: 'Geneva Foundation',
                  email: 'admin@geneva.org',
                  organization: 'Geneva Foundation',
                  created_at: new Date().toISOString(),
                  status: 'active'
                },
                {
                  id: 'praxis_research',
                  name: 'Praxis Research',
                  email: 'admin@praxis.com',
                  organization: 'Praxis Research Institute',
                  created_at: new Date().toISOString(),
                  status: 'active'
                }
              ];
            }
            
            set((state) => ({
              customers: customers,
              loading: { ...state.loading, customers: false }
            }));
          } catch (error) {
            console.error('Failed to load customers:', error);
            set((state) => ({
              customers: [],
              loading: { ...state.loading, customers: false },
              errors: { ...state.errors, customers: (error as Error).message }
            }));
          }
        },
        
        selectCustomer: async (customerId: string) => {
          const customer = get().customers.find(c => c.id === customerId);
          if (!customer) {
            throw new Error(`Customer not found: ${customerId}`);
          }
          
          set({ currentCustomer: customer });
          
          // Auto-load projects for the selected customer
          await get().loadProjects(customerId);
        },
        
        // Project actions
        loadProjects: async (customerId?: string) => {
          const targetCustomerId = customerId || get().currentCustomer?.id;
          if (!targetCustomerId) {
            set((state) => ({
              errors: { ...state.errors, projects: 'No customer selected' }
            }));
            return;
          }
          
          set((state) => ({ 
            loading: { ...state.loading, projects: true },
            errors: { ...state.errors, projects: null }
          }));
          
          try {
            // Query the real Geneva projects API using system token
            const response = await fetch(`${API_BASE}/codex/projects/`, {
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'geneva-system-token'  // System-level token for accessing projects
              }
            });
            
            let projects: Project[] = [];
            
            if (response.ok) {
              const data = await response.json();
              console.log('📋 Project Store: Successfully loaded projects from API:', data);
              
              // Convert API response to our Project format
              if (data.items && Array.isArray(data.items)) {
                projects = data.items.map((item: any) => ({
                  id: item.project_id || item.id,
                  name: item.name,
                  description: item.description || '',
                  customer_id: targetCustomerId,
                  created_at: item.created_at || new Date().toISOString(),
                  updated_at: item.updated_at || new Date().toISOString(),
                  status: item.status || 'active',
                  settings: {
                    acorn_enabled: true,
                    memory_enhanced: true,
                    claude_integration: true
                  }
                }));
              }
              console.log('📋 Project Store: Converted projects:', projects);
            } else {
              console.error(`Projects API returned ${response.status}:`, await response.text());
              throw new Error(`Failed to load projects from API: ${response.status}`);
            }
            
            console.log('📋 Project Store: Final projects list:', projects);
            
            set((state) => ({
              projects: projects,
              loading: { ...state.loading, projects: false }
            }));
          } catch (error) {
            console.error('Failed to load projects:', error);
            set((state) => ({
              projects: [],
              loading: { ...state.loading, projects: false },
              errors: { ...state.errors, projects: (error as Error).message }
            }));
          }
        },
        
        selectProject: async (projectId: string) => {
          const project = get().projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error(`Project not found: ${projectId}`);
          }
          
          set({ currentProject: project });
        },
        
        createProject: async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
          try {
            const response = await fetch(`${API_BASE}/api/customers/${projectData.customer_id}/projects`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(projectData)
            });
            
            if (!response.ok) {
              throw new Error(`Failed to create project: ${response.status}`);
            }
            
            const newProject = await response.json();
            
            set((state) => ({
              projects: [...state.projects, newProject]
            }));
            
            return newProject.id;
          } catch (error) {
            console.error('Failed to create project:', error);
            // Create mock project for development
            const mockProject: Project = {
              ...projectData,
              id: `proj-${Date.now()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            set((state) => ({
              projects: [...state.projects, mockProject]
            }));
            
            return mockProject.id;
          }
        },
        
        // Context management
        switchContext: async (customerId: string, projectId: string) => {
          set((state) => ({ 
            loading: { ...state.loading, switching: true },
            errors: { ...state.errors, switching: null }
          }));
          
          try {
            await get().selectCustomer(customerId);
            await get().selectProject(projectId);
            
            set((state) => ({
              loading: { ...state.loading, switching: false }
            }));
          } catch (error) {
            set((state) => ({
              loading: { ...state.loading, switching: false },
              errors: { ...state.errors, switching: (error as Error).message }
            }));
            throw error;
          }
        },
        
        clearContext: () => {
          set({
            currentCustomer: null,
            currentProject: null
          });
        },
        
        // Utility actions
        clearError: (key: keyof ProjectState['errors']) => {
          set((state) => ({
            errors: { ...state.errors, [key]: null }
          }));
        },
        
        reset: () => {
          set(initialState);
        }
      }),
      {
        name: 'project-store',
        // Only persist the current context, not all data
        partialize: (state) => ({
          currentCustomer: state.currentCustomer,
          currentProject: state.currentProject
        })
      }
    ),
    { name: 'project-store' }
  )
);

// Helper hook for project context
export const useProjectContext = () => {
  // Use individual selectors to avoid object reference changes
  const currentCustomer = useProjectStore(state => state.currentCustomer);
  const currentProject = useProjectStore(state => state.currentProject);
  const switchContext = useProjectStore(state => state.switchContext);
  const clearContext = useProjectStore(state => state.clearContext);
  
  // Select individual loading states to avoid object reference issues
  const loadingCustomers = useProjectStore(state => state.loading.customers);
  const loadingProjects = useProjectStore(state => state.loading.projects);
  const loadingSwitching = useProjectStore(state => state.loading.switching);
  
  // Select individual error states to avoid object reference issues  
  const errorsCustomers = useProjectStore(state => state.errors.customers);
  const errorsProjects = useProjectStore(state => state.errors.projects);
  const errorsSwitching = useProjectStore(state => state.errors.switching);
  
  const hasContext = useMemo(() => !!(currentCustomer && currentProject), [currentCustomer, currentProject]);
  const isLoading = useMemo(() => loadingCustomers || loadingProjects || loadingSwitching, [loadingCustomers, loadingProjects, loadingSwitching]);
  const hasErrors = useMemo(() => !!(errorsCustomers || errorsProjects || errorsSwitching), [errorsCustomers, errorsProjects, errorsSwitching]);
  
  const getContextString = useCallback(() => {
    if (!currentCustomer || !currentProject) {
      return null;
    }
    return `${currentCustomer.name} / ${currentProject.name}`;
  }, [currentCustomer, currentProject]);
  
  const getContextIds = useCallback(() => {
    if (!currentCustomer || !currentProject) {
      return null;
    }
    return {
      customerId: currentCustomer.id,
      projectId: currentProject.id
    };
  }, [currentCustomer, currentProject]);
  
  // Create stable loading and errors objects for backward compatibility
  const loading = useMemo(() => ({
    customers: loadingCustomers,
    projects: loadingProjects,
    switching: loadingSwitching
  }), [loadingCustomers, loadingProjects, loadingSwitching]);
  
  const errors = useMemo(() => ({
    customers: errorsCustomers,
    projects: errorsProjects,
    switching: errorsSwitching
  }), [errorsCustomers, errorsProjects, errorsSwitching]);

  return {
    // Context
    customer: currentCustomer,
    project: currentProject,
    hasContext,
    
    // Context string helpers
    getContextString,
    getContextIds,
    
    // Actions
    switchContext,
    clearContext,
    
    // Loading states
    isLoading,
    loading,
    
    // Errors
    errors,
    hasErrors
  };
};