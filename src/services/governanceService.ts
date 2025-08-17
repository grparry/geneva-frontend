/**
 * Simplified Governance API Service
 * 
 * Basic REST API integration for room governance state.
 * WebSocket functionality removed - governance is now request-scoped.
 */

import axios, { AxiosResponse } from 'axios';
import { RoomGovernanceState } from '../types/governance';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';

export class GovernanceApiService {
  private apiClient = axios.create({
    baseURL: API_BASE + '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Reuse the same tenant context interceptor pattern from chatApi
    this.apiClient.interceptors.request.use((config) => {
      const tenantContext = this.getTenantContext();
      
      if (tenantContext) {
        config.headers['X-Customer-ID'] = tenantContext.customerId;
        config.headers['X-Project-ID'] = tenantContext.projectId;
        console.log('Governance API: Added tenant context headers');
      } else {
        console.warn('Governance API: Missing tenant context');
      }
      
      return config;
    });

    // Handle authentication and governance-specific errors
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403) {
          console.error('Governance API: Access denied - insufficient permissions');
        } else if (error.response?.status === 423) {
          console.error('Governance API: Resource locked - governance action in progress');
        }
        return Promise.reject(error);
      }
    );
  }

  private getTenantContext(): { customerId: string; projectId: string } | null {
    try {
      // First try: project-store (superadmin selections)
      const projectStoreData = localStorage.getItem('project-store');
      if (projectStoreData) {
        const store = JSON.parse(projectStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          return {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          };
        }
      }
      
      // Fallback: tenant-store (detected tenant)
      const tenantStoreData = localStorage.getItem('tenant-store');
      if (tenantStoreData) {
        const store = JSON.parse(tenantStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          return {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          };
        }
      }
      
      // Localhost fallback
      if (window.location.hostname === 'localhost') {
        return {
          customerId: 'superadmin',
          projectId: 'default'
        };
      }
      
    } catch (error) {
      console.warn('Failed to get tenant context:', error);
    }
    
    return null;
  }

  /**
   * Get complete governance state and participation rules for a room
   */
  async getRoomGovernanceState(roomId: string): Promise<RoomGovernanceState> {
    try {
      const response: AxiosResponse<RoomGovernanceState> = await this.apiClient.get(
        `/rooms/${roomId}/governance/state`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get governance state for room ${roomId}:`, error);
      throw new Error(`Failed to get governance state: ${this.getErrorMessage(error)}`);
    }
  }






  private getErrorMessage(error: any): string {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }
}

// Export singleton instance
export const governanceService = new GovernanceApiService();