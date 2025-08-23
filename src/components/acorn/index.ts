// ACORN Message Type Components
export { RoomStateIndicator } from './RoomStateIndicator';
export { IntermediateStatusDisplay } from './IntermediateStatusDisplay'; 
export { MessageTypeIndicator } from './MessageTypeIndicator';
export { ACORNMessageTypeDemo } from './ACORNMessageTypeDemo';
export { WebSocketConnectionTest } from './WebSocketConnectionTest';

// Re-export types and hooks for convenience
export type { 
  ACORNWebSocketMessage,
  ACORNMessageType,
  RoomState,
  MessageTypeCategory
} from '../../types/acorn-messages';

export { 
  MESSAGE_TYPE_CATEGORIES,
  getMessageTypeCategory,
  isIntermediateStatusMessage,
  isGovernanceMessage,
  getRoomStateColor,
  getRoomStateIcon
} from '../../types/acorn-messages';

export { useACORNMessages } from '../../hooks/useACORNMessages';
export { useACORNWebSocket } from '../../hooks/useACORNWebSocket';
export type { 
  ACORNMessage,
  RoomStateInfo,
  IntermediateStatus 
} from '../../hooks/useACORNMessages';