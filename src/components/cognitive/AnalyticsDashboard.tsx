/**
 * Analytics Dashboard Component
 * Comprehensive analytics and insights for cognitive memory system
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  Speed,
  Security,
  Psychology,
  Assessment,
  Refresh,
  Download,
  Timeline,
  DataUsage,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, subHours } from 'date-fns';
import {
  useGetAnalyticsQuery,
  useGetProcessingStatusQuery,
  useGetTierStatsQuery,
  useGetConceptsQuery,
} from '../../services/cognitive/api';
import type {
  CognitiveStatsProps,
  CognitiveTier,
} from '../../types/cognitive';
import {
  TIER_DEFINITIONS,
  SECURITY_RISK_DEFINITIONS,
  getTierColor,
} from '../../types/cognitive';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'good' | 'warning' | 'critical';
}

export const AnalyticsDashboard: React.FC<CognitiveStatsProps> = ({
  projectId,
  refreshInterval = 30000,
  showDetailedBreakdown = true,
  compact = false,
}) => {
  const theme = useTheme();
  
  // Local state
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'performance' | 'trends' | 'detailed'>('overview');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  // API queries
  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    refetch: refetchAnalytics 
  } = useGetAnalyticsQuery({ 
    time_range: timeRange, 
    include_trends: true 
  });

  const { 
    data: processingStatus, 
    isLoading: processingLoading,
    refetch: refetchProcessing 
  } = useGetProcessingStatusQuery();

  const { 
    data: tierStats, 
    isLoading: tierStatsLoading,
    refetch: refetchTierStats 
  } = useGetTierStatsQuery();

  const { 
    data: conceptsData, 
    isLoading: conceptsLoading 
  } = useGetConceptsQuery({ limit: 50 });

  // Combine loading states
  const isLoading = analyticsLoading || processingLoading || tierStatsLoading || conceptsLoading;

  // Generate mock data for demonstrations
  useEffect(() => {
    const metrics: PerformanceMetric[] = [
      {
        name: 'Processing Throughput',
        value: analytics?.processing_stats.total_processed || 1250,
        unit: 'memories/hour',
        trend: 'up',
        change: 15.3,
        status: 'good',
      },
      {
        name: 'Average Processing Time',
        value: analytics?.processing_stats.avg_processing_time || 85,
        unit: 'ms',
        trend: 'down',
        change: -12.1,
        status: 'good',
      },
      {
        name: 'Error Rate',
        value: analytics?.processing_stats.error_rate || 2.3,
        unit: '%',
        trend: 'up',
        change: 0.8,
        status: 'warning',
      },
      {
        name: 'System Load',
        value: 68,
        unit: '%',
        trend: 'stable',
        change: 0.2,
        status: 'good',
      },
    ];
    setPerformanceMetrics(metrics);
  }, [analytics]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetchAnalytics();
      refetchProcessing();
      refetchTierStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchAnalytics, refetchProcessing, refetchTierStats]);

  const handleRefresh = () => {
    refetchAnalytics();
    refetchProcessing();
    refetchTierStats();
  };

  // Prepare chart data
  const tierDistributionData = tierStats ? Object.entries(tierStats.tier_distribution).map(([tier, data]) => ({
    name: `Tier ${tier}`,
    value: data.count,
    color: getTierColor(Number(tier) as CognitiveTier),
    percentage: data.percentage,
  })) : [];

  const conceptTrendData = conceptsData?.concepts.slice(0, 10).map(concept => ({
    name: concept.concept.length > 15 ? `${concept.concept.substring(0, 15)}...` : concept.concept,
    count: concept.count,
    percentage: concept.percentage,
  })) || [];

  const securityDistributionData = [
    { name: 'Low Risk', value: 65, color: SECURITY_RISK_DEFINITIONS.low.color },
    { name: 'Medium Risk', value: 25, color: SECURITY_RISK_DEFINITIONS.medium.color },
    { name: 'High Risk', value: 8, color: SECURITY_RISK_DEFINITIONS.high.color },
    { name: 'Critical Risk', value: 2, color: SECURITY_RISK_DEFINITIONS.critical.color },
  ];

  // Mock time series data
  const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    processed: Math.floor(Math.random() * 100) + 50,
    failed: Math.floor(Math.random() * 5),
    pending: Math.floor(Math.random() * 20) + 5,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h5">
            Analytics Dashboard
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto Refresh"
            />
            
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Button startIcon={<Download />} variant="outlined">
              Export
            </Button>
          </Stack>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Comprehensive insights into your cognitive memory system performance and trends
        </Typography>
      </Box>

      {/* View Mode Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={1}>
          {[
            { key: 'overview', label: 'Overview', icon: <Analytics /> },
            { key: 'performance', label: 'Performance', icon: <Speed /> },
            { key: 'trends', label: 'Trends', icon: <Timeline /> },
            { key: 'detailed', label: 'Detailed', icon: <Assessment /> },
          ].map((mode) => (
            <Button
              key={mode.key}
              variant={viewMode === mode.key ? 'contained' : 'outlined'}
              startIcon={mode.icon}
              onClick={() => setViewMode(mode.key as any)}
            >
              {mode.label}
            </Button>
          ))}
        </Stack>
      </Paper>

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <Stack spacing={3}>
          {/* Key Metrics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {performanceMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {metric.value.toLocaleString()}
                    </Typography>
                    <Box sx={{ 
                      color: metric.trend === 'up' 
                        ? theme.palette.success.main 
                        : metric.trend === 'down' 
                        ? theme.palette.error.main 
                        : theme.palette.text.secondary 
                    }}>
                      {metric.trend === 'up' ? <TrendingUp /> : 
                       metric.trend === 'down' ? <TrendingDown /> : <Timeline />}
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {metric.name}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    {metric.change > 0 ? '+' : ''}{metric.change}% vs last period
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Charts */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Memory Tier Distribution
              </Typography>
              
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tierDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                    >
                      {tierDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>

            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Security Risk Distribution
              </Typography>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={securityDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value">
                    {securityDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          {/* Processing Status */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main" gutterBottom>
                  {processingStatus?.total_completed || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="info.main" gutterBottom>
                  {processingStatus?.total_processing || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Processing
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main" gutterBottom>
                  {processingStatus?.total_pending || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="error.main" gutterBottom>
                  {processingStatus?.total_failed || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Stack>
      )}

      {/* Performance Mode */}
      {viewMode === 'performance' && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Processing Performance Trends
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="processed" 
                  stroke={theme.palette.success.main} 
                  name="Processed"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke={theme.palette.error.main} 
                  name="Failed"
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke={theme.palette.warning.main} 
                  name="Pending"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>
      )}

      {/* Trends Mode */}
      {viewMode === 'trends' && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Top Concepts by Usage
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conceptTrendData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip />
                <Bar dataKey="count" fill={theme.palette.secondary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>
      )}

      {/* Detailed Mode */}
      {viewMode === 'detailed' && showDetailedBreakdown && (
        <Stack spacing={3}>
          <Alert severity="info">
            Detailed analytics provide in-depth insights into system performance, 
            memory processing patterns, and cognitive agents behavior.
          </Alert>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Agent Performance Breakdown
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              <Card>
                <CardHeader title="Bradley (Security)" avatar={<Security />} />
                <CardContent>
                  <Typography variant="h4">98.5%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analysis Accuracy
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={98.5} 
                    sx={{ mt: 1 }}
                    color="success"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader title="Thedra (Memory)" avatar={<Psychology />} />
                <CardContent>
                  <Typography variant="h4">94.2%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tier Classification
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={94.2} 
                    sx={{ mt: 1 }}
                    color="info"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader title="Greta (Ontology)" avatar={<DataUsage />} />
                <CardContent>
                  <Typography variant="h4">96.8%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Concept Extraction
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={96.8} 
                    sx={{ mt: 1 }}
                    color="warning"
                  />
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Stack>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;