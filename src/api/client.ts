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

  // Note: execution endpoints don't exist in backend - removing phantom APIs

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
  },

  // Add missing real backend endpoints
  getSystemOverview: async () => {
    const response = await apiClient.get('/observability/system/overview');
    return response.data;
  },

  getTopAgents: async (limit: number = 10) => {
    const response = await apiClient.get(`/observability/agents/top?limit=${limit}`);
    return response.data;
  },

  getMemoryMetrics: async (timeWindowHours: number = 24) => {
    const response = await apiClient.get(`/observability/memory/metrics?time_window_hours=${timeWindowHours}`);
    return response.data;
  },

  getCommunicationStats: async () => {
    const response = await apiClient.get('/observability/communications/stats');
    return response.data;
  },

  getAlerts: async (resolved?: boolean, severity?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (resolved !== undefined) params.append('resolved', resolved.toString());
    if (severity) params.append('severity', severity);
    params.append('limit', limit.toString());
    
    const response = await apiClient.get(`/observability/alerts?${params}`);
    return response.data;
  }
};