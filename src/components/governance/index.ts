/**
 * Simplified Governance Components Index
 * 
 * Basic governance components for minimal state display.
 * Complex WebSocket and Trinity components simplified to placeholders.
 */

// Core Components (simplified)
export { RoomStateIndicator, RoomStateBadge, RoomStateDot } from './RoomStateIndicator';
export { RoomStateCard } from './RoomStateCard';
export { RoomGovernanceModal } from './RoomGovernanceModal';

// Placeholder Components (for backward compatibility)
export { TrinityQueueStatus, TrinityQueueIndicator } from './TrinityQueueStatus';
export { 
  GovernanceNotifications, 
  GovernanceNotificationBadge, 
  GovernanceNotificationSummary 
} from './GovernanceNotifications';
export { 
  ACORNChatRoomGovernance, 
  useACORNGovernanceContext 
} from './ACORNChatRoomGovernance';
export { GovernanceDashboard } from './GovernanceDashboard';
export { GovernanceTestComponent } from './GovernanceTestComponent';

// Re-export basic types
export type {
  RoomState,
  ParticipationRules,
  RoomGovernanceState
} from '../../types/governance';

// Re-export simplified service and hook
export { governanceService } from '../../services/governanceService';
export { useGovernanceState, useRoomGovernance } from '../../hooks/useGovernance';
export { useRoomStates } from '../../hooks/useRoomStates';
export type { RoomWithState, UseRoomStatesReturn } from '../../hooks/useRoomStates';