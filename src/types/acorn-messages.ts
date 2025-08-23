// ACORN Message Types and WebSocket Message Handling
// Based on src/core/message_types.py and ACORN documentation

export enum ACORNMessageType {
  // User Communication
  USER_MESSAGE = 'user_message',
  USER_QUESTION = 'user_question', 
  USER_REQUEST = 'user_request',
  USER_COMMAND = 'user_command',
  USER_FEEDBACK = 'user_feedback',

  // Executive Agent Responses
  EXECUTIVE_RESPONSE = 'executive_response',
  EXECUTIVE_ANALYSIS = 'executive_analysis',
  EXECUTIVE_RECOMMENDATION = 'executive_recommendation',
  EXECUTIVE_DECISION = 'executive_decision',
  EXECUTIVE_ESCALATION = 'executive_escalation',

  // System Agent Operations
  SYSTEM_NOTIFICATION = 'system_notification',
  SYSTEM_STATUS_UPDATE = 'system_status_update',
  SYSTEM_ERROR_REPORT = 'system_error_report',
  SYSTEM_COMPLETION = 'system_completion',
  SYSTEM_ALERT = 'system_alert',

  // Trinity Governance
  TRINITY_REVIEW_REQUEST = 'trinity_review_request',
  TRINITY_REVIEW_RESPONSE = 'trinity_review_response',
  TRINITY_COLLABORATION = 'trinity_collaboration',
  TRINITY_DECISION = 'trinity_decision',
  TRINITY_ESCALATION = 'trinity_escalation',

  // Governance Workflow
  GOVERNANCE_STATE_CHANGE = 'governance_state_change',
  GOVERNANCE_VALIDATION = 'governance_validation',
  GOVERNANCE_APPROVAL = 'governance_approval',
  GOVERNANCE_REJECTION = 'governance_rejection',
  GOVERNANCE_BLOCK = 'governance_block',

  // Memory Operations
  MEMORY_INJECTION = 'memory_injection',
  MEMORY_ORGANIZATION = 'memory_organization',
  MEMORY_VALIDATION = 'memory_validation',
  MEMORY_COMPLETION = 'memory_completion',
  MEMORY_ERROR = 'memory_error',

  // Infrastructure Events
  INFRASTRUCTURE_STARTUP = 'infrastructure_startup',
  INFRASTRUCTURE_SHUTDOWN = 'infrastructure_shutdown',
  INFRASTRUCTURE_HEALTH_CHECK = 'infrastructure_health_check',
  INFRASTRUCTURE_MAINTENANCE = 'infrastructure_maintenance',
  INFRASTRUCTURE_DEPLOYMENT = 'infrastructure_deployment',

  // Workflow Coordination
  WORKFLOW_START = 'workflow_start',
  WORKFLOW_STEP_COMPLETE = 'workflow_step_complete',
  WORKFLOW_PAUSE = 'workflow_pause',
  WORKFLOW_RESUME = 'workflow_resume',
  WORKFLOW_COMPLETE = 'workflow_complete',
  WORKFLOW_ERROR = 'workflow_error'
}

export enum RoomState {
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  CONTEXT_INJECTION = 'CONTEXT_INJECTION',
  TRINITY_REVIEW = 'TRINITY_REVIEW',
  HUMAN_REVIEW = 'HUMAN_REVIEW',
  BLOCKED = 'BLOCKED',
  SAVING_STATE = 'SAVING_STATE',
  IDLE = 'IDLE'
}

export interface ACORNWebSocketMessage {
  // Core message fields
  type: string; // WebSocket message type (e.g., 'chat_message', 'room_state_change')
  message_type: ACORNMessageType; // Structured ACORN message type
  content: string;
  timestamp: string;
  
  // Agent information
  agent_id?: string;
  agent_name?: string;
  agent_title?: string;
  agent_avatar?: string;
  agent_color?: string;
  
  // User information
  user_id?: string;
  
  // Room information
  room_id?: string;
  
