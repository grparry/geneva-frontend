import type { Customer, Project } from '../store/projectStore';
import { SUPERADMIN_CUSTOMER_ID } from '../constants/tenant';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';

/**
 * Pure service layer for tenant operations
 * Handles all API calls and business logic without state management
 */
export class TenantService {
  /**
   * Fetch all available customers from Geneva backend
   */
  async fetchCustomers(): Promise<Customer[]> {
    console.log('🔧 TenantService: Fetching customers from Geneva API');
    
    try {
      const response = await fetch(`${API_BASE}/api/customers/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Customer-ID': SUPERADMIN_CUSTOMER_ID
        }
      });
      
      if (!response.ok) {
        throw new Error(`Customer API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log('🔧 TenantService: Raw customer API response:', data);
      
      // The API returns { customers: [...], total: number }
      if (!data.customers || !Array.isArray(data.customers)) {
        throw new Error('Invalid customer API response format');
      }

      // Map Geneva customer format to our Customer interface
      const customers: Customer[] = data.customers.map((apiCustomer: any) => ({
        id: apiCustomer.customer_id,
        name: apiCustomer.customer_name,
        email: `admin@${apiCustomer.customer_id.replace('_', '')}.com`, // Generate email from ID
        organization: apiCustomer.customer_name,
        created_at: apiCustomer.created_at,
        status: apiCustomer.is_active ? 'active' : 'inactive'
      }));

      console.log('🔧 TenantService: Successfully processed customers:', customers.length);
      return customers;
      
    } catch (error) {
      console.error('🔧 TenantService: Failed to fetch customers:', error);
      throw new Error(`Failed to load customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch projects for a specific customer
   */
  async fetchProjects(customerId: string): Promise<Project[]> {
    if (!customerId) {
      throw new Error('Customer ID is required to fetch projects');
    }

    console.log('🔧 TenantService: Fetching projects for customer:', customerId);

    try {
      const response = await fetch(`${API_BASE}/codex/projects/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'geneva-system-token'
        }
      });

      if (!response.ok) {
        throw new Error(`Projects API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log('🔧 TenantService: Raw projects API response:', data);

      let projects: Project[] = [];
      if (data.items && Array.isArray(data.items)) {
        projects = data.items.map((item: any) => ({
          id: item.project_id || item.id,
          name: item.name,
          description: item.description || '',
          customer_id: customerId,
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

      console.log('🔧 TenantService: Successfully processed projects:', projects.length);
      return projects;

    } catch (error) {
      console.error('🔧 TenantService: Failed to fetch projects:', error);
      throw new Error(`Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new project
   */
  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    console.log('🔧 TenantService: Creating project:', projectData.name);

    try {
      const response = await fetch(`${API_BASE}/api/customers/${projectData.customer_id}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.status}: ${await response.text()}`);
      }

      const newProject = await response.json();
      console.log('🔧 TenantService: Successfully created project:', newProject.id);
      return newProject.id;

    } catch (error) {
      console.error('🔧 TenantService: Failed to create project:', error);
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate that a customer and project combination is valid
   */
  async validateContext(customerId: string, projectId: string): Promise<{ customer: Customer; project: Project }> {
    console.log('🔧 TenantService: Validating context:', { customerId, projectId });

    // Fetch customer data
    const customers = await this.fetchCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    // Fetch project data
    const projects = await this.fetchProjects(customerId);
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    console.log('🔧 TenantService: Context validation successful');
    return { customer, project };
  }

}

// Export a singleton instance
export const tenantService = new TenantService();