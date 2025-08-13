/**
 * Enhanced ACORN Chat Room with Governance
 * 
 * Example of how to integrate governance features into the existing ACORNChatRoom.
 * This shows the minimal changes needed to add governance to existing chat functionality.
 */

import React, { useState } from 'react';
import { Box, TextField, Button, Chip, Avatar, Typography } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

// Import the original ACORNChatRoom component (this would be the actual import)
// import { ACORNChatRoom } from '../ACORNChatRoom';

// Import governance components
import { 
  ACORNChatRoomGovernance, 
  useACORNGovernanceContext,
  RoomStateIndicator,
  TrinityQueueIndicator
} from './index';
import { RoomState } from '../../types/governance';

interface ACORNChatRoomEnhancedProps {
  roomId: string;
  initialParticipants?: string[];
}

/**
 * Example of enhanced chat room with governance integration
 */
export const ACORNChatRoomEnhanced: React.FC<ACORNChatRoomEnhancedProps> = ({
  roomId,
  initialParticipants = []
}) => {
  const [inputMessage, setInputMessage] = useState('');
  
  // Use governance context for this room
  const {
    governance,
    canUserSend,
    canUserRead,
    areExecutiveAgentsActive,
    isRoomBlocked,
    getInputPlaceholder,
    getDisabledReason
  } = useACORNGovernanceContext(roomId);

  // Handle governance state changes
  const handleGovernanceStateChange = (state: RoomState) => {
    console.log('Room state changed to:', state);
    
    // Example: Auto-clear input when room is blocked
    if (state === 'BLOCKED') {
      setInputMessage('');
    }
  };

  // Handle participation rule changes
  const handleParticipationRulesChange = (canSend: boolean, canRead: boolean) => {
    console.log('Participation rules changed:', { canSend, canRead });
    
    // Example: Clear input if user can no longer send
    if (!canSend) {
      setInputMessage('');
    }
  };

  const sendMessage = () => {
    if (!canUserSend || !inputMessage.trim()) return;
    
    // Existing message sending logic would go here
    console.log('Sending message:', inputMessage);
    setInputMessage('');
  };

  const disabledReason = getDisabledReason();

  return (
    <ACORNChatRoomGovernance
      roomId={roomId}
      onGovernanceStateChange={handleGovernanceStateChange}
      onParticipationRulesChange={handleParticipationRulesChange}
      showGovernanceInHeader={true}
      showTrinityQueue={true}
      showNotifications={true}
    >
      {/* This would wrap the existing ACORNChatRoom content */}
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Chat Header with Governance Integration */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="h6">
            Room: {roomId}
          </Typography>
          
          {/* Governance indicators would automatically appear in the wrapper */}
          
          {/* Show agent status with governance context */}
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Chip
              avatar={<Avatar>T</Avatar>}
              label="Thedra"
              color="primary"
              size="small"
            />
            <Chip
              avatar={<Avatar>G</Avatar>}
              label="Greta"
              color="primary"
              size="small"
            />
            <Chip
              avatar={<Avatar>S</Avatar>}
              label="Sloan"
              color={areExecutiveAgentsActive ? 'primary' : 'default'}
              size="small"
              sx={{ 
                opacity: areExecutiveAgentsActive ? 1 : 0.6 
              }}
            />
          </Box>
        </Box>

        {/* Chat Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          opacity: canUserRead ? 1 : 0.5
        }}>
          {!canUserRead ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              You cannot read messages in this room currently
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Chat messages would appear here...
              {isRoomBlocked && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  This room is currently blocked
                </Box>
              )}
            </Typography>
          )}
        </Box>

        {/* Enhanced Input Area with Governance */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={getInputPlaceholder()}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!canUserSend}
              title={disabledReason || undefined}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: canUserSend ? 'background.paper' : 'action.disabledBackground'
                }
              }}
            />
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={sendMessage}
              disabled={!canUserSend || !inputMessage.trim()}
            >
              Send
            </Button>
          </Box>
          
          {disabledReason && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {disabledReason}
            </Typography>
          )}
        </Box>
      </Box>
    </ACORNChatRoomGovernance>
  );
};

/**
 * Simple example showing minimal governance integration
 */
export const SimpleGovernanceExample: React.FC<{ roomId: string }> = ({ roomId }) => {
  const { governance, canUserSend } = useACORNGovernanceContext(roomId);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Simple Governance Integration
      </Typography>
      
      {governance && (
        <Box sx={{ mb: 2 }}>
          <RoomStateIndicator 
            currentState={governance.current_state}
            participationRules={governance.participation_rules}
            trinityQueueLength={governance.trinity_queue_length}
          />
        </Box>
      )}
      
      <TextField
        fullWidth
        placeholder={canUserSend ? 'Type a message...' : 'Messages disabled'}
        disabled={!canUserSend}
        variant="outlined"
      />
      
      {governance?.trinity_queue_length && governance.trinity_queue_length > 0 && (
        <Box sx={{ mt: 2 }}>
          <TrinityQueueIndicator
            queueLength={governance.trinity_queue_length}
            safetyActive={governance?.trinity_queue_summary?.safety_suspension_active}
          />
        </Box>
      )}
    </Box>
  );
};