  // Room state change specific fields
  previous_state?: RoomState;
  new_state?: RoomState;
  transition_reason?: string;
  transitioned_by?: string;
  
  // Participation rules
  participation_rules?: {
    executive_agents_active: boolean;
    system_agents_active: boolean;
    users_can_send: boolean;
    state_reason: string;
    restrictions?: string[];
  };
  
  // System message flag
  system_message?: boolean;
  
  // Generic metadata
  metadata?: {
    operation_type?: string;
    authority?: string;
    progress?: string;
    state_transition?: {
      from: RoomState;
      to: RoomState;
      reason: string;
      transitioned_by: string;
    };
    [key: string]: any;
  };
  
  // Media items
  media_items?: any[];
}

export interface MessageTypeCategory {
  name: string;
  types: ACORNMessageType[];
  priority: number;
  requiresResponse: boolean;
  canTriggerWorkflows: boolean;
  color: string;
  icon: string;
}

export const MESSAGE_TYPE_CATEGORIES: Record<string, MessageTypeCategory> = {
  user: {
    name: 'User Communication',
    types: [
      ACORNMessageType.USER_MESSAGE,
      ACORNMessageType.USER_QUESTION,
      ACORNMessageType.USER_REQUEST,
      ACORNMessageType.USER_COMMAND,
      ACORNMessageType.USER_FEEDBACK
    ],
    priority: 8,
    requiresResponse: true,
    canTriggerWorkflows: true,
    color: '#2196f3',
    icon: '💬'
  },
  executive: {
    name: 'Executive Responses',
    types: [
      ACORNMessageType.EXECUTIVE_RESPONSE,
      ACORNMessageType.EXECUTIVE_ANALYSIS,
      ACORNMessageType.EXECUTIVE_RECOMMENDATION,
      ACORNMessageType.EXECUTIVE_DECISION,
      ACORNMessageType.EXECUTIVE_ESCALATION
    ],
    priority: 7,
    requiresResponse: false,
    canTriggerWorkflows: true,
    color: '#4caf50',
    icon: '👔'
  },
  system: {
    name: 'System Operations',
    types: [
      ACORNMessageType.SYSTEM_NOTIFICATION,
      ACORNMessageType.SYSTEM_STATUS_UPDATE,
      ACORNMessageType.SYSTEM_ERROR_REPORT,
      ACORNMessageType.SYSTEM_COMPLETION,
      ACORNMessageType.SYSTEM_ALERT
    ],
    priority: 6,
    requiresResponse: false,
    canTriggerWorkflows: false,
    color: '#ff9800',
    icon: '⚙️'
  },
  trinity: {
    name: 'Trinity Governance',
    types: [
      ACORNMessageType.TRINITY_REVIEW_REQUEST,
      ACORNMessageType.TRINITY_REVIEW_RESPONSE,
      ACORNMessageType.TRINITY_COLLABORATION,
      ACORNMessageType.TRINITY_DECISION,
      ACORNMessageType.TRINITY_ESCALATION
    ],
    priority: 9,
    requiresResponse: true,
    canTriggerWorkflows: true,
    color: '#9c27b0',
    icon: '🛡️'
  },
  governance: {
    name: 'Governance Workflow',
    types: [
      ACORNMessageType.GOVERNANCE_STATE_CHANGE,
      ACORNMessageType.GOVERNANCE_VALIDATION,
      ACORNMessageType.GOVERNANCE_APPROVAL,
      ACORNMessageType.GOVERNANCE_REJECTION,
      ACORNMessageType.GOVERNANCE_BLOCK
    ],
    priority: 10,
    requiresResponse: false,
    canTriggerWorkflows: true,
    color: '#f44336',
    icon: '🏛️'
  },
  memory: {
    name: 'Memory Operations',
    types: [
      ACORNMessageType.MEMORY_INJECTION,
      ACORNMessageType.MEMORY_ORGANIZATION,
      ACORNMessageType.MEMORY_VALIDATION,
      ACORNMessageType.MEMORY_COMPLETION,
      ACORNMessageType.MEMORY_ERROR
    ],
    priority: 5,
    requiresResponse: false,
    canTriggerWorkflows: false,
    color: '#673ab7',
    icon: '🧠'
  },
  infrastructure: {
    name: 'Infrastructure Events',
    types: [
      ACORNMessageType.INFRASTRUCTURE_STARTUP,
      ACORNMessageType.INFRASTRUCTURE_SHUTDOWN,
      ACORNMessageType.INFRASTRUCTURE_HEALTH_CHECK,
      ACORNMessageType.INFRASTRUCTURE_MAINTENANCE,
      ACORNMessageType.INFRASTRUCTURE_DEPLOYMENT
    ],
    priority: 3,
    requiresResponse: false,
    canTriggerWorkflows: false,
    color: '#607d8b',
    icon: '🏗️'
  },
  workflow: {
    name: 'Workflow Coordination',
    types: [
      ACORNMessageType.WORKFLOW_START,
      ACORNMessageType.WORKFLOW_STEP_COMPLETE,
      ACORNMessageType.WORKFLOW_PAUSE,
      ACORNMessageType.WORKFLOW_RESUME,
      ACORNMessageType.WORKFLOW_COMPLETE,
      ACORNMessageType.WORKFLOW_ERROR
    ],
    priority: 4,
    requiresResponse: false,
    canTriggerWorkflows: true,
    color: '#795548',
    icon: '🔄'
  }
};

