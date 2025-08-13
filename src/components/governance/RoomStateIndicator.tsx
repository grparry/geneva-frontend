/**
 * Room State Indicator Component
 * 
 * Displays the current governance state of a room with appropriate styling and context.
 * Integrates seamlessly into existing chat interface headers and status areas.
 */

import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircle as ReadyIcon,
  Autorenew as LoadingIcon,
  Security as ReviewIcon,
  Person as HumanIcon,
  Block as BlockedIcon,
  Save as SavingIcon,
  Bedtime as IdleIcon
} from '@mui/icons-material';
import { RoomState, ParticipationRules } from '../../types/governance';

export interface RoomStateIndicatorProps {
  currentState: RoomState;
  participationRules?: ParticipationRules;
  trinityQueueLength?: number;
  compact?: boolean;
  showTooltip?: boolean;
  onClick?: () => void;
}

const STATE_CONFIG = {
  READY: {
    color: '#4caf50',
    label: 'Ready',
    icon: ReadyIcon,
    description: 'Room ready for governance decisions',
    severity: 'success' as const
  },
  INITIALIZING: {
    color: '#2196f3',
    label: 'Initializing',
    icon: LoadingIcon,
    description: 'Room being set up, limited participation',
    severity: 'info' as const
  },
  CONTEXT_INJECTION: {
    color: '#9c27b0',
    label: 'Context Loading',
    icon: LoadingIcon,
    description: 'Thedra injecting memory context',
    severity: 'info' as const
  },
  TRINITY_REVIEW: {
    color: '#ff9800',
    label: 'Trinity Review',
    icon: ReviewIcon,
    description: 'Trinity review in progress - executive agents suspended',
    severity: 'warning' as const
  },
  HUMAN_REVIEW: {
    color: '#f44336',
    label: 'Human Review',
    icon: HumanIcon,
    description: 'Escalated to human review - all agents suspended',
    severity: 'error' as const
  },
  BLOCKED: {
    color: '#d32f2f',
    label: 'Blocked',
    icon: BlockedIcon,
    description: 'Room blocked by governance decision',
    severity: 'error' as const
  },
  SAVING_STATE: {
    color: '#607d8b',
    label: 'Saving',
    icon: SavingIcon,
    description: 'Persisting conversation state',
    severity: 'info' as const
  },
  IDLE: {
    color: '#9e9e9e',
    label: 'Idle',
    icon: IdleIcon,
    description: 'Normal operation',
    severity: 'default' as const
  }
};

export const RoomStateIndicator: React.FC<RoomStateIndicatorProps> = ({
  currentState,
  participationRules,
  trinityQueueLength,
  compact = false,
  showTooltip = true,
  onClick
}) => {
  const theme = useTheme();
  const config = STATE_CONFIG[currentState];
  const IconComponent = config.icon;

  const getDetailedTooltip = () => {
    let tooltip = config.description;
    
    if (participationRules) {
      tooltip += '\n\nParticipation:';
      tooltip += `\n• Users: ${participationRules.users_can_send ? 'Can send messages' : 'Read-only'}`;
      tooltip += `\n• Executive Agents: ${participationRules.executive_agents_active ? 'Active' : 'Suspended'}`;
      tooltip += `\n• System Agents: ${participationRules.system_agents_active ? 'Active' : 'Limited'}`;
      
      if (participationRules.restrictions.length > 0) {
        tooltip += `\n\nRestrictions: ${participationRules.restrictions.join(', ')}`;
      }
    }
    
    if (trinityQueueLength !== undefined && trinityQueueLength > 0) {
      tooltip += `\n\nTrinity Queue: ${trinityQueueLength} items`;
    }
    
    return tooltip;
  };

  const indicator = (
    <Chip
      icon={<IconComponent sx={{ fontSize: compact ? '16px' : '18px' }} />}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant={compact ? 'caption' : 'body2'} fontWeight="medium">
            {config.label}
          </Typography>
          {trinityQueueLength !== undefined && trinityQueueLength > 0 && (
            <Typography
              variant="caption"
              sx={{
                backgroundColor: alpha(theme.palette.common.white, 0.3),
                borderRadius: '10px',
                px: 0.5,
                py: 0.1,
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}
            >
              {trinityQueueLength}
            </Typography>
          )}
        </Box>
      }
      size={compact ? 'small' : 'medium'}
      sx={{
        backgroundColor: alpha(config.color, 0.1),
        borderColor: config.color,
        border: '1px solid',
        color: config.color,
        fontWeight: 'medium',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          backgroundColor: alpha(config.color, 0.15),
          borderColor: config.color,
        } : {},
        '& .MuiChip-icon': {
          color: config.color
        }
      }}
      onClick={onClick}
      clickable={!!onClick}
    />
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <Tooltip
      title={
        <Typography 
          variant="body2" 
          sx={{ whiteSpace: 'pre-line', maxWidth: 300 }}
        >
          {getDetailedTooltip()}
        </Typography>
      }
      placement="bottom"
      arrow
    >
      {indicator}
    </Tooltip>
  );
};

/**
 * Minimal state badge for space-constrained areas
 */
export const RoomStateBadge: React.FC<{
  currentState: RoomState;
  size?: 'small' | 'medium';
}> = ({ currentState, size = 'small' }) => {
  const config = STATE_CONFIG[currentState];
  const IconComponent = config.icon;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        backgroundColor: alpha(config.color, 0.1),
        border: `1px solid ${alpha(config.color, 0.3)}`,
        color: config.color
      }}
    >
      <IconComponent sx={{ fontSize: size === 'small' ? '14px' : '16px' }} />
      <Typography variant="caption" fontWeight="medium">
        {config.label}
      </Typography>
    </Box>
  );
};

/**
 * Simple state dot indicator for minimal displays
 */
export const RoomStateDot: React.FC<{
  currentState: RoomState;
  size?: number;
}> = ({ currentState, size = 8 }) => {
  const config = STATE_CONFIG[currentState];

  return (
    <Tooltip title={`${config.label}: ${config.description}`}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: config.color,
          display: 'inline-block',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      />
    </Tooltip>
  );
};