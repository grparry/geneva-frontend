import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
  Alert,
  Button,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from '@mui/lab';
import SendIcon from '@mui/icons-material/Send';
import ReceiveIcon from '@mui/icons-material/CallReceived';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { apiClient } from '../../api/client';

interface DelegationTask {
  task_id: string;
  task_type: string;
  source_substrate: string;
  target_substrate: string;
  source_agent?: string;
  target_agent?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  priority: number;
  payload_size: number;
  result_size?: number;
  error_message?: string;
  metadata: Record<string, any>;
}

interface DelegationFlow {
  flow_id: string;
  name: string;
  source: string;
  target: string;
  task_count: number;
  success_rate: number;
  avg_duration_ms: number;
  total_data_transferred: number;
}

interface DelegationMetrics {
  total_delegations: number;
  active_delegations: number;
  success_rate: number;
  avg_duration_ms: number;
  top_sources: Array<{ substrate: string; count: number }>;
  top_targets: Array<{ substrate: string; count: number }>;
  task_type_distribution: Record<string, number>;
  hourly_trend: Array<{ hour: string; count: number }>;
}

interface DelegationFlowMapProps {
  substrateId?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  onTaskClick?: (task: DelegationTask) => void;
}

export const DelegationFlowMap: React.FC<DelegationFlowMapProps> = ({
  substrateId,
  timeRange = '24h',
  onTaskClick,
}) => {
  const [tasks, setTasks] = useState<DelegationTask[]>([]);
  const [flows, setFlows] = useState<DelegationFlow[]>([]);
  const [metrics, setMetrics] = useState<DelegationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    taskType: 'all',
    direction: 'all', // sent, received, all
  });
  const [selectedFlow, setSelectedFlow] = useState<DelegationFlow | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<DelegationTask | null>(null);

  useEffect(() => {
    loadDelegationData();
    const interval = setInterval(loadDelegationData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [substrateId, timeRange, filter]);

  const loadDelegationData = async () => {
    setLoading(true);
    try {
      const [tasksRes, flowsRes, metricsRes] = await Promise.all([
        apiClient.get('/federation/delegations', {
          params: {
            substrate_id: substrateId,
            time_range: timeRange,
            status: filter.status !== 'all' ? filter.status : undefined,
            task_type: filter.taskType !== 'all' ? filter.taskType : undefined,
          },
        }),
        apiClient.get('/federation/delegation-flows', {
          params: { substrate_id: substrateId, time_range: timeRange },
        }),
        apiClient.get('/federation/delegation-metrics', {
          params: { substrate_id: substrateId, time_range: timeRange },
        }),
      ]);
      
      setTasks(tasksRes.data);
      setFlows(flowsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error('Failed to load delegation data:', error);
      // Use mock data for demo
      const mockTasks: DelegationTask[] = [
        {
          task_id: 'task-1',
          task_type: 'memory_search',
          source_substrate: 'substrate-1',
          target_substrate: 'substrate-2',
          source_agent: 'semantic_retriever',
          target_agent: 'memory_searcher',
          status: 'completed',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3000000).toISOString(),
          completed_at: new Date(Date.now() - 3000000).toISOString(),
          priority: 5,
          payload_size: 1024,
          result_size: 4096,
          metadata: { query: 'federation protocols', results: 12 },
        },
        {
          task_id: 'task-2',
          task_type: 'data_processing',
          source_substrate: 'substrate-1',
          target_substrate: 'substrate-3',
          source_agent: 'data_coordinator',
          target_agent: 'analytics_processor',
          status: 'in_progress',
          created_at: new Date(Date.now() - 600000).toISOString(),
          updated_at: new Date(Date.now() - 60000).toISOString(),
          priority: 8,
          payload_size: 10240,
          metadata: { dataset: 'user_behaviors', progress: 0.65 },
        },
        {
          task_id: 'task-3',
          task_type: 'memory_sync',
          source_substrate: 'substrate-2',
          target_substrate: 'substrate-1',
          status: 'failed',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7000000).toISOString(),
          priority: 3,
          payload_size: 2048,
          error_message: 'Target agent not available',
          metadata: { retry_count: 3 },
        },
      ];
      
      const mockFlows: DelegationFlow[] = [
        {
          flow_id: 'flow-1',
          name: 'substrate-1 → substrate-2',
          source: 'substrate-1',
          target: 'substrate-2',
          task_count: 156,
          success_rate: 0.94,
          avg_duration_ms: 2340,
          total_data_transferred: 524288,
        },
        {
          flow_id: 'flow-2',
          name: 'substrate-1 → substrate-3',
          source: 'substrate-1',
          target: 'substrate-3',
          task_count: 89,
          success_rate: 0.91,
          avg_duration_ms: 3120,
          total_data_transferred: 892416,
        },
        {
          flow_id: 'flow-3',
          name: 'substrate-2 → substrate-1',
          source: 'substrate-2',
          target: 'substrate-1',
          task_count: 67,
          success_rate: 0.88,
          avg_duration_ms: 1890,
          total_data_transferred: 327680,
        },
      ];
      
      const mockMetrics: DelegationMetrics = {
        total_delegations: 312,
        active_delegations: 8,
        success_rate: 0.92,
        avg_duration_ms: 2450,
        top_sources: [
          { substrate: 'substrate-1', count: 178 },
          { substrate: 'substrate-2', count: 89 },
          { substrate: 'substrate-3', count: 45 },
        ],
        top_targets: [
          { substrate: 'substrate-2', count: 156 },
          { substrate: 'substrate-3', count: 98 },
          { substrate: 'substrate-1', count: 58 },
        ],
        task_type_distribution: {
          memory_search: 125,
          data_processing: 87,
          memory_sync: 65,
          task_coordination: 35,
        },
        hourly_trend: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          count: Math.floor(Math.random() * 20 + 5),
        })),
      };
      
      setTasks(mockTasks);
      setFlows(mockFlows);
      setMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'in_progress':
        return <PendingIcon color="warning" />;
      default:
        return <AccessTimeIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'grey' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'in_progress':
        return 'warning';
      default:
        return 'grey';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter.status !== 'all' && task.status !== filter.status) return false;
    if (filter.taskType !== 'all' && task.task_type !== filter.taskType) return false;
    if (filter.direction === 'sent' && task.source_substrate !== substrateId) return false;
    if (filter.direction === 'received' && task.target_substrate !== substrateId) return false;
    return true;
  });

  const renderFlowCard = (flow: DelegationFlow) => (
    <Card
      key={flow.flow_id}
      sx={{
        cursor: 'pointer',
        border: selectedFlow?.flow_id === flow.flow_id ? 2 : 0,
        borderColor: 'primary.main',
      }}
      onClick={() => setSelectedFlow(flow)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1">
            {flow.source} → {flow.target}
          </Typography>
          <Chip
            label={`${flow.task_count} tasks`}
            size="small"
            color="primary"
          />
        </Box>
        
        <Grid container spacing={1}>
          <Grid size={6}>
            <Typography variant="caption" color="textSecondary">
              Success Rate
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <LinearProgress
                variant="determinate"
                value={flow.success_rate * 100}
                sx={{ flex: 1, height: 6 }}
                color={flow.success_rate > 0.9 ? 'success' : 'warning'}
              />
              <Typography variant="body2">
                {(flow.success_rate * 100).toFixed(0)}%
              </Typography>
            </Box>
          </Grid>
          <Grid size={6}>
            <Typography variant="caption" color="textSecondary">
              Avg Duration
            </Typography>
            <Typography variant="body2">
              {formatDuration(flow.avg_duration_ms)}
            </Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant="caption" color="textSecondary">
              Data Transferred
            </Typography>
            <Typography variant="body2">
              {formatBytes(flow.total_data_transferred)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header with Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Delegations
              </Typography>
              <Typography variant="h4">
                {metrics?.total_delegations || 0}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                <Chip
                  label={`${metrics?.active_delegations || 0} active`}
                  size="small"
                  color="primary"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h4">
                {((metrics?.success_rate || 0) * 100).toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(metrics?.success_rate || 0) * 100}
                sx={{ mt: 1 }}
                color={metrics && metrics.success_rate > 0.9 ? 'success' : 'warning'}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Duration
              </Typography>
              <Typography variant="h4">
                {formatDuration(metrics?.avg_duration_ms || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Task Types
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {metrics && Object.entries(metrics.task_type_distribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${type}: ${count}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Delegation Flows */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Delegation Flows</Typography>
              <IconButton size="small" onClick={loadDelegationData}>
                <RefreshIcon />
              </IconButton>
            </Box>
            
            <Box display="flex" flexDirection="column" gap={2}>
              {flows.map(flow => renderFlowCard(flow))}
            </Box>
            
            {/* Top Sources & Targets */}
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Top Sources
              </Typography>
              <List dense>
                {metrics?.top_sources.map((source, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={source.substrate}
                      secondary={`${source.count} delegations`}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Top Targets
              </Typography>
              <List dense>
                {metrics?.top_targets.map((target, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={target.substrate}
                      secondary={`${target.count} delegations`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>

        {/* Task Timeline */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Delegation Timeline</Typography>
              
              <Box display="flex" gap={1}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Direction</InputLabel>
                  <Select
                    value={filter.direction}
                    onChange={(e) => setFilter({ ...filter, direction: e.target.value })}
                    label="Direction"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="sent">Sent</MenuItem>
                    <MenuItem value="received">Received</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Timeline position="alternate">
              {filteredTasks.map((task, index) => (
                <TimelineItem key={task.task_id}>
                  <TimelineOppositeContent color="textSecondary">
                    <Typography variant="caption">
                      {new Date(task.created_at).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {formatDuration(
                        task.completed_at
                          ? new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()
                          : Date.now() - new Date(task.created_at).getTime()
                      )}
                    </Typography>
                  </TimelineOppositeContent>
                  
                  <TimelineSeparator>
                    <TimelineDot color={getStatusColor(task.status)}>
                      {getStatusIcon(task.status)}
                    </TimelineDot>
                    {index < filteredTasks.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  
                  <TimelineContent>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => {
                        setSelectedTask(task);
                        if (onTaskClick) onTaskClick(task);
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="subtitle2">
                            {task.task_type}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {task.source_substrate} → {task.target_substrate}
                          </Typography>
                          {task.source_agent && (
                            <Typography variant="caption" color="textSecondary" display="block">
                              {task.source_agent} → {task.target_agent || 'any'}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={`P${task.priority}`}
                            size="small"
                            color={task.priority > 5 ? 'error' : 'default'}
                          />
                          {task.status === 'completed' && task.result_size && (
                            <Chip
                              label={formatBytes(task.result_size)}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuAnchor(e.currentTarget);
                              setSelectedTask(task);
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      {task.error_message && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {task.error_message}
                        </Alert>
                      )}
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>

            {filteredTasks.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  No delegations found for the selected filters
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Task Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          console.log('View details:', selectedTask);
          setMenuAnchor(null);
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          console.log('View logs:', selectedTask);
          setMenuAnchor(null);
        }}>
          View Logs
        </MenuItem>
        {selectedTask?.status === 'failed' && (
          <MenuItem onClick={() => {
            console.log('Retry task:', selectedTask);
            setMenuAnchor(null);
          }}>
            Retry Task
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => {
          navigator.clipboard.writeText(selectedTask?.task_id || '');
          setMenuAnchor(null);
        }}>
          Copy Task ID
        </MenuItem>
      </Menu>
    </Box>
  );
};