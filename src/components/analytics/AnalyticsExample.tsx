/**
 * Example component demonstrating analytics integration
 * Shows how to use the analytics hooks and components
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUpRounded,
  TrendingDownRounded,
  RefreshRounded,
  AttachMoneyRounded,
  SpeedRounded,
  GroupsRounded,
  CheckCircleRounded,
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
  ResponsiveContainer,
  Legend,
} from 'recharts';

import {
  useKPIMetrics,
  useCostAnalysis,
  useWorkflowAnalytics,
  useAgentPerformance,
  useAlerts,
  useCostTrendChart,
  useWorkflowSuccessRateChart,
} from '../../hooks/useAnalytics';
import AnalyticsErrorBoundary from './AnalyticsErrorBoundary';
import {
  KPICardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from './AnalyticsLoadingSkeleton';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, trend, icon, color = 'primary.main' }) => {
  const isPositiveTrend = trend && trend > 0;
  const trendColor = isPositiveTrend ? 'success.main' : 'error.main';

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {isPositiveTrend ? (
                  <TrendingUpRounded sx={{ fontSize: 20, color: trendColor }} />
                ) : (
                  <TrendingDownRounded sx={{ fontSize: 20, color: trendColor }} />
                )}
                <Typography variant="body2" sx={{ color: trendColor, ml: 0.5 }}>
                  {Math.abs(trend).toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main Analytics Example Component
const AnalyticsExample: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState(0);

  // Use analytics hooks
  const kpiMetrics = useKPIMetrics(timeRange, { pollingInterval: 30000 });
  const costAnalysis = useCostAnalysis(timeRange);
  const workflowAnalytics = useWorkflowAnalytics(timeRange);
  const agentPerformance = useAgentPerformance(timeRange);
  const alerts = useAlerts('active');
  const costTrendChart = useCostTrendChart(timeRange);
  const workflowSuccessChart = useWorkflowSuccessRateChart(timeRange);

  const handleRefresh = () => {
    kpiMetrics.refetch();
    costAnalysis.refetch();
    workflowAnalytics.refetch();
    agentPerformance.refetch();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={kpiMetrics.isFetching}>
              <RefreshRounded />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts Section */}
      {alerts.unacknowledgedCount > 0 && (
        <Box sx={{ mb: 3 }}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="body2">
                You have {alerts.unacknowledgedCount} unacknowledged alert{alerts.unacknowledgedCount > 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* KPI Cards */}
      <AnalyticsErrorBoundary componentName="KPI Metrics">
        {kpiMetrics.isLoading ? (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[1, 2, 3, 4].map((item) => (
              <Grid xs={12} sm={6} md={3} key={item}>
                <KPICardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : kpiMetrics.data ? (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12} sm={6} md={3}>
              <KPICard
                title="Total Workflows"
                value={kpiMetrics.data.workflows.total}
                trend={kpiMetrics.data.workflows.trend}
                icon={<SpeedRounded sx={{ fontSize: 40 }} />}
                color="primary.main"
              />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <KPICard
                title="Success Rate"
                value={kpiMetrics.data.workflows.successRateFormatted}
                trend={kpiMetrics.data.workflows.trend}
                icon={<CheckCircleRounded sx={{ fontSize: 40 }} />}
                color="success.main"
              />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <KPICard
                title="Total Cost"
                value={kpiMetrics.data.costs.totalFormatted}
                trend={kpiMetrics.data.costs.trend}
                icon={<AttachMoneyRounded sx={{ fontSize: 40 }} />}
                color="warning.main"
              />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <KPICard
                title="Active Agents"
                value={kpiMetrics.data.agents.active_count}
                icon={<GroupsRounded sx={{ fontSize: 40 }} />}
                color="info.main"
              />
            </Grid>
          </Grid>
        ) : null}
      </AnalyticsErrorBoundary>

      {/* Tabs for different analytics views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Cost Analysis" />
          <Tab label="Workflow Performance" />
          <Tab label="Agent Performance" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {/* Cost Analysis Tab */}
        {activeTab === 0 && (
          <AnalyticsErrorBoundary componentName="Cost Analysis">
            {costTrendChart.isLoading ? (
              <ChartSkeleton height={400} />
            ) : costTrendChart.chartData ? (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cost Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={costTrendChart.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="llmCost"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="LLM Costs"
                      />
                      <Area
                        type="monotone"
                        dataKey="resourceCost"
                        stackId="1"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="Resource Costs"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : null}

            {/* Cost Breakdown Pie Chart */}
            {costAnalysis.data?.distribution && (
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Cost Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={costAnalysis.data.distribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {costAnalysis.data.distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Cost Drivers
                      </Typography>
                      <TableSkeleton rows={5} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </AnalyticsErrorBoundary>
        )}

        {/* Workflow Performance Tab */}
        {activeTab === 1 && (
          <AnalyticsErrorBoundary componentName="Workflow Performance">
            {workflowSuccessChart.isLoading ? (
              <ChartSkeleton height={400} />
            ) : workflowSuccessChart.chartData ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Workflow Success Rate Over Time
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={workflowSuccessChart.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="successRate"
                        stroke="#8884d8"
                        name="Success Rate (%)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="executions"
                        stroke="#82ca9d"
                        name="Executions"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : null}
          </AnalyticsErrorBoundary>
        )}

        {/* Agent Performance Tab */}
        {activeTab === 2 && (
          <AnalyticsErrorBoundary componentName="Agent Performance">
            {agentPerformance.isLoading ? (
              <TableSkeleton rows={6} />
            ) : agentPerformance.data ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Agent Utilization
                  </Typography>
                  <Grid container spacing={2}>
                    {agentPerformance.data.agents.slice(0, 6).map((agent) => (
                      <Grid xs={12} sm={6} md={4} key={agent.agent_id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {agent.agent_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {agent.agent_type}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                Success Rate: {agent.successRateFormatted}
                              </Typography>
                              <Typography variant="body2">
                                Avg Response: {agent.avgResponseTimeFormatted}
                              </Typography>
                              <Typography variant="body2">
                                Total Cost: {agent.totalCostFormatted}
                              </Typography>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              {agent.specialization.map((spec) => (
                                <Chip
                                  key={spec}
                                  label={spec}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            ) : null}
          </AnalyticsErrorBoundary>
        )}
      </Box>
    </Container>
  );
};

export default AnalyticsExample;