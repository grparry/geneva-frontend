/**
 * Room State Governance Types
 * 
 * TypeScript types for the Geneva Room State Governance system.
 * Provides type safety for governance states, Trinity reviews, and participation rules.
 */

export type RoomState = 
  | 'INITIALIZING'
  | 'READY' 
  | 'CONTEXT_INJECTION'
  | 'TRINITY_REVIEW'
  | 'HUMAN_REVIEW'
  | 'BLOCKED'
  | 'SAVING_STATE'
  | 'IDLE';

export type AuthorityType =
  | 'system_agent'
  | 'executive_agent'
  | 'human_review'
  | 'governance_decision'
  | 'admin_override';

export type ReviewType =
  | 'governance_escalation'
  | 'security_violation'
  | 'policy_breach'
  | 'content_moderation'
  | 'resource_constraint'
  | 'compliance_check';

export type ReviewPriority = 'low' | 'medium' | 'high' | 'critical';

export type QueueStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'escalated'
  | 'blocked'
  | 'timeout';

export type ResolutionAction =
  | 'approved'
  | 'blocked'
  | 'escalated'
  | 'modified'
  | 'deferred'
  | 'overridden';

export interface ParticipationRules {
  executive_agents_active: boolean;
  system_agents_active: boolean;
  users_can_send: boolean;
  users_can_read: boolean;
  auto_context_injection: boolean;
  state_reason: string;
  restrictions: string[];
}

export interface GovernanceFlags {
  escalation_pending: boolean;
  security_review_required: boolean;
}

export interface RoomGovernanceState {
  room_id: string;
  current_state: RoomState;
  previous_state: RoomState | null;
  state_updated_at: string;
  state_updated_by: string;
  governance_flags: GovernanceFlags;
  in_trinity_queue: boolean;
  trinity_queue_length: number;
  participation_rules: ParticipationRules;
  trinity_queue_summary: TrinityQueueSummary;
}

export interface TrinityQueueSummary {
  total_items: number;
  pending_items: number;
  safety_suspension_active: boolean;
}

export interface TrinityQueueStatus {
  room_id: string;
  queue_summary: {
    total_items: number;
    pending_items: number;
    in_progress_items: number;
    completed_items: number;
    timeout_items: number;
    items_by_priority: Record<ReviewPriority, number>;
    items_by_type: Record<ReviewType, number>;
    avg_completion_time_hours: number;
    oldest_pending_item: string | null;
    safety_suspension_active: boolean;
  };
}

export interface GovernanceSystemSummary {
  room_state_summary: {
    total_rooms: number;
    active_rooms: number;
    states: Record<RoomState, {
      count: number;
      active: number;
      avg_time_in_state_seconds: number;
    }>;
    trinity_queue_length: number;
  };
  trinity_queue_summary: {
    total_items: number;
    pending_items: number;
    in_progress_items: number;
    completed_items: number;
    safety_suspension_active: boolean;
    items_by_priority: Record<ReviewPriority, number>;
    items_by_type: Record<ReviewType, number>;
  };
  system_status: 'operational' | 'degraded' | 'critical';
}

export interface StateTransitionRequest {
  new_state: RoomState;
  transitioned_by: string;
  authority_type: AuthorityType;
  reason: string;
  context?: Record<string, any>;
}

export interface StateTransitionResponse {
  success: boolean;
  room_id: string;
  transition: {
    from_state: RoomState;
    to_state: RoomState;
    reason: string;
    transitioned_by: string;
    authority_type: AuthorityType;
    timestamp: string;
    context?: Record<string, any>;
  };
}

// WebSocket Event Types

export interface RoomStateChangeEvent {
  type: 'room_state_change';
  room_id: string;
  previous_state: RoomState;
  new_state: RoomState;
  reason: string;
  timestamp: string;
  agent_participation_rules: {
    system_agents: 'allowed' | 'trinity_only' | 'suspended';
    executive_agents: 'allowed' | 'suspended';
    users: 'allowed' | 'read_only' | 'observer';
    message: string;
  };
}

export interface TrinityQueueUpdateEvent {
  type: 'trinity_queue_update';
  room_id: string;
  queue_length: number;
  queue_position: number;
  estimated_wait_time: string;
  review_type: ReviewType;
  priority: ReviewPriority;
}

export type GovernanceWebSocketEvent = RoomStateChangeEvent | TrinityQueueUpdateEvent;

// Enhanced Room Status with Governance

export interface RoomStatusWithGovernance {
  room_id: string;
  status: string;
  participants: string[];
  system_participants: string[];
  governance: RoomGovernanceState;
}

// Hook Return Types

export interface UseGovernanceStateReturn {
  governance: RoomGovernanceState | null;
  isLoading: boolean;
  error: string | null;
  refreshGovernance: () => Promise<void>;
}

export interface UseTrinityQueueReturn {
  queueStatus: TrinityQueueStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshQueue: () => Promise<void>;
}

export interface UseGovernanceSummaryReturn {
  summary: GovernanceSystemSummary | null;
  isLoading: boolean;
  error: string | null;
  refreshSummary: () => Promise<void>;
}

// Utility Types

export type GovernanceStateConfig = {
  [K in RoomState]: {
    color: string;
    label: string;
    icon: string;
    description: string;
  };
};

export interface GovernanceNotification {
  id: string;
  type: 'state_change' | 'queue_update' | 'escalation' | 'resolution';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  room_id?: string;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}