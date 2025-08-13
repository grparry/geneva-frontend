/**
 * Governance Dashboard Component
 * 
 * System-wide governance monitoring and management dashboard.
 * Provides oversight of all room states, Trinity queue, and system health.
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useGovernanceSummary } from '../../hooks/useGovernance';
import { RoomStateBadge } from './RoomStateIndicator';
import { RoomState, ReviewPriority } from '../../types/governance';

interface GovernanceDashboardProps {
  onRoomClick?: (roomId: string) => void;
  showSystemControls?: boolean;
  refreshInterval?: number;
}

export const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({
  onRoomClick,
  showSystemControls = false,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const {
    summary,
    isLoading,
    error,
    refreshSummary
  } = useGovernanceSummary();

  // Auto-refresh effect
  React.useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;
    
    const interval = setInterval(refreshSummary, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshSummary]);

  const getStateDistribution = () => {
    if (!summary) return [];
    
    return Object.entries(summary.room_state_summary.states).map(([state, data]) => ({
      state: state as RoomState,
      count: data.count,
      active: data.active,
      avgTime: data.avg_time_in_state_seconds
    })).filter(item => item.count > 0);
  };

  const getPriorityDistribution = () => {
    if (!summary) return [];
    
    return Object.entries(summary.trinity_queue_summary.items_by_priority).map(([priority, count]) => ({
      priority: priority as ReviewPriority,
      count
    })).filter(item => item.count > 0);
  };

  const getSystemHealthColor = () => {
    if (!summary) return 'grey';
    
    switch (summary.system_status) {
      case 'operational': return 'success';
      case 'degraded': return 'warning';
      case 'critical': return 'error';
      default: return 'grey';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600 * 10) / 10}h`;
  };

  if (error) {
    return (
      <Alert 
        severity="error"
        action={
          <Button size="small" onClick={refreshSummary}>
            Retry
          </Button>
        }
      >
        Failed to load governance dashboard: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h4">
            Governance Dashboard
          </Typography>
          {summary && (
            <Chip
              label={summary.system_status}
              color={getSystemHealthColor() as any}
              size="small"
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}>
            <Button
              variant={autoRefresh ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto-refresh
            </Button>
          </Tooltip>
          
          <IconButton onClick={refreshSummary} disabled={isLoading}>
            <RefreshIcon sx={{ 
              animation: isLoading ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
          </IconButton>
          
          {showSystemControls && (
            <IconButton>
              <SettingsIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {isLoading && !summary && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      {summary && (
        <Stack spacing={3}>
          {/* Top Row - Overview Cards */}
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            flexWrap: 'wrap',
            '& > *': { flex: 1, minWidth: 280 }
          }}>
            {/* System Overview */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Overview
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Rooms
                    </Typography>
                    <Typography variant="h4">
                      {summary.room_state_summary.total_rooms}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {summary.room_state_summary.active_rooms} active
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      System Status
                    </Typography>
                    <Chip
                      label={summary.system_status.toUpperCase()}
                      color={getSystemHealthColor() as any}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Trinity Queue Status */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trinity Queue
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Queue Length
                    </Typography>
                    <Typography variant="h4">
                      {summary.trinity_queue_summary.total_items}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`${summary.trinity_queue_summary.pending_items} Pending`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                    <Chip
                      label={`${summary.trinity_queue_summary.in_progress_items} In Progress`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                    <Chip
                      label={`${summary.trinity_queue_summary.completed_items} Completed`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                  
                  {summary.trinity_queue_summary.safety_suspension_active && (
                    <Alert severity="warning" icon={<WarningIcon />}>
                      Safety suspension active
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Room State Distribution */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Room States
                </Typography>
                <Stack spacing={1}>
                  {getStateDistribution().map(({ state, count, active, avgTime }) => (
                    <Box key={state} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RoomStateBadge currentState={state} size="small" />
                        <Typography variant="body2">
                          {count} ({active} active)
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        ~{formatDuration(avgTime)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Bottom Row - Detailed Cards */}
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            flexWrap: 'wrap',
            '& > *': { flex: 1, minWidth: 400 }
          }}>
            {/* Priority Breakdown */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Queue Priority Breakdown
                </Typography>
                {getPriorityDistribution().length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {getPriorityDistribution().map(({ priority, count }) => (
                      <Chip
                        key={priority}
                        label={`${count} ${priority}`}
                        color={
                          priority === 'critical' ? 'error' :
                          priority === 'high' ? 'warning' :
                          priority === 'medium' ? 'info' : 'default'
                        }
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No items in queue
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Queue Type Breakdown */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Queue Type Breakdown
                </Typography>
                {Object.keys(summary.trinity_queue_summary.items_by_type).length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(summary.trinity_queue_summary.items_by_type).map(([type, count]) => (
                          <TableRow key={type}>
                            <TableCell>
                              <Typography variant="body2">
                                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                {count}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No items by type
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* System Actions */}
          {showSystemControls && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button variant="outlined" startIcon={<TrendingIcon />}>
                    View Trends
                  </Button>
                  <Button variant="outlined" startIcon={<ViewIcon />}>
                    Detailed Logs
                  </Button>
                  <Button variant="outlined" startIcon={<SettingsIcon />}>
                    Configuration
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}
    </Box>
  );
};