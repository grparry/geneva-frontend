import {
  Substrate,
  SubstratePeer,
  FederationMetrics,
  TrustLevel,
  PeerStatus,
  DelegationResponse,
  DelegationStatus,
  FederationEvent
} from '../types/federation';

// Mock data for development/demo
export const mockSubstrate: Substrate = {
  id: 'current-substrate-001',
  name: 'Geneva Primary',
  url: 'http://localhost:8400',
  status: PeerStatus.CONNECTED,
  capabilities: ['memory', 'execution', 'analytics', 'federation'],
  metadata: {
    version: '2.1.0',
    environment: 'development'
  }
};

export const mockPeers: SubstratePeer[] = [
  {
    id: 'peer-001',
    substrate_id: 'substrate-peer-001',
    name: 'Geneva Research Lab',
    url: 'https://research.geneva.example.com',
    status: PeerStatus.CONNECTED,
    trust_level: TrustLevel.TRUSTED,
    capabilities: ['memory', 'analytics', 'research'],
    last_heartbeat: new Date(Date.now() - 30000).toISOString(),
    discovered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    connected_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      location: 'Research Division',
      specialty: 'AI Research'
    }
  },
  {
    id: 'peer-002',
    substrate_id: 'substrate-peer-002',
    name: 'Geneva Production',
    url: 'https://prod.geneva.example.com',
    status: PeerStatus.CONNECTED,
    trust_level: TrustLevel.FULL,
    capabilities: ['memory', 'execution', 'analytics', 'security'],
    last_heartbeat: new Date(Date.now() - 15000).toISOString(),
    discovered_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    connected_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      location: 'Production Environment',
      sla: '99.9%'
    }
  },
  {
    id: 'peer-003',
    substrate_id: 'substrate-peer-003',
    name: 'Geneva Testing',
    url: 'https://test.geneva.example.com',
    status: PeerStatus.DISCONNECTED,
    trust_level: TrustLevel.BASIC,
    capabilities: ['memory', 'execution'],
    last_heartbeat: new Date(Date.now() - 3600000).toISOString(),
    discovered_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      location: 'Test Environment',
      purpose: 'Integration Testing'
    }
  }
];

export const mockMetrics: FederationMetrics = {
  total_peers: 3,
  connected_peers: 2,
  total_delegations: 156,
  successful_delegations: 148,
  failed_delegations: 8,
  average_delegation_time_ms: 245,
  trust_violations: 0
};

export const mockDelegationHistory: DelegationResponse[] = [
  {
    id: 'delegation-001',
    status: DelegationStatus.COMPLETED,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    accepted_at: new Date(Date.now() - 3599000).toISOString(),
    completed_at: new Date(Date.now() - 3595000).toISOString(),
    result: {
      success: true,
      data: { message: 'Task completed successfully' }
    }
  },
  {
    id: 'delegation-002',
    status: DelegationStatus.FAILED,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    accepted_at: new Date(Date.now() - 7199000).toISOString(),
    completed_at: new Date(Date.now() - 7190000).toISOString(),
    error: 'Connection timeout'
  },
  {
    id: 'delegation-003',
    status: DelegationStatus.EXECUTING,
    created_at: new Date(Date.now() - 300000).toISOString(),
    accepted_at: new Date(Date.now() - 299000).toISOString()
  }
];

export const mockEvents: FederationEvent[] = [
  {
    type: 'peer.connected',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    data: { peer_id: 'peer-001', message: 'Peer connected successfully' }
  },
  {
    type: 'delegation.completed',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    data: { delegation_id: 'delegation-001', duration_ms: 4000 }
  },
  {
    type: 'trust.upgraded',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    data: { peer_id: 'peer-002', from: TrustLevel.TRUSTED, to: TrustLevel.FULL }
  }
];

// Mock API with delay to simulate network
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockFederationApi = {
  getCurrentSubstrate: async () => {
    await delay(500);
    return mockSubstrate;
  },

  getPeers: async () => {
    await delay(300);
    return mockPeers;
  },

  getMetrics: async () => {
    await delay(200);
    return mockMetrics;
  },

  getDelegationHistory: async (limit: number) => {
    await delay(400);
    return mockDelegationHistory.slice(0, limit);
  },

  addPeer: async (data: any) => {
    await delay(1000);
    const newPeer: SubstratePeer = {
      id: `peer-${Date.now()}`,
      substrate_id: `substrate-peer-${Date.now()}`,
      name: data.name,
      url: data.url,
      status: PeerStatus.CONNECTING,
      trust_level: data.trust_level,
      capabilities: [],
      discovered_at: new Date().toISOString()
    };
    mockPeers.push(newPeer);
    return newPeer;
  },

  updateTrustLevel: async (peerId: string, trustLevel: TrustLevel) => {
    await delay(500);
    const peer = mockPeers.find(p => p.id === peerId);
    if (peer) {
      peer.trust_level = trustLevel;
    }
    return peer;
  },

  delegateTask: async (request: any) => {
    await delay(2000);
    return {
      id: `delegation-${Date.now()}`,
      status: DelegationStatus.COMPLETED,
      created_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      result: {
        success: true,
        data: { message: 'Mock task completed', request }
      }
    };
  },

  discoverPeer: async (url: string) => {
    await delay(1000);
    return {
      substrate: {
        id: `discovered-${Date.now()}`,
        name: `Discovered Substrate at ${url}`,
        url,
        status: PeerStatus.DISCOVERED,
        capabilities: ['memory', 'execution']
      },
      capabilities: ['memory', 'execution'],
      isCompatible: true
    };
  },

  testConnection: async (peerId: string) => {
    await delay(300);
    return {
      success: true,
      latency_ms: Math.floor(Math.random() * 100) + 20
    };
  }
};