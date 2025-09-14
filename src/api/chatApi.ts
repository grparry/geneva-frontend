/**
 * Chat API Service for ACORN Chat Interface
 * Handles the new security requirements with customer_id and project_id
 */

import axios from 'axios';
import { SUPERADMIN_CUSTOMER_ID } from '../constants/tenant';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';

export interface CreateChatRoomRequest {
  customer_id: string;
  project_id: string;
  participants: string[];
  include_system_agents?: boolean;
}

export interface CreateChatRoomResponse {
  room_id: string;
  participants: string[];
  system_participants: string[];
  created_at: string;
  persistent: boolean;
}

export interface ChatRoom {
  room_id: string;
  name: string;
  participants: string[];
  system_participants: string[];
  user_participants: string[];
  room_type: string;
  customer_id: string;
  project_id: string;
  created_at: string;
  last_activity_at?: string;
  message_count: number;
  active: boolean;
  persistent: boolean;
  settings: Record<string, any>;
}

export interface ChatMessage {
  message_id: string;
  content: string;
  agent_id?: string;
  agent_name?: string;
  user_id?: string;
  user_name?: string;
  timestamp: string;
  type: 'user' | 'agent' | 'system';
  metadata?: Record<string, any>;
}

export interface SendMessageRequest {
  content: string;
  user_id?: string;
  user_name?: string;
  message_type?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message_id: string;
  timestamp: string;
  responses_triggered: number;
}

export class ChatApiService {
  private cachedTenantParams: string | null = null;
  private lastTenantParamCheck: number = 0;
  private readonly TENANT_CACHE_TTL = 5000; // 5 seconds
  
