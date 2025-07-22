/**
 * Delegation Status Chip Component
 * 
 * Visual indicator for delegation status with progress and timing information.
 */

import React from 'react';
import { 
  Chip, 
  Tooltip, 
  Box, 
  LinearProgress,
  Typography,
} from '@mui/material';
import { 
  ScheduleOutlined,
  CheckCircleOutlined,
  PlayArrowOutlined,
  DoneAllOutlined,
  ErrorOutlined,
  CancelOutlined,
} from '@mui/icons-material';
import { DelegationStatus } from '../../../types/federation';

interface DelegationStatusChipProps {
  status: DelegationStatus;
  size?: 'small' | 'medium';
  showProgress?: boolean;
  executionTimeMs?: number;
  totalTimeMs?: number;
  error?: string;
  variant?: 'filled' | 'outlined';
  withTooltip?: boolean;
}

export const DelegationStatusChip: React.FC<DelegationStatusChipProps> = ({
  status,
  size = 'small',
  showProgress = false,
  executionTimeMs,
  totalTimeMs,
  error,
  variant = 'filled',
  withTooltip = true,
}) => {
  const getStatusConfig = (delegationStatus: DelegationStatus) => {
    switch (delegationStatus) {
      case DelegationStatus.PENDING:
        return {
          color: 'secondary' as const,
          backgroundColor: '#f5f5f5',
          textColor: '#666',
          icon: <ScheduleOutlined />,
          label: 'Pending',
          progress: 0,
          description: 'Delegation is waiting to be processed',
        };
      
      case DelegationStatus.ACCEPTED:
        return {
          color: 'info' as const,
          backgroundColor: '#e3f2fd',
          textColor: '#1976d2',
          icon: <CheckCircleOutlined />,
          label: 'Accepted',
          progress: 25,
          description: 'Delegation has been accepted by the target peer',
        };
      
      case DelegationStatus.EXECUTING:
        return {
          color: 'warning' as const,
          backgroundColor: '#fff3e0',
          textColor: '#f57c00',
          icon: <PlayArrowOutlined />,
          label: 'Executing',
          progress: 75,
          description: 'Delegation is currently being executed',
        };
      
      case DelegationStatus.COMPLETED:
        return {
          color: 'success' as const,
          backgroundColor: '#e8f5e8',
          textColor: '#2e7d32',
          icon: <DoneAllOutlined />,
          label: 'Completed',
          progress: 100,
          description: 'Delegation completed successfully',
        };
      
      case DelegationStatus.FAILED:
        return {
          color: 'error' as const,
          backgroundColor: '#ffebee',
          textColor: '#c62828',
          icon: <ErrorOutlined />,
          label: 'Failed',
          progress: 100,
          description: 'Delegation failed to execute',
        };
      
      case DelegationStatus.REJECTED:
        return {
          color: 'error' as const,
          backgroundColor: '#ffebee',
          textColor: '#c62828',
          icon: <CancelOutlined />,
          label: 'Rejected',
          progress: 0,
          description: 'Delegation was rejected by the target peer',
        };
      
      default:
        return {
          color: 'secondary' as const,
          backgroundColor: '#f5f5f5',
          textColor: '#666',
          icon: <ScheduleOutlined />,
          label: 'Unknown',
          progress: 0,
          description: 'Unknown delegation status',
        };
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const config = getStatusConfig(status);
  
  const getTooltipContent = () => {
    let content = config.description;
    
    if (executionTimeMs) {
      content += `\nExecution time: ${formatDuration(executionTimeMs)}`;
    }
    
    if (totalTimeMs) {
      content += `\nTotal time: ${formatDuration(totalTimeMs)}`;
    }
    
    if (error && (status === DelegationStatus.FAILED || status === DelegationStatus.REJECTED)) {
      content += `\nError: ${error}`;
    }
    
    return content;
  };

  const chipContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {React.cloneElement(config.icon, { 
        sx: { fontSize: size === 'small' ? 16 : 18 } 
      })}
      <Typography variant="caption" component="span">
        {config.label}
      </Typography>
    </Box>
  );

  const chipElement = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Chip
        label={chipContent}
        color={config.color}
        size={size}
        variant={variant}
        sx={{
          ...(variant === 'filled' && {
            backgroundColor: config.backgroundColor,
            color: config.textColor,
            '& .MuiChip-label': {
              color: config.textColor,
            },
          }),
        }}
      />
      
      {showProgress && (
        <Box sx={{ width: '100%', mt: 0.5 }}>
          <LinearProgress
            variant="determinate"
            value={config.progress}
            color={config.color}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(0,0,0,0.1)',
            }}
          />
        </Box>
      )}
      
      {(executionTimeMs || totalTimeMs) && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ fontSize: '0.7rem', textAlign: 'center' }}
        >
          {executionTimeMs && `Exec: ${formatDuration(executionTimeMs)}`}
          {executionTimeMs && totalTimeMs && ' | '}
          {totalTimeMs && `Total: ${formatDuration(totalTimeMs)}`}
        </Typography>
      )}
    </Box>
  );

  if (withTooltip) {
    return (
      <Tooltip title={getTooltipContent()} arrow>
        <Box>{chipElement}</Box>
      </Tooltip>
    );
  }

  return chipElement;
};

export default DelegationStatusChip;