import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useTenantStore } from '../store/tenantStore';
import { tenantService } from '../services/tenantService';
import type { Customer, Project } from '../store/projectStore';

export interface TenantContextValue {
  // Current stable context (only set when both customer AND project are selected)
  customer: Customer | null;
  project: Project | null;
  hasFullContext: boolean;
  
  // Available data for selection
  availableCustomers: Customer[];
  availableProjects: Project[];
  
  // Selection state (separate from final context)
  selectedCustomerId: string;
  selectedProjectId: string;
  
  // Actions
  setSelectedCustomerId: (id: string) => void;
  setSelectedProjectId: (id: string) => void;
  commitContext: (customerId?: string, projectId?: string) => Promise<void>;
  loadCustomers: () => void;
  loadProjects: (customerId: string) => void;
  
  // Status
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantContextProviderProps {
  children: ReactNode;
}

export const TenantContextProvider: React.FC<TenantContextProviderProps> = ({ children }) => {
  // Local selection state (separate from committed context)
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Available data for selection (fetched from service layer)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Use refs to track loading states without triggering re-renders
  const loadingCustomersRef = useRef(false);
  const loadingProjectsRef = useRef(false);
  
  // Get committed context from minimal store
  const { currentCustomer, currentProject, setCurrentContext, _initializeTabSync } = useTenantStore();

  console.log('🏢 TenantContextProvider render:', {
    selectedCustomerId,
    selectedProjectId,
    customersLength: customers.length,
    projectsLength: projects.length,
    isCommitting,
    isLoadingCustomers,
    isLoadingProjects,
    hasCurrentCustomer: !!currentCustomer,
    hasCurrentProject: !!currentProject,
    timestamp: Date.now()
  });
  
  // Stable committed context (only changes when both are selected and committed)
  const hasFullContext = !!(currentCustomer && currentProject);
  
  // Initialize multi-tab sync on mount
  useEffect(() => {
    const cleanup = _initializeTabSync();
    return cleanup;
  }, []);
  
  // Load customers from service layer
  const loadCustomers = useCallback(async () => {
    if (loadingCustomersRef.current) return;
    
    loadingCustomersRef.current = true;
    setIsLoadingCustomers(true);
    setError(null);
    
    try {
      console.log('🏢 TenantContext: Loading customers from service layer');
      const fetchedCustomers = await tenantService.fetchCustomers();
      setCustomers(fetchedCustomers);
      console.log('🏢 TenantContext: Successfully loaded customers:', fetchedCustomers.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customers';
      console.error('🏢 TenantContext: Failed to load customers:', errorMessage);
      setError(errorMessage);
    } finally {
      loadingCustomersRef.current = false;
      setIsLoadingCustomers(false);
    }
  }, []); // Stable function with no dependencies
  
  // Auto-load customers on mount - only run once
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);
  
  // Load projects from service layer
  const loadProjects = useCallback(async (customerId: string) => {
    if (!customerId || loadingProjectsRef.current) return;
    
    loadingProjectsRef.current = true;
    setIsLoadingProjects(true);
    setError(null);
    
    try {
      console.log('🏢 TenantContext: Loading projects from service layer for customer:', customerId);
      const fetchedProjects = await tenantService.fetchProjects(customerId);
      setProjects(fetchedProjects);
      console.log('🏢 TenantContext: Successfully loaded projects:', fetchedProjects.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      console.error('🏢 TenantContext: Failed to load projects:', errorMessage);
      setError(errorMessage);
      setProjects([]); // Clear projects on error
    } finally {
      loadingProjectsRef.current = false;
      setIsLoadingProjects(false);
    }
  }, []); // Stable function with no dependencies
  
  // TEMPORARILY DISABLE AUTO-SELECT TO ISOLATE LOOP ISSUE
  // Auto-select single customer
  // useEffect(() => {
  //   if (customers.length === 1 && !selectedCustomerId && !hasFullContext) {
  //     console.log('🏢 TenantContext: Auto-selecting single customer');
  //     setSelectedCustomerId(customers[0].id);
  //     loadProjects(customers[0].id);
  //   }
  // }, [customers.length, selectedCustomerId, hasFullContext]);
  
  // Auto-select single project
  // useEffect(() => {
  //   if (projects.length === 1 && selectedCustomerId && !selectedProjectId && !hasFullContext) {
  //     console.log('🏢 TenantContext: Auto-selecting single project');
  //     setSelectedProjectId(projects[0].id);
  //   }
  // }, [projects.length, selectedCustomerId, selectedProjectId, hasFullContext]);
  
  // Handle customer selection
  const handleSetSelectedCustomerId = useCallback((customerId: string) => {
    console.log('🏢 TenantContext: Customer selected:', customerId);
    setSelectedCustomerId(customerId);
    setSelectedProjectId(''); // Clear project when customer changes
    setError(null);
    loadProjects(customerId);
  }, [loadProjects]);
  
  // Handle project selection  
  const handleSetSelectedProjectId = useCallback((projectId: string) => {
    console.log('🏢 TenantContext: Project selected:', projectId);
    setSelectedProjectId(projectId);
    setError(null);
  }, []);
  
  // Commit the context (only when both customer and project are selected)
  const commitContext = useCallback(async (customerId?: string, projectId?: string) => {
    // Use provided parameters or fall back to context state
    const customerIdToUse = customerId || selectedCustomerId;
    const projectIdToUse = projectId || selectedProjectId;
    
    console.log('🏢 TenantContext: commitContext called with:', {
      providedCustomerId: customerId,
      providedProjectId: projectId,
      contextCustomerId: selectedCustomerId,
      contextProjectId: selectedProjectId,
      finalCustomerId: customerIdToUse,
      finalProjectId: projectIdToUse,
      hasCustomerId: !!customerIdToUse,
      hasProjectId: !!projectIdToUse
    });
    
    if (!customerIdToUse || !projectIdToUse) {
      const errorMsg = `Both customer and project must be selected. Got customer: ${customerIdToUse}, project: ${projectIdToUse}`;
      console.error('🏢 TenantContext: Commit failed -', errorMsg);
      setError(errorMsg);
      return;
    }
    
    setIsCommitting(true);
    setError(null);
    
    try {
      console.log('🏢 TenantContext: Validating and committing context:', { customerId: customerIdToUse, projectId: projectIdToUse });
      
      // Use service layer to validate the context
      const { customer, project } = await tenantService.validateContext(customerIdToUse, projectIdToUse);
      
      // Commit to the minimal store
      setCurrentContext(customer, project);
      
      console.log('🏢 TenantContext: Context committed successfully');
      // Don't reset selection state - let the committed context take over
    } catch (err) {
      console.error('🏢 TenantContext: Failed to commit context:', err);
      setError(err instanceof Error ? err.message : 'Failed to set context');
    } finally {
      setIsCommitting(false);
    }
  }, [selectedCustomerId, selectedProjectId, setCurrentContext]);
  
  const contextValue: TenantContextValue = {
    // Stable committed context
    customer: currentCustomer,
    project: currentProject,
    hasFullContext,
    
    // Available data
    availableCustomers: customers,
    availableProjects: projects,
    
    // Selection state
    selectedCustomerId,
    selectedProjectId,
    
    // Actions
    setSelectedCustomerId: handleSetSelectedCustomerId,
    setSelectedProjectId: handleSetSelectedProjectId,
    commitContext,
    loadCustomers,
    loadProjects,
    
    // Status
    isLoading: isCommitting || isLoadingCustomers || isLoadingProjects,
    error
  };
  
  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within a TenantContextProvider');
  }
  return context;
};