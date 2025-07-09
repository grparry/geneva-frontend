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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Button,
  LinearProgress,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Slider,
  Divider
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Calculate as CalculateIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Speed as SpeedIcon,
  Token as TokenIcon,
  Api as ApiIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Lightbulb as InsightIcon
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
  ReferenceLine,
  ComposedChart,
  Treemap
} from 'recharts';

interface CostMetric {
  category: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  forecast: number;
  budget?: number;
}

interface ResourceUsage {
  resource: string;
  usage: number;
  cost: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface CostByService {
  service: string;
  cost: number;
  percentage: number;
  calls: number;
  avgCostPerCall: number;
}

interface CostOptimization {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

interface BudgetAlert {
  type: 'warning' | 'error';
  message: string;
  metric: string;
  current: number;
  threshold: number;
}

const CostAnalysisDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [department, setDepartment] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [showProjections, setShowProjections] = useState(true);
  const [budgetThreshold, setBudgetThreshold] = useState(10000);

  // Mock cost metrics
  const costMetrics: CostMetric[] = [
    {
      category: 'Total Cost',
      current: 8425,
      previous: 7234,
      change: 1191,
      changePercent: 16.5,
      forecast: 9850,
      budget: 10000
    },
    {
      category: 'API Costs',
      current: 3542,
      previous: 2987,
      change: 555,
      changePercent: 18.6,
      forecast: 4100
    },
    {
      category: 'Token Usage',
      current: 2814,
      previous: 2456,
      change: 358,
      changePercent: 14.6,
      forecast: 3200
    },
    {
      category: 'Infrastructure',
      current: 1235,
      previous: 1189,
      change: 46,
      changePercent: 3.9,
      forecast: 1300
    },
    {
      category: 'Storage',
      current: 534,
      previous: 489,
      change: 45,
      changePercent: 9.2,
      forecast: 600
    },
    {
      category: 'Other',
      current: 300,
      previous: 113,
      change: 187,
      changePercent: 165.5,
      forecast: 650
    }
  ];

