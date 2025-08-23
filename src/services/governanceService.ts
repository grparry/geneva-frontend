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
      // Check project-store (superadmin selections)
      const projectStoreData = localStorage.getItem('project-store');
      if (projectStoreData) {
        const store = JSON.parse(projectStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          console.log('🏢 Governance API: Using project-store context:', {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          });
          return {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          };
        }
      }
      
      // Check tenant-store (detected tenant from subdomain)
      const tenantStoreData = localStorage.getItem('tenant-store');
      if (tenantStoreData) {
        const store = JSON.parse(tenantStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          console.log('🏢 Governance API: Using tenant-store context:', {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          });
          return {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          };
        }
      }
      
      console.error('🏢 Governance API: No valid tenant context found in project-store or tenant-store');
      
    } catch (error) {
      console.error('🏢 Governance API: Failed to parse store data:', error);
    }
    
    return null;
  }

  /**
   * Get complete governance state and participation rules for a room
   */
  async getRoomGovernanceState(roomId: string): Promise<RoomGovernanceState> {
    try {
      const response: AxiosResponse<RoomGovernanceState> = await this.apiClient.get(
        `/rooms/${roomId}/governance/state`,
        {
          params: {
            admin_auth: 'admin'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get governance state for room ${roomId}:`, error);
      throw new Error(`Failed to get governance state: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Transition room state (admin function)
   */
  async transitionRoomState(
    roomId: string, 
    request: {
      new_state: string;
      transitioned_by: string;
      authority_type: 'system_agent' | 'human_review' | 'auto_timeout' | 'governance_decision';
      reason: string;
      context?: Record<string, any>;
    }
  ): Promise<{ success: boolean; room_id: string; transition: any }> {
    try {
      const response = await this.apiClient.post(
        `/rooms/${roomId}/governance/state/transition?admin_auth=admin`,
        request
      );
      
      console.log(`✅ Successfully transitioned room ${roomId} to state ${request.new_state}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to transition room ${roomId} state:`, error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Request data sent:', request);
      throw new Error(`Failed to transition room state: ${this.getErrorMessage(error)}`);
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