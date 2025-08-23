import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ACORNWebSocketMessage, 
  ACORNMessageType, 
  RoomState,
  isIntermediateStatusMessage,
  isGovernanceMessage,
  getMessageTypeCategory 
} from '../types/acorn-messages';

export interface ACORNMessage extends ACORNWebSocketMessage {
  id: string;
  localTimestamp: Date;
  category?: string;
  isIntermediate?: boolean;
}

export interface RoomStateInfo {
  currentState: RoomState;
  previousState?: RoomState;
  lastTransition?: Date;
  transitionReason?: string;
  transitionedBy?: string;
  participationRules?: {
    executive_agents_active: boolean;
    system_agents_active: boolean;
    users_can_send: boolean;
    state_reason: string;
    restrictions?: string[];
  };
}

export interface IntermediateStatus {
  id: string;
  message: string;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  operationType?: string;
  timestamp: Date;
  isActive: boolean;
}

interface UseACORNMessagesConfig {
  roomId?: string;
  maxMessages?: number;
  maxIntermediateStatus?: number;
  autoRemoveIntermediateDelay?: number; // ms
}

export const useACORNMessages = (config: UseACORNMessagesConfig = {}) => {
  const {
    roomId,
    maxMessages = 100,
    maxIntermediateStatus = 5,
    autoRemoveIntermediateDelay = 5000
  } = config;

  // Message storage
  const [messages, setMessages] = useState<ACORNMessage[]>([]);
  const [roomState, setRoomState] = useState<RoomStateInfo>({
    currentState: RoomState.INITIALIZING
  });
  const [intermediateStatuses, setIntermediateStatuses] = useState<IntermediateStatus[]>([]);
  
  // Auto-removal timers for intermediate statuses
  const statusTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clear intermediate status after delay
  const scheduleStatusRemoval = useCallback((statusId: string) => {
    // Clear existing timer if any
    const existingTimer = statusTimers.current.get(statusId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new removal
    const timer = setTimeout(() => {
      setIntermediateStatuses(prev => 
        prev.map(status => 
          status.id === statusId 
            ? { ...status, isActive: false }
            : status
        )
      );
      
      // Remove completely after fade out
      setTimeout(() => {
        setIntermediateStatuses(prev => prev.filter(s => s.id !== statusId));
        statusTimers.current.delete(statusId);
      }, 300); // Fade out duration
      
    }, autoRemoveIntermediateDelay);

    statusTimers.current.set(statusId, timer);
  }, [autoRemoveIntermediateDelay]);

  // Process incoming WebSocket message
  const processMessage = useCallback((rawMessage: ACORNWebSocketMessage) => {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const category = getMessageTypeCategory(rawMessage.message_type);
    
    const acornMessage: ACORNMessage = {
      ...rawMessage,
      id: messageId,
      localTimestamp: new Date(),
      category: category?.name,
      isIntermediate: isIntermediateStatusMessage(rawMessage.message_type)
    };

    console.log('🔄 Processing ACORN message:', {
      type: rawMessage.type,
      messageType: rawMessage.message_type,
      category: category?.name,
      isIntermediate: acornMessage.isIntermediate,
      isGovernance: isGovernanceMessage(rawMessage.message_type)
    });

    // Handle different message types
    switch (rawMessage.type) {
      case 'room_state_change':
        handleRoomStateChange(rawMessage);
        break;
        
      case 'chat_message':
        handleChatMessage(acornMessage);
        break;
        
      case 'intermediate_status':
      case 'system_status_update':
        if (acornMessage.isIntermediate) {
          handleIntermediateStatus(acornMessage);
        } else {
          handleChatMessage(acornMessage);
        }
        break;
        
      default:
        // Handle as regular chat message
        handleChatMessage(acornMessage);
    }
  }, []);

  // Handle room state changes
  const handleRoomStateChange = useCallback((message: ACORNWebSocketMessage) => {
    if (message.new_state && message.room_id === roomId) {
      console.log('🏛️ Room state change:', {
        from: message.previous_state,
        to: message.new_state,
        reason: message.transition_reason,
        by: message.transitioned_by
      });

      setRoomState(prev => ({
        currentState: message.new_state as RoomState,
        previousState: message.previous_state as RoomState,
        lastTransition: new Date(),
        transitionReason: message.transition_reason,
        transitionedBy: message.transitioned_by,
        participationRules: message.participation_rules
      }));

      // Also add as a visible message
      const stateMessage: ACORNMessage = {
        ...message,
        id: `state-${Date.now()}`,
        localTimestamp: new Date(),
        category: 'Governance Workflow',
        content: message.content || `Room state changed to ${message.new_state}`,
        system_message: true
      };
      
      handleChatMessage(stateMessage);
    }
  }, [roomId]);

  // Handle regular chat messages
  const handleChatMessage = useCallback((message: ACORNMessage) => {
    setMessages(prev => {
      const newMessages = [...prev, message].slice(-maxMessages);
      return newMessages;
    });
  }, [maxMessages]);

  // Handle intermediate status updates
  const handleIntermediateStatus = useCallback((message: ACORNMessage) => {
    const statusId = `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const intermediateStatus: IntermediateStatus = {
      id: statusId,
      message: message.content,
      agentId: message.agent_id,
      agentName: message.agent_name,
      agentAvatar: message.agent_avatar,
      operationType: message.metadata?.operation_type,
      timestamp: new Date(),
      isActive: true
    };

    console.log('⚡ Adding intermediate status:', intermediateStatus);

    setIntermediateStatuses(prev => {
      const newStatuses = [intermediateStatus, ...prev].slice(0, maxIntermediateStatus);
      return newStatuses;
    });

    // Schedule auto-removal
    scheduleStatusRemoval(statusId);
  }, [maxIntermediateStatus, scheduleStatusRemoval]);

  // Manually remove intermediate status
  const removeIntermediateStatus = useCallback((statusId: string) => {
    const timer = statusTimers.current.get(statusId);
    if (timer) {
      clearTimeout(timer);
      statusTimers.current.delete(statusId);
    }
    
    setIntermediateStatuses(prev => prev.filter(s => s.id !== statusId));
  }, []);

  // Clear all intermediate statuses
  const clearIntermediateStatuses = useCallback(() => {
    // Clear all timers
    statusTimers.current.forEach(timer => clearTimeout(timer));
    statusTimers.current.clear();
    
    setIntermediateStatuses([]);
  }, []);

  // Get messages by category
  const getMessagesByCategory = useCallback((categoryName: string) => {
    return messages.filter(msg => msg.category === categoryName);
  }, [messages]);

  // Get messages by type
  const getMessagesByType = useCallback((messageType: ACORNMessageType) => {
    return messages.filter(msg => msg.message_type === messageType);
  }, [messages]);

  // Get governance messages
  const getGovernanceMessages = useCallback(() => {
    return messages.filter(msg => isGovernanceMessage(msg.message_type));
  }, [messages]);

  // Check if room allows user input
  const canUserSend = useCallback(() => {
    return roomState.participationRules?.users_can_send ?? true;
  }, [roomState.participationRules]);

  // Check if executive agents are active
  const areExecutiveAgentsActive = useCallback(() => {
    return roomState.participationRules?.executive_agents_active ?? true;
  }, [roomState.participationRules]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      statusTimers.current.forEach(timer => clearTimeout(timer));
      statusTimers.current.clear();
    };
  }, []);

  return {
    // State
    messages,
    roomState,
    intermediateStatuses,
    
    // Actions
    processMessage,
    removeIntermediateStatus,
    clearIntermediateStatuses,
    
    // Queries
    getMessagesByCategory,
    getMessagesByType,
    getGovernanceMessages,
    canUserSend,
    areExecutiveAgentsActive,
    
    // Room state helpers
    currentRoomState: roomState.currentState,
    participationRules: roomState.participationRules
  };
};