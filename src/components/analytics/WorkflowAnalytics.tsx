import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
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
  TablePagination,
  IconButton,
  Tooltip,
  Alert,
  Button,
  LinearProgress,
  Avatar,
  AvatarGroup,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  AccessTime as DurationIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Functions as FunctionsIcon,
  BugReport as BugIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Treemap,
  Sankey,
  RadialBarChart,
  RadialBar
} from 'recharts';

interface WorkflowMetrics {
  id: string;
  name: string;
  executions: number;
  successRate: number;
  avgDuration: number;
  p95Duration: number;
  avgCost: number;
  failureReasons: Array<{ reason: string; count: number }>;
  lastRun: string;
  trend: 'improving' | 'stable' | 'degrading';
}

interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: 'success' | 'failed' | 'partial';
  duration: number;
  cost: number;
  startTime: string;
  endTime: string;
  agents: string[];
  tools: string[];
  errorMessage?: string;
}

interface FailureAnalysis {
  category: string;
  count: number;
  percentage: number;
  workflows: string[];
  trend: number;
}

interface PerformanceTrend {
  date: string;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  executions: number;
}

interface WorkflowDependency {
  source: string;
  target: string;
  value: number;
}

const WorkflowAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock workflow metrics
  const workflowMetrics: WorkflowMetrics[] = [
    {
      id: 'wf-001',
      name: 'Customer Data Analysis',
      executions: 1234,
      successRate: 96.5,
      avgDuration: 45.2,
      p95Duration: 78.5,
      avgCost: 0.85,
      failureReasons: [
        { reason: 'Timeout', count: 23 },
        { reason: 'API Error', count: 12 },
        { reason: 'Validation Failed', count: 8 }
      ],
      lastRun: '2 hours ago',
      trend: 'improving'
    },
    {
      id: 'wf-002',
      name: 'Content Generation Pipeline',
      executions: 856,
      successRate: 92.3,
      avgDuration: 120.5,
      p95Duration: 180.2,
      avgCost: 2.45,
      failureReasons: [
        { reason: 'Rate Limit', count: 35 },
        { reason: 'Quality Check Failed', count: 25 },
        { reason: 'Timeout', count: 6 }
      ],
      lastRun: '30 minutes ago',
      trend: 'stable'
    },
    {
      id: 'wf-003',
      name: 'Code Review Automation',
      executions: 2341,
      successRate: 88.7,
      avgDuration: 89.3,
      p95Duration: 145.8,
      avgCost: 1.25,
      failureReasons: [
        { reason: 'Parse Error', count: 145 },
        { reason: 'Timeout', count: 89 },
        { reason: 'API Error', count: 31 }
      ],
      lastRun: '5 minutes ago',
      trend: 'degrading'
    },
    {
      id: 'wf-004',
      name: 'Market Research Workflow',
      executions: 445,
      successRate: 94.8,
      avgDuration: 210.3,
      p95Duration: 320.5,
      avgCost: 3.75,
      failureReasons: [
        { reason: 'Data Source Unavailable', count: 12 },
        { reason: 'Timeout', count: 8 },
        { reason: 'API Error', count: 3 }
      ],
      lastRun: '1 hour ago',
      trend: 'improving'
    }
  ];

  // Mock execution history
  const generateExecutionHistory = (): WorkflowExecution[] => {
    const executions: WorkflowExecution[] = [];
    const statuses: Array<'success' | 'failed' | 'partial'> = ['success', 'success', 'success', 'failed', 'partial'];
    
    for (let i = 0; i < 50; i++) {
      const workflow = workflowMetrics[i % workflowMetrics.length];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const startTime = new Date(Date.now() - Math.random() * 86400000);
      const duration = workflow.avgDuration * (0.5 + Math.random());
      
      executions.push({
        id: `exec-${i}`,
        workflowName: workflow.name,
        status,
        duration,
        cost: workflow.avgCost * (0.8 + Math.random() * 0.4),
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + duration * 1000).toISOString(),
        agents: ['Digby', 'Iris', 'Bradley'].slice(0, 1 + Math.floor(Math.random() * 3)),
        tools: ['web-search', 'analyzer', 'generator'].slice(0, 1 + Math.floor(Math.random() * 3)),
        errorMessage: status === 'failed' ? 'API rate limit exceeded' : undefined
      });
    }
    
    return executions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  };

  const executionHistory = generateExecutionHistory();

  // Mock performance trend data
  const generatePerformanceTrend = (): PerformanceTrend[] => {
    const days = 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const baseExecutions = 40 + Math.floor(Math.random() * 20);
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgDuration: 80 + Math.random() * 40,
        p50Duration: 70 + Math.random() * 30,
        p95Duration: 120 + Math.random() * 60,
        p99Duration: 180 + Math.random() * 80,
        executions: baseExecutions
      };
    });
  };

  const performanceTrend = generatePerformanceTrend();

  // Mock failure analysis
  const failureAnalysis: FailureAnalysis[] = [
    {
      category: 'Timeout Errors',
      count: 234,
      percentage: 35.2,
      workflows: ['Customer Data Analysis', 'Market Research Workflow'],
      trend: -12.5
    },
    {
      category: 'API Errors',
      count: 189,
      percentage: 28.5,
      workflows: ['Content Generation Pipeline', 'Code Review Automation'],
      trend: 8.3
    },
    {
      category: 'Validation Failures',
      count: 145,
      percentage: 21.8,
      workflows: ['Customer Data Analysis', 'Content Generation Pipeline'],
      trend: -5.2
    },
    {
      category: 'Resource Constraints',
      count: 67,
      percentage: 10.1,
      workflows: ['Code Review Automation'],
      trend: 15.7
    },
    {
      category: 'Other',
      count: 29,
      percentage: 4.4,
      workflows: ['Market Research Workflow'],
      trend: 2.1
    }
  ];

  // Mock workflow dependencies
  const workflowDependencies: WorkflowDependency[] = [
    { source: 'Data Collection', target: 'Data Validation', value: 100 },
    { source: 'Data Validation', target: 'Analysis', value: 95 },
    { source: 'Analysis', target: 'Report Generation', value: 90 },
    { source: 'Analysis', target: 'Alert Generation', value: 45 },
    { source: 'Report Generation', target: 'Distribution', value: 85 },
    { source: 'Alert Generation', target: 'Notification', value: 40 }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'partial':
        return <WarningIcon color="warning" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'degrading':
        return <TrendingDownIcon color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredWorkflows = workflowMetrics.filter(wf =>
    wf.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5">Workflow Analytics</Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Workflow</InputLabel>
              <Select
                value={selectedWorkflow}
                label="Workflow"
                onChange={(e) => setSelectedWorkflow(e.target.value)}
              >
                <MenuItem value="all">All Workflows</MenuItem>
                {workflowMetrics.map(wf => (
                  <MenuItem key={wf.id} value={wf.id}>{wf.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="24h">Last 24 hours</MenuItem>
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Failures" />
          <Tab label="Execution History" />
          <Tab label="Dependencies" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Workflow Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {filteredWorkflows.map((workflow) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={workflow.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" noWrap>
                        {workflow.name}
                      </Typography>
                      {getTrendIcon(workflow.trend)}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4">
                        {workflow.successRate}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Success Rate
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Executions
                        </Typography>
                        <Typography variant="h6">
                          {workflow.executions.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Avg Duration
                        </Typography>
                        <Typography variant="h6">
                          {workflow.avgDuration.toFixed(1)}s
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Avg Cost
                        </Typography>
                        <Typography variant="h6">
                          ${workflow.avgCost.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Last Run
                        </Typography>
                        <Typography variant="body2">
                          {workflow.lastRun}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Top Failure Reasons
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {workflow.failureReasons.slice(0, 2).map((reason) => (
                          <Chip
                            key={reason.reason}
                            label={`${reason.reason} (${reason.count})`}
                            size="small"
                            variant="outlined"
                            color="error"
                          />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Summary Stats */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Success Rate Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workflowMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="successRate" name="Success Rate %">
                      {workflowMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.successRate > 95 ? '#4caf50' : entry.successRate > 90 ? '#ff9800' : '#f44336'} />
                      ))}
                    </Bar>
                    <ReferenceLine y={95} stroke="#4caf50" strokeDasharray="3 3" label="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Cost vs Duration Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis dataKey="avgDuration" name="Duration" unit="s" />
                    <YAxis dataKey="avgCost" name="Cost" unit="$" />
                    <ChartTooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Workflows" data={workflowMetrics} fill="#8884d8">
                      {workflowMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Performance Tab */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgDuration" stroke="#2196f3" name="Average" strokeWidth={2} />
                    <Line type="monotone" dataKey="p50Duration" stroke="#4caf50" name="P50" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="p95Duration" stroke="#ff9800" name="P95" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="p99Duration" stroke="#f44336" name="P99" strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Duration Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip />
                    <Area type="monotone" dataKey="p50Duration" stackId="1" stroke="#4caf50" fill="#4caf50" />
                    <Area type="monotone" dataKey="p95Duration" stackId="1" stroke="#ff9800" fill="#ff9800" />
                    <Area type="monotone" dataKey="p99Duration" stackId="1" stroke="#f44336" fill="#f44336" />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Execution Volume
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="executions" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Failures Tab */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Failure Analysis
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                        <TableCell align="right">Trend</TableCell>
                        <TableCell>Affected Workflows</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {failureAnalysis.map((failure) => (
                        <TableRow key={failure.category}>
                          <TableCell>{failure.category}</TableCell>
                          <TableCell align="right">{failure.count}</TableCell>
                          <TableCell align="right">{failure.percentage.toFixed(1)}%</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${failure.trend > 0 ? '+' : ''}${failure.trend.toFixed(1)}%`}
                              size="small"
                              color={failure.trend > 0 ? 'error' : 'success'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <AvatarGroup max={3}>
                              {failure.workflows.map((wf) => (
                                <Tooltip key={wf} title={wf}>
                                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                    {wf.charAt(0)}
                                  </Avatar>
                                </Tooltip>
                              ))}
                            </AvatarGroup>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Failure Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={failureAnalysis}>
                    <RadialBar dataKey="percentage" cornerRadius={10} fill="#8884d8" label>
                      {failureAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </RadialBar>
                    <ChartTooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>
                  Action Required: Rising API Errors
                </Typography>
                <Typography variant="body2">
                  API errors have increased by 8.3% in the last 30 days. Consider implementing retry logic and reviewing API rate limits.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Execution History Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Workflow</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Agents</TableCell>
                  <TableCell>Tools</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {executionHistory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>{getStatusIcon(execution.status)}</TableCell>
                      <TableCell>{execution.workflowName}</TableCell>
                      <TableCell>
                        {new Date(execution.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell>{execution.duration.toFixed(1)}s</TableCell>
                      <TableCell>${execution.cost.toFixed(2)}</TableCell>
                      <TableCell>
                        <AvatarGroup max={3}>
                          {execution.agents.map((agent) => (
                            <Tooltip key={agent} title={agent}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {agent.charAt(0)}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {execution.tools.map((tool) => (
                            <Chip key={tool} label={tool} size="small" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {execution.errorMessage && (
                          <Tooltip title={execution.errorMessage}>
                            <IconButton size="small">
                              <ErrorIcon color="error" fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={executionHistory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Dependencies Tab */}
      {activeTab === 4 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Workflow Dependencies & Flow
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            This diagram shows the typical flow of data through workflow stages and their dependencies.
          </Alert>
          <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Sankey diagram visualization would be rendered here showing workflow dependencies
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default WorkflowAnalytics;