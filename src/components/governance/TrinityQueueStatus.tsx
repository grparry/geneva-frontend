/**
 * Trinity Queue Status Component
 * 
 * Displays Trinity review queue information and status.
 * Provides queue position, wait times, and safety suspension alerts.
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Alert,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material';
import { TrinityQueueStatus as TrinityQueueStatusType, ReviewPriority } from '../../types/governance';

export interface TrinityQueueStatusProps {
  queueStatus: TrinityQueueStatusType | null;
  roomId?: string;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  showHeader?: boolean;
  compact?: boolean;
}

const PRIORITY_CONFIG = {
  critical: { color: '#d32f2f', label: 'Critical', weight: 4 },
  high: { color: '#f57c00', label: 'High', weight: 3 },
  medium: { color: '#1976d2', label: 'Medium', weight: 2 },
  low: { color: '#388e3c', label: 'Low', weight: 1 }
};

export const TrinityQueueStatus: React.FC<TrinityQueueStatusProps> = ({
  queueStatus,
  roomId,
  expanded = false,
  onExpandChange,
  showHeader = true,
  compact = false
}) => {
  const [internalExpanded, setInternalExpanded] = React.useState(expanded);
  
  const isExpanded = onExpandChange ? expanded : internalExpanded;
  const handleExpandChange = onExpandChange || setInternalExpanded;

  if (!queueStatus || queueStatus.queue_summary.total_items === 0) {
    return null;
  }

  const { queue_summary } = queueStatus;
  const hasActiveItems = queue_summary.pending_items > 0 || queue_summary.in_progress_items > 0;
  const completionRate = queue_summary.total_items > 0 
    ? (queue_summary.completed_items / queue_summary.total_items) * 100 
    : 0;

  const getPriorityBreakdown = () => {
    return Object.entries(queue_summary.items_by_priority).map(([priority, count]) => ({
      priority: priority as ReviewPriority,
      count,
      config: PRIORITY_CONFIG[priority as ReviewPriority]
    })).filter(item => item.count > 0);
  };

  const getEstimatedWaitTime = () => {
    if (queue_summary.avg_completion_time_hours === 0) return 'Unknown';
    
    const waitTimeHours = queue_summary.pending_items * queue_summary.avg_completion_time_hours;
    if (waitTimeHours < 1) {
      return `${Math.round(waitTimeHours * 60)}m`;
    } else if (waitTimeHours < 24) {
      return `${Math.round(waitTimeHours * 10) / 10}h`;
    } else {
      return `${Math.round(waitTimeHours / 24 * 10) / 10}d`;
    }
  };

  const HeaderContent = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <GroupIcon sx={{ color: 'warning.main', fontSize: compact ? '18px' : '20px' }} />
      <Typography variant={compact ? 'subtitle2' : 'h6'} fontWeight="medium">
        Trinity Review Queue
      </Typography>
      {queue_summary.safety_suspension_active && (
        <Tooltip title="Safety suspension active - executive agents suspended">
          <WarningIcon sx={{ color: 'error.main', fontSize: '18px' }} />
        </Tooltip>
      )}
      {onExpandChange && (
        <IconButton
          size="small"
          onClick={() => handleExpandChange(!isExpanded)}
          sx={{ ml: 'auto' }}
        >
          {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      )}
    </Box>
  );

  const QueueStats = () => (
    <Stack spacing={compact ? 1 : 2}>
      {/* Safety Suspension Alert */}
      {queue_summary.safety_suspension_active && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ fontSize: compact ? '0.75rem' : '0.875rem' }}
        >
          Safety Suspension Active - Executive agents are suspended due to high queue volume
        </Alert>
      )}

      {/* Queue Overview */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Queue Progress
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {queue_summary.completed_items}/{queue_summary.total_items} completed
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={completionRate}
          sx={{
            height: compact ? 4 : 6,
            borderRadius: 1,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              backgroundColor: completionRate === 100 ? 'success.main' : 'warning.main'
            }
          }}
        />
      </Box>

      {/* Status Breakdown */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label={`${queue_summary.pending_items} Pending`}
          size="small"
          color="warning"
          variant="outlined"
        />
        <Chip
          label={`${queue_summary.in_progress_items} In Progress`}
          size="small"
          color="info"
          variant="outlined"
        />
        <Chip
          label={`${queue_summary.timeout_items} Timeout`}
          size="small"
          color="error"
          variant="outlined"
        />
      </Box>

      {/* Priority Breakdown */}
      {!compact && getPriorityBreakdown().length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            By Priority
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {getPriorityBreakdown().map(({ priority, count, config }) => (
              <Chip
                key={priority}
                label={`${count} ${config.label}`}
                size="small"
                sx={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                  borderColor: config.color,
                  border: '1px solid'
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Timing Information */}
      {!compact && queue_summary.avg_completion_time_hours > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: '16px', color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Avg. completion: {queue_summary.avg_completion_time_hours.toFixed(1)}h
            </Typography>
          </Box>
          {hasActiveItems && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PriorityIcon sx={{ fontSize: '16px', color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Est. wait: {getEstimatedWaitTime()}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Oldest Pending Item */}
      {!compact && queue_summary.oldest_pending_item && (
        <Typography variant="caption" color="text.secondary">
          Oldest pending: {new Date(queue_summary.oldest_pending_item).toLocaleString()}
        </Typography>
      )}
    </Stack>
  );

  if (compact) {
    return (
      <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
        <HeaderContent />
        <Box sx={{ mt: 1 }}>
          <QueueStats />
        </Box>
      </Box>
    );
  }

  return (
    <Card 
      sx={{ 
        border: queue_summary.safety_suspension_active ? '2px solid' : '1px solid',
        borderColor: queue_summary.safety_suspension_active ? 'warning.main' : 'grey.300',
        bgcolor: queue_summary.safety_suspension_active ? 'warning.light' : 'background.paper'
      }}
    >
      <CardContent sx={{ pb: showHeader ? 2 : 1 }}>
        {showHeader && <HeaderContent />}
        
        <Collapse in={isExpanded || !onExpandChange} timeout="auto">
          <Box sx={{ mt: showHeader ? 2 : 0 }}>
            <QueueStats />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

/**
 * Minimal queue indicator for header areas
 */
export const TrinityQueueIndicator: React.FC<{
  queueLength: number;
  safetyActive?: boolean;
  onClick?: () => void;
}> = ({ queueLength, safetyActive = false, onClick }) => {
  if (queueLength === 0) return null;

  return (
    <Tooltip title={`Trinity Queue: ${queueLength} items${safetyActive ? ' (Safety suspension active)' : ''}`}>
      <Chip
        icon={<GroupIcon />}
        label={queueLength}
        size="small"
        color={safetyActive ? 'error' : 'warning'}
        onClick={onClick}
        clickable={!!onClick}
        sx={{
          fontWeight: 'medium',
          '& .MuiChip-icon': {
            fontSize: '16px'
          }
        }}
      />
    </Tooltip>
  );
};