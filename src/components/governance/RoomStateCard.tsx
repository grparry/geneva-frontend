import React from 'react';
import { 
  Box, 
  Chip, 
  Typography, 
  Tooltip, 
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  CheckCircle as ReadyIcon,
  Security as TrinityIcon,
  Person as HumanIcon,
  Block as BlockedIcon,
  Memory as MemoryIcon,
  Save as SaveIcon,
  Refresh as InitIcon,
  Schedule as IdleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { RoomGovernanceState, RoomState } from '../../types/governance';

interface RoomStateCardProps {
  governanceState?: RoomGovernanceState;
  isLoading?: boolean;
  error?: string;
  size?: 'small' | 'medium';
  showDetails?: boolean;
}

const getRoomStateConfig = (state: RoomState) => {
  switch (state) {
    case 'READY':
      return {
        color: '#4caf50',
        icon: <ReadyIcon />,
        label: 'Ready',
        description: 'Normal conversation mode'
      };
    case 'TRINITY_REVIEW':
      return {
        color: '#9c27b0',
        icon: <TrinityIcon />,
        label: 'Trinity Review',
        description: 'Under governance review'
      };
    case 'HUMAN_REVIEW':
      return {
        color: '#ff9800',
        icon: <HumanIcon />,
        label: 'Human Review',
        description: 'Escalated to human review'
      };
    case 'BLOCKED':
      return {
        color: '#f44336',
        icon: <BlockedIcon />,
        label: 'Blocked',
        description: 'Conversation blocked'
      };
    case 'CONTEXT_INJECTION':
      return {
        color: '#673ab7',
        icon: <MemoryIcon />,
        label: 'Memory Injection',
        description: 'Loading context'
      };
    case 'SAVING_STATE':
      return {
        color: '#2196f3',
        icon: <SaveIcon />,
        label: 'Saving',
        description: 'Saving conversation state'
      };
    case 'INITIALIZING':
      return {
        color: '#607d8b',
        icon: <InitIcon />,
        label: 'Initializing',
        description: 'Room being initialized'
      };
    case 'IDLE':
      return {
        color: '#9e9e9e',
        icon: <IdleIcon />,
        label: 'Idle',
        description: 'Conversation completed'
      };
    default:
      return {
        color: '#9e9e9e',
        icon: <WarningIcon />,
        label: 'Unknown',
        description: 'Unknown state'
      };
  }
};

const getParticipationStatus = (governanceState: RoomGovernanceState) => {
  const rules = governanceState.participation_rules;
  
  if (!rules.users_can_send && !rules.users_can_read) {
    return { text: 'Users Blocked', color: 'error' as const, severity: 'high' };
  } else if (!rules.users_can_send) {
    return { text: 'Read Only', color: 'warning' as const, severity: 'medium' };
  } else if (!rules.executive_agents_active) {
    return { text: 'Agents Suspended', color: 'info' as const, severity: 'medium' };
  } else {
    return { text: 'Full Access', color: 'success' as const, severity: 'low' };
  }
};

export const RoomStateCard: React.FC<RoomStateCardProps> = ({
  governanceState,
  isLoading = false,
  error,
  size = 'small',
  showDetails = false
}) => {
  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Loading state...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Tooltip title={`Failed to load room state: ${error}`}>
        <Chip
          icon={<WarningIcon />}
          label="State Unknown"
          size={size}
          color="error"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  // No governance state available
  if (!governanceState) {
    return (
      <Chip
        label="No State"
        size={size}
        variant="outlined"
        sx={{ color: 'text.disabled', borderColor: 'text.disabled' }}
      />
    );
  }

  const stateConfig = getRoomStateConfig(governanceState.current_state);
  const participationStatus = getParticipationStatus(governanceState);

  const mainIndicator = (
    <Chip
      icon={React.cloneElement(stateConfig.icon, { 
        sx: { color: 'white !important', fontSize: size === 'small' ? '0.875rem' : '1rem' } 
      })}
      label={stateConfig.label}
      size={size}
      sx={{
        bgcolor: stateConfig.color,
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
      <Tooltip 
        title={
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {stateConfig.label}
            </Typography>
            <Typography variant="caption" display="block">
              {stateConfig.description}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Access: {participationStatus.text}
            </Typography>
            {governanceState.participation_rules.state_reason && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                "{governanceState.participation_rules.state_reason}"
              </Typography>
            )}
          </Box>
        }
      >
        {mainIndicator}
      </Tooltip>
    );
  }

  return (
    <Box>
      {mainIndicator}
      
      {/* Participation Status */}
      <Box sx={{ mt: 1 }}>
        <Chip
          label={participationStatus.text}
          size="small"
          color={participationStatus.color}
          variant="outlined"
        />
      </Box>

      {/* State Reason */}
      {governanceState.participation_rules.state_reason && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}
        >
          "{governanceState.participation_rules.state_reason}"
        </Typography>
      )}

      {/* Governance Flags */}
      {(governanceState.governance_flags.manual_override_active ||
        governanceState.governance_flags.escalation_pending ||
        governanceState.governance_flags.high_priority_review) && (
        <Box sx={{ mt: 1 }}>
          {governanceState.governance_flags.manual_override_active && (
            <Chip label="Manual Override" size="small" color="warning" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
          )}
          {governanceState.governance_flags.escalation_pending && (
            <Chip label="Escalation Pending" size="small" color="error" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
          )}
          {governanceState.governance_flags.high_priority_review && (
            <Chip label="High Priority" size="small" color="info" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
          )}
        </Box>
      )}

      {/* Restrictions */}
      {governanceState.participation_rules.restrictions.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
          <Typography variant="caption">
            <strong>Restrictions:</strong>
          </Typography>
          {governanceState.participation_rules.restrictions.map((restriction, index) => (
            <Typography key={index} variant="caption" display="block">
              • {restriction}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Last Updated */}
      <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
        Updated: {new Date(governanceState.state_updated_at).toLocaleString()}
        {governanceState.state_updated_by && (
          <span> by {governanceState.state_updated_by}</span>
        )}
      </Typography>
    </Box>
  );
};