/**
 * Simplified Room State Governance Types
 * 
 * Basic TypeScript types for governance state display.
 * WebSocket and complex Trinity types removed - governance is now request-scoped.
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

export interface ParticipationRules {
  users_can_send: boolean;
  users_can_read: boolean;
  executive_agents_active: boolean;
  system_agents_active: boolean;
  state_reason?: string;
  restrictions: string[];
}

export interface GovernanceFlags {
  manual_override_active: boolean;
  escalation_pending: boolean;
  high_priority_review: boolean;
  system_maintenance_mode: boolean;
}

export interface RoomGovernanceState {
  room_id: string;
  current_state: RoomState;
  state_updated_at: string;
  state_updated_by: string;
  governance_flags: GovernanceFlags;
  participation_rules: ParticipationRules;
}

// Hook Return Types

export interface UseGovernanceStateReturn {
  governance: RoomGovernanceState | null;
  isLoading: boolean;
  error: string | null;
  refreshGovernance: () => Promise<void>;
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