  // Mock daily cost trend
  const generateCostTrend = () => {
    const days = 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const baseCost = 250 + Math.random() * 100;
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actual: baseCost,
        forecast: i > 25 ? baseCost * 1.1 : null,
        budget: 333, // Daily budget based on monthly budget
        apiCost: baseCost * 0.42,
        tokenCost: baseCost * 0.33,
        infraCost: baseCost * 0.15,
        otherCost: baseCost * 0.10
      };
    });
  };

  const costTrend = generateCostTrend();

  // Mock resource usage
  const resourceUsage: ResourceUsage[] = [
    { resource: 'GPT-4 Tokens', usage: 12500000, cost: 1875, unit: 'tokens', trend: 'up' },
    { resource: 'Claude API Calls', usage: 45000, cost: 1125, unit: 'calls', trend: 'up' },
    { resource: 'Web Search API', usage: 15000, cost: 450, unit: 'searches', trend: 'stable' },
    { resource: 'Code Analysis', usage: 8500, cost: 425, unit: 'analyses', trend: 'down' },
    { resource: 'Storage (GB)', usage: 450, cost: 225, unit: 'GB', trend: 'up' },
    { resource: 'Compute Hours', usage: 1200, cost: 600, unit: 'hours', trend: 'up' }
  ];

  // Mock cost by service
  const costByService: CostByService[] = [
    { service: 'OpenAI', cost: 2345, percentage: 27.8, calls: 125000, avgCostPerCall: 0.019 },
    { service: 'Anthropic', cost: 1890, percentage: 22.4, calls: 85000, avgCostPerCall: 0.022 },
    { service: 'Google Cloud', cost: 1234, percentage: 14.6, calls: 450000, avgCostPerCall: 0.003 },
    { service: 'AWS', cost: 987, percentage: 11.7, calls: 230000, avgCostPerCall: 0.004 },
    { service: 'Azure', cost: 765, percentage: 9.1, calls: 180000, avgCostPerCall: 0.004 },
    { service: 'Others', cost: 1204, percentage: 14.4, calls: 95000, avgCostPerCall: 0.013 }
  ];

  // Mock cost optimizations
  const costOptimizations: CostOptimization[] = [
    {
      id: 'opt-1',
      title: 'Implement Response Caching',
      description: 'Cache frequently requested API responses to reduce redundant calls',
      potentialSavings: 450,
      effort: 'low',
      impact: 'high'
    },
    {
      id: 'opt-2',
      title: 'Optimize Token Usage',
      description: 'Implement prompt compression and response truncation strategies',
      potentialSavings: 380,
      effort: 'medium',
      impact: 'high'
    },
    {
      id: 'opt-3',
      title: 'Use Batch Processing',
      description: 'Group similar requests to leverage batch pricing discounts',
      potentialSavings: 290,
      effort: 'medium',
      impact: 'medium'
    },
    {
      id: 'opt-4',
      title: 'Migrate to Reserved Instances',
      description: 'Switch compute resources to reserved instances for 30% savings',
      potentialSavings: 370,
      effort: 'low',
      impact: 'medium'
    },
    {
      id: 'opt-5',
      title: 'Implement Tiered Storage',
      description: 'Move infrequently accessed data to cheaper storage tiers',
      potentialSavings: 120,
      effort: 'low',
      impact: 'low'
    }
  ];

  // Mock budget alerts
  const budgetAlerts: BudgetAlert[] = [
    {
      type: 'warning',
      message: 'API costs are 85% of monthly budget',
      metric: 'API Costs',
      current: 3542,
      threshold: 4000
    },
    {
      type: 'error',
      message: 'Total costs projected to exceed budget by 15%',
      metric: 'Total Cost',
      current: 8425,
      threshold: budgetThreshold
    }
  ];

  const getChangeIcon = (change: number) => {
    return change > 0 ? (
      <ArrowUpIcon sx={{ fontSize: 16, color: '#f44336' }} />
    ) : (
      <ArrowDownIcon sx={{ fontSize: 16, color: '#4caf50' }} />
    );
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#607d8b'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5">Cost Analysis Dashboard</Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                label="Department"
                onChange={(e) => setDepartment(e.target.value)}
              >
                <MenuItem value="all">All Departments</MenuItem>
                <MenuItem value="engineering">Engineering</MenuItem>
                <MenuItem value="research">Research</MenuItem>
                <MenuItem value="operations">Operations</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="ytd">Year to date</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export Report
            </Button>
            
            <IconButton>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {budgetAlerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.type}
              sx={{ mb: 1 }}
              action={
                <Button color="inherit" size="small">
                  View Details
                </Button>
              }
            >
              <AlertTitle>{alert.message}</AlertTitle>
              {alert.metric}: ${alert.current.toLocaleString()} / ${alert.threshold.toLocaleString()}
            </Alert>
          ))}
        </Box>
      )}

      {/* Cost Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {costMetrics.slice(0, 4).map((metric) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={metric.category}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {metric.category}
                </Typography>
                <Typography variant="h4" sx={{ my: 1 }}>
                  ${metric.current.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getChangeIcon(metric.change)}
                  <Typography
                    variant="body2"
                    color={metric.change > 0 ? 'error.main' : 'success.main'}
                  >
                    ${Math.abs(metric.change)} ({Math.abs(metric.changePercent)}%)
                  </Typography>
                </Box>
                {metric.budget && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(metric.current / metric.budget) * 100}
                      color={(metric.current / metric.budget) > 0.9 ? 'error' : 'primary'}
                    />
                    <Typography variant="caption" color="text.secondary">
                      ${metric.budget - metric.current} remaining
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Trends" />
          <Tab label="Breakdown" />
          <Tab label="Resources" />
          <Tab label="Optimizations" />
          <Tab label="Forecasting" />
        </Tabs>
      </Paper>

      {/* Trends Tab */}
      {activeTab === 0 && (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Cost Trends</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={showProjections}
                    onChange={(e) => setShowProjections(e.target.checked)}
                  />
                }
                label="Show Projections"
              />
            </Box>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={costTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stackId="1"
                  stroke="#2196f3"
                  fill="#2196f3"
                  name="Actual Cost"
                />
                {showProjections && (
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#ff9800"
                    strokeDasharray="5 5"
                    name="Forecast"
                  />
                )}
                <ReferenceLine
                  y={333}
                  stroke="#f44336"
                  strokeDasharray="3 3"
                  label="Daily Budget"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Cost by Category
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costMetrics.slice(1)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.category}: $${entry.current}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="current"
                    >
                      {costMetrics.slice(1).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Cost Growth Rate
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="changePercent" name="Growth %">
                      {costMetrics.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.changePercent > 20 ? '#f44336' : entry.changePercent > 10 ? '#ff9800' : '#4caf50'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Breakdown Tab */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Cost by Service Provider
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell align="right">Cost</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                        <TableCell align="right">API Calls</TableCell>
                        <TableCell align="right">Avg Cost/Call</TableCell>
                        <TableCell align="center">Trend</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costByService.map((service) => (
                        <TableRow key={service.service}>
                          <TableCell>{service.service}</TableCell>
                          <TableCell align="right">${service.cost.toLocaleString()}</TableCell>
                          <TableCell align="right">{service.percentage}%</TableCell>
                          <TableCell align="right">{service.calls.toLocaleString()}</TableCell>
                          <TableCell align="right">${service.avgCostPerCall.toFixed(3)}</TableCell>
                          <TableCell align="center">
                            {Math.random() > 0.5 ? (
                              <TrendingUpIcon color="error" />
                            ) : (
                              <TrendingDownIcon color="success" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Top Cost Drivers
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={costByService.map(item => ({ ...item, name: item.service }))}
                      dataKey="cost"
                      aspectRatio={4 / 3}
                      stroke="#fff"
                      fill="#8884d8"
                    >
                      {costByService.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Treemap>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Resources Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {resourceUsage.map((resource) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={resource.resource}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      {resource.resource}
                    </Typography>
                    {resource.trend === 'up' ? (
                      <TrendingUpIcon color="error" />
                    ) : resource.trend === 'down' ? (
                      <TrendingDownIcon color="success" />
                    ) : null}
                  </Box>
                  
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {resource.usage.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {resource.unit}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Cost
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${resource.cost.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Cost per {resource.unit}
                    </Typography>
                    <Typography variant="body2">
                      ${(resource.cost / resource.usage).toFixed(4)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Optimizations Tab */}
      {activeTab === 3 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Potential Monthly Savings: ${costOptimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0).toLocaleString()}</AlertTitle>
            Implementing these optimizations could reduce your monthly costs by approximately 19%.
          </Alert>
          
          <Grid container spacing={2}>
            {costOptimizations.map((optimization) => (
              <Grid size={{ xs: 12, md: 6 }} key={optimization.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">
                          {optimization.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {optimization.description}
                        </Typography>
                      </Box>
                      <InsightIcon color="primary" />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={`Effort: ${optimization.effort}`}
                        size="small"
                        color={getEffortColor(optimization.effort)}
                      />
                      <Chip
                        label={`Impact: ${optimization.impact}`}
                        size="small"
                        color={getImpactColor(optimization.impact)}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" color="success.main">
                        ${optimization.potentialSavings}/mo
                      </Typography>
                      <Button variant="outlined" size="small">
                        Implement
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Forecasting Tab */}
      {activeTab === 4 && (
        <Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Budget Planning & Forecasting
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Monthly Budget Threshold
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Slider
                  value={budgetThreshold}
                  onChange={(e, v) => setBudgetThreshold(v as number)}
                  min={5000}
                  max={20000}
                  step={1000}
                  marks
                  valueLabelDisplay="on"
                  sx={{ flex: 1 }}
                />
                <TextField
                  value={budgetThreshold}
                  onChange={(e) => setBudgetThreshold(Number(e.target.value))}
                  type="number"
                  size="small"
                  sx={{ width: 120 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Alert severity={costMetrics[0].forecast > budgetThreshold ? 'error' : 'success'}>
                  <AlertTitle>Next Month Forecast</AlertTitle>
                  <Typography variant="h4">
                    ${costMetrics[0].forecast.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    {costMetrics[0].forecast > budgetThreshold
                      ? `${((costMetrics[0].forecast / budgetThreshold - 1) * 100).toFixed(1)}% over budget`
                      : `${((1 - costMetrics[0].forecast / budgetThreshold) * 100).toFixed(1)}% under budget`}
                  </Typography>
                </Alert>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Alert severity="info">
                  <AlertTitle>Quarterly Projection</AlertTitle>
                  <Typography variant="h4">
                    ${(costMetrics[0].forecast * 3).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Based on current growth rate
                  </Typography>
                </Alert>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Alert severity="warning">
                  <AlertTitle>Annual Run Rate</AlertTitle>
                  <Typography variant="h4">
                    ${(costMetrics[0].current * 12).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    At current spending levels
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Cost Reduction Scenarios
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Scenario</TableCell>
                      <TableCell align="right">Monthly Savings</TableCell>
                      <TableCell align="right">Annual Savings</TableCell>
                      <TableCell align="right">New Monthly Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Implement Top 3 Optimizations</TableCell>
                      <TableCell align="right">${(450 + 380 + 290).toLocaleString()}</TableCell>
                      <TableCell align="right">${((450 + 380 + 290) * 12).toLocaleString()}</TableCell>
                      <TableCell align="right">${(costMetrics[0].current - 1120).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>10% Reduction in API Calls</TableCell>
                      <TableCell align="right">$354</TableCell>
                      <TableCell align="right">$4,248</TableCell>
                      <TableCell align="right">${(costMetrics[0].current - 354).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Migrate to Cheaper Providers</TableCell>
                      <TableCell align="right">$842</TableCell>
                      <TableCell align="right">$10,104</TableCell>
                      <TableCell align="right">${(costMetrics[0].current - 842).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default CostAnalysisDashboard;