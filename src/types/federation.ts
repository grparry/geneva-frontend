export enum PeerStatus {
  DISCOVERED = 'discovered',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

export enum TrustLevel {
  NONE = 'none',
  BASIC = 'basic',
  VERIFIED = 'verified',
  TRUSTED = 'trusted',
  FULL = 'full'
}

export enum DelegationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface Substrate {
  id: string;
  name: string;
  url: string;
  status: PeerStatus;
  capabilities: string[];
  metadata?: Record<string, any>;
}

export interface SubstratePeer {
  id: string;
  substrate_id: string;
  name: string;
  url: string;
  status: PeerStatus;
  trust_level: TrustLevel;
  capabilities: string[];
  metadata?: Record<string, any>;
  last_heartbeat?: string;
  discovered_at: string;
  connected_at?: string;
}

export interface FederationConfig {
  substrate_id: string;
  substrate_name: string;
  network_scope: string;
  capabilities: string[];
  trust_threshold: number;
  discovery_enabled: boolean;
  auto_accept_peers: boolean;
  max_peers: number;
}

export interface Delegation {
  id: string;
  source_substrate: string;
  target_substrate: string;
  task_type: string;
  task_data: Record<string, any>;
  status: DelegationStatus;
  priority: number;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  result?: DelegationResult;
  error?: string;
}

export interface DelegationResult {
  success: boolean;
  data?: any;
  error?: string;
  metrics?: {
    execution_time_ms?: number;
    total_time_ms?: number;
    memory_used_mb?: number;
  };
}

export interface TrustRelationship {
  id: string;
  substrate_id: string;
  peer_id: string;
  trust_level: TrustLevel;
  established_at: string;
  last_verified?: string;
  certificate?: string;
}

export interface FederationMetrics {
  total_peers: number;
  connected_peers: number;
  total_delegations: number;
  successful_delegations: number;
  failed_delegations: number;
  average_delegation_time_ms: number;
  trust_violations: number;
}

export interface FederationEvent {
  type: 'peer.discovered' | 'peer.connected' | 'peer.disconnected' | 
        'trust.established' | 'trust.upgraded' | 'trust.revoked' |
        'delegation.received' | 'delegation.accepted' | 'delegation.completed' |
        'delegation.failed';
  timestamp: string;
  data: any;
}

export interface DelegationRequest {
  target_peer_id: string;
  task_type: string;
  task_data: Record<string, any>;
  priority?: number;
  timeout_ms?: number;
}

export interface DelegationResponse {
  id: string;
  status: DelegationStatus;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  result?: DelegationResult;
  error?: string;
}