  private apiClient = axios.create({
    baseURL: API_BASE + '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor to include customer/project context headers
    this.apiClient.interceptors.request.use((config) => {
      const tenantContext = this.getTenantContext();
      
      if (tenantContext) {
        config.headers['X-Customer-ID'] = tenantContext.customerId;
        config.headers['X-Project-ID'] = tenantContext.projectId;
        console.log('🌐 Chat API REQUEST HEADERS:', {
          'X-Customer-ID': tenantContext.customerId,
          'X-Project-ID': tenantContext.projectId,
          url: config.url,
          method: config.method?.toUpperCase()
        });
      } else {
        console.warn('🌐 Chat API: Missing tenant context - no customer/project headers added to:', config.url);
      }
      
      return config;
    });

    // Add response interceptor to handle authentication errors
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403) {
          console.error('Chat API: Authentication required - please select a valid project context');
        } else if (error.response?.status === 404 && error.response?.data?.detail?.includes('Customer')) {
          console.error('Chat API: Customer not found - please check your project context');
        }
        return Promise.reject(error);
      }
    );
  }

  private getTenantContext(): { customerId: string; projectId: string } | null {
    try {
      // Check both stores and use tenant-store (primary context source) if it has valid data
      const tenantStoreData = localStorage.getItem('tenant-store');
      const projectStoreData = localStorage.getItem('project-store');
      
      // Priority 1: Use tenant-store if it has complete context (this is the primary store)
      if (tenantStoreData) {
        const tenantStore = JSON.parse(tenantStoreData);
        const tenantState = tenantStore.state || tenantStore;
        
        console.log('🏢 Chat API: tenant-store contents:', {
          hasCurrentCustomer: !!tenantState.currentCustomer,
          customerId: tenantState.currentCustomer?.id,
          customerName: tenantState.currentCustomer?.name,
          hasCurrentProject: !!tenantState.currentProject,
          projectId: tenantState.currentProject?.id,
          projectName: tenantState.currentProject?.name
        });
        
        if (tenantState.currentCustomer?.id && tenantState.currentProject?.id) {
          console.log('🏢 Chat API: Using primary tenant context from tenant-store');
          return {
            customerId: tenantState.currentCustomer.id,
            projectId: tenantState.currentProject.id
          };
        }
      }
      
      // Priority 2: Fallback to project-store (for superadmin selections)
      if (projectStoreData) {
        const projectStore = JSON.parse(projectStoreData);
        const projectState = projectStore.state || projectStore;
        
        console.log('🏢 Chat API: project-store contents:', {
          hasCurrentCustomer: !!projectState.currentCustomer,
          customerId: projectState.currentCustomer?.id,
          customerName: projectState.currentCustomer?.name,
          hasCurrentProject: !!projectState.currentProject,
          projectId: projectState.currentProject?.id,
          projectName: projectState.currentProject?.name
        });
        
        if (projectState.currentCustomer?.id && projectState.currentProject?.id) {
          console.log('🏢 Chat API: Using fallback tenant context from project-store');
          return {
            customerId: projectState.currentCustomer.id,
            projectId: projectState.currentProject.id
          };
        }
      }
      
      // Final fallback: If localhost and no context, use superadmin
      if (window.location.hostname === 'localhost') {
        console.log('🏢 Chat API: Using localhost superadmin fallback');
        return {
          customerId: SUPERADMIN_CUSTOMER_ID,
          projectId: 'default'
        };
      }
      
    } catch (error) {
      console.warn('🏢 Chat API: Failed to parse store data:', error);
    }
    
    return null;
  }

  /**
   * Create a new chat room with customer/project security
   */
  async createRoom(request: CreateChatRoomRequest): Promise<CreateChatRoomResponse> {
    const response = await this.apiClient.post<CreateChatRoomResponse>('/chat/rooms', request);
    return response.data;
  }

  /**
   * List chat rooms - no parameters needed as API uses dependencies for security
   */
  async listRooms(): Promise<ChatRoom[]> {
    const response = await this.apiClient.get<ChatRoom[]>('/chat/rooms');
    return response.data;
  }

  /**
   * Get specific room details
   */
  async getRoom(roomId: string): Promise<ChatRoom> {
    const response = await this.apiClient.get<ChatRoom>(`/chat/rooms/${roomId}`);
    return response.data;
  }

  /**
   * Get room message history
   */
  async getRoomHistory(roomId: string, limit: number = 50): Promise<{ messages: ChatMessage[]; source: string }> {
    const response = await this.apiClient.get(`/chat/rooms/${roomId}/history`, {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Send a message to a room via REST API
   */
  async sendMessage(roomId: string, request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await this.apiClient.post<SendMessageResponse>(
      `/chat/rooms/${roomId}/messages`,
      request
    );
    return response.data;
  }

  /**
   * Get room status with system agent information
   */
  async getRoomStatus(roomId: string): Promise<{
    room_id: string;
    status: string;
    participants: string[];
    system_participants: string[];
    created_at: string;
    persistent: boolean;
    active_connections: number;
    system_agents: any[];
    conversation_insights?: any;
    proactive_opportunities?: any[];
    active_collaborations?: any[];
  }> {
    const response = await this.apiClient.get(`/chat/rooms/${roomId}/status`);
    return response.data;
  }

  /**
   * Get recent messages from a room
   */
  async getRecentMessages(roomId: string, limit: number = 10): Promise<{
    messages: ChatMessage[];
    source: string;
    count: number;
    note?: string;
  }> {
    const response = await this.apiClient.get(`/chat/rooms/${roomId}/messages/recent`, {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Search conversation with semantic search
   */
  async searchConversation(
    roomId: string, 
    query: string, 
    limit: number = 20,
    similarityThreshold: number = 0.7
  ): Promise<{
    results: Array<{
      message_id: string;
      content: string;
      agent_id?: string;
      agent_name?: string;
      timestamp: string;
      similarity_score: number;
    }>;
    query: string;
  }> {
    const response = await this.apiClient.get(`/chat/rooms/${roomId}/search`, {
      params: { 
        query, 
        limit, 
        similarity_threshold: similarityThreshold 
      }
    });
    return response.data;
  }

  /**
   * Delete a chat room
   */
  async deleteRoom(roomId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.apiClient.delete(`/chat/rooms/${roomId}`);
    return response.data;
  }

  /**
   * List all available agents (executives and system)
   */
  async listAllAgents(): Promise<{
    system_agents: Array<{
      agent_id: string;
      name: string;
      title: string;
      department: string;
      avatar: string;
      color: string;
      type: string;
      system_component: string;
    }>;
  }> {
    const response = await this.apiClient.get('/chat/agents/all');
    return response.data;
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<any> {
    const response = await this.apiClient.get('/chat/health');
    return response.data;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<any> {
    const response = await this.apiClient.get('/chat/metrics');
    return response.data;
  }

  /**
   * Get agent health status
   */
  async getAgentHealth(agentId: string): Promise<{
    agent_id: string;
    status: string;
    health_check_passed: boolean;
    timestamp: string;
  }> {
    const response = await this.apiClient.get(`/chat/agents/${agentId}/health`);
    return response.data;
  }

  /**
   * Test system agents directly
   */
  async testSystemAgents(message: string = "Hello system agents"): Promise<{
    input_message: string;
    responses: Array<{
      agent_id: string;
      agent_name: string;
      content: string;
      operation_type: string;
      related_data: any;
      metadata: any;
    }>;
    response_count: number;
  }> {
    const response = await this.apiClient.post('/chat/test/agents', null, {
      params: { message }
    });
    return response.data;
  }

  /**
   * Create WebSocket URL for room communication with tenant context
   */
  getWebSocketUrl(roomId: string): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_BASE.replace(/^https?:\/\//, '');
    const tenantParams = this.getTenantQueryParams();
    return `${wsProtocol}//${wsHost}/api/chat/ws/${roomId}${tenantParams}`;
  }
  
  /**
   * Get tenant query parameters for WebSocket services
   * Used by ACORN WebSocket services that need tenant context
   */
  getWebSocketTenantParams(): string {
    return this.getTenantQueryParams();
  }

  /**
   * Create WebSocket URL for infrastructure events with tenant context
   */
  getInfrastructureWebSocketUrl(): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_BASE.replace(/^https?:\/\//, '');
    const tenantParams = this.getTenantQueryParams();
    return `${wsProtocol}//${wsHost}/api/chat/infrastructure${tenantParams}`;
  }

  /**
   * Get tenant context query parameters for WebSocket URLs (use selected tenant, not superadmin)
   * Cached to prevent excessive localStorage reads and logging
   */
  private getTenantQueryParams(): string {
    // Use cache if valid (within TTL)
    const now = Date.now();
    if (this.cachedTenantParams !== null && (now - this.lastTenantParamCheck) < this.TENANT_CACHE_TTL) {
      return this.cachedTenantParams;
    }
    
    try {
      // First try: Get tenant context from project store (for superadmin user selections)
      const projectStoreData = localStorage.getItem('project-store');
      if (projectStoreData) {
        const store = JSON.parse(projectStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          const params = `?customer_id=${encodeURIComponent(state.currentCustomer.id)}&project_id=${encodeURIComponent(state.currentProject.id)}`;
          
          // Only log if cache is stale or params changed
          if (this.cachedTenantParams !== params) {
            console.log('🏢 Chat WebSocket: Using selected tenant context for WebSocket:', {
              customerId: state.currentCustomer.id,
              projectId: state.currentProject.id
            });
          }
          
          this.cachedTenantParams = params;
          this.lastTenantParamCheck = now;
          return params;
        }
      }
      
      // Fallback: Use tenant-store for detected tenant (from subdomain)
      const tenantStoreData = localStorage.getItem('tenant-store');
      if (tenantStoreData) {
        const store = JSON.parse(tenantStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          const params = `?customer_id=${encodeURIComponent(state.currentCustomer.id)}&project_id=${encodeURIComponent(state.currentProject.id)}`;
          
          // Only log if cache is stale or params changed
          if (this.cachedTenantParams !== params) {
            console.log('🏢 Chat WebSocket: Using detected tenant context for WebSocket:', {
              customerId: state.currentCustomer.id,
              projectId: state.currentProject.id
            });
          }
          
          this.cachedTenantParams = params;
          this.lastTenantParamCheck = now;
          return params;
        }
      }
      
      // No fallback to superadmin for data APIs - require explicit tenant selection
      if (this.cachedTenantParams !== '') {
        console.warn('🏢 Chat WebSocket: No tenant context available for WebSocket - connection may fail');
      }
      
    } catch (error) {
      if (this.cachedTenantParams !== '') {
        console.warn('🏢 Chat WebSocket: Failed to get tenant context for WebSocket URL:', error);
      }
    }
    
    this.cachedTenantParams = '';
    this.lastTenantParamCheck = now;
    return '';
  }
}

// Export singleton instance
export const chatApi = new ChatApiService();