export const getMessageTypeCategory = (messageType: ACORNMessageType): MessageTypeCategory | null => {
  for (const category of Object.values(MESSAGE_TYPE_CATEGORIES)) {
    if (category.types.includes(messageType)) {
      return category;
    }
  }
  return null;
};

export const isIntermediateStatusMessage = (messageType: ACORNMessageType): boolean => {
  return [
    ACORNMessageType.SYSTEM_STATUS_UPDATE,
    ACORNMessageType.MEMORY_INJECTION,
    ACORNMessageType.TRINITY_COLLABORATION,
    ACORNMessageType.WORKFLOW_STEP_COMPLETE
  ].includes(messageType);
};

export const isGovernanceMessage = (messageType: ACORNMessageType): boolean => {
  const governanceCategory = MESSAGE_TYPE_CATEGORIES.governance;
  const trinityCategory = MESSAGE_TYPE_CATEGORIES.trinity;
  return [...governanceCategory.types, ...trinityCategory.types].includes(messageType);
};

export const getRoomStateColor = (state: RoomState): string => {
  switch (state) {
    case RoomState.READY:
      return '#4caf50'; // Green
    case RoomState.TRINITY_REVIEW:
      return '#9c27b0'; // Purple
    case RoomState.HUMAN_REVIEW:
      return '#ff9800'; // Orange
    case RoomState.BLOCKED:
      return '#f44336'; // Red
    case RoomState.CONTEXT_INJECTION:
      return '#673ab7'; // Deep Purple
    case RoomState.SAVING_STATE:
      return '#2196f3'; // Blue
    case RoomState.INITIALIZING:
      return '#607d8b'; // Blue Grey
    case RoomState.IDLE:
      return '#9e9e9e'; // Grey
    default:
      return '#9e9e9e';
  }
};

export const getRoomStateIcon = (state: RoomState): string => {
  switch (state) {
    case RoomState.READY:
      return '✅';
    case RoomState.TRINITY_REVIEW:
      return '🛡️';
    case RoomState.HUMAN_REVIEW:
      return '👤';
    case RoomState.BLOCKED:
      return '🚫';
    case RoomState.CONTEXT_INJECTION:
      return '🧠';
    case RoomState.SAVING_STATE:
      return '💾';
    case RoomState.INITIALIZING:
      return '🔄';
    case RoomState.IDLE:
      return '😴';
    default:
      return '❓';
  }
};