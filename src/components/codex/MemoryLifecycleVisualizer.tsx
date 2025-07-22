import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Stepper,
  Step,
  StepButton,
  StepLabel,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PsychologyIcon from '@mui/icons-material/Psychology';
import StorageIcon from '@mui/icons-material/Storage';
import SearchIcon from '@mui/icons-material/Search';
import UpdateIcon from '@mui/icons-material/Update';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { apiClient } from '../../api/client';
import { CognitiveProcessingView } from './CognitiveProcessingView';

interface Memory {
  id: string;
  content: any;
  memory_type: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface LifecycleStage {
  stage_id: string;
  stage_name: string;
  description: string;
  timestamp: string;
  duration_ms?: number;
  metadata: Record<string, any>;
}

interface LifecycleMetrics {
  stage: string;
  total_memories: number;
  avg_duration_ms: number;
  success_rate: number;
  common_transitions: Array<{
    from: string;
    to: string;
    percentage: number;
  }>;
  bottlenecks: Array<{
    type: string;
    description: string;
    impact: string;
    suggestion: string;
  }>;
}

interface MemoryLifecycleView {
  memory_id: string;
  current_stage: string;
  lifecycle_stages: LifecycleStage[];
  cognitive_processing?: any;
  metadata: Record<string, any>;
}

interface MemoryLifecycleVisualizerProps {
  memoryId?: string;
}

export const MemoryLifecycleVisualizer: React.FC<MemoryLifecycleVisualizerProps> = ({
  memoryId,
}) => {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [lifecycleData, setLifecycleData] = useState<MemoryLifecycleView | null>(null);
  const [lifecycleStage, setLifecycleStage] = useState<string>('creation');
  const [stageMetrics, setStageMetrics] = useState<LifecycleMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lifecycleStages = [
    { id: 'creation', label: 'Creation', icon: <AddIcon /> },
    { id: 'processing', label: 'Cognitive Processing', icon: <PsychologyIcon /> },
    { id: 'storage', label: 'Storage', icon: <StorageIcon /> },
    { id: 'retrieval', label: 'Retrieval', icon: <SearchIcon /> },
    { id: 'update', label: 'Update', icon: <UpdateIcon /> },
    { id: 'expiration', label: 'Expiration', icon: <TimerOffIcon /> },
  ];

  useEffect(() => {
    if (memoryId) {
      loadMemoryLifecycle(memoryId);
    }
    loadStageMetrics(lifecycleStage);
  }, [memoryId, lifecycleStage]);

  const loadMemoryLifecycle = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/codex/memories/${id}/lifecycle`);
      setLifecycleData(response.data);
      if (response.data.current_stage) {
        setLifecycleStage(response.data.current_stage);
      }
    } catch (err) {
      console.error('Failed to load memory lifecycle:', err);
      setError('Failed to load memory lifecycle data');
    } finally {
      setLoading(false);
    }
  };

  const loadStageMetrics = async (stage: string) => {
    try {
      const response = await apiClient.get('/codex/lifecycle/metrics', {
        params: { stage, time_range: '24h' },
      });
      setStageMetrics(response.data);
    } catch (err) {
      console.error('Failed to load stage metrics:', err);
    }
  };

  const getStageStatus = (stageId: string): 'completed' | 'active' | 'pending' => {
    if (!lifecycleData) return 'pending';
    
    const stageIndex = lifecycleData.lifecycle_stages.findIndex(
      (s) => s.stage_id === stageId
    );
    const currentIndex = lifecycleData.lifecycle_stages.findIndex(
      (s) => s.stage_id === lifecycleData.current_stage
    );
    
    if (stageIndex === -1) return 'pending';
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'active':
        return <CircularProgress size={20} />;
      default:
        return null;
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const renderStageDetails = () => {
    const stage = lifecycleStages.find((s) => s.id === lifecycleStage);
    if (!stage) return null;

    const stageData = lifecycleData?.lifecycle_stages.find(
      (s) => s.stage_id === lifecycleStage
    );

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {stage.label} Stage
        </Typography>
        
        {stageData ? (
          <Box>
            <Typography variant="body2" color="textSecondary" paragraph>
              {stageData.description}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Timestamp
                </Typography>
                <Typography variant="body2">
                  {new Date(stageData.timestamp).toLocaleString()}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Duration
                </Typography>
                <Typography variant="body2">
                  {formatDuration(stageData.duration_ms)}
                </Typography>
              </Grid>
            </Grid>
            
            {Object.keys(stageData.metadata).length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Metadata
                </Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                  <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                    {JSON.stringify(stageData.metadata, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="textSecondary">
            This stage has not been reached yet.
          </Typography>
        )}
        
        {/* Special content for processing stage */}
        {lifecycleStage === 'processing' && lifecycleData?.cognitive_processing && (
          <Box mt={3}>
            <CognitiveProcessingView
              memory={selectedMemory || { id: lifecycleData.memory_id } as Memory}
              processingResults={lifecycleData.cognitive_processing}
            />
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Lifecycle Flow Diagram */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Memory Lifecycle Flow
        </Typography>
        <Stepper
          activeStep={lifecycleStages.findIndex((s) => s.id === lifecycleStage)}
          alternativeLabel
        >
          {lifecycleStages.map((stage) => {
            const status = getStageStatus(stage.id);
            return (
              <Step key={stage.id} completed={status === 'completed'}>
                <StepButton
                  onClick={() => setLifecycleStage(stage.id)}
                  icon={stage.icon}
                >
                  <StepLabel
                    optional={getStageIcon(status)}
                    StepIconProps={{
                      completed: status === 'completed',
                      active: status === 'active',
                    }}
                  >
                    {stage.label}
                  </StepLabel>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Stage Details and Metrics */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            {renderStageDetails()}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stage Metrics
            </Typography>
            
            {stageMetrics ? (
              <Box>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Memories
                    </Typography>
                    <Typography variant="h4">
                      {stageMetrics.total_memories.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Average Duration
                    </Typography>
                    <Typography variant="h4">
                      {formatDuration(stageMetrics.avg_duration_ms)}
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Success Rate
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={stageMetrics.success_rate * 100}
                        sx={{ flex: 1 }}
                        color={stageMetrics.success_rate > 0.9 ? 'success' : 'warning'}
                      />
                      <Typography variant="body2">
                        {(stageMetrics.success_rate * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                
                {/* Common Transitions */}
                {stageMetrics.common_transitions.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Common Transitions
                    </Typography>
                    <List dense>
                      {stageMetrics.common_transitions.map((transition, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`→ ${transition.to}`}
                            secondary={`${(transition.percentage * 100).toFixed(0)}% of memories`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {/* Bottlenecks */}
                {stageMetrics.bottlenecks.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Bottlenecks Detected
                    </Typography>
                    {stageMetrics.bottlenecks.map((bottleneck, index) => (
                      <Alert
                        key={index}
                        severity={bottleneck.impact === 'high' ? 'error' : 'warning'}
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="body2">{bottleneck.description}</Typography>
                        <Typography variant="caption" display="block">
                          Suggestion: {bottleneck.suggestion}
                        </Typography>
                      </Alert>
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Loading metrics...
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};