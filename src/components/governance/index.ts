/**
 * Governance Components Index
 * 
 * Exports all governance-related components for easy importing.
 */

// Core Components
export { RoomStateIndicator, RoomStateBadge, RoomStateDot } from './RoomStateIndicator';
export { TrinityQueueStatus, TrinityQueueIndicator } from './TrinityQueueStatus';
export { 
  GovernanceNotifications, 
  GovernanceNotificationBadge, 
  GovernanceNotificationSummary 
} from './GovernanceNotifications';

// Integration Components
export { 
  ACORNChatRoomGovernance, 
  useACORNGovernanceContext 
} from './ACORNChatRoomGovernance';

// Dashboard Components
export { GovernanceDashboard } from './GovernanceDashboard';

// Test Component (for development)
export { GovernanceTestComponent } from './GovernanceTestComponent';

// Re-export types and services for convenience
export type {
  RoomState,
  ParticipationRules,
  RoomGovernanceState,
  TrinityQueueStatus as TrinityQueueStatusType,
  GovernanceSystemSummary,
  GovernanceNotification,
  GovernanceWebSocketEvent
} from '../../types/governance';

export { governanceService, GovernanceWebSocketUtils } from '../../services/governanceService';

export {
  useGovernanceState,
  useTrinityQueue,
  useGovernanceSummary,
  useGovernanceWebSocket,
  useRoomGovernance,
  useGovernanceNotifications
} from '../../hooks/useGovernance';