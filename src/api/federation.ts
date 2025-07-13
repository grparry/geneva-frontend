import { apiClient } from './client';
import {
  Substrate,
  SubstratePeer,
  FederationMetrics,
  TrustLevel,
  DelegationRequest,
  DelegationResponse,
  FederationEvent
} from '../types/federation';

export const federationApi = {
  // Substrate Management
  getCurrentSubstrate: async (): Promise<Substrate> => {
    const response = await apiClient.get('/federation/substrate/current');
    return response.data;
  },

  updateSubstrate: async (updates: Partial<Substrate>): Promise<Substrate> => {
    // This endpoint doesn't exist in the backend yet
    throw new Error('Update substrate not implemented');
  },

  // Peer Management
  getPeers: async (): Promise<SubstratePeer[]> => {
    const response = await apiClient.get('/federation/peers');
    return response.data;
  },

  getPeerDetails: async (peerId: string): Promise<SubstratePeer> => {
    const response = await apiClient.get(`/federation/peers/${peerId}`);
    return response.data;
  },

  addPeer: async (data: {
    url: string;
    name: string;
    trust_level: TrustLevel;
    api_key?: string;
  }): Promise<SubstratePeer> => {
    // First discover the peer
    const response = await apiClient.post('/federation/discover', { peer_url: data.url });
    return response.data;
  },

  removePeer: async (peerId: string): Promise<void> => {
    // This endpoint doesn't exist in the backend yet
    throw new Error('Remove peer not implemented');
  },

  updateTrustLevel: async (peerId: string, trustLevel: TrustLevel): Promise<SubstratePeer> => {
    const response = await apiClient.post('/federation/trust/upgrade', {
      peer_id: peerId,
      new_level: trustLevel,
      reason: 'Manual trust update'
    });
    return response.data;
  },

  // Discovery & Testing
  discoverPeer: async (url: string): Promise<{
    substrate: Substrate;
    capabilities: string[];
    isCompatible: boolean;
  }> => {
    const response = await apiClient.post('/federation/discover', { peer_url: url });
    return {
      substrate: response.data,
      capabilities: response.data.capabilities || [],
      isCompatible: true
    };
  },

  testConnection: async (peerId: string): Promise<{
    success: boolean;
    latency_ms: number;
    error?: string;
  }> => {
    const response = await apiClient.post('/federation/heartbeat', {
      substrate_id: peerId
    });
    return {
      success: response.data.status === 'healthy',
      latency_ms: response.data.latency_ms || 0,
      error: response.data.error
    };
  },

  // Capabilities
  getPeerCapabilities: async (peerId: string): Promise<{
    capabilities: string[];
    supported_task_types: string[];
    resource_limits?: {
      max_concurrent_tasks: number;
      max_task_duration_ms: number;
    };
  }> => {
    const response = await apiClient.get(`/federation/peers/${peerId}`);
    return {
      capabilities: response.data.capabilities || [],
      supported_task_types: response.data.supported_task_types || [],
      resource_limits: response.data.resource_limits
    };
  },

  // Task Delegation
  delegateTask: async (request: DelegationRequest): Promise<DelegationResponse> => {
    const response = await apiClient.post('/federation/delegate/task', {
      target_substrate: request.target_peer_id,
      task_type: request.task_type,
      task_data: request.task_data,
      priority: request.priority || 5
    });
    return response.data;
  },

  getDelegationStatus: async (delegationId: string): Promise<DelegationResponse> => {
    const response = await apiClient.get(`/federation/delegations/${delegationId}`);
    return response.data;
  },

  cancelDelegation: async (delegationId: string): Promise<void> => {
    // This endpoint doesn't exist in the backend yet
    throw new Error('Cancel delegation not implemented');
  },

  getDelegationHistory: async (limit = 50): Promise<DelegationResponse[]> => {
    // This endpoint doesn't exist in the backend yet
    return [];
  },

  // Metrics & Monitoring
  getMetrics: async (): Promise<FederationMetrics> => {
    const response = await apiClient.get('/federation/metrics');
    return response.data;
  },

  getMetricsHistory: async (period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    timestamps: string[];
    metrics: FederationMetrics[];
  }> => {
    // This endpoint doesn't exist in the backend yet
    return { timestamps: [], metrics: [] };
  },

  // Events
  getRecentEvents: async (limit = 100): Promise<FederationEvent[]> => {
    const response = await apiClient.get('/federation/events', {
      params: { limit }
    });
    return response.data;
  },

  // Security & Trust
  revokePeerAccess: async (peerId: string, reason: string): Promise<void> => {
    await apiClient.post('/federation/trust/revoke', { 
      peer_id: peerId,
      reason 
    });
  },

  reportTrustViolation: async (peerId: string, violation: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> => {
    // This endpoint doesn't exist in the backend yet
    throw new Error('Report trust violation not implemented');
  },

  getTrustViolations: async (peerId?: string): Promise<Array<{
    id: string;
    peer_id: string;
    type: string;
    description: string;
    severity: string;
    timestamp: string;
    resolved: boolean;
  }>> => {
    // This endpoint doesn't exist in the backend yet
    return [];
  },

  // Batch Operations
  batchUpdateTrustLevels: async (updates: Array<{
    peer_id: string;
    trust_level: TrustLevel;
  }>): Promise<void> => {
    // This endpoint doesn't exist in the backend yet
    throw new Error('Batch update trust levels not implemented');
  },

  batchTestConnections: async (peerIds: string[]): Promise<Array<{
    peer_id: string;
    success: boolean;
    latency_ms?: number;
    error?: string;
  }>> => {
    // This endpoint doesn't exist in the backend yet
    return peerIds.map(id => ({ peer_id: id, success: false, error: 'Not implemented' }));
  }
};