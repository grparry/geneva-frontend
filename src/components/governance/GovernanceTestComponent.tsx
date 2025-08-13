/**
 * Governance Test Component
 * 
 * Test component to validate governance service layer integration.
 * This component can be temporarily added to test the service before full UI implementation.
 */

import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import { useRoomGovernance, useGovernanceSummary } from '../../hooks/useGovernance';
import { governanceService } from '../../services/governanceService';
import { StateTransitionRequest } from '../../types/governance';

interface GovernanceTestComponentProps {
  roomId?: string;
}

export const GovernanceTestComponent: React.FC<GovernanceTestComponentProps> = ({ 
  roomId = 'test-room-123' 
}) => {
  const [testRoomId, setTestRoomId] = useState(roomId);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionResult, setTransitionResult] = useState<string | null>(null);

  // Test room governance hooks
  const {
    governance,
    isLoading: governanceLoading,
    error: governanceError,
    trinityQueue,
    trinityQueueLoading,
    trinityQueueError,
    webSocket,
    refreshAll
  } = useRoomGovernance(testRoomId);

  // Test system summary hook
  const {
    summary,
    isLoading: summaryLoading,
    error: summaryError,
    refreshSummary
  } = useGovernanceSummary();

  // Test state transition
  const testStateTransition = async () => {
    if (!testRoomId) return;

    setTransitionLoading(true);
    setTransitionResult(null);

    try {
      const request: StateTransitionRequest = {
        new_state: 'TRINITY_REVIEW',
        transitioned_by: 'test_user',
        authority_type: 'admin_override',
        reason: 'Testing governance service integration',
        context: {
          test: true,
          timestamp: new Date().toISOString()
        }
      };

      const result = await governanceService.transitionRoomState(testRoomId, request);
      setTransitionResult(`Success: Transitioned from ${result.transition.from_state} to ${result.transition.to_state}`);
      
      // Refresh governance state after transition
      setTimeout(() => refreshAll(), 1000);
      
    } catch (error) {
      setTransitionResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTransitionLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'READY': return 'success';
      case 'TRINITY_REVIEW': return 'warning';
      case 'BLOCKED': return 'error';
      case 'HUMAN_REVIEW': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Governance Service Test
      </Typography>
      
      <Stack spacing={3}>
        {/* Room ID Input */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Configuration
            </Typography>
            <TextField
              label="Room ID"
              value={testRoomId}
              onChange={(e) => setTestRoomId(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
            />
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={refreshAll}
                disabled={!testRoomId}
                sx={{ mr: 2 }}
              >
                Refresh Governance State
              </Button>
              <Button 
                variant="outlined" 
                onClick={testStateTransition}
                disabled={!testRoomId || transitionLoading}
                sx={{ mr: 2 }}
              >
                {transitionLoading ? <CircularProgress size={20} /> : 'Test State Transition'}
              </Button>
            </Box>
            {transitionResult && (
              <Alert 
                severity={transitionResult.startsWith('Success') ? 'success' : 'error'}
                sx={{ mt: 2 }}
              >
                {transitionResult}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* WebSocket Status */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              WebSocket Connection
            </Typography>
            <Chip 
              label={webSocket.isConnected ? 'Connected' : 'Disconnected'}
              color={webSocket.isConnected ? 'success' : 'error'}
              sx={{ mr: 2 }}
            />
            {webSocket.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                WebSocket Error: {webSocket.error}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mt: 2 }}>
              Events Received: {webSocket.events.length}
            </Typography>
            <Typography variant="body2">
              Notifications: {webSocket.notifications.length}
            </Typography>
          </CardContent>
        </Card>

        {/* Room Governance State */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Room Governance State
            </Typography>
            
            {governanceLoading && <CircularProgress />}
            
            {governanceError && (
              <Alert severity="error">
                Error: {governanceError}
              </Alert>
            )}
            
            {governance && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">Current State:</Typography>
                  <Chip 
                    label={governance.current_state}
                    color={getStateColor(governance.current_state) as any}
                    sx={{ mt: 1 }}
                  />
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Updated By:</Typography>
                  <Typography variant="body2">{governance.state_updated_by}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Updated At:</Typography>
                  <Typography variant="body2">
                    {new Date(governance.state_updated_at).toLocaleString()}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Participation Rules:</Typography>
                  <Typography variant="body2">
                    • Executive Agents: {governance.participation_rules.executive_agents_active ? '✅ Active' : '❌ Suspended'}
                  </Typography>
                  <Typography variant="body2">
                    • System Agents: {governance.participation_rules.system_agents_active ? '✅ Active' : '❌ Suspended'}
                  </Typography>
                  <Typography variant="body2">
                    • Users Can Send: {governance.participation_rules.users_can_send ? '✅ Yes' : '❌ No'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Trinity Queue:</Typography>
                  <Typography variant="body2">
                    In Queue: {governance.in_trinity_queue ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2">
                    Queue Length: {governance.trinity_queue_length}
                  </Typography>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Trinity Queue Status */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Trinity Queue Status
            </Typography>
            
            {trinityQueueLoading && <CircularProgress />}
            
            {trinityQueueError && (
              <Alert severity="error">
                Error: {trinityQueueError}
              </Alert>
            )}
            
            {trinityQueue && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">Queue Summary:</Typography>
                  <Typography variant="body2">Total Items: {trinityQueue.queue_summary.total_items}</Typography>
                  <Typography variant="body2">Pending: {trinityQueue.queue_summary.pending_items}</Typography>
                  <Typography variant="body2">In Progress: {trinityQueue.queue_summary.in_progress_items}</Typography>
                  <Typography variant="body2">Completed: {trinityQueue.queue_summary.completed_items}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Safety Status:</Typography>
                  <Chip 
                    label={trinityQueue.queue_summary.safety_suspension_active ? 'Safety Suspension Active' : 'Normal Operation'}
                    color={trinityQueue.queue_summary.safety_suspension_active ? 'error' : 'success'}
                  />
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* System Summary */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Summary
            </Typography>
            
            <Button 
              variant="outlined" 
              onClick={refreshSummary}
              sx={{ mb: 2 }}
            >
              Refresh Summary
            </Button>
            
            {summaryLoading && <CircularProgress />}
            
            {summaryError && (
              <Alert severity="error">
                Error: {summaryError}
              </Alert>
            )}
            
            {summary && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">Room States:</Typography>
                  <Typography variant="body2">Total Rooms: {summary.room_state_summary.total_rooms}</Typography>
                  <Typography variant="body2">Active Rooms: {summary.room_state_summary.active_rooms}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Trinity Queue:</Typography>
                  <Typography variant="body2">Queue Length: {summary.trinity_queue_summary.total_items}</Typography>
                  <Typography variant="body2">Pending: {summary.trinity_queue_summary.pending_items}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">System Status:</Typography>
                  <Chip 
                    label={summary.system_status}
                    color={summary.system_status === 'operational' ? 'success' : 'warning'}
                  />
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        {webSocket.events.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Governance Events
              </Typography>
              <Stack spacing={1}>
                {webSocket.events.slice(-5).map((event, index) => (
                  <Box key={index} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {event.type}
                    </Typography>
                    <Typography variant="caption">
                      {event.type === 'room_state_change' 
                        ? `${event.previous_state} → ${event.new_state}: ${event.reason}`
                        : `Queue position ${event.queue_position} of ${event.queue_length}`
                      }
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
};