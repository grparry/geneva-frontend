import React, { useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Code as CodeIcon,
  SmartToy as SmartToyIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useObservabilityStore } from '../store/observabilityStore';
import { AgentExecution } from '../store/types';


interface ExecutionTimelineProps {
  agentId?: string;
  onExecutionSelect: (executionId: string) => void;
  selectedExecution?: string;
  timeRange?: string;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ 
  agentId, 
  onExecutionSelect, 
  selectedExecution,
  timeRange = '24h'
}) => {
  // Store hooks
  const {
    executions,
    selectedExecution: storeSelectedExecution,
    selectExecution,
    loadExecutions,
    loading,
    errors
  } = useObservabilityStore();

  // Convert executions Map to Array and filter by agentId if provided
  const executionsList = Array.from(executions.values())
    .filter(exec => !agentId || exec.agent_id === agentId)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  const handleLoadExecutions = async () => {
    await loadExecutions(agentId, timeRange);
  };

  useEffect(() => {
    handleLoadExecutions();
    
    // Refresh every 30 seconds for running executions
    const interval = setInterval(handleLoadExecutions, 30000);
    return () => clearInterval(interval);
  }, [agentId, timeRange]);

  const handleExecutionSelect = (executionId: string) => {
    selectExecution(executionId);
    onExecutionSelect(executionId);
  };

  const getStatusIcon = (execution: AgentExecution) => {
    switch (execution.status) {
      case 'running':
        return <PlayArrowIcon color="primary" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <PlayArrowIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const runningCount = executionsList.filter(e => e.status === 'running').length;

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SmartToyIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Execution Timeline
            </Typography>
            {runningCount > 0 && (
              <Badge badgeContent={runningCount} color="primary">
                <Chip 
                  label="Active" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Badge>
            )}
          </Stack>
          
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={handleLoadExecutions} disabled={loading.executions}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <Typography variant="caption" color="text.secondary">
          {agentId ? `Agent: ${agentId}` : 'All agents'} • Last {timeRange}
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading.executions ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : errors.executions ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="error">
              {errors.executions}
            </Typography>
          </Box>
        ) : executionsList.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No executions found
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {executionsList.map((execution, index) => (
              <React.Fragment key={execution.execution_id}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedExecution === execution.execution_id}
                    onClick={() => handleExecutionSelect(execution.execution_id)}
                    sx={{ px: 2, py: 1.5 }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        mr: 2,
                        bgcolor: `${getStatusColor(execution.status)}.light`
                      }}
                    >
                      {getStatusIcon(execution)}
                    </Avatar>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Chip 
                          label={execution.status}
                          size="small"
                          color={getStatusColor(execution.status) as any}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        
                        {execution.has_claude_execution && (
                          <Chip 
                            icon={<CodeIcon />}
                            label="Claude"
                            size="small"
                            variant="filled"
                            color="secondary"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        
                        <Typography variant="caption" color="text.secondary">
                          <ScheduleIcon sx={{ fontSize: 12, mr: 0.5 }} />
                          {getTimeAgo(execution.started_at)}
                        </Typography>
                      </Stack>
                      
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: 0.5
                        }}
                      >
                        {execution.action}
                      </Typography>
                      
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                          {execution.message_count} messages
                        </Typography>
                        
                        {execution.duration_ms && (
                          <Typography variant="caption" color="text.secondary">
                            <TimerIcon sx={{ fontSize: 12, mr: 0.5 }} />
                            {formatDuration(execution.duration_ms)}
                          </Typography>
                        )}
                        
                        {execution.success_rate && (
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(execution.success_rate * 100)}% success
                          </Typography>
                        )}
                      </Stack>
                      
                      {execution.error_message && (
                        <Typography 
                          variant="caption" 
                          color="error"
                          sx={{ 
                            display: 'block',
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {execution.error_message}
                        </Typography>
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
                {index < executionsList.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};