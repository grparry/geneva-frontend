import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  AlertTitle,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Divider,
  Badge
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  Assessment as ChartIcon,
  Lightbulb as InsightIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  BookmarkBorder as SaveIcon,
  BookmarkAdded as SavedIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  AutoAwesome as RecommendIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ToolResult {
  toolId: string;
  toolType: string;
  toolName: string;
  status: 'success' | 'partial' | 'failed';
  duration: number;
  tokensUsed: number;
  apiCalls: number;
  results: Array<{
    type: 'code' | 'document' | 'image' | 'data' | 'insight';
    name: string;
    content: any;
    metadata?: Record<string, any>;
  }>;
  errors?: string[];
  warnings?: string[];
}

interface AggregatedResult {
  summary: string;
  confidence: number;
  keyFindings: Array<{
    finding: string;
    importance: 'high' | 'medium' | 'low';
    sources: string[];
  }>;
  synthesizedInsights: Array<{
    insight: string;
    confidence: number;
    supportingEvidence: string[];
  }>;
  conflicts?: Array<{
    topic: string;
    conflictingResults: Array<{
      source: string;
      claim: string;
    }>;
  }>;
}

interface ActionableRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  requiredActions: string[];
  relatedResults: string[];
}

interface WorkflowArtifact {
  id: string;
  type: 'code' | 'report' | 'diagram' | 'data';
  name: string;
  size: number;
  createdAt: string;
  downloadUrl?: string;
  previewUrl?: string;
}

interface ResultAggregationViewerProps {
  workflowId: string;
  toolResults: ToolResult[];
  aggregatedInsights: AggregatedResult;
  recommendations: ActionableRecommendation[];
  artifacts: WorkflowArtifact[];
  onSaveResult?: (resultId: string) => void;
  onExportResults?: (format: 'json' | 'pdf' | 'markdown') => void;
  onFeedback?: (resultId: string, feedback: 'positive' | 'negative', comment?: string) => void;
}

const ResultAggregationViewer: React.FC<ResultAggregationViewerProps> = ({
  workflowId,
  toolResults,
  aggregatedInsights,
  recommendations,
  artifacts,
  onSaveResult,
  onExportResults,
  onFeedback
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [savedResults, setSavedResults] = useState<Set<string>>(new Set());
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; resultId?: string }>({ open: false });
  const [feedbackComment, setFeedbackComment] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState<WorkflowArtifact | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleResultExpansion = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const toggleSaveResult = (resultId: string) => {
    const newSaved = new Set(savedResults);
    if (newSaved.has(resultId)) {
      newSaved.delete(resultId);
    } else {
      newSaved.add(resultId);
      onSaveResult?.(resultId);
    }
    setSavedResults(newSaved);
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    if (feedbackDialog.resultId) {
      onFeedback?.(feedbackDialog.resultId, type, feedbackComment);
      setFeedbackDialog({ open: false });
      setFeedbackComment('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'partial':
        return <WarningIcon color="warning" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <CodeIcon />;
      case 'document':
        return <DocumentIcon />;
      case 'image':
        return <ImageIcon />;
      case 'data':
        return <ChartIcon />;
      case 'insight':
        return <InsightIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const getImportanceColor = (importance: string): 'error' | 'warning' | 'success' => {
    switch (importance) {
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

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Workflow Results & Insights
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => onExportResults?.('json')}
            >
              Export JSON
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => onExportResults?.('pdf')}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
            >
              Share
            </Button>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Aggregated Insights" />
            <Tab label={`Tool Results (${toolResults.length})`} />
            <Tab label={`Recommendations (${recommendations.length})`} />
            <Tab label={`Artifacts (${artifacts.length})`} />
          </Tabs>
        </Box>
      </Paper>

      {/* Aggregated Insights Tab */}
      {activeTab === 0 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Executive Summary
            </Typography>
            <Typography variant="body1" paragraph>
              {aggregatedInsights.summary}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Confidence Level:
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={aggregatedInsights.confidence} 
                sx={{ flex: 1, mr: 2 }}
              />
              <Typography variant="body2">
                {aggregatedInsights.confidence}%
              </Typography>
            </Box>
          </Paper>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Key Findings
                </Typography>
                <List>
                  {aggregatedInsights.keyFindings.map((finding, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Chip 
                          label={finding.importance} 
                          size="small"
                          color={getImportanceColor(finding.importance)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={finding.finding}
                        secondary={`Sources: ${finding.sources.join(', ')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Synthesized Insights
                </Typography>
                {aggregatedInsights.synthesizedInsights.map((insight, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <InsightIcon color="primary" />
                        <Typography sx={{ flex: 1 }}>{insight.insight}</Typography>
                        <Chip 
                          label={`${insight.confidence}% confident`} 
                          size="small"
                          color={insight.confidence > 80 ? 'success' : 'warning'}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="subtitle2" gutterBottom>
                        Supporting Evidence:
                      </Typography>
                      <List dense>
                        {insight.supportingEvidence.map((evidence, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={evidence} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Paper>
            </Grid>
          </Grid>

          {aggregatedInsights.conflicts && aggregatedInsights.conflicts.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Conflicting Results Detected</AlertTitle>
              {aggregatedInsights.conflicts.map((conflict, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">{conflict.topic}</Typography>
                  {conflict.conflictingResults.map((result, idx) => (
                    <Typography key={idx} variant="body2">
                      • {result.source}: {result.claim}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Alert>
          )}
        </Box>
      )}

      {/* Tool Results Tab */}
      {activeTab === 1 && (
        <Box>
          {toolResults.map((tool) => (
            <Accordion 
              key={tool.toolId}
              expanded={expandedResults.has(tool.toolId)}
              onChange={() => toggleResultExpansion(tool.toolId)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {getStatusIcon(tool.status)}
                  <Typography sx={{ flex: 1 }}>
                    {tool.toolName} ({tool.toolType})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={`${tool.duration}ms`} size="small" />
                    <Chip label={`${tool.tokensUsed} tokens`} size="small" />
                    <Chip label={`${tool.results.length} results`} size="small" color="primary" />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {tool.errors && tool.errors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {tool.errors.map((error, idx) => (
                      <Typography key={idx} variant="body2">{error}</Typography>
                    ))}
                  </Alert>
                )}

                {tool.warnings && tool.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {tool.warnings.map((warning, idx) => (
                      <Typography key={idx} variant="body2">{warning}</Typography>
                    ))}
                  </Alert>
                )}

                <List>
                  {tool.results.map((result, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <Card sx={{ width: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {getResultIcon(result.type)}
                            <Typography variant="subtitle1" sx={{ flex: 1 }}>
                              {result.name}
                            </Typography>
                            <IconButton size="small" onClick={() => toggleSaveResult(`${tool.toolId}-${index}`)}>
                              {savedResults.has(`${tool.toolId}-${index}`) ? <SavedIcon /> : <SaveIcon />}
                            </IconButton>
                          </Box>

                          {result.type === 'code' && (
                            <Box sx={{ position: 'relative' }}>
                              <IconButton 
                                size="small" 
                                sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
                                onClick={() => copyToClipboard(result.content)}
                              >
                                <CopyIcon />
                              </IconButton>
                              <SyntaxHighlighter 
                                language={result.metadata?.language || 'javascript'} 
                                style={tomorrow}
                                customStyle={{ maxHeight: '300px', overflow: 'auto' }}
                              >
                                {result.content}
                              </SyntaxHighlighter>
                            </Box>
                          )}

                          {result.type === 'document' && (
                            <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                              <Typography variant="body2" whiteSpace="pre-wrap">
                                {result.content}
                              </Typography>
                            </Paper>
                          )}

                          {result.type === 'insight' && (
                            <Alert severity="info" icon={<InsightIcon />}>
                              {result.content}
                            </Alert>
                          )}

                          {result.metadata && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Metadata: {JSON.stringify(result.metadata)}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            startIcon={<ThumbUpIcon />}
                            onClick={() => setFeedbackDialog({ open: true, resultId: `${tool.toolId}-${index}` })}
                          >
                            Helpful
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<ThumbDownIcon />}
                            onClick={() => setFeedbackDialog({ open: true, resultId: `${tool.toolId}-${index}` })}
                          >
                            Not Helpful
                          </Button>
                        </CardActions>
                      </Card>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Recommendations Tab */}
      {activeTab === 2 && (
        <Grid container spacing={2}>
          {recommendations.map((rec) => (
            <Grid key={rec.id} size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <RecommendIcon color="primary" />
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      {rec.title}
                    </Typography>
                    <Chip 
                      label={rec.priority} 
                      size="small"
                      color={getImportanceColor(rec.priority)}
                    />
                  </Box>
                  
                  <Typography variant="body2" paragraph>
                    {rec.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Estimated Impact:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rec.estimatedImpact}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Required Actions:
                    </Typography>
                    <List dense>
                      {rec.requiredActions.map((action, idx) => (
                        <ListItem key={idx}>
                          <ListItemText primary={`${idx + 1}. ${action}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Based on results from: {rec.relatedResults.join(', ')}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">View Details</Button>
                  <Button size="small">Create Task</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Artifacts Tab */}
      {activeTab === 3 && (
        <Grid container spacing={2}>
          {artifacts.map((artifact) => (
            <Grid key={artifact.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getResultIcon(artifact.type)}
                    <Typography variant="subtitle1" sx={{ flex: 1 }}>
                      {artifact.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Type: {artifact.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Size: {formatFileSize(artifact.size)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(artifact.createdAt).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  {artifact.previewUrl && (
                    <Button size="small" startIcon={<OpenIcon />} onClick={() => setSelectedArtifact(artifact)}>
                      Preview
                    </Button>
                  )}
                  {artifact.downloadUrl && (
                    <Button size="small" startIcon={<DownloadIcon />} href={artifact.downloadUrl}>
                      Download
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog.open} onClose={() => setFeedbackDialog({ open: false })}>
        <DialogTitle>Provide Feedback</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Your feedback helps improve result quality and relevance.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Comments (Optional)"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog({ open: false })}>
            Cancel
          </Button>
          <Button 
            startIcon={<ThumbDownIcon />} 
            onClick={() => handleFeedback('negative')}
            color="error"
          >
            Not Helpful
          </Button>
          <Button 
            startIcon={<ThumbUpIcon />} 
            onClick={() => handleFeedback('positive')}
            color="success"
            variant="contained"
          >
            Helpful
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultAggregationViewer;