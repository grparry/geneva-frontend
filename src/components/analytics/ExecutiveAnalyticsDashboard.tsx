import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Button,
  LinearProgress,
  Tooltip,
  Avatar,
  AvatarGroup,
  Divider,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Speed as PerformanceIcon,
  Group as AgentsIcon,
  Timeline as WorkflowIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CalendarMonth as CalendarIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
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
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

interface KPIMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  icon: React.ReactNode;
  color: string;
}

interface TrendData {
  date: string;
  workflows: number;
  successRate: number;
  avgDuration: number;
  cost: number;
  agents: number;
}

interface AgentPerformance {
  agent: string;
  tasks: number;
  successRate: number;
  avgDuration: number;
  utilization: number;
}

interface WorkflowDistribution {
  name: string;
  value: number;
  percentage: number;
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: number;
}

interface ExecutiveAnalyticsDashboardProps {
  onExportReport?: (format: 'pdf' | 'excel' | 'ppt') => void;
  onScheduleReport?: () => void;
}

const ExecutiveAnalyticsDashboard: React.FC<ExecutiveAnalyticsDashboardProps> = ({
  onExportReport,
  onScheduleReport
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [compareMode, setCompareMode] = useState(false);

  // Mock KPI data
  const kpiMetrics: KPIMetric[] = [
    {
      name: 'Total Workflows',
      value: 12847,
      unit: '',
      change: 23.5,
      trend: 'up',
      icon: <WorkflowIcon />,
      color: '#2196f3'
    },
    {
      name: 'Success Rate',
      value: 94.2,
      unit: '%',
      change: 2.8,
      trend: 'up',
      target: 95,
      icon: <SuccessIcon />,
      color: '#4caf50'
    },
    {
      name: 'Avg Response Time',
      value: 3.2,
      unit: 's',
      change: -15.3,
      trend: 'down',
      target: 3.0,
      icon: <PerformanceIcon />,
      color: '#ff9800'
    },
    {
      name: 'Total Cost',
      value: 8425,
      unit: '$',
      change: 12.7,
      trend: 'up',
      icon: <MoneyIcon />,
      color: '#f44336'
    },
    {
      name: 'Active Agents',
      value: 18,
      unit: '',
      change: 5.9,
      trend: 'up',
      target: 20,
      icon: <AgentsIcon />,
      color: '#9c27b0'
    },
    {
      name: 'Error Rate',
      value: 1.8,
      unit: '%',
      change: -22.4,
      trend: 'down',
      target: 2.0,
      icon: <ErrorIcon />,
      color: '#f44336'
    }
  ];

  // Mock trend data
  const generateTrendData = (): TrendData[] => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    return Array.from({ length: days / (days > 30 ? 7 : 1) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i * (days > 30 ? 7 : 1)));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workflows: Math.floor(400 + Math.random() * 200),
        successRate: 90 + Math.random() * 8,
        avgDuration: 2.5 + Math.random() * 2,
        cost: 250 + Math.random() * 150,
        agents: 15 + Math.floor(Math.random() * 5)
      };
    });
  };

  const trendData = generateTrendData();

  // Mock agent performance data
  const agentPerformance: AgentPerformance[] = [
    { agent: 'Digby', tasks: 3847, successRate: 96.5, avgDuration: 2.8, utilization: 87 },
    { agent: 'Iris', tasks: 2956, successRate: 94.2, avgDuration: 3.5, utilization: 72 },
    { agent: 'Bradley', tasks: 2134, successRate: 98.1, avgDuration: 1.9, utilization: 65 },
    { agent: 'Greta', tasks: 1892, successRate: 93.7, avgDuration: 4.2, utilization: 58 },
    { agent: 'Custom Agent 1', tasks: 1018, successRate: 91.3, avgDuration: 5.1, utilization: 43 }
  ];

  // Mock workflow distribution
  const workflowDistribution: WorkflowDistribution[] = [
    { name: 'Data Analysis', value: 4521, percentage: 35.2 },
    { name: 'Content Generation', value: 3214, percentage: 25.0 },
    { name: 'Code Review', value: 2567, percentage: 20.0 },
    { name: 'Research', value: 1289, percentage: 10.0 },
    { name: 'Other', value: 1256, percentage: 9.8 }
  ];

  // Mock cost breakdown
  const costBreakdown: CostBreakdown[] = [
    { category: 'API Calls', amount: 3542, percentage: 42.0, trend: 15.3 },
    { category: 'Token Usage', amount: 2814, percentage: 33.4, trend: 8.7 },
    { category: 'Infrastructure', amount: 1235, percentage: 14.7, trend: -2.1 },
    { category: 'Storage', amount: 534, percentage: 6.3, trend: 5.2 },
    { category: 'Other', amount: 300, percentage: 3.6, trend: 12.8 }
  ];

  const getKPIColor = (metric: KPIMetric) => {
    if (!metric.target) return metric.color;
    
    const isGoodDirection = metric.name.includes('Error') || metric.name.includes('Cost') || metric.name.includes('Response Time')
      ? metric.value < metric.target
      : metric.value >= metric.target;
    
    return isGoodDirection ? '#4caf50' : '#f44336';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', isPositive: boolean) => {
    if (trend === 'stable') return null;
    const Icon = trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
    const color = isPositive ? '#4caf50' : '#f44336';
    return <Icon sx={{ fontSize: 16, color }} />;
  };

  const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5">Executive Analytics Dashboard</Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value as any)}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="ytd">Year to date</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant={compareMode ? 'contained' : 'outlined'}
              onClick={() => setCompareMode(!compareMode)}
              startIcon={<CalendarIcon />}
            >
              Compare Periods
            </Button>
            
            <Button
              variant="outlined"
              onClick={onScheduleReport}
              startIcon={<CalendarIcon />}
            >
              Schedule Report
            </Button>
            
            <Button
              variant="contained"
              onClick={() => onExportReport?.('pdf')}
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
            
            <IconButton>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiMetrics.map((metric) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={metric.name}>
            <Card>
              <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: metric.color + '20', color: metric.color, width: 32, height: 32 }}>
                    {metric.icon}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {metric.name}
                  </Typography>
                </Box>
                
                <Typography variant="h4" component="div" sx={{ mb: 0.5 }}>
                  {metric.value.toLocaleString()}{metric.unit}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getTrendIcon(
                    metric.trend,
                    metric.name.includes('Error') || metric.name.includes('Cost') || metric.name.includes('Response Time')
                      ? metric.trend === 'down'
                      : metric.trend === 'up'
                  )}
                  <Typography
                    variant="body2"
                    color={
                      metric.name.includes('Error') || metric.name.includes('Cost') || metric.name.includes('Response Time')
                        ? metric.trend === 'down' ? 'success.main' : 'error.main'
                        : metric.trend === 'up' ? 'success.main' : 'error.main'
                    }
                  >
                    {Math.abs(metric.change)}%
                  </Typography>
                  {compareMode && (
                    <Typography variant="caption" color="text.secondary">
                      vs last period
                    </Typography>
                  )}
                </Box>
                
                {metric.target && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Target: {metric.target}{metric.unit}
                      </Typography>
                      <Typography variant="caption" color={getKPIColor(metric)}>
                        {((metric.value / metric.target) * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (metric.value / metric.target) * 100)}
                      sx={{
                        height: 4,
                        backgroundColor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getKPIColor(metric)
                        }
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Workflow Trends */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Workflow Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="workflows"
                  stroke="#2196f3"
                  name="Workflows"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="successRate"
                  stroke="#4caf50"
                  name="Success Rate %"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgDuration"
                  stroke="#ff9800"
                  name="Avg Duration (s)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Workflow Distribution */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Workflow Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={workflowDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {workflowDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Secondary Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Agent Performance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Agent Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="agent" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#2196f3" name="Tasks Completed" />
                <Bar dataKey="utilization" fill="#ff9800" name="Utilization %" />
              </BarChart>
            </ResponsiveContainer>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Top Performers
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {agentPerformance.slice(0, 3).map((agent) => (
                  <Chip
                    key={agent.agent}
                    label={`${agent.agent}: ${agent.successRate}% success`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Cost Analysis */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cost Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#f44336"
                  fill="#f44336"
                  fillOpacity={0.6}
                  name="Daily Cost ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              {costBreakdown.map((item, index) => (
                <Box key={item.category} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{item.category}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        ${item.amount.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={item.trend > 0 ? 'error.main' : 'success.main'}
                      >
                        {item.trend > 0 ? '+' : ''}{item.trend}%
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{
                      height: 6,
                      backgroundColor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: COLORS[index % COLORS.length]
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions & Insights
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Alert severity="success">
              <Typography variant="subtitle2" gutterBottom>
                Performance Improvement
              </Typography>
              <Typography variant="body2">
                Response time improved by 15.3% this period. Consider increasing agent pool to maintain this trend.
              </Typography>
            </Alert>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <Alert severity="warning">
              <Typography variant="subtitle2" gutterBottom>
                Cost Optimization Opportunity
              </Typography>
              <Typography variant="body2">
                API calls increased by 23%. Review workflow efficiency and consider caching strategies.
              </Typography>
            </Alert>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                Capacity Planning
              </Typography>
              <Typography variant="body2">
                Current growth rate suggests reaching capacity in 45 days. Plan infrastructure scaling.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ExecutiveAnalyticsDashboard;