import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Tooltip,
  IconButton,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import MemoryIcon from '@mui/icons-material/Memory';
import TransformIcon from '@mui/icons-material/Transform';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CodeIcon from '@mui/icons-material/Code';
import { apiClient } from '../../api/client';

interface Memory {
  id: string;
  content: any;
  memory_type: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface ProcessingStep {
  step_id: string;
  step_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  input_summary?: string;
  output_summary?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

interface CognitiveTransformation {
  transformation_id: string;
  transformation_type: string;
  description: string;
  before_state: any;
  after_state: any;
  confidence_score?: number;
  applied_rules?: string[];
}

interface ProcessingMetrics {
  total_duration_ms: number;
  step_durations: Record<string, number>;
  transformation_count: number;
  error_count: number;
  warning_count: number;
  memory_usage_bytes?: number;
  cpu_usage_percent?: number;
}

interface CognitiveProcessingViewProps {
  memory: Memory;
  processingResults?: any;
}

export const CognitiveProcessingView: React.FC<CognitiveProcessingViewProps> = ({
  memory,
  processingResults,
}) => {
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [transformations, setTransformations] = useState<CognitiveTransformation[]>([]);
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  useEffect(() => {
    if (processingResults) {
      // Use provided results
      parseProcessingResults(processingResults);
    } else {
      // Load from API
      loadProcessingData();
    }
  }, [memory.id, processingResults]);

  const parseProcessingResults = (results: any) => {
    // Parse processing steps
    if (results.steps) {
      setProcessingSteps(results.steps);
    }

    // Parse transformations
    if (results.transformations) {
      setTransformations(results.transformations);
    }

    // Parse metrics
    if (results.metrics) {
      setMetrics(results.metrics);
    }

    setLoading(false);
  };

  const loadProcessingData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/codex/memories/${memory.id}/processing`);
      parseProcessingResults(response.data);
    } catch (error) {
      console.error('Failed to load processing data:', error);
      // Use mock data for demo
      const mockData = {
        steps: [
          {
            step_id: 'parse',
            step_name: 'Content Parsing',
            status: 'completed' as const,
            started_at: new Date(Date.now() - 5000).toISOString(),
            completed_at: new Date(Date.now() - 4500).toISOString(),
            duration_ms: 500,
            input_summary: 'Raw content string',
            output_summary: 'Structured content object',
          },
          {
            step_id: 'extract',
            step_name: 'Entity Extraction',
            status: 'completed' as const,
            started_at: new Date(Date.now() - 4500).toISOString(),
            completed_at: new Date(Date.now() - 3500).toISOString(),
            duration_ms: 1000,
            input_summary: 'Structured content',
            output_summary: 'Extracted 5 entities, 3 relationships',
          },
          {
            step_id: 'classify',
            step_name: 'Content Classification',
            status: 'completed' as const,
            started_at: new Date(Date.now() - 3500).toISOString(),
            completed_at: new Date(Date.now() - 2800).toISOString(),
            duration_ms: 700,
            input_summary: 'Content with entities',
            output_summary: 'Technical documentation, confidence: 0.92',
          },
          {
            step_id: 'embed',
            step_name: 'Vector Embedding',
            status: 'completed' as const,
            started_at: new Date(Date.now() - 2800).toISOString(),
            completed_at: new Date(Date.now() - 2000).toISOString(),
            duration_ms: 800,
            input_summary: 'Classified content',
            output_summary: '1536-dimensional vector',
          },
          {
            step_id: 'link',
            step_name: 'Relationship Linking',
            status: 'completed' as const,
            started_at: new Date(Date.now() - 2000).toISOString(),
            completed_at: new Date(Date.now() - 1000).toISOString(),
            duration_ms: 1000,
            input_summary: 'Embedded content',
            output_summary: 'Created 8 relationships',
            warnings: ['Ambiguous reference to "config" resolved using context'],
          },
        ],
        transformations: [
          {
            transformation_id: 't1',
            transformation_type: 'content_structure',
            description: 'Converted unstructured text to structured format',
            before_state: { type: 'text', format: 'plain' },
            after_state: { type: 'structured', format: 'json', fields: 12 },
            confidence_score: 0.95,
          },
          {
            transformation_id: 't2',
            transformation_type: 'entity_enrichment',
            description: 'Enriched entities with ontology references',
            before_state: { entities: 5, enriched: 0 },
            after_state: { entities: 5, enriched: 5 },
            confidence_score: 0.88,
            applied_rules: ['ontology.entity.matching', 'context.resolution'],
          },
        ],
        metrics: {
          total_duration_ms: 4000,
          step_durations: {
            parse: 500,
            extract: 1000,
            classify: 700,
            embed: 800,
            link: 1000,
          },
          transformation_count: 2,
          error_count: 0,
          warning_count: 1,
          memory_usage_bytes: 2048000,
          cpu_usage_percent: 45,
        },
      };
      parseProcessingResults(mockData);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <PsychologyIcon color="primary" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const getStepColor = (status: string): 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'grey' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'primary';
      default:
        return 'grey';
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  };

  if (loading) {
    return (
      <Box>
        <Typography>Loading cognitive processing data...</Typography>
        <LinearProgress sx={{ mt: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Processing Metrics Summary */}
      {metrics && (
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Duration
                </Typography>
                <Typography variant="h5">
                  {formatDuration(metrics.total_duration_ms)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Transformations
                </Typography>
                <Typography variant="h5">
                  {metrics.transformation_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Memory Usage
                </Typography>
                <Typography variant="h5">
                  {formatBytes(metrics.memory_usage_bytes)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Status
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {metrics.error_count > 0 ? (
                    <Chip label={`${metrics.error_count} errors`} color="error" size="small" />
                  ) : metrics.warning_count > 0 ? (
                    <Chip label={`${metrics.warning_count} warnings`} color="warning" size="small" />
                  ) : (
                    <Chip label="Success" color="success" size="small" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Processing Timeline */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Processing Pipeline
        </Typography>
        <Timeline position="alternate">
          {processingSteps.map((step, index) => (
            <TimelineItem key={step.step_id}>
              <TimelineOppositeContent color="textSecondary">
                <Typography variant="caption">
                  {formatDuration(step.duration_ms)}
                </Typography>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={getStepColor(step.status)}>
                  {getStepIcon(step.status)}
                </TimelineDot>
                {index < processingSteps.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Paper
                  elevation={selectedStep === step.step_id ? 3 : 1}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setSelectedStep(step.step_id === selectedStep ? null : step.step_id)}
                >
                  <Typography variant="subtitle1">{step.step_name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {step.output_summary}
                  </Typography>
                  {step.errors && step.errors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {step.errors[0]}
                    </Alert>
                  )}
                  {step.warnings && step.warnings.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {step.warnings[0]}
                    </Alert>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Paper>

      {/* Transformations */}
      {transformations.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Cognitive Transformations
          </Typography>
          {transformations.map((transform) => (
            <Accordion key={transform.transformation_id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <TransformIcon color="primary" />
                  <Box flex={1}>
                    <Typography>{transform.description}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Type: {transform.transformation_type}
                    </Typography>
                  </Box>
                  {transform.confidence_score && (
                    <Chip
                      label={`Confidence: ${(transform.confidence_score * 100).toFixed(0)}%`}
                      size="small"
                      color={transform.confidence_score > 0.8 ? 'success' : 'warning'}
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Before
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(transform.before_state, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      After
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(transform.after_state, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                  {transform.applied_rules && transform.applied_rules.length > 0 && (
                    <Grid size={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Applied Rules
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {transform.applied_rules.map((rule, index) => (
                          <Chip
                            key={index}
                            label={rule}
                            size="small"
                            icon={<CodeIcon />}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Processing Details */}
      {selectedStep && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Step Details: {processingSteps.find(s => s.step_id === selectedStep)?.step_name}
          </Typography>
          <Box>
            {/* Additional step details could go here */}
            <Typography variant="body2" color="textSecondary">
              Select a step in the timeline to view detailed information.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};