import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = {
  // Communication Stream endpoints
  getStream: async (conversationId: string, communicationType?: string) => {
    const params = new URLSearchParams();
    if (communicationType) params.append('communication_type', communicationType);
    
    const response = await axios.get(
      `${API_BASE}/api/observability/stream/${conversationId}?${params}`
    );
    return response.data;
  },
  
  getRecentConversations: async (hours: number = 24) => {
    const response = await axios.get(
      `${API_BASE}/api/observability/recent?hours=${hours}`
    );
    return response.data;
  },

  // Execution endpoints
  getAgentExecutions: async (agentId?: string, timeRange: string = '24h') => {
    const params = new URLSearchParams();
    if (agentId) params.append('agent_id', agentId);
    params.append('time_range', timeRange);
    
    const response = await axios.get(
      `${API_BASE}/api/observability/executions?${params}`
    );
    return response.data;
  },

  getExecutionDetails: async (executionId: string) => {
    const response = await axios.get(
      `${API_BASE}/api/observability/executions/${executionId}`
    );
    return response.data;
  },

  getExecutionContext: async (executionId: string) => {
    const response = await axios.get(
      `${API_BASE}/api/observability/executions/${executionId}/context`
    );
    return response.data;
  },

  // Agent metrics endpoints
  getAgentMetrics: async (agentId: string, timeRange: string = '24h') => {
    const params = new URLSearchParams();
    params.append('time_range', timeRange);
    
    const response = await axios.get(
      `${API_BASE}/api/observability/agents/${agentId}/metrics?${params}`
    );
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await axios.get(
      `${API_BASE}/api/observability/health`
    );
    return response.data;
  }
};