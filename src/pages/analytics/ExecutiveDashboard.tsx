/**
 * Executive Analytics Dashboard Page
 * High-level KPIs and strategic insights for executives
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUpRounded,
  TrendingDownRounded,
  AttachMoneyRounded,
  SpeedRounded,
  GroupsRounded,
  CheckCircleRounded,
  WarningAmberRounded,
  DownloadRounded,
  CalendarTodayRounded,
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
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { useKPIMetrics, useCostAnalysis, useWorkflowAnalytics } from '../../hooks/useAnalytics';
import { useLiveMetrics } from '../../hooks/useAnalyticsWebSocket';
import AnalyticsErrorBoundary from '../../components/analytics/AnalyticsErrorBoundary';
import { ExecutiveDashboardSkeleton } from '../../components/analytics/AnalyticsLoadingSkeleton';
import { ConnectionIndicator } from '../../components/analytics/WebSocketConnectionManager';
import { AlertSummaryWidget } from '../../components/analytics/CostAlertsPanel';

// Chart colors
const CHART_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
};

// KPI Metric Card Component
const KPIMetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  color?: string;
  isLive?: boolean;
}> = ({ title, value, subtitle, trend, icon, color = 'primary.main', isLive }) => {
  const theme = useTheme();
  const isPositiveTrend = trend && trend > 0;
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                {isPositiveTrend ? (
                  <TrendingUpRounded sx={{ fontSize: 20, color: 'success.main' }} />
                ) : (
                  <TrendingDownRounded sx={{ fontSize: 20, color: 'error.main' }} />
                )}
                <Typography
                  variant="body2"
                  sx={{ 
                    ml: 0.5,
                    color: isPositiveTrend ? 'success.main' : 'error.main',
                    fontWeight: 'medium',
                  }}
                >
                  {Math.abs(trend).toFixed(1)}% vs last period
                </Typography>
              </Box>
            )}
          </Box>
          <Box 
            sx={{ 
              color,
              opacity: 0.8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            }}
          >
            {icon}
          </Box>
        </Box>
        
        {isLive && (
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <ConnectionIndicator size="small" showLabel={false} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Executive Summary Section
const ExecutiveSummary: React.FC<{ timeRange: string }> = ({ timeRange }) => {
  const { data: kpiData, isLoading } = useKPIMetrics(timeRange);
  const { liveMetrics } = useLiveMetrics();
  
  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map(i => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
            <Card>
              <CardContent>
                <LinearProgress />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }
  
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KPIMetricCard
          title="Total Workflows"
          value={kpiData?.workflows.total || 0}
          subtitle={`${kpiData?.workflows.successful || 0} successful`}
          trend={kpiData?.workflows.trend}
          icon={<SpeedRounded sx={{ fontSize: 32 }} />}
          color="primary.main"
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KPIMetricCard
          title="Success Rate"
          value={kpiData?.workflows.successRateFormatted || '0%'}
          subtitle="Overall performance"
          trend={kpiData?.workflows.trend}
          icon={<CheckCircleRounded sx={{ fontSize: 32 }} />}
          color="success.main"
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KPIMetricCard
          title="Total Cost"
          value={kpiData?.costs.totalFormatted || '$0'}
          subtitle={`Avg ${kpiData?.costs.avgPerWorkflowFormatted || '$0'}/workflow`}
          trend={kpiData?.costs.trend}
          icon={<AttachMoneyRounded sx={{ fontSize: 32 }} />}
          color="warning.main"
          isLive={!!liveMetrics}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KPIMetricCard
          title="Active Agents"
          value={liveMetrics?.metrics.active_agents || kpiData?.agents.active_count || 0}
          subtitle={`${kpiData?.agents.utilizationFormatted || '0%'} utilization`}
          icon={<GroupsRounded sx={{ fontSize: 32 }} />}
          color="info.main"
          isLive={!!liveMetrics}
        />
      </Grid>
    </Grid>
  );
};

// Cost Trend Chart
const CostTrendChart: React.FC<{ timeRange: string }> = ({ timeRange }) => {
  const { data: costData, isLoading } = useCostAnalysis(timeRange);
  
  if (isLoading || !costData?.costTrendsFormatted) {
    return <LinearProgress />;
  }
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cost Trends
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={costData.costTrendsFormatted}>
            <defs>
              <linearGradient id="colorLLM" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorResource" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => `$${value.toFixed(2)}`}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="llm_cost"
              stackId="1"
              stroke={CHART_COLORS.primary}
              fillOpacity={1}
              fill="url(#colorLLM)"
              name="LLM Costs"
            />
            <Area
              type="monotone"
              dataKey="resource_cost"
              stackId="1"
              stroke={CHART_COLORS.secondary}
              fillOpacity={1}
              fill="url(#colorResource)"
              name="Resource Costs"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Workflow Performance Chart
const WorkflowPerformanceChart: React.FC<{ timeRange: string }> = ({ timeRange }) => {
  const { data: workflowData, isLoading } = useWorkflowAnalytics(timeRange);
  
  if (isLoading || !workflowData?.performanceTrendsFormatted) {
    return <LinearProgress />;
  }
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Workflow Performance
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={workflowData.performanceTrendsFormatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestampFormatted" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="success_rate"
              stroke={CHART_COLORS.success}
              name="Success Rate (%)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="executions"
              stroke={CHART_COLORS.info}
              name="Executions"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Main Executive Dashboard Component
export const ExecutiveDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  
  const handleExportReport = () => {
    // TODO: Implement report export functionality
    console.log('Exporting executive report...');
  };
  
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Executive Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Strategic insights and performance overview
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <ConnectionIndicator />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Period"
                  onChange={(e) => setTimeRange(e.target.value)}
                  startAdornment={<CalendarTodayRounded sx={{ fontSize: 20, mr: 1 }} />}
                >
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last Quarter</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                startIcon={<DownloadRounded />}
                onClick={handleExportReport}
              >
                Export Report
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Executive Summary */}
        <AnalyticsErrorBoundary componentName="Executive Summary">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Key Performance Indicators
            </Typography>
            <ExecutiveSummary timeRange={timeRange} />
          </Box>
        </AnalyticsErrorBoundary>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <AnalyticsErrorBoundary componentName="Cost Trends">
              <CostTrendChart timeRange={timeRange} />
            </AnalyticsErrorBoundary>
          </Grid>
          
          <Grid size={{ xs: 12, lg: 4 }}>
            <AnalyticsErrorBoundary componentName="Alerts Summary">
              <AlertSummaryWidget />
            </AnalyticsErrorBoundary>
          </Grid>
        </Grid>

        {/* Performance Metrics */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <AnalyticsErrorBoundary componentName="Workflow Performance">
              <WorkflowPerformanceChart timeRange={timeRange} />
            </AnalyticsErrorBoundary>
          </Grid>
        </Grid>

        {/* Quick Insights */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Insights
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingUpRounded color="success" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Performance Highlights
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      • Workflow success rate improved by 5% this period
                    </Typography>
                    <Typography variant="body2">
                      • Average response time decreased by 12%
                    </Typography>
                    <Typography variant="body2">
                      • Agent utilization at optimal levels (75-85%)
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WarningAmberRounded color="warning" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Areas of Attention
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      • Cost per workflow increased by 8% due to model upgrades
                    </Typography>
                    <Typography variant="body2">
                      • Error rate spike detected in authentication workflows
                    </Typography>
                    <Typography variant="body2">
                      • Consider scaling resources for peak usage periods
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ExecutiveDashboard;