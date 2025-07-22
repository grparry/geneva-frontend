/**
 * Federation Type Definitions
 * 
 * Complete TypeScript definitions for Geneva's federation system frontend integration.
 */

// Core Enums
export enum PeerStatus {
  DISCOVERED = 'discovered',
  HANDSHAKING = 'handshaking',
  CONNECTED = 'connected',
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  OFFLINE = 'offline',
  UNTRUSTED = 'untrusted',
  ERROR = 'error',
  DISCONNECTED = 'disconnected',
}

export enum TrustLevel {
  NONE = 'none',
  BASIC = 'basic',
  VERIFIED = 'verified',
  TRUSTED = 'trusted',
  FULL = 'full',
}

export enum DelegationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REJECTED = 'rejected',
}

// Error Types for Comprehensive Error Handling
export enum FederationErrorType {
  // Network Errors
  PEER_UNREACHABLE = 'peer_unreachable',
  CONNECTION_TIMEOUT = 'connection_timeout',
  NETWORK_PARTITION = 'network_partition',
  
  // Authentication Errors
  TRUST_LEVEL_INSUFFICIENT = 'trust_level_insufficient',
  CERTIFICATE_INVALID = 'certificate_invalid',
  AUTHENTICATION_FAILED = 'authentication_failed',
  
  // Delegation Errors
  DELEGATION_REJECTED = 'delegation_rejected',
  TASK_EXECUTION_FAILED = 'task_execution_failed',
  DELEGATION_TIMEOUT = 'delegation_timeout',
  
  // System Errors
  CAPACITY_EXCEEDED = 'capacity_exceeded',
  SYSTEM_UNAVAILABLE = 'system_unavailable',
  DATA_CORRUPTION = 'data_corruption',
}

// Core Federation Interfaces (aligned with Geneva backend)
export interface Substrate {
  id: string;
  name: string;
  url: string;
  status: string;
  capabilities: string[];
  metadata?: Record<string, any>;
}

export interface SubstratePeer {
  id: string; // UUID
  substrate_id: string; // UUID
  name: string;
  url: string;
  status: PeerStatus;
  trust_level: TrustLevel;
  capabilities: Record<string, any>;
  mcp_version: string;
  last_heartbeat?: string; // ISO DateTime
  last_error?: string;
  error_count: number;
  discovered_at: string; // ISO DateTime
  connected_at?: string; // ISO DateTime
  certificate?: string;
}

export interface Delegation {
  id: string; // UUID
  task_id: string; // UUID
  task_type: string;
  task_data: Record<string, any>;
  priority: number; // 1-10
  source_substrate: string; // UUID
  source_agent?: string;
  target_substrate: string; // UUID
  target_agent?: string;
  status: DelegationStatus;
  created_at: string; // ISO DateTime
  accepted_at?: string; // ISO DateTime
  started_at?: string; // ISO DateTime
  completed_at?: string; // ISO DateTime
  result?: Record<string, any>;
  error?: string;
  queue_time_ms?: number; // Float
  execution_time_ms?: number; // Float
  total_time_ms?: number; // Float
}

// Trust Management Types (aligned with Geneva backend)
export interface TrustRelationship {
  id: string; // UUID
  peer_id: string; // UUID (foreign key)
  from_peer_id: string; // UUID (source peer)
  to_peer_id: string; // UUID (target peer)
  trust_level: TrustLevel;
  established_at: string; // ISO DateTime
  last_verified?: string; // ISO DateTime
  last_updated: string; // ISO DateTime
  mutual: boolean;
  peer_certificate?: string;
  revoked: boolean;
  revoked_at?: string; // ISO DateTime
  revocation_reason?: string;
}

export interface TrustAuditEntry {
  id: string;
  peer_id?: string;
  peer_name?: string;
  action_type: string;
  old_trust_level?: TrustLevel;
  new_trust_level?: TrustLevel;
  performed_by?: string;
  reason?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CertificateInfo {
  id: string;
  peer_id: string;
  certificate_pem: string;
  public_key_pem: string;
  fingerprint: string;
  issuer: string;
  subject: string;
  valid_from: string;
  valid_until: string;
  serial_number: string;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  updated_at: string;
}

export interface DelegationResult {
  delegation_id: string;
  status: string;
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  metrics: Record<string, any>;
}

export interface DelegationRequest {
  task_id: string;
  task_type: string;
  task_data: Record<string, any>;
  target_substrate: string;
  priority?: number;
}

export interface Heartbeat {
  substrate_id: string;
  timestamp: string;
  status: PeerStatus;
  capabilities: Record<string, any>;
  metrics: Record<string, any>;
  cpu_usage?: number;
  memory_usage?: number;
  active_tasks: number;
  queue_depth: number;
}

export interface FederationConfig {
  substrate_id: string;
  substrate_name: string;
  discovery_interval: number;
  heartbeat_interval: number;
  task_timeout: number;
  require_mutual_trust: boolean;
  min_trust_level: TrustLevel;
  accept_delegations: boolean;
  capabilities: Record<string, any>;
  max_concurrent_delegations: number;
  max_queue_size: number;
}

// API Request/Response Types
export interface DelegateTaskRequest {
  target_substrate: string;
  task_type: string;
  task_data: Record<string, any>;
  priority?: number;
}

export interface TrustUpgradeRequest {
  peer_id: string;
  new_trust_level: TrustLevel;
  reason?: string;
}

export interface DiscoverPeerRequest {
  peer_url: string;
}

export interface HandshakeRequest {
  substrate_id: string;
  substrate_name: string;
  capabilities: Record<string, any>;
  certificate?: string;
}

// Metrics and Monitoring
export interface FederationMetrics {
  total_peers: number;
  connected_peers: number;
  trusted_peers: number;
  total_delegations: number;
  successful_delegations: number;
  failed_delegations: number;
  avg_delegation_time_ms: number;
  network_health: number; // 0-1 scale
  last_updated: string;
}

export interface FederationHealth {
  overall_status: 'healthy' | 'degraded' | 'critical';
  network_health: number;
  peer_connectivity: number;
  delegation_success_rate: number;
  trust_violations: number;
  last_check: string;
  issues: HealthIssue[];
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'trust' | 'performance' | 'security';
  message: string;
  timestamp: string;
  affected_resources: string[];
}

// Error Handling
export interface FederationError {
  type: FederationErrorType;
  message: string;
  context: Record<string, any>;
  timestamp: string;
  recoverable: boolean;
  suggestedActions: string[];
}

// Security and Permissions
export interface FederationPermission {
  action: 'view' | 'manage' | 'delegate' | 'trust_manage' | 'admin';
  resource: 'peers' | 'delegations' | 'trust' | 'metrics' | 'system';
  conditions?: {
    trustLevel?: TrustLevel[];
    peerStatus?: PeerStatus[];
    delegationPriority?: number;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  outcome: 'success' | 'failure';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export interface CertificateValidation {
  isValid: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  issues: string[];
  lastValidated: string;
}

// WebSocket Events
export interface FederationEvent {
  type: 'federation.peer.discovered' 
      | 'federation.peer.status_changed'
      | 'federation.peer.disconnected'
      | 'federation.delegation.created'
      | 'federation.delegation.accepted'
      | 'federation.delegation.completed'
      | 'federation.delegation.failed'
      | 'federation.trust.established'
      | 'federation.trust.upgraded'
      | 'federation.trust.revoked'
      | 'federation.metrics.updated'
      | 'federation.alert.critical';
  data: any;
  timestamp: string;
}

// UI Component Props
export interface PeerCardProps {
  peer: SubstratePeer;
  onStatusClick?: (peer: SubstratePeer) => void;
  onTrustClick?: (peer: SubstratePeer) => void;
  onConnect?: (peer: SubstratePeer) => void;
  compact?: boolean;
}

export interface DelegationQueueProps {
  delegations: Delegation[];
  onDelegationClick?: (delegation: Delegation) => void;
  onRetry?: (delegation: Delegation) => void;
  onCancel?: (delegation: Delegation) => void;
  loading?: boolean;
  error?: string;
}

export interface TrustMatrixProps {
  relationships: TrustRelationship[];
  peers: SubstratePeer[];
  onTrustUpgrade?: (relationship: TrustRelationship, newLevel: TrustLevel) => void;
  onTrustRevoke?: (relationship: TrustRelationship) => void;
  interactive?: boolean;
}

// Performance Monitoring
export interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
}

// Network Topology
export interface GraphNode {
  id: string;
  name: string;
  status: string;
  trust_level: string;
  color: string;
  size?: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  trust_level: string;
  color: string;
  width?: number;
}

export interface NetworkTopologyData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface NetworkNode {
  id: string;
  name: string;
  status: PeerStatus;
  trustLevel: TrustLevel;
  color: string;
  size?: number;
  x?: number;
  y?: number;
}

// Filter and Search
export interface FederationFilters {
  peerStatus?: PeerStatus[];
  trustLevel?: TrustLevel[];
  delegationStatus?: DelegationStatus[];
  timeRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
}

// Utility Types
export type FederationTab = 'peers' | 'delegations' | 'trust' | 'topology' | 'metrics' | 'monitoring';

export interface FederationDashboardState {
  activeTab: FederationTab;
  filters: FederationFilters;
  isConnected: boolean;
  lastUpdate: string;
}

// API Response Wrappers
export interface FederationApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// All types are already exported above - no need for duplicate exports