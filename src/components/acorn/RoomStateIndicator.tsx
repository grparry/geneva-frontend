import React from 'react';
import { Box, Chip, Tooltip, Typography, Paper, Collapse } from '@mui/material';
import { RoomState, getRoomStateColor, getRoomStateIcon } from '../../types/acorn-messages';
import { RoomStateInfo } from '../../hooks/useACORNMessages';

interface RoomStateIndicatorProps {
  roomState: RoomStateInfo;
  showDetails?: boolean;
  size?: 'small' | 'medium';
}

export const RoomStateIndicator: React.FC<RoomStateIndicatorProps> = ({
  roomState,
  showDetails = false,
  size = 'medium'
}) => {
  const { currentState, participationRules, transitionReason, transitionedBy } = roomState;
  const stateColor = getRoomStateColor(currentState);
  const stateIcon = getRoomStateIcon(currentState);

  const getStateDescription = (state: RoomState): string => {
    switch (state) {
      case RoomState.READY:
        return 'Normal conversation mode';
      case RoomState.TRINITY_REVIEW:
        return 'Under Trinity governance review';
      case RoomState.HUMAN_REVIEW:
        return 'Escalated to human review';
      case RoomState.BLOCKED:
        return 'Conversation blocked';
      case RoomState.CONTEXT_INJECTION:
        return 'Memory context being injected';
      case RoomState.SAVING_STATE:
        return 'Saving conversation state';
      case RoomState.INITIALIZING:
        return 'Room being initialized';
      case RoomState.IDLE:
        return 'Conversation completed';
      default:
        return 'Unknown state';
    }
  };

  const getStateDisplayName = (state: RoomState): string => {
    return state.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const indicator = (
    <Chip
      icon={<span>{stateIcon}</span>}
      label={getStateDisplayName(currentState)}
      size={size}
      sx={{
        bgcolor: stateColor,
        color: 'white',
        fontWeight: 'bold',
        '& .MuiChip-icon': {
          color: 'white'
        }
      }}
    />
  );

  if (!showDetails) {
    return (
      <Tooltip title={getStateDescription(currentState)}>
        {indicator}
      </Tooltip>
    );
  }

  return (
    <Box>
      {indicator}
      
      <Collapse in={showDetails}>
        <Paper sx={{ mt: 1, p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {getStateDescription(currentState)}
          </Typography>
          
          {transitionReason && (
            <Typography variant="caption" display="block" color="text.secondary">
              Reason: {transitionReason}
            </Typography>
          )}
          
          {transitionedBy && (
            <Typography variant="caption" display="block" color="text.secondary">
              Changed by: {transitionedBy}
            </Typography>
          )}
          
          {participationRules && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                Participation Rules:
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label="Users"
                  size="small"
                  color={participationRules.users_can_send ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
                <Chip
                  label="Executive Agents"
                  size="small"
                  color={participationRules.executive_agents_active ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
                <Chip
                  label="System Agents"
                  size="small"
                  color={participationRules.system_agents_active ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              </Box>
              
              {participationRules.restrictions && participationRules.restrictions.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="warning.main">
                    Restrictions:
                  </Typography>
                  {participationRules.restrictions.map((restriction, index) => (
                    <Typography key={index} variant="caption" display="block" color="warning.main">
                      • {restriction}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};