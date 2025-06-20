import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Pattern as PatternIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import { useObservabilityStore } from '../store/observabilityStore';
import { useUIStore } from '../store/uiStore';

interface CommunicationPattern {
  id: string;
  type: 'success' | 'failure' | 'anomaly' | 'optimization';
  pattern: string;
  frequency: number;
  successRate: number;
  avgResponseTime: number;
  communicationType: string;
  examples: string[];
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastSeen: string;
}

interface PerformanceAnomaly {
  id: string;
  type: 'latency_spike' | 'error_burst' | 'volume_spike' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedCommunications: number;
  detectedAt: string;
  duration: number;
  suggestedAction: string;
  relatedAgents: string[];
}

interface PatternAnalyzerProps {
  conversationId?: string;
  agentId?: string;
  timeRange?: string;
  autoRefresh?: boolean;
}

export const PatternAnalyzer: React.FC<PatternAnalyzerProps> = ({
  conversationId,
  agentId,
  timeRange = '24h',
  autoRefresh = true
}) => {
  // Store hooks
  const { streamCache, conversations } = useObservabilityStore();
  const { addNotification } = useUIStore();
  
  // Component state
  const [patterns, setPatterns] = useState<CommunicationPattern[]>([]);
  const [anomalies, setAnomalies] = useState<PerformanceAnomaly[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<CommunicationPattern | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<PerformanceAnomaly | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'patterns' | 'anomalies' | 'both'>('both');
  const [showDetails, setShowDetails] = useState(false);
  const [localAutoRefresh, setLocalAutoRefresh] = useState(autoRefresh);
  const [minConfidence, setMinConfidence] = useState(0.7);
  
  // Get messages for analysis
  const analysisMessages = useMemo(() => {
    if (conversationId) {
      return streamCache.get(conversationId) || [];
    }
    
    // If no specific conversation, analyze all messages
    const allMessages: any[] = [];
    Array.from(streamCache.entries()).forEach(([convId, messages]) => {
      if (!agentId || messages.some(m => m.source_agent_id === agentId || m.target_agent_id === agentId)) {
        allMessages.push(...messages.map(m => ({ ...m, conversation_id: convId })));
      }
    });
    
    return allMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 1000);
  }, [streamCache, conversationId, agentId]);
  
  // Pattern detection algorithms
  const detectCommunicationPatterns = useCallback(() => {
    const patternMap = new Map<string, {
      frequency: number;
      successes: number;
      responseTimes: number[];
      communicationType: string;
      examples: string[];
      lastSeen: string;
    }>();
    
    analysisMessages.forEach(message => {
      // Extract patterns from message content
      const patterns = extractPatterns(message.content);
      
      patterns.forEach(pattern => {
        const key = `${pattern}_${message.communication_type}`;
        
        if (!patternMap.has(key)) {
          patternMap.set(key, {
            frequency: 0,
            successes: 0,
            responseTimes: [],
            communicationType: message.communication_type,
            examples: [],
            lastSeen: message.timestamp
          });
        }
        
        const entry = patternMap.get(key)!;
        entry.frequency++;
        entry.lastSeen = message.timestamp;
        
        if (entry.examples.length < 3) {
          entry.examples.push(message.content.slice(0, 100) + '...');
        }
        
        // Determine success based on response time and error indicators
        const isSuccess = !message.content.toLowerCase().includes('error') && 
                         !message.content.toLowerCase().includes('failed');
        if (isSuccess) entry.successes++;
        
        if (message.processing_duration_ms) {
          entry.responseTimes.push(message.processing_duration_ms);
        }
      });
    });
    
    // Convert to pattern objects
    const detectedPatterns: CommunicationPattern[] = Array.from(patternMap.entries())
      .map(([key, data]) => {
        const [pattern, communicationType] = key.split('_');
        const successRate = data.frequency > 0 ? (data.successes / data.frequency) * 100 : 0;
        const avgResponseTime = data.responseTimes.length > 0 
          ? data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length 
          : 0;
        
        // Calculate confidence based on frequency and consistency
        const confidence = Math.min(0.9, (data.frequency / 10) * 0.3 + (successRate / 100) * 0.4 + 0.3);
        
        // Determine trend (simplified)
        const trend: 'increasing' | 'decreasing' | 'stable' = successRate > 80 ? 'increasing' : successRate < 50 ? 'decreasing' : 'stable';
        
        // Classify pattern type
        let type: 'success' | 'failure' | 'anomaly' | 'optimization' = 'success';
        if (successRate < 50) type = 'failure';
        else if (successRate > 90 && avgResponseTime < 1000) type = 'optimization';
        else if (data.frequency < 3) type = 'anomaly';
        
        return {
          id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          pattern,
          frequency: data.frequency,
          successRate,
          avgResponseTime,
          communicationType,
          examples: data.examples,
          confidence,
          trend,
          lastSeen: data.lastSeen
        };
      })
      .filter(p => p.confidence >= minConfidence && p.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency);
    
    setPatterns(detectedPatterns);
  }, [analysisMessages, minConfidence]);
  
  // Anomaly detection
  const detectAnomalies = useCallback(() => {
    const detectedAnomalies: PerformanceAnomaly[] = [];
    
    // Group messages by time windows for anomaly detection
    const timeWindows = groupMessagesByTimeWindow(analysisMessages, 300000); // 5-minute windows
    
    timeWindows.forEach((messages, windowStart) => {
      const windowEnd = windowStart + 300000;
      
      // Detect latency spikes
      const responseTimes = messages
        .filter(m => m.processing_duration_ms)
        .map(m => m.processing_duration_ms);
      
      if (responseTimes.length > 0) {
        const avgLatency = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const maxLatency = Math.max(...responseTimes);
        
        if (maxLatency > avgLatency * 3 && maxLatency > 5000) {
          detectedAnomalies.push({
            id: `anomaly-latency-${windowStart}`,
            type: 'latency_spike',
            severity: maxLatency > 15000 ? 'critical' : maxLatency > 10000 ? 'high' : 'medium',
            description: `Latency spike detected: ${maxLatency}ms (${(maxLatency / avgLatency).toFixed(1)}x normal)`,
            affectedCommunications: messages.length,
            detectedAt: new Date(windowStart).toISOString(),
            duration: windowEnd - windowStart,
            suggestedAction: 'Check system resources and network connectivity',
            relatedAgents: Array.from(new Set(messages.map(m => m.source_agent_id)))
          });
        }
      }
      
      // Detect error bursts
      const errorMessages = messages.filter(m => 
        m.content.toLowerCase().includes('error') || 
        m.content.toLowerCase().includes('failed') ||
        m.content.toLowerCase().includes('exception')
      );
      
      if (errorMessages.length > messages.length * 0.3 && errorMessages.length > 3) {
        detectedAnomalies.push({
          id: `anomaly-errors-${windowStart}`,
          type: 'error_burst',
          severity: errorMessages.length > messages.length * 0.5 ? 'critical' : 'high',
          description: `Error burst detected: ${errorMessages.length} errors in ${messages.length} messages (${((errorMessages.length / messages.length) * 100).toFixed(1)}%)`,
          affectedCommunications: messages.length,
          detectedAt: new Date(windowStart).toISOString(),
          duration: windowEnd - windowStart,
          suggestedAction: 'Investigate error patterns and system stability',
          relatedAgents: Array.from(new Set(errorMessages.map(m => m.source_agent_id)))
        });
      }
      
      // Detect volume spikes
      const normalVolume = analysisMessages.length / timeWindows.size;
      if (messages.length > normalVolume * 2.5 && messages.length > 50) {
        detectedAnomalies.push({
          id: `anomaly-volume-${windowStart}`,
          type: 'volume_spike',
          severity: messages.length > normalVolume * 5 ? 'high' : 'medium',
          description: `Volume spike detected: ${messages.length} messages (${(messages.length / normalVolume).toFixed(1)}x normal)`,
          affectedCommunications: messages.length,
          detectedAt: new Date(windowStart).toISOString(),
          duration: windowEnd - windowStart,
          suggestedAction: 'Monitor system load and scaling capabilities',
          relatedAgents: Array.from(new Set(messages.map(m => m.source_agent_id)))
        });
      }
    });
    
    setAnomalies(detectedAnomalies.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()));
  }, [analysisMessages]);
  
  // Helper functions
  const extractPatterns = (content: string): string[] => {
    const patterns: string[] = [];
    
    // Tool usage patterns
    if (content.includes('```')) patterns.push('code_block_usage');
    if (content.includes('def ') || content.includes('function ')) patterns.push('function_definition');
    if (content.includes('import ') || content.includes('from ')) patterns.push('import_statement');
    if (content.includes('class ')) patterns.push('class_definition');
    
    // Communication patterns
    if (content.toLowerCase().includes('please ') || content.toLowerCase().includes('could you')) patterns.push('polite_request');
    if (content.toLowerCase().includes('error') || content.toLowerCase().includes('failed')) patterns.push('error_reporting');
    if (content.toLowerCase().includes('success') || content.toLowerCase().includes('completed')) patterns.push('success_confirmation');
    if (content.toLowerCase().includes('help') || content.toLowerCase().includes('assist')) patterns.push('help_request');
    
    // Task patterns
    if (content.toLowerCase().includes('create') || content.toLowerCase().includes('build')) patterns.push('creation_task');
    if (content.toLowerCase().includes('update') || content.toLowerCase().includes('modify')) patterns.push('modification_task');
    if (content.toLowerCase().includes('delete') || content.toLowerCase().includes('remove')) patterns.push('deletion_task');
    if (content.toLowerCase().includes('search') || content.toLowerCase().includes('find')) patterns.push('search_task');
    
    return patterns;
  };
  
  const groupMessagesByTimeWindow = (messages: any[], windowSize: number) => {
    const windows = new Map<number, any[]>();
    
    messages.forEach(message => {
      const timestamp = new Date(message.timestamp).getTime();
      const windowStart = Math.floor(timestamp / windowSize) * windowSize;
      
      if (!windows.has(windowStart)) {
        windows.set(windowStart, []);
      }
      windows.get(windowStart)!.push(message);
    });
    
    return windows;
  };
  
  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      if (analysisMode === 'patterns' || analysisMode === 'both') {
        detectCommunicationPatterns();
      }
      
      if (analysisMode === 'anomalies' || analysisMode === 'both') {
        detectAnomalies();
      }
      
      addNotification({
        type: 'success',
        title: 'Analysis Complete',
        message: `Found ${patterns.length} patterns and ${anomalies.length} anomalies`
      });
    } catch (error) {
      console.error('Analysis error:', error);
      addNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: 'An error occurred during pattern analysis'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [analysisMode, detectCommunicationPatterns, detectAnomalies, patterns.length, anomalies.length, addNotification]);
  
  // Auto-refresh analysis
  useEffect(() => {
    if (localAutoRefresh && analysisMessages.length > 0) {
      runAnalysis();
      
      const interval = setInterval(runAnalysis, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [localAutoRefresh, analysisMessages.length, runAnalysis]);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };
  
  const getPatternTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'optimization': return 'primary';
      case 'failure': return 'error';
      case 'anomaly': return 'warning';
      default: return 'default';
    }
  };
  
  const exportAnalysis = useCallback(() => {
    const analysisData = {
      timestamp: new Date().toISOString(),
      timeRange,
      conversationId,
      agentId,
      summary: {
        totalPatterns: patterns.length,
        totalAnomalies: anomalies.length,
        messagesAnalyzed: analysisMessages.length,
        avgConfidence: patterns.length > 0 ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0
      },
      patterns: patterns.map(p => ({
        type: p.type,
        pattern: p.pattern,
        frequency: p.frequency,
        successRate: p.successRate,
        avgResponseTime: p.avgResponseTime,
        communicationType: p.communicationType,
        confidence: p.confidence,
        trend: p.trend
      })),
      anomalies: anomalies.map(a => ({
        type: a.type,
        severity: a.severity,
        description: a.description,
        affectedCommunications: a.affectedCommunications,
        detectedAt: a.detectedAt,
        duration: a.duration,
        relatedAgents: a.relatedAgents
      }))
    };
    
    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pattern-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addNotification({
      type: 'success',
      title: 'Analysis Exported',
      message: 'Pattern analysis downloaded as JSON'
    });
  }, [patterns, anomalies, analysisMessages.length, timeRange, conversationId, agentId, addNotification]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AnalyticsIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Pattern Analyzer
            </Typography>
            <Chip 
              label={`${analysisMessages.length} messages`}
              variant="outlined"
              size="small"
            />
          </Stack>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Analysis Mode</InputLabel>
              <Select
                value={analysisMode}
                label="Analysis Mode"
                onChange={(e) => setAnalysisMode(e.target.value as any)}
              >
                <MenuItem value="patterns">Patterns Only</MenuItem>
                <MenuItem value="anomalies">Anomalies Only</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Min Confidence</InputLabel>
              <Select
                value={minConfidence}
                label="Min Confidence"
                onChange={(e) => setMinConfidence(Number(e.target.value))}
              >
                <MenuItem value={0.5}>50%</MenuItem>
                <MenuItem value={0.6}>60%</MenuItem>
                <MenuItem value={0.7}>70%</MenuItem>
                <MenuItem value={0.8}>80%</MenuItem>
                <MenuItem value={0.9}>90%</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={localAutoRefresh}
                  onChange={(e) => setLocalAutoRefresh(e.target.checked)}
                />
              }
              label="Auto Refresh"
            />
            
            <Tooltip title="Run Analysis">
              <IconButton onClick={runAnalysis} disabled={isAnalyzing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export Analysis">
              <IconButton onClick={exportAnalysis} disabled={patterns.length === 0 && anomalies.length === 0}>
                <ExportIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        
        {isAnalyzing && (
          <LinearProgress sx={{ mb: 1 }} />
        )}
      </Paper>

      {/* Content */}
      <Stack direction="row" spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Patterns */}
        {(analysisMode === 'patterns' || analysisMode === 'both') && (
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={1}>
              <Typography variant="h6" gutterBottom>
                Communication Patterns ({patterns.length})
              </Typography>
              
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {patterns.length === 0 ? (
                  <Alert severity="info">
                    No patterns detected. Try running analysis or adjusting confidence threshold.
                  </Alert>
                ) : (
                  <List>
                    {patterns.map((pattern, index) => (
                      <React.Fragment key={pattern.id}>
                        <ListItem 
                          sx={{ cursor: 'pointer' }}
                          onClick={() => setSelectedPattern(pattern)}
                        >
                          <ListItemIcon>
                            <PatternIcon color={getPatternTypeColor(pattern.type) as any} />
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body1">
                                  {pattern.pattern.replace(/_/g, ' ')}
                                </Typography>
                                <Chip 
                                  label={pattern.type}
                                  size="small"
                                  color={getPatternTypeColor(pattern.type) as any}
                                  variant="outlined"
                                />
                              </Stack>
                            }
                            secondary={
                              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                <Typography variant="caption">
                                  Frequency: {pattern.frequency}
                                </Typography>
                                <Typography variant="caption">
                                  Success: {pattern.successRate.toFixed(1)}%
                                </Typography>
                                <Typography variant="caption">
                                  Confidence: {(pattern.confidence * 100).toFixed(0)}%
                                </Typography>
                              </Stack>
                            }
                          />
                          
                          {pattern.trend === 'increasing' && <TrendingUpIcon color="success" />}
                          {pattern.trend === 'decreasing' && <TrendingDownIcon color="error" />}
                          {pattern.trend === 'stable' && <TimelineIcon color="action" />}
                        </ListItem>
                        
                        {index < patterns.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Box>
        )}
        
        {/* Anomalies */}
        {(analysisMode === 'anomalies' || analysisMode === 'both') && (
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={1}>
              <Typography variant="h6" gutterBottom>
                Performance Anomalies ({anomalies.length})
              </Typography>
              
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {anomalies.length === 0 ? (
                  <Alert severity="success">
                    No anomalies detected. System performance appears normal.
                  </Alert>
                ) : (
                  <List>
                    {anomalies.map((anomaly, index) => (
                      <React.Fragment key={anomaly.id}>
                        <ListItem 
                          sx={{ cursor: 'pointer' }}
                          onClick={() => setSelectedAnomaly(anomaly)}
                        >
                          <ListItemIcon>
                            {anomaly.severity === 'critical' && <ErrorIcon color="error" />}
                            {anomaly.severity === 'high' && <WarningIcon color="error" />}
                            {anomaly.severity === 'medium' && <WarningIcon color="warning" />}
                            {anomaly.severity === 'low' && <WarningIcon color="info" />}
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body1">
                                  {anomaly.type.replace(/_/g, ' ')}
                                </Typography>
                                <Chip 
                                  label={anomaly.severity}
                                  size="small"
                                  color={getSeverityColor(anomaly.severity) as any}
                                  variant="outlined"
                                />
                              </Stack>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  {anomaly.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(anomaly.detectedAt).toLocaleString()} • 
                                  {anomaly.affectedCommunications} communications affected
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        
                        {index < anomalies.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Box>
        )}
      </Stack>
      
      {/* Pattern Details Dialog */}
      <Dialog 
        open={Boolean(selectedPattern)} 
        onClose={() => setSelectedPattern(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedPattern && (
          <>
            <DialogTitle>
              Pattern Details: {selectedPattern.pattern.replace(/_/g, ' ')}
            </DialogTitle>
            <DialogContent>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Statistics</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Frequency:</strong> {selectedPattern.frequency} occurrences
                    </Typography>
                    <Typography variant="body2">
                      <strong>Success Rate:</strong> {selectedPattern.successRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      <strong>Avg Response Time:</strong> {selectedPattern.avgResponseTime.toFixed(0)}ms
                    </Typography>
                    <Typography variant="body2">
                      <strong>Confidence:</strong> {(selectedPattern.confidence * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2">
                      <strong>Communication Type:</strong> {selectedPattern.communicationType}
                    </Typography>
                  </Stack>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Examples</Typography>
                  <List dense>
                    {selectedPattern.examples.map((example, idx) => (
                      <ListItem key={idx}>
                        <ListItemText 
                          primary={example}
                          primaryTypographyProps={{ variant: 'body2', sx: { fontFamily: 'monospace' } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPattern(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Anomaly Details Dialog */}
      <Dialog 
        open={Boolean(selectedAnomaly)} 
        onClose={() => setSelectedAnomaly(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedAnomaly && (
          <>
            <DialogTitle>
              Anomaly Details: {selectedAnomaly.type.replace(/_/g, ' ')}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Alert severity={getSeverityColor(selectedAnomaly.severity) as any}>
                  {selectedAnomaly.description}
                </Alert>
                
                <Typography variant="body2">
                  <strong>Detected:</strong> {new Date(selectedAnomaly.detectedAt).toLocaleString()}
                </Typography>
                
                <Typography variant="body2">
                  <strong>Duration:</strong> {(selectedAnomaly.duration / 1000).toFixed(0)} seconds
                </Typography>
                
                <Typography variant="body2">
                  <strong>Affected Communications:</strong> {selectedAnomaly.affectedCommunications}
                </Typography>
                
                <Typography variant="body2">
                  <strong>Related Agents:</strong> {selectedAnomaly.relatedAgents.join(', ')}
                </Typography>
                
                <Typography variant="body2">
                  <strong>Suggested Action:</strong> {selectedAnomaly.suggestedAction}
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAnomaly(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};