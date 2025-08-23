import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  TextField,
  Stack,
  Divider
} from '@mui/material';
import { 
  ACORNMessageType, 
  RoomState, 
  ACORNWebSocketMessage 
} from '../../types/acorn-messages';
import { useACORNMessages } from '../../hooks/useACORNMessages';
import { RoomStateIndicator } from './RoomStateIndicator';
import { IntermediateStatusDisplay } from './IntermediateStatusDisplay';
import { MessageTypeIndicator } from './MessageTypeIndicator';

interface ACORNMessageTypeDemoProps {
  roomId?: string;
}

export const ACORNMessageTypeDemo: React.FC<ACORNMessageTypeDemoProps> = ({ 
  roomId = 'demo-room' 
}) => {
  const [selectedMessageType, setSelectedMessageType] = useState<ACORNMessageType>(ACORNMessageType.USER_MESSAGE);
  const [selectedRoomState, setSelectedRoomState] = useState<RoomState>(RoomState.READY);
  const [messageContent, setMessageContent] = useState('This is a demo message');
  const [agentId, setAgentId] = useState('demo_agent');
  
  const {
    messages,
    roomState,
    intermediateStatuses,
    processMessage,
    removeIntermediateStatus,
    canUserSend,
    currentRoomState
  } = useACORNMessages({ roomId });

  const sendDemoMessage = () => {
    const demoMessage: ACORNWebSocketMessage = {
      type: 'chat_message',
      message_type: selectedMessageType,
      content: messageContent,
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      agent_name: 'Demo Agent',
      agent_avatar: '🤖',
      agent_color: '#2196f3',
      room_id: roomId,
      metadata: {
        operation_type: 'demo',
        demo: true
      }
    };

    processMessage(demoMessage);
  };

  const sendRoomStateChange = () => {
    const stateChangeMessage: ACORNWebSocketMessage = {
      type: 'room_state_change',
      message_type: ACORNMessageType.GOVERNANCE_STATE_CHANGE,
      content: `Room state changed to ${selectedRoomState}`,
      timestamp: new Date().toISOString(),
      room_id: roomId,
      previous_state: currentRoomState,
      new_state: selectedRoomState,
      transition_reason: 'Demo state change',
      transitioned_by: 'demo_system',
      system_message: true,
      participation_rules: {
        executive_agents_active: selectedRoomState === RoomState.READY,
        system_agents_active: true,
        users_can_send: selectedRoomState !== RoomState.BLOCKED && selectedRoomState !== RoomState.TRINITY_REVIEW,
        state_reason: `Room is in ${selectedRoomState} state`,
        restrictions: selectedRoomState === RoomState.TRINITY_REVIEW ? ['Executive agents suspended pending review'] : []
      },
      metadata: {
        operation_type: 'room_state_transition',
        authority: 'system'
      }
    };

    processMessage(stateChangeMessage);
  };

  const sendIntermediateStatus = () => {
    const statusMessage: ACORNWebSocketMessage = {
      type: 'intermediate_status',
      message_type: ACORNMessageType.SYSTEM_STATUS_UPDATE,
      content: `🔄 Demo Agent: Processing ${messageContent.toLowerCase()}...`,
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      agent_name: 'Demo Agent',
      agent_avatar: '🔄',
      room_id: roomId,
      metadata: {
        operation_type: 'demo_processing',
        progress: 'in_progress'
      }
    };

    processMessage(statusMessage);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        ACORN Message Type Demo
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Room State
        </Typography>
        <RoomStateIndicator roomState={roomState} showDetails />
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          Can User Send: {canUserSend() ? '✅ Yes' : '❌ No'}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Send Demo Messages
        </Typography>
        
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Message Type</InputLabel>
            <Select
              value={selectedMessageType}
              onChange={(e) => setSelectedMessageType(e.target.value as ACORNMessageType)}
              label="Message Type"
            >
              {Object.values(ACORNMessageType).map((type) => (
                <MenuItem key={type} value={type}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MessageTypeIndicator messageType={type} size="small" />
                    <span>{type}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Message Content"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
          />
          
          <TextField
            fullWidth
            label="Agent ID"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          />
          
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={sendDemoMessage}>
              Send Message
            </Button>
            <Button variant="outlined" onClick={sendIntermediateStatus}>
              Send Status Update
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Room State Changes
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>New Room State</InputLabel>
          <Select
            value={selectedRoomState}
            onChange={(e) => setSelectedRoomState(e.target.value as RoomState)}
            label="New Room State"
          >
            {Object.values(RoomState).map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button variant="contained" onClick={sendRoomStateChange}>
          Change Room State
        </Button>
      </Paper>

      {intermediateStatuses.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Status Updates
          </Typography>
          <IntermediateStatusDisplay
            statuses={intermediateStatuses}
            onRemoveStatus={removeIntermediateStatus}
            showTimestamp
          />
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Messages ({messages.length})
        </Typography>
        
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {messages.slice(-10).map((message, index) => (
            <Box key={message.id} sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MessageTypeIndicator messageType={message.message_type} />
                <Typography variant="caption" color="text.secondary">
                  {message.agent_name || message.user_id || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {message.localTimestamp.toLocaleTimeString()}
                </Typography>
              </Box>
              
              <Typography variant="body2">
                {message.content}
              </Typography>
              
              {message.metadata && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Metadata: {JSON.stringify(message.metadata, null, 2)}
                </Typography>
              )}
            </Box>
          ))}
          
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No messages yet. Send some demo messages to see them here!
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};