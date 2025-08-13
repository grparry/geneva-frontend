/**
 * Governance API Service
 * 
 * Service layer for Room State Governance API endpoints.
 * Handles governance state, Trinity queue management, and system monitoring.
 * Uses the same authentication and tenant context as the chat API.
 */

import axios, { AxiosResponse } from 'axios';
import {
  RoomGovernanceState,
  TrinityQueueStatus,
  GovernanceSystemSummary,
  StateTransitionRequest,
  StateTransitionResponse,
  GovernanceWebSocketEvent
} from '../types/governance';

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

  /**
   * Get Trinity review queue status for a specific room
   */
  async getTrinityQueueStatus(roomId: string): Promise<TrinityQueueStatus> {
    try {
      const response: AxiosResponse<TrinityQueueStatus> = await this.apiClient.get(
        `/rooms/${roomId}/governance/trinity/queue`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get Trinity queue status for room ${roomId}:`, error);
      throw new Error(`Failed to get Trinity queue status: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get system-wide governance health and statistics
   */
  async getGovernanceSystemSummary(): Promise<GovernanceSystemSummary> {
    try {
      const response: AxiosResponse<GovernanceSystemSummary> = await this.apiClient.get(
        '/governance/summary'
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get governance system summary:', error);
      throw new Error(`Failed to get governance summary: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Manually transition room state (admin/testing use)
   */
  async transitionRoomState(
    roomId: string, 
    request: StateTransitionRequest
  ): Promise<StateTransitionResponse> {
    try {
      const response: AxiosResponse<StateTransitionResponse> = await this.apiClient.post(
        `/rooms/${roomId}/governance/state/transition`,
        request
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to transition room ${roomId} state:`, error);
      throw new Error(`Failed to transition room state: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get enhanced room status that includes governance information
   */
  async getRoomStatusWithGovernance(roomId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/rooms/${roomId}/status`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get room status with governance for ${roomId}:`, error);
      throw new Error(`Failed to get room status: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Create WebSocket URL for governance events
   * Leverages existing infrastructure WebSocket with governance event filtering
   */
  getGovernanceWebSocketUrl(roomId?: string): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_BASE.replace(/^https?:\/\//, '');
    const tenantParams = this.getTenantQueryParams();
    
    if (roomId) {
      // Room-specific governance events
      return `${wsProtocol}//${wsHost}/api/chat/ws/${roomId}${tenantParams}&governance=true`;
    } else {
      // System-wide governance events via infrastructure WebSocket
      return `${wsProtocol}//${wsHost}/api/chat/infrastructure${tenantParams}&governance=true`;
    }
  }

  private getTenantQueryParams(): string {
    try {
      const projectStoreData = localStorage.getItem('project-store');
      if (projectStoreData) {
        const store = JSON.parse(projectStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          return `?customer_id=${encodeURIComponent(state.currentCustomer.id)}&project_id=${encodeURIComponent(state.currentProject.id)}`;
        }
      }
      
      const tenantStoreData = localStorage.getItem('tenant-store');
      if (tenantStoreData) {
        const store = JSON.parse(tenantStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          return `?customer_id=${encodeURIComponent(state.currentCustomer.id)}&project_id=${encodeURIComponent(state.currentProject.id)}`;
        }
      }
      
    } catch (error) {
      console.warn('Failed to get tenant context for governance WebSocket:', error);
    }
    
    return '';
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

  /**
   * Parse governance events from WebSocket messages
   */
  static parseGovernanceEvent(data: any): GovernanceWebSocketEvent | null {
    try {
      if (data.type === 'room_state_change' || data.type === 'trinity_queue_update') {
        return data as GovernanceWebSocketEvent;
      }
      return null;
    } catch (error) {
      console.warn('Failed to parse governance event:', error);
      return null;
    }
  }

  /**
   * Check if a WebSocket message is a governance event
   */
  static isGovernanceEvent(data: any): boolean {
    return data?.type === 'room_state_change' || data?.type === 'trinity_queue_update';
  }
}

// Export singleton instance
export const governanceService = new GovernanceApiService();

// Export utility functions for WebSocket integration
export const GovernanceWebSocketUtils = {
  parseEvent: GovernanceApiService.parseGovernanceEvent,
  isGovernanceEvent: GovernanceApiService.isGovernanceEvent,
  
  /**
   * Filter governance events from a stream of WebSocket messages
   */
  filterGovernanceEvents: (messages: any[]): GovernanceWebSocketEvent[] => {
    return messages
      .filter(GovernanceApiService.isGovernanceEvent)
      .map(GovernanceApiService.parseGovernanceEvent)
      .filter(Boolean) as GovernanceWebSocketEvent[];
  },

  /**
   * Create governance notification from WebSocket event
   */
  createNotificationFromEvent: (event: GovernanceWebSocketEvent) => {
    switch (event.type) {
      case 'room_state_change':
        return {
          id: `state-change-${Date.now()}`,
          type: 'state_change' as const,
          severity: event.new_state === 'BLOCKED' ? 'error' as const : 'info' as const,
          title: 'Room State Changed',
          message: `Room transitioned from ${event.previous_state} to ${event.new_state}: ${event.reason}`,
          timestamp: event.timestamp,
          room_id: event.room_id
        };
      
      case 'trinity_queue_update':
        return {
          id: `queue-update-${Date.now()}`,
          type: 'queue_update' as const,
          severity: event.priority === 'critical' ? 'warning' as const : 'info' as const,
          title: 'Trinity Queue Update',
          message: `Position ${event.queue_position} of ${event.queue_length} (${event.estimated_wait_time})`,
          timestamp: new Date().toISOString(),
          room_id: event.room_id
        };
      
      default:
        return null;
    }
  }
};