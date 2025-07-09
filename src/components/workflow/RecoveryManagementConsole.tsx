import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  RestoreFromTrash as RecoveryIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Assessment as MetricsIcon,
  Build as ManualIcon,
  AutoMode as AutoIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

interface FailedWorkflow {
  id: string;
  workflowId: string;
  name: string;
  failedAt: string;
  stage: string;
  error: {
    type: string;
    message: string;
    tool?: string;
    retryCount: number;
  };
  checkpoints: number;
  lastCheckpoint?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedRecoveryTime: number;
}

interface RecoveryExecution {
  id: string;
  workflowId: string;
  strategy: string;
  status: 'queued' | 'preparing' | 'executing' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  steps: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    duration?: number;
  }>;
}

interface RecoveryMetrics {
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  successRate: number;
  commonFailureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

interface ManualRecoveryOption {
  id: string;
  name: string;
  description: string;
  actions: Array<{
    type: string;
    target: string;
    parameters: Record<string, any>;
  }>;
}

interface RecoveryManagementConsoleProps {
  failedWorkflows: FailedWorkflow[];
  recoveryQueue: RecoveryExecution[];
  metrics: RecoveryMetrics;
  onRecover: (workflowId: string, strategy: string, options?: any) => void;
  onCancelRecovery: (recoveryId: string) => void;
  onRetryRecovery: (recoveryId: string) => void;
  onManualIntervention: (workflowId: string, option: ManualRecoveryOption) => void;
}

const RecoveryManagementConsole: React.FC<RecoveryManagementConsoleProps> = ({
  failedWorkflows,
  recoveryQueue,
  metrics,
  onRecover,
  onCancelRecovery,
  onRetryRecovery,
  onManualIntervention
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<FailedWorkflow | null>(null);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [autoRecoveryEnabled, setAutoRecoveryEnabled] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  const filteredWorkflows = failedWorkflows.filter(
    workflow => filterPriority === 'all' || workflow.priority === filterPriority
  );

  const toggleWorkflowExpansion = (workflowId: string) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(workflowId)) {
      newExpanded.delete(workflowId);
    } else {
      newExpanded.add(workflowId);
    }
    setExpandedWorkflows(newExpanded);
  };

  const getErrorSeverity = (error: FailedWorkflow['error']) => {
    if (error.retryCount > 3) return 'error';
    if (error.retryCount > 1) return 'warning';
    return 'info';
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'warning';
    }
  };

  const getRecoveryStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'executing':
        return 'primary';
      case 'preparing':
        return 'warning';
      default:
        return 'default';
    }
  };

  const manualOptions: ManualRecoveryOption[] = [
    {
      id: 'skip-tool',
      name: 'Skip Failed Tool',
      description: 'Skip the failed tool and continue with the workflow',
      actions: [
        { type: 'skip', target: 'current_tool', parameters: {} },
        { type: 'continue', target: 'workflow', parameters: {} }
      ]
    },
    {
      id: 'modify-params',
      name: 'Modify Tool Parameters',
      description: 'Adjust tool parameters and retry',
      actions: [
        { type: 'modify', target: 'tool_params', parameters: {} },
        { type: 'retry', target: 'current_tool', parameters: {} }
      ]
    },
    {
      id: 'rollback',
      name: 'Rollback to Previous State',
      description: 'Rollback to the last successful state',
      actions: [
        { type: 'rollback', target: 'last_checkpoint', parameters: {} },
        { type: 'resume', target: 'workflow', parameters: {} }
      ]
    }
  ];

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RecoveryIcon /> Recovery Management Console
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={autoRecoveryEnabled ? <AutoIcon /> : <ManualIcon />}
              label={autoRecoveryEnabled ? 'Auto Recovery ON' : 'Manual Mode'}
              color={autoRecoveryEnabled ? 'success' : 'warning'}
              onClick={() => setAutoRecoveryEnabled(!autoRecoveryEnabled)}
            />
            
            <Button
              variant="outlined"
              startIcon={<MetricsIcon />}
              onClick={() => setShowMetrics(!showMetrics)}
            >
              {showMetrics ? 'Hide' : 'Show'} Metrics
            </Button>
            
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Metrics Dashboard */}
      <Collapse in={showMetrics}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Recovery Metrics
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4">
                    {metrics.successRate.toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics.successRate} 
                    sx={{ mt: 1 }}
                    color={metrics.successRate > 80 ? 'success' : 'warning'}
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Recoveries
                  </Typography>
                  <Typography variant="h4">
                    {metrics.totalRecoveries}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {metrics.successfulRecoveries} successful
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Recovery Time
                  </Typography>
                  <Typography variant="h4">
                    {Math.round(metrics.averageRecoveryTime)}s
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Failed Recoveries
                  </Typography>
                  <Typography variant="h4" color="error">
                    {metrics.failedRecoveries}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {metrics.commonFailureReasons.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Common Failure Reasons
              </Typography>
              <List dense>
                {metrics.commonFailureReasons.slice(0, 3).map((reason, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={reason.reason}
                      secondary={`${reason.count} occurrences (${reason.percentage.toFixed(1)}%)`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Collapse>

      <Grid container spacing={2}>
        {/* Failed Workflows */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Failed Workflows ({filteredWorkflows.length})
              </Typography>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filterPriority}
                  label="Priority"
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <List>
              {filteredWorkflows.length === 0 ? (
                <Alert severity="success">
                  No failed workflows to recover
                </Alert>
              ) : (
                filteredWorkflows.map(workflow => (
                  <React.Fragment key={workflow.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Badge badgeContent={workflow.checkpoints} color="primary">
                          <ErrorIcon color="error" />
                        </Badge>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {workflow.name}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={workflow.priority} 
                              color={getPriorityColor(workflow.priority)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Failed at: {workflow.stage} - {new Date(workflow.failedAt).toLocaleTimeString()}
                            </Typography>
                            <Typography variant="caption" color="error">
                              {workflow.error.message}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => toggleWorkflowExpansion(workflow.id)}
                        >
                          {expandedWorkflows.has(workflow.id) ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <Collapse in={expandedWorkflows.has(workflow.id)}>
                      <Box sx={{ pl: 9, pr: 2, pb: 2 }}>
                        <Alert severity={getErrorSeverity(workflow.error)} sx={{ mb: 1 }}>
                          <AlertTitle>Error Details</AlertTitle>
                          Type: {workflow.error.type}<br />
                          Tool: {workflow.error.tool || 'N/A'}<br />
                          Retry Count: {workflow.error.retryCount}
                        </Alert>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayIcon />}
                            onClick={() => onRecover(workflow.workflowId, 'auto')}
                          >
                            Auto Recover
                          </Button>
                          
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<TimelineIcon />}
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            View Checkpoints
                          </Button>
                          
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ManualIcon />}
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            Manual Options
                          </Button>
                        </Box>
                      </Box>
                    </Collapse>
                    
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recovery Queue */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recovery Queue ({recoveryQueue.length})
            </Typography>

            {recoveryQueue.length === 0 ? (
              <Alert severity="info">
                No active recovery operations
              </Alert>
            ) : (
              <List>
                {recoveryQueue.map(recovery => (
                  <ListItem key={recovery.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {recovery.workflowId}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={recovery.status} 
                            color={getRecoveryStatusColor(recovery.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Strategy: {recovery.strategy}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={recovery.progress} 
                            sx={{ mt: 1, mb: 1 }}
                          />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {recovery.steps.map((step, index) => (
                              <Chip
                                key={index}
                                size="small"
                                label={step.name}
                                color={
                                  step.status === 'completed' ? 'success' :
                                  step.status === 'running' ? 'primary' :
                                  step.status === 'failed' ? 'error' : 'default'
                                }
                                variant={step.status === 'running' ? 'filled' : 'outlined'}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {recovery.status === 'executing' && (
                        <IconButton
                          edge="end"
                          onClick={() => onCancelRecovery(recovery.id)}
                        >
                          <StopIcon />
                        </IconButton>
                      )}
                      {recovery.status === 'failed' && (
                        <IconButton
                          edge="end"
                          onClick={() => onRetryRecovery(recovery.id)}
                        >
                          <RefreshIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Manual Intervention Options */}
      {selectedWorkflow && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Manual Recovery Options for {selectedWorkflow.name}
          </Typography>
          
          <Grid container spacing={2}>
            {manualOptions.map(option => (
              <Grid key={option.id} size={{ xs: 12, md: 4 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {option.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {option.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Actions: {option.actions.map(a => a.type).join(' → ')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => onManualIntervention(selectedWorkflow.workflowId, option)}
                    >
                      Apply
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default RecoveryManagementConsole;