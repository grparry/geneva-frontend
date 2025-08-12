import { defaultApiClient } from './createApiClient';

// Export the tenant-aware API client as the default
export const apiClient = defaultApiClient;

// Re-export chat API
export { chatApi, ChatApiService } from './chatApi';
export type { 
  CreateChatRoomRequest, 
  CreateChatRoomResponse, 
  ChatRoom, 
  ChatMessage, 
  SendMessageRequest, 
  SendMessageResponse 
} from './chatApi';

export const api = {
  // Communication Stream endpoints
  getStream: async (conversationId: string, communicationType?: string) => {
    const params = new URLSearchParams();
    if (communicationType) params.append('communication_type', communicationType);
    
    const response = await apiClient.get(`/observability/stream/${conversationId}?${params}`);
    return response.data;
  },
  
  getRecentConversations: async (hours: number = 24) => {
    const response = await apiClient.get(`/observability/recent?hours=${hours}`);
    return response.data;
  },

  // Execution endpoints
  getAgentExecutions: async (agentId?: string, timeRange: string = '24h') => {
    const params = new URLSearchParams();
    if (agentId) params.append('agent_id', agentId);
    params.append('time_range', timeRange);
    
    const response = await apiClient.get(`/observability/executions?${params}`);
    return response.data;
  },

  getExecutionDetails: async (executionId: string) => {
    const response = await apiClient.get(`/observability/executions/${executionId}`);
    return response.data;
  },

  getExecutionContext: async (executionId: string) => {
    const response = await apiClient.get(`/observability/executions/${executionId}/context`);
    return response.data;
  },

  // Agent metrics endpoints
  getAgentMetrics: async (agentId: string, timeRange: string = '24h') => {
    const params = new URLSearchParams();
    params.append('time_range', timeRange);
    
    const response = await apiClient.get(`/observability/agents/${agentId}/metrics?${params}`);
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await apiClient.get('/observability/health');
    return response.data;
  }
};