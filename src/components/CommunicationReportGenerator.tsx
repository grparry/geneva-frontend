import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendIcon,
  BarChart as ChartIcon,
  Timeline as TimelineIcon,
  Speed as PerformanceIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useObservabilityStore } from '../store/observabilityStore';
import { useUIStore } from '../store/uiStore';

interface ReportConfiguration {
  title: string;
  description: string;
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  communicationTypes: string[];
  agentFilter?: string;
  includeMetrics: boolean;
  includeErrorAnalysis: boolean;
  includeTrendAnalysis: boolean;
  includePatternSummary: boolean;
  includePerformanceMetrics: boolean;
  includeConversationSamples: boolean;
  format: 'markdown' | 'json' | 'csv' | 'html';
  sections: string[];
}

interface ReportData {
  summary: {
    totalMessages: number;
    communicationTypes: Record<string, number>;
    timeRange: string;
    avgResponseTime: number;
    errorRate: number;
    topAgents: Array<{ agent: string; messageCount: number }>;
  };
  metrics: {
    messageVolume: Array<{ date: string; count: number; type: string }>;
    responseTimesTrend: Array<{ date: string; avgTime: number }>;
    errorRateTrend: Array<{ date: string; errorRate: number }>;
    communicationBreakdown: Record<string, number>;
  };
  patterns: {
    commonPatterns: Array<{ pattern: string; frequency: number; successRate: number }>;
    anomalies: Array<{ type: string; count: number; description: string }>;
  };
  samples: Array<{
    timestamp: string;
    type: string;
    from: string;
    to: string;
    summary: string;
  }>;
}

export const CommunicationReportGenerator: React.FC = () => {
  // Store hooks
  const { streamCache, conversations, agents } = useObservabilityStore();
  const { addNotification } = useUIStore();
  
  // Component state
  const [config, setConfig] = useState<ReportConfiguration>({
    title: 'Communication Report',
    description: 'Comprehensive analysis of agent communications',
    timeRange: { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() },
    communicationTypes: ['claude', 'inter_agent', 'memory_service', 'external_api'],
    includeMetrics: true,
    includeErrorAnalysis: true,
    includeTrendAnalysis: true,
    includePatternSummary: true,
    includePerformanceMetrics: true,
    includeConversationSamples: true,
    format: 'markdown',
    sections: ['summary', 'metrics', 'trends', 'patterns', 'samples']
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Get filtered messages for analysis
  const filteredMessages = useMemo(() => {
    const allMessages: any[] = [];
    
    Array.from(streamCache.entries()).forEach(([conversationId, messages]) => {
      messages.forEach(msg => {
        allMessages.push({ ...msg, conversation_id: conversationId });
      });
    });
    
    return allMessages.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      const withinTimeRange = (!config.timeRange.start || msgDate >= config.timeRange.start) &&
                             (!config.timeRange.end || msgDate <= config.timeRange.end);
      const typeMatch = config.communicationTypes.length === 0 || 
                       config.communicationTypes.includes(msg.communication_type);
      const agentMatch = !config.agentFilter || 
                        msg.source_agent_id === config.agentFilter || 
                        msg.target_agent_id === config.agentFilter;
      
      return withinTimeRange && typeMatch && agentMatch;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [streamCache, config]);
  
  // Generate report data
  const generateReportData = useCallback((): ReportData => {
    const messages = filteredMessages;
    
    // Calculate summary metrics
    const communicationTypeBreakdown: Record<string, number> = {};
    const agentMessageCounts: Record<string, number> = {};
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    let errorCount = 0;
    
    messages.forEach(msg => {
      // Communication type breakdown
      communicationTypeBreakdown[msg.communication_type] = 
        (communicationTypeBreakdown[msg.communication_type] || 0) + 1;
      
      // Agent message counts
      agentMessageCounts[msg.source_agent_id] = 
        (agentMessageCounts[msg.source_agent_id] || 0) + 1;
      
      // Response times
      if (msg.processing_duration_ms) {
        totalResponseTime += msg.processing_duration_ms;
        responseTimeCount++;
      }
      
      // Error counting
      if (msg.content.toLowerCase().includes('error') || 
          msg.content.toLowerCase().includes('failed')) {
        errorCount++;
      }
    });
    
    const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    const errorRate = messages.length > 0 ? (errorCount / messages.length) * 100 : 0;
    
    // Top agents by message count
    const topAgents = Object.entries(agentMessageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([agent, messageCount]) => ({ agent, messageCount }));
    
    // Generate time-series data
    const messageVolume = generateTimeSeriesData(messages, 'volume');
    const responseTimesTrend = generateTimeSeriesData(messages, 'responseTime');
    const errorRateTrend = generateTimeSeriesData(messages, 'errorRate');
    
    // Pattern analysis
    const patterns = analyzePatterns(messages);
    
    // Sample conversations
    const samples = messages.slice(0, 20).map(msg => ({
      timestamp: msg.timestamp,
      type: msg.communication_type,
      from: msg.source_agent_id,
      to: msg.target_agent_id || 'system',
      summary: msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : '')
    }));
    
    return {
      summary: {
        totalMessages: messages.length,
        communicationTypes: communicationTypeBreakdown,
        timeRange: `${config.timeRange.start?.toLocaleDateString()} - ${config.timeRange.end?.toLocaleDateString()}`,
        avgResponseTime,
        errorRate,
        topAgents
      },
      metrics: {
        messageVolume,
        responseTimesTrend,
        errorRateTrend,
        communicationBreakdown: communicationTypeBreakdown
      },
      patterns: {
        commonPatterns: patterns.patterns,
        anomalies: patterns.anomalies
      },
      samples
    };
  }, [filteredMessages, config]);
  
  // Helper functions
  const generateTimeSeriesData = (messages: any[], metric: 'volume' | 'responseTime' | 'errorRate'): any[] => {
    const groupedData: Record<string, any[]> = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toDateString();
      if (!groupedData[date]) groupedData[date] = [];
      groupedData[date].push(msg);
    });
    
    return Object.entries(groupedData).map(([date, msgs]) => {
      switch (metric) {
        case 'volume':
          return { date, count: msgs.length, type: 'total' };
        case 'responseTime':
          const responseTimes = msgs.filter(m => m.processing_duration_ms).map(m => m.processing_duration_ms);
          const avgTime = responseTimes.length > 0 
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
            : 0;
          return { date, avgTime, count: msgs.length, type: 'responseTime' };
        case 'errorRate':
          const errors = msgs.filter(m => 
            m.content.toLowerCase().includes('error') || 
            m.content.toLowerCase().includes('failed')
          );
          const errorRate = msgs.length > 0 ? (errors.length / msgs.length) * 100 : 0;
          return { date, errorRate, count: msgs.length, type: 'errorRate' };
        default:
          return { date, count: msgs.length, type: 'default' };
      }
    });
  };
  
  const analyzePatterns = (messages: any[]) => {
    const patternCounts: Record<string, { count: number; successes: number }> = {};
    const anomalies: Array<{ type: string; count: number; description: string }> = [];
    
    messages.forEach(msg => {
      // Simple pattern detection
      const content = msg.content.toLowerCase();
      
      if (content.includes('error')) {
        patternCounts['error_message'] = patternCounts['error_message'] || { count: 0, successes: 0 };
        patternCounts['error_message'].count++;
      }
      
      if (content.includes('success') || content.includes('completed')) {
        patternCounts['success_message'] = patternCounts['success_message'] || { count: 0, successes: 0 };
        patternCounts['success_message'].count++;
        patternCounts['success_message'].successes++;
      }
      
      if (content.includes('```')) {
        patternCounts['code_block'] = patternCounts['code_block'] || { count: 0, successes: 0 };
        patternCounts['code_block'].count++;
        if (!content.includes('error')) patternCounts['code_block'].successes++;
      }
    });
    
    const patterns = Object.entries(patternCounts).map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      successRate: data.count > 0 ? (data.successes / data.count) * 100 : 0
    }));
    
    // Simple anomaly detection
    const hourlyVolume = groupMessagesByHour(messages);
    const avgHourlyVolume = Object.values(hourlyVolume).reduce((a, b) => a + b, 0) / Object.keys(hourlyVolume).length;
    
    Object.entries(hourlyVolume).forEach(([hour, volume]) => {
      if (volume > avgHourlyVolume * 2) {
        anomalies.push({
          type: 'volume_spike',
          count: volume,
          description: `Volume spike at ${hour}: ${volume} messages (${(volume / avgHourlyVolume).toFixed(1)}x normal)`
        });
      }
    });
    
    return { patterns, anomalies };
  };
  
  const groupMessagesByHour = (messages: any[]) => {
    const grouped: Record<string, number> = {};
    
    messages.forEach(msg => {
      const hour = new Date(msg.timestamp).toISOString().slice(0, 13);
      grouped[hour] = (grouped[hour] || 0) + 1;
    });
    
    return grouped;
  };
  
  // Generate report content
  const generateMarkdownReport = (data: ReportData): string => {
    let markdown = `# ${config.title}\n\n`;
    markdown += `${config.description}\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
    markdown += `**Time Range:** ${data.summary.timeRange}\n\n`;
    
    if (config.sections.includes('summary')) {
      markdown += `## Executive Summary\n\n`;
      markdown += `- **Total Messages:** ${data.summary.totalMessages.toLocaleString()}\n`;
      markdown += `- **Average Response Time:** ${data.summary.avgResponseTime.toFixed(0)}ms\n`;
      markdown += `- **Error Rate:** ${data.summary.errorRate.toFixed(2)}%\n`;
      markdown += `- **Communication Types:** ${Object.keys(data.summary.communicationTypes).join(', ')}\n\n`;
      
      markdown += `### Top Communicating Agents\n\n`;
      data.summary.topAgents.forEach((agent, idx) => {
        markdown += `${idx + 1}. **${agent.agent}**: ${agent.messageCount} messages\n`;
      });
      markdown += `\n`;
    }
    
    if (config.sections.includes('metrics') && config.includeMetrics) {
      markdown += `## Communication Metrics\n\n`;
      markdown += `### Message Volume by Type\n\n`;
      Object.entries(data.metrics.communicationBreakdown).forEach(([type, count]) => {
        markdown += `- **${type}**: ${count} messages\n`;
      });
      markdown += `\n`;
    }
    
    if (config.sections.includes('patterns') && config.includePatternSummary) {
      markdown += `## Pattern Analysis\n\n`;
      markdown += `### Common Patterns\n\n`;
      data.patterns.commonPatterns.forEach(pattern => {
        markdown += `- **${pattern.pattern}**: ${pattern.frequency} occurrences (${pattern.successRate.toFixed(1)}% success rate)\n`;
      });
      markdown += `\n`;
      
      if (data.patterns.anomalies.length > 0) {
        markdown += `### Anomalies Detected\n\n`;
        data.patterns.anomalies.forEach(anomaly => {
          markdown += `- **${anomaly.type}**: ${anomaly.description}\n`;
        });
        markdown += `\n`;
      }
    }
    
    if (config.sections.includes('samples') && config.includeConversationSamples) {
      markdown += `## Sample Communications\n\n`;
      data.samples.slice(0, 10).forEach((sample, idx) => {
        markdown += `### ${idx + 1}. ${sample.type} - ${new Date(sample.timestamp).toLocaleString()}\n`;
        markdown += `**From:** ${sample.from} → **To:** ${sample.to}\n`;
        markdown += `**Summary:** ${sample.summary}\n\n`;
      });
    }
    
    return markdown;
  };
  
  const generateJSONReport = (data: ReportData): string => {
    return JSON.stringify({
      metadata: {
        title: config.title,
        description: config.description,
        generatedAt: new Date().toISOString(),
        timeRange: data.summary.timeRange,
        configuration: config
      },
      data
    }, null, 2);
  };
  
  const generateCSVReport = (data: ReportData): string => {
    let csv = 'Timestamp,Type,From,To,Summary,Duration,HasError\n';
    
    data.samples.forEach(sample => {
      const hasError = sample.summary.toLowerCase().includes('error');
      csv += `"${sample.timestamp}","${sample.type}","${sample.from}","${sample.to}","${sample.summary.replace(/"/g, '""')}","","${hasError}"\n`;
    });
    
    return csv;
  };
  
  // Generate and download report
  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const data = generateReportData();
      setReportData(data);
      
      let reportContent = '';
      let mimeType = 'text/plain';
      let fileExtension = 'txt';
      
      switch (config.format) {
        case 'markdown':
          reportContent = generateMarkdownReport(data);
          mimeType = 'text/markdown';
          fileExtension = 'md';
          break;
        case 'json':
          reportContent = generateJSONReport(data);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        case 'csv':
          reportContent = generateCSVReport(data);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'html':
          // Convert markdown to HTML (simplified)
          reportContent = generateMarkdownReport(data)
            .replace(/^# (.*)/gm, '<h1>$1</h1>')
            .replace(/^## (.*)/gm, '<h2>$1</h2>')
            .replace(/^### (.*)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
          reportContent = `<html><body>${reportContent}</body></html>`;
          mimeType = 'text/html';
          fileExtension = 'html';
          break;
      }
      
      setGeneratedReport(reportContent);
      
      // Download the report
      const blob = new Blob([reportContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `communication-report-${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
      a.click();
      URL.revokeObjectURL(url);
      
      addNotification({
        type: 'success',
        title: 'Report Generated',
        message: `Communication report downloaded as ${config.format.toUpperCase()}`
      });
      
    } catch (error) {
      console.error('Report generation error:', error);
      addNotification({
        type: 'error',
        title: 'Report Generation Failed',
        message: 'An error occurred while generating the report'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [config, generateReportData, addNotification]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <ReportIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Communication Report Generator
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => setShowPreview(true)}
                disabled={!reportData}
              >
                Preview
              </Button>
              
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={generateReport}
                disabled={isGenerating || filteredMessages.length === 0}
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </Stack>
          </Stack>
          
          {isGenerating && <LinearProgress />}
          
          <Alert severity="info" sx={{ mt: 1 }}>
            Will analyze {filteredMessages.length.toLocaleString()} messages from the selected time range and filters.
          </Alert>
        </Paper>

        {/* Configuration */}
        <Stack direction="row" spacing={2}>
          {/* Basic Configuration */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2, height: 'fit-content' }} elevation={1}>
              <Typography variant="h6" gutterBottom>
                Report Configuration
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Report Title"
                  value={config.title}
                  onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                />
                
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="datetime-local"
                    value={config.timeRange.start?.toISOString().slice(0, 16) || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      timeRange: { ...prev.timeRange, start: e.target.value ? new Date(e.target.value) : null }
                    }))}
                    size="small"
                  />
                  
                  <TextField
                    fullWidth
                    label="End Date"
                    type="datetime-local"
                    value={config.timeRange.end?.toISOString().slice(0, 16) || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      timeRange: { ...prev.timeRange, end: e.target.value ? new Date(e.target.value) : null }
                    }))}
                    size="small"
                  />
                </Stack>
                
                <FormControl fullWidth>
                  <InputLabel>Output Format</InputLabel>
                  <Select
                    value={config.format}
                    label="Output Format"
                    onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as any }))}
                  >
                    <MenuItem value="markdown">Markdown (.md)</MenuItem>
                    <MenuItem value="json">JSON (.json)</MenuItem>
                    <MenuItem value="csv">CSV (.csv)</MenuItem>
                    <MenuItem value="html">HTML (.html)</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Paper>
          </Box>
          
          {/* Content Sections */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2, height: 'fit-content' }} elevation={1}>
              <Typography variant="h6" gutterBottom>
                Report Sections
              </Typography>
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.includeMetrics}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeMetrics: e.target.checked }))}
                    />
                  }
                  label="Communication Metrics"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.includeErrorAnalysis}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeErrorAnalysis: e.target.checked }))}
                    />
                  }
                  label="Error Analysis"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.includeTrendAnalysis}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeTrendAnalysis: e.target.checked }))}
                    />
                  }
                  label="Trend Analysis"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.includePatternSummary}
                      onChange={(e) => setConfig(prev => ({ ...prev, includePatternSummary: e.target.checked }))}
                    />
                  }
                  label="Pattern Summary"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.includePerformanceMetrics}
                      onChange={(e) => setConfig(prev => ({ ...prev, includePerformanceMetrics: e.target.checked }))}
                    />
                  }
                  label="Performance Metrics"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.includeConversationSamples}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeConversationSamples: e.target.checked }))}
                    />
                  }
                  label="Conversation Samples"
                />
              </FormGroup>
            </Paper>
          </Box>
        </Stack>
        
        {/* Preview Dialog */}
        <Dialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Report Preview</DialogTitle>
          <DialogContent>
            {reportData && (
              <Box sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                {config.format === 'json' 
                  ? generateJSONReport(reportData)
                  : generateMarkdownReport(reportData)
                }
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
};