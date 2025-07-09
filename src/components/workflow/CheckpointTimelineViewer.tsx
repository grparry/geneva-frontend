import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PlayArrow as ResumeIcon,
  Compare as CompareIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';

interface WorkflowCheckpoint {
  id: string;
  workflowId: string;
  timestamp: string;
  stage: string;
  status: 'success' | 'partial' | 'failed';
  toolsCompleted: string[];
  toolsPending: string[];
  artifacts: Array<{
    type: string;
    name: string;
    size: number;
  }>;
  metadata: {
    duration: number;
    tokensUsed: number;
    apiCalls: number;
  };
}

interface WorkflowState {
  workflowId: string;
  currentStage: string;
  progress: number;
  status: 'running' | 'paused' | 'failed' | 'completed';
  activeTools: string[];
  errors: Array<{
    tool: string;
    message: string;
    timestamp: string;
  }>;
}

interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  confidence: number;
  estimatedTime: number;
  requiredActions: string[];
}

interface StateComparison {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

interface CheckpointTimelineViewerProps {
  workflowId: string;
  checkpoints: WorkflowCheckpoint[];
  currentState: WorkflowState;
  onRestore: (checkpointId: string, strategy: RecoveryStrategy) => void;
  onCompare: (checkpoint1: string, checkpoint2: string) => void;
}

const CheckpointTimelineViewer: React.FC<CheckpointTimelineViewerProps> = ({
  workflowId,
  checkpoints,
  currentState,
  onRestore,
  onCompare
}) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<WorkflowCheckpoint | null>(null);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareCheckpoints, setCompareCheckpoints] = useState<string[]>([]);
  const [recoveryStrategies] = useState<RecoveryStrategy[]>([
    {
      id: 'resume',
      name: 'Resume from Checkpoint',
      description: 'Continue workflow from the selected checkpoint state',
      confidence: 95,
      estimatedTime: 30,
      requiredActions: ['Restore state', 'Resume pending tools']
    },
    {
      id: 'retry',
      name: 'Retry Failed Tools',
      description: 'Retry only the tools that failed since this checkpoint',
      confidence: 85,
      estimatedTime: 45,
      requiredActions: ['Identify failed tools', 'Reset tool state', 'Retry execution']
    },
    {
      id: 'partial',
      name: 'Partial Recovery',
      description: 'Recover successful tool results and rerun incomplete ones',
      confidence: 75,
      estimatedTime: 60,
      requiredActions: ['Analyze partial results', 'Merge successful outputs', 'Rerun incomplete tools']
    },
    {
      id: 'reset',
      name: 'Reset to Checkpoint',
      description: 'Completely reset workflow to checkpoint state',
      confidence: 100,
      estimatedTime: 15,
      requiredActions: ['Clear current state', 'Restore checkpoint', 'Restart workflow']
    }
  ]);

  const getCheckpointIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <SuccessIcon />;
      case 'partial':
        return <WarningIcon />;
      case 'failed':
        return <ErrorIcon />;
      default:
        return <SaveIcon />;
    }
  };

  const getCheckpointColor = (status: string): 'success' | 'warning' | 'error' | 'primary' => {
    switch (status) {
      case 'success':
        return 'success';
      case 'partial':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'primary';
    }
  };

  const handleCheckpointClick = (checkpoint: WorkflowCheckpoint) => {
    if (compareMode) {
      if (compareCheckpoints.includes(checkpoint.id)) {
        setCompareCheckpoints(compareCheckpoints.filter(id => id !== checkpoint.id));
      } else if (compareCheckpoints.length < 2) {
        setCompareCheckpoints([...compareCheckpoints, checkpoint.id]);
      }
    } else {
      setSelectedCheckpoint(checkpoint);
    }
  };

  const handleRestore = (strategy: RecoveryStrategy) => {
    if (selectedCheckpoint) {
      onRestore(selectedCheckpoint.id, strategy);
      setRecoveryDialogOpen(false);
    }
  };

  const handleCompare = () => {
    if (compareCheckpoints.length === 2) {
      onCompare(compareCheckpoints[0], compareCheckpoints[1]);
      setCompareMode(false);
      setCompareCheckpoints([]);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon /> Checkpoint Timeline
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={compareMode ? 'contained' : 'outlined'}
              startIcon={<CompareIcon />}
              onClick={() => {
                setCompareMode(!compareMode);
                setCompareCheckpoints([]);
              }}
              disabled={checkpoints.length < 2}
            >
              Compare Mode
            </Button>
            
            {compareMode && compareCheckpoints.length === 2 && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleCompare}
              >
                Compare Selected
              </Button>
            )}
          </Box>
        </Box>

        {currentState.status === 'failed' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Workflow failed at stage: {currentState.currentStage}. Select a checkpoint to recover.
          </Alert>
        )}

        <Timeline position="alternate">
          {checkpoints.map((checkpoint, index) => (
            <TimelineItem key={checkpoint.id}>
              <TimelineOppositeContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(checkpoint.timestamp).toLocaleTimeString()}
                </Typography>
                <Typography variant="body2">
                  Stage: {checkpoint.stage}
                </Typography>
              </TimelineOppositeContent>
              
              <TimelineSeparator>
                <TimelineConnector sx={{ display: index === 0 ? 'none' : 'block' }} />
                <TimelineDot 
                  color={getCheckpointColor(checkpoint.status)}
                  sx={{ 
                    cursor: 'pointer',
                    border: compareCheckpoints.includes(checkpoint.id) ? '3px solid' : 'none',
                    borderColor: 'primary.main'
                  }}
                  onClick={() => handleCheckpointClick(checkpoint)}
                >
                  {getCheckpointIcon(checkpoint.status)}
                </TimelineDot>
                <TimelineConnector sx={{ display: index === checkpoints.length - 1 ? 'none' : 'block' }} />
              </TimelineSeparator>
              
              <TimelineContent sx={{ py: 2 }}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedCheckpoint?.id === checkpoint.id ? 'action.selected' : 'background.paper',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  onClick={() => handleCheckpointClick(checkpoint)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Checkpoint #{index + 1}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={checkpoint.status} 
                        color={getCheckpointColor(checkpoint.status)}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip 
                        size="small" 
                        label={`${checkpoint.toolsCompleted.length} tools completed`}
                        variant="outlined"
                      />
                      {checkpoint.toolsPending.length > 0 && (
                        <Chip 
                          size="small" 
                          label={`${checkpoint.toolsPending.length} pending`}
                          variant="outlined"
                          color="warning"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      Duration: {formatDuration(checkpoint.metadata.duration)} | 
                      Tokens: {checkpoint.metadata.tokensUsed.toLocaleString()}
                    </Typography>
                    
                    {checkpoint.artifacts.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {checkpoint.artifacts.length} artifacts
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Paper>

      {selectedCheckpoint && !compareMode && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Checkpoint Details
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<RestoreIcon />}
              onClick={() => setRecoveryDialogOpen(true)}
              disabled={currentState.status === 'running'}
            >
              Restore Checkpoint
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Completed Tools
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedCheckpoint.toolsCompleted.map(tool => (
                <Chip key={tool} label={tool} size="small" color="success" />
              ))}
            </Box>
          </Box>

          {selectedCheckpoint.toolsPending.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Pending Tools
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedCheckpoint.toolsPending.map(tool => (
                  <Chip key={tool} label={tool} size="small" color="warning" />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Artifacts
            </Typography>
            <List dense>
              {selectedCheckpoint.artifacts.map((artifact, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={artifact.name}
                    secondary={`${artifact.type} - ${formatSize(artifact.size)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>
      )}

      {/* Recovery Dialog */}
      <Dialog 
        open={recoveryDialogOpen} 
        onClose={() => setRecoveryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Select Recovery Strategy
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Choose how to recover from checkpoint created at {selectedCheckpoint && new Date(selectedCheckpoint.timestamp).toLocaleString()}
          </Alert>
          
          <List>
            {recoveryStrategies.map(strategy => (
              <ListItem 
                key={strategy.id}
                onClick={() => handleRestore(strategy)}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {strategy.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          size="small" 
                          label={`${strategy.confidence}% confidence`}
                          color={strategy.confidence > 90 ? 'success' : 'warning'}
                        />
                        <Chip 
                          size="small" 
                          label={`~${strategy.estimatedTime}s`}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {strategy.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Actions: {strategy.requiredActions.join(' → ')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecoveryDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckpointTimelineViewer;