/**
 * Cost Analysis Page
 * Detailed cost breakdown and optimization insights
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Stack,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  alpha,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  AttachMoneyRounded,
  TrendingUpRounded,
  TrendingDownRounded,
  CloudRounded,
  StorageRounded,
  ApiRounded,
  WarningAmberRounded,
  InfoRounded,
  DownloadRounded,
  ViewModuleRounded,
  TableChartRounded,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { useCostAnalysis, useTrendData } from '../../hooks/useAnalytics';
import { useCostAlerts } from '../../hooks/useAnalyticsWebSocket';
import AnalyticsErrorBoundary from '../../components/analytics/AnalyticsErrorBoundary';
import { CostAnalysisSkeleton } from '../../components/analytics/AnalyticsLoadingSkeleton';
import { CostAlertsPanel } from '../../components/analytics/CostAlertsPanel';
import { MetricType } from '../../types/analytics';

// Chart colors
const COLORS = {
  providers: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'],
  resources: ['#82ca9d', '#8884d8', '#ffc658', '#ff7c7c', '#8dd1e1'],
};

// Cost summary card
const CostSummaryCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, subtitle, change, icon, color = 'primary.main' }) => {
  const theme = useTheme();
  const isIncrease = change && change > 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color,
            }}
          >
            {icon}
          </Box>
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isIncrease ? (
                <TrendingUpRounded sx={{ fontSize: 20, color: 'error.main' }} />
              ) : (
                <TrendingDownRounded sx={{ fontSize: 20, color: 'success.main' }} />
              )}
              <Typography
                variant="body2"
                sx={{ 
                  ml: 0.5,
                  color: isIncrease ? 'error.main' : 'success.main',
                  fontWeight: 'medium',
                }}
              >
                {Math.abs(change).toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>
        
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Cost distribution pie chart
const CostDistributionChart: React.FC<{ data: any }> = ({ data }) => {
  if (!data?.distribution) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cost Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.distribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.distribution.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS.providers[index % COLORS.providers.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => data.distribution.find((d: any) => d.value === value)?.formatted} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Provider cost breakdown
const ProviderBreakdown: React.FC<{ providers: any[] }> = ({ providers }) => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode !== null) {
      setViewMode(newMode as 'table' | 'chart');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Provider Cost Breakdown
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="table">
              <TableChartRounded sx={{ fontSize: 20 }} />
            </ToggleButton>
            <ToggleButton value="chart">
              <ViewModuleRounded sx={{ fontSize: 20 }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {viewMode === 'table' ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Provider</TableCell>
                  <TableCell align="right">API Calls</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">% of Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.provider}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ApiRounded sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {provider.provider}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{provider.calls.toLocaleString()}</TableCell>
                    <TableCell align="right">{provider.tokensFormatted}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {provider.costFormatted}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${provider.percentage.toFixed(1)}%`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={providers}
              dataKey="cost"
              aspectRatio={4/3}
              stroke="#fff"
              fill="#8884d8"
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <Paper sx={{ p: 1 }}>
                        <Typography variant="body2">{data.provider}</Typography>
                        <Typography variant="caption">
                          Cost: {data.costFormatted} ({data.percentage.toFixed(1)}%)
                        </Typography>
                      </Paper>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

// Cost optimization recommendations
const CostOptimizationTips: React.FC = () => {
  const recommendations = [
    {
      icon: <CloudRounded />,
      title: 'Switch to efficient models',
      description: 'Consider using GPT-3.5 for simple tasks instead of GPT-4',
      savings: '~40% reduction',
    },
    {
      icon: <StorageRounded />,
      title: 'Implement response caching',
      description: 'Cache frequently requested data to reduce API calls',
      savings: '~25% reduction',
    },
    {
      icon: <ApiRounded />,
      title: 'Batch API requests',
      description: 'Group similar requests to reduce overhead',
      savings: '~15% reduction',
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cost Optimization Recommendations
        </Typography>
        <List>
          {recommendations.map((rec, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                    }}
                  >
                    {rec.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={rec.title}
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {rec.description}
                      </Typography>
                      <Chip
                        label={rec.savings}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </>
                  }
                />
              </ListItem>
              {index < recommendations.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Main Cost Analysis Component
export const CostAnalysis: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const { data: costData, isLoading, error } = useCostAnalysis(timeRange);
  const { alerts } = useCostAlerts(['high', 'critical']);
  const { data: costTrend } = useTrendData(MetricType.TOTAL_COST, timeRange);
  
  const handleExportReport = () => {
    // TODO: Implement cost report export
    console.log('Exporting cost analysis report...');
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <CostAnalysisSkeleton />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const hasBudgetAlerts = alerts.some(alert => alert.alert_type.includes('budget'));

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Cost Analysis
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor spending and optimize costs
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<DownloadRounded />}
                onClick={handleExportReport}
              >
                Export Report
              </Button>
            </Stack>
          </Box>

          {/* Budget Alert */}
          {hasBudgetAlerts && (
            <Alert 
              severity="warning" 
              icon={<WarningAmberRounded />}
              sx={{ mb: 3 }}
            >
              <AlertTitle>Budget Alert</AlertTitle>
              You have exceeded your daily budget threshold. Review your spending below.
            </Alert>
          )}
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <CostSummaryCard
              title="Total Cost"
              value={costData?.totalFormatted || '$0'}
              subtitle={`${timeRange} period`}
              change={costData?.cost_trends?.[0]?.change}
              icon={<AttachMoneyRounded />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <CostSummaryCard
              title="LLM Costs"
              value={costData?.llm_costs?.totalFormatted || '$0'}
              subtitle={`${costData?.distribution?.[0]?.percentage.toFixed(0)}% of total`}
              icon={<CloudRounded />}
              color="info.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <CostSummaryCard
              title="Resource Costs"
              value={costData?.resource_costs?.totalFormatted || '$0'}
              subtitle={`${costData?.distribution?.[1]?.percentage.toFixed(0)}% of total`}
              icon={<StorageRounded />}
              color="success.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <CostSummaryCard
              title="Avg per Workflow"
              value={costData?.topWorkflowsFormatted || '$0'}
              change={undefined}
              icon={<ApiRounded />}
              color="warning.main"
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Cost Trends */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cost Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={costData?.costTrendsFormatted || []}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dateFormatted" />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="body2">{data.dateFormatted}</Typography>
                              <Typography variant="body2">Total: {data.totalCostFormatted}</Typography>
                              <Typography variant="body2">LLM: {data.llmCostFormatted}</Typography>
                              <Typography variant="body2">Resources: {data.resourceCostFormatted}</Typography>
                            </Paper>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_cost"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      name="Total Cost"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Provider Breakdown */}
            <ProviderBreakdown providers={costData?.providerBreakdown || []} />
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              {/* Cost Distribution */}
              <CostDistributionChart data={costData} />
              
              {/* Optimization Tips */}
              <CostOptimizationTips />
              
              {/* Recent Alerts */}
              <CostAlertsPanel maxHeight={300} />
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CostAnalysis;