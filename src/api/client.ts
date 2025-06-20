import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = {
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
  }
};