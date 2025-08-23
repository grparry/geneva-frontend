import React from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { RoomStateCard } from './RoomStateCard';
import { RoomGovernanceState, RoomState } from '../../types/governance';

const createMockGovernanceState = (state: RoomState, customizations?: Partial<RoomGovernanceState>): RoomGovernanceState => ({
  room_id: 'test-room',
  current_state: state,
  state_updated_at: new Date().toISOString(),
  state_updated_by: 'system',
  governance_flags: {
    manual_override_active: false,
    escalation_pending: false,
    high_priority_review: false,
    system_maintenance_mode: false
  },
  participation_rules: {
    users_can_send: state === 'READY' || state === 'CONTEXT_INJECTION',
    users_can_read: true,
    executive_agents_active: state === 'READY' || state === 'CONTEXT_INJECTION',
    system_agents_active: true,
    state_reason: `Room is in ${state} state`,
    restrictions: state === 'TRINITY_REVIEW' ? ['Executive agents suspended pending review'] : []
  },
  ...customizations
});

export const RoomStateTest: React.FC = () => {
  const states: RoomState[] = [
    'READY',
    'TRINITY_REVIEW', 
    'HUMAN_REVIEW',
    'BLOCKED',
    'CONTEXT_INJECTION',
    'SAVING_STATE',
    'INITIALIZING',
    'IDLE'
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Room State Card Test
      </Typography>
      
      <Stack spacing={3}>
        {states.map(state => (
          <Paper key={state} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {state}
            </Typography>
            
            <Stack direction="row" spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Small Size
                </Typography>
                <RoomStateCard
                  governanceState={createMockGovernanceState(state)}
                  size="small"
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Medium Size
                </Typography>
                <RoomStateCard
                  governanceState={createMockGovernanceState(state)}
                  size="medium"
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  With Details
                </Typography>
                <RoomStateCard
                  governanceState={createMockGovernanceState(state, {
                    governance_flags: {
                      manual_override_active: state === 'BLOCKED',
                      escalation_pending: state === 'TRINITY_REVIEW',
                      high_priority_review: state === 'HUMAN_REVIEW',
                      system_maintenance_mode: false
                    },
                    participation_rules: {
                      users_can_send: state === 'READY',
                      users_can_read: state !== 'BLOCKED',
                      executive_agents_active: state === 'READY',
                      system_agents_active: true,
                      state_reason: `Custom reason for ${state} state`,
                      restrictions: state === 'BLOCKED' ? ['All user actions suspended', 'Emergency protocol active'] : []
                    }
                  })}
                  showDetails
                />
              </Box>
            </Stack>
          </Paper>
        ))}
        
        {/* Loading State */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Loading State
          </Typography>
          <RoomStateCard isLoading />
        </Paper>
        
        {/* Error State */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Error State
          </Typography>
          <RoomStateCard error="Failed to connect to governance service" />
        </Paper>
        
        {/* No State */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            No Governance State
          </Typography>
          <RoomStateCard />
        </Paper>
      </Stack>
    </Box>
  );
};