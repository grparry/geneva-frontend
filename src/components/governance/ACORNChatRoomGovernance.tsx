/**
 * ACORN Chat Room Governance Integration
 * 
 * Enhanced version of ACORNChatRoom with governance features integrated.
 * Provides seamless governance state management without disrupting existing functionality.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Snackbar, Alert, Button } from '@mui/material';
import { useRoomGovernance, useGovernanceNotifications } from '../../hooks/useGovernance';
import { RoomStateIndicator } from './RoomStateIndicator';
import { TrinityQueueStatus, TrinityQueueIndicator } from './TrinityQueueStatus';
import { GovernanceNotifications } from './GovernanceNotifications';
import { GovernanceWebSocketEvent, RoomState } from '../../types/governance';

interface ACORNChatRoomGovernanceProps {
  roomId: string;
  children?: React.ReactNode;
  onGovernanceStateChange?: (state: RoomState) => void;
  onParticipationRulesChange?: (canSend: boolean, canRead: boolean) => void;
  showGovernanceInHeader?: boolean;
  showTrinityQueue?: boolean;
  showNotifications?: boolean;
}

/**
 * Governance wrapper component that can be wrapped around existing ACORNChatRoom
 */
export const ACORNChatRoomGovernance: React.FC<ACORNChatRoomGovernanceProps> = ({
  roomId,
  children,
  onGovernanceStateChange,
  onParticipationRulesChange,
  showGovernanceInHeader = true,
  showTrinityQueue = true,
  showNotifications = true
}) => {
  const [showGovernanceDetails, setShowGovernanceDetails] = useState(false);
  const [queueExpanded, setQueueExpanded] = useState(false);
  
  // Governance state management
  const {
    governance,
    isLoading: governanceLoading,
    error: governanceError,
    trinityQueue,
    webSocket,
    refreshAll
  } = useRoomGovernance(roomId);

  // Notification management
  const {
    notifications: localNotifications,
    addNotification,
    removeNotification,
    clearAll: clearLocalNotifications
  } = useGovernanceNotifications();

  // Combine WebSocket notifications with local notifications
  const allNotifications = [...localNotifications, ...webSocket.notifications];

  // Handle governance state changes
  useEffect(() => {
    if (governance && onGovernanceStateChange) {
      onGovernanceStateChange(governance.current_state);
    }
  }, [governance?.current_state, onGovernanceStateChange]);

  // Handle participation rules changes
  useEffect(() => {
    if (governance?.participation_rules && onParticipationRulesChange) {
      onParticipationRulesChange(
        governance.participation_rules.users_can_send,
        governance.participation_rules.users_can_read
      );
    }
  }, [governance?.participation_rules, onParticipationRulesChange]);

  // Add notifications for governance events
  useEffect(() => {
    const latestEvent = webSocket.events[webSocket.events.length - 1];
    if (latestEvent && latestEvent.room_id === roomId) {
      // Add contextual notifications based on state changes
      if (latestEvent.type === 'room_state_change') {
        const { new_state, reason } = latestEvent;
        
        if (new_state === 'BLOCKED') {
          addNotification({
            type: 'state_change',
            severity: 'error',
            title: 'Room Blocked',
            message: `This room has been blocked: ${reason}`,
            room_id: roomId
          });
        } else if (new_state === 'TRINITY_REVIEW') {
          addNotification({
            type: 'state_change',
            severity: 'warning',
            title: 'Trinity Review Started',
            message: 'Executive agents are suspended during review',
            room_id: roomId
          });
        } else if (new_state === 'READY') {
          addNotification({
            type: 'state_change',
            severity: 'success',
            title: 'Room Ready',
            message: 'All agents can now participate normally',
            room_id: roomId
          });
        }
      }
    }
  }, [webSocket.events, roomId, addNotification]);

  const handleGovernanceError = () => {
    if (governanceError) {
      addNotification({
        type: 'state_change',
        severity: 'error',
        title: 'Governance Error',
        message: governanceError,
        actions: [{ label: 'Retry', action: refreshAll }]
      });
    }
  };

  useEffect(() => {
    handleGovernanceError();
  }, [governanceError]);

  const getParticipationMessage = () => {
    if (!governance?.participation_rules) return null;
    
    const rules = governance.participation_rules;
    
    if (!rules.users_can_send && !rules.users_can_read) {
      return {
        severity: 'error' as const,
        message: 'This room is currently inaccessible'
      };
    } else if (!rules.users_can_send) {
      return {
        severity: 'warning' as const,
        message: 'This room is currently read-only'
      };
    } else if (!rules.executive_agents_active) {
      return {
        severity: 'info' as const,
        message: 'Executive agents are currently suspended'
      };
    }
    
    return null;
  };

  const participationAlert = getParticipationMessage();

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {/* Governance Header */}
      {showGovernanceInHeader && governance && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <RoomStateIndicator
            currentState={governance.current_state}
            participationRules={governance.participation_rules}
            trinityQueueLength={governance.trinity_queue_length}
            onClick={() => setShowGovernanceDetails(!showGovernanceDetails)}
          />
          
          {governance.trinity_queue_length > 0 && (
            <TrinityQueueIndicator
              queueLength={governance.trinity_queue_length}
              safetyActive={governance.trinity_queue_summary.safety_suspension_active}
              onClick={() => setQueueExpanded(!queueExpanded)}
            />
          )}
          
          <Box sx={{ ml: 'auto' }}>
            <Typography variant="caption" color="text.secondary">
              Updated by {governance.state_updated_by}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Participation Alert */}
      {participationAlert && (
        <Alert 
          severity={participationAlert.severity}
          sx={{ borderRadius: 0 }}
          action={
            governance?.participation_rules.state_reason && (
              <Button 
                size="small" 
                color="inherit"
                onClick={() => setShowGovernanceDetails(true)}
              >
                Details
              </Button>
            )
          }
        >
          {participationAlert.message}
          {governance?.participation_rules.state_reason && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {governance.participation_rules.state_reason}
            </Typography>
          )}
        </Alert>
      )}

      {/* Trinity Queue Status (when expanded) */}
      {showTrinityQueue && trinityQueue && queueExpanded && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TrinityQueueStatus
            queueStatus={trinityQueue}
            roomId={roomId}
            expanded={true}
            onExpandChange={setQueueExpanded}
          />
        </Box>
      )}

      {/* Main Chat Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'hidden',
        position: 'relative'
      }}>
        {children}
      </Box>

      {/* Governance Notifications */}
      {showNotifications && (
        <GovernanceNotifications
          notifications={allNotifications}
          onNotificationRemove={(id) => {
            removeNotification(id);
            webSocket.removeNotification(id);
          }}
          onNotificationAction={(notification, actionIndex) => {
            if (notification.actions?.[actionIndex]) {
              notification.actions[actionIndex].action();
            }
          }}
          position={{ vertical: 'top', horizontal: 'center' }}
        />
      )}

      {/* WebSocket Connection Error */}
      {!webSocket.isConnected && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert 
            severity="warning"
            action={
              <Button size="small" color="inherit" onClick={webSocket.connect}>
                Reconnect
              </Button>
            }
          >
            Governance events disconnected
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

/**
 * Hook to provide governance context to child components
 */
export const useACORNGovernanceContext = (roomId: string) => {
  const governance = useRoomGovernance(roomId);
  
  return {
    ...governance,
    
    // Helper functions for component integration
    canUserSend: governance.governance?.participation_rules.users_can_send ?? true,
    canUserRead: governance.governance?.participation_rules.users_can_read ?? true,
    areExecutiveAgentsActive: governance.governance?.participation_rules.executive_agents_active ?? true,
    areSystemAgentsActive: governance.governance?.participation_rules.system_agents_active ?? true,
    
    // State checkers
    isRoomBlocked: governance.governance?.current_state === 'BLOCKED',
    isInTrinityReview: governance.governance?.current_state === 'TRINITY_REVIEW',
    isInHumanReview: governance.governance?.current_state === 'HUMAN_REVIEW',
    isRoomReady: governance.governance?.current_state === 'READY',
    
    // UI helpers
    getInputPlaceholder: () => {
      if (!governance.governance) return 'Type your message...';
      
      const rules = governance.governance.participation_rules;
      if (!rules.users_can_send) {
        return rules.state_reason || 'Messages disabled';
      }
      return 'Type your message...';
    },
    
    getDisabledReason: () => {
      if (!governance.governance) return null;
      
      const rules = governance.governance.participation_rules;
      if (!rules.users_can_send && rules.restrictions.length > 0) {
        return rules.restrictions.join(', ');
      }
      return null;
    }
  };
};