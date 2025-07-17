/**
 * Workflow Analytics Page
 * Detailed workflow performance metrics and analysis
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
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  SearchRounded,
  FilterListRounded,
  TrendingUpRounded,
  TrendingDownRounded,
  AccessTimeRounded,
  CheckCircleRounded,
  CancelRounded,
  WarningAmberRounded,
  InfoRounded,
  DownloadRounded,
  SpeedRounded,
  RemoveRounded,
} from '@mui/icons-material';
import { Alert } from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

import { useWorkflowAnalytics, useTrendData } from '../../hooks/useAnalytics';
import { useMetricSubscription } from '../../hooks/useAnalyticsWebSocket';
import AnalyticsErrorBoundary from '../../components/analytics/AnalyticsErrorBoundary';
import { TableSkeleton } from '../../components/analytics/AnalyticsLoadingSkeleton';
import { MetricType } from '../../types/analytics';

// Status chip component
const StatusChip: React.FC<{ status: string; count?: number }> = ({ status, count }) => {
  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return { color: 'success' as const, icon: <CheckCircleRounded sx={{ fontSize: 16 }} /> };
      case 'failed':
      case 'error':
        return { color: 'error' as const, icon: <CancelRounded sx={{ fontSize: 16 }} /> };
      case 'running':
      case 'in_progress':
        return { color: 'info' as const, icon: <AccessTimeRounded sx={{ fontSize: 16 }} /> };
      default:
        return { color: 'default' as const, icon: <InfoRounded sx={{ fontSize: 16 }} /> };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={count ? `${status} (${count})` : status}
      size="small"
      color={config.color}
      icon={config.icon}
    />
  );
};

// Workflow performance summary cards
const WorkflowSummaryCards: React.FC<{ data: any }> = ({ data }) => {
  const theme = useTheme();
  
  if (!data) return null;

  const cards = [
    {
      title: 'Total Executions',
      value: data.total_executions,
      icon: <SpeedRounded />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Success Rate',
      value: data.successRateFormatted,
      icon: <CheckCircleRounded />,
      color: theme.palette.success.main,
    },
    {
      title: 'Average Duration',
      value: data.avgDurationFormatted,
      icon: <AccessTimeRounded />,
      color: theme.palette.info.main,
    },
    {
      title: 'Failed Workflows',
      value: data.failed,
      subtitle: `${((data.failed / data.total_executions) * 100).toFixed(1)}% failure rate`,
      icon: <CancelRounded />,
      color: theme.palette.error.main,
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card, index) => (
        <Grid xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: alpha(card.color, 0.1),
                    color: card.color,
                    mr: 2,
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {card.title}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {card.value}
              </Typography>
              {card.subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {card.subtitle}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Workflow performance table
const WorkflowPerformanceTable: React.FC<{ 
  workflows: any[];
  onWorkflowClick?: (workflowId: string) => void;
}> = ({ workflows, onWorkflowClick }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(workflow => {
      const matchesSearch = workflow.workflow_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'high_performing' && workflow.success_rate >= 90) ||
        (filterStatus === 'low_performing' && workflow.success_rate < 70);
      return matchesSearch && matchesStatus;
    });
  }, [workflows, searchTerm, filterStatus]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Workflow Performance Details
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filterStatus}
                label="Filter"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Workflows</MenuItem>
                <MenuItem value="high_performing">High Performing</MenuItem>
                <MenuItem value="low_performing">Needs Attention</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Workflow Name</TableCell>
                <TableCell align="right">Executions</TableCell>
                <TableCell align="right">Success Rate</TableCell>
                <TableCell align="right">Avg Duration</TableCell>
                <TableCell align="right">Total Cost</TableCell>
                <TableCell align="center">Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkflows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((workflow) => (
                  <TableRow
                    key={workflow.workflow_id}
                    hover
                    onClick={() => onWorkflowClick?.(workflow.workflow_id)}
                    sx={{ cursor: onWorkflowClick ? 'pointer' : 'default' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {workflow.workflow_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{workflow.executions}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={workflow.successRateFormatted}
                        size="small"
                        color={
                          workflow.success_rate >= 90 ? 'success' :
                          workflow.success_rate >= 70 ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">{workflow.avgDurationFormatted}</TableCell>
                    <TableCell align="right">{workflow.totalCostFormatted}</TableCell>
                    <TableCell align="center">
                      {workflow.success_rate > 85 ? (
                        <TrendingUpRounded color="success" />
                      ) : workflow.success_rate < 70 ? (
                        <TrendingDownRounded color="error" />
                      ) : (
                        <RemoveRounded color="action" />
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
          count={filteredWorkflows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>
    </Card>
  );
};

// Error distribution chart
const ErrorDistributionChart: React.FC<{ errors: any[] }> = ({ errors }) => {
  const COLORS = ['#f44336', '#ff9800', '#ffc107', '#ffeb3b'];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Error Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={errors}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.error_type}: ${entry.count}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {errors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Common Error Messages
          </Typography>
          {errors.slice(0, 3).map((error, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="caption" color="error">
                {error.error_type}:
              </Typography>
              <Typography variant="caption" sx={{ ml: 1 }}>
                {error.sample_message}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Main Workflow Analytics Component
export const WorkflowAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const { data: workflowData, isLoading, error } = useWorkflowAnalytics(timeRange, 100);
  const { value: activeWorkflows } = useMetricSubscription('active_workflows');
  
  const handleExportData = () => {
    // TODO: Implement CSV export
    console.log('Exporting workflow data...');
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <TableSkeleton rows={10} />
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

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Workflow Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor and optimize workflow performance
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              {activeWorkflows !== null && (
                <Chip
                  label={`${activeWorkflows} Active Now`}
                  color="primary"
                  icon={<SpeedRounded />}
                />
              )}
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
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
              
              <Button
                variant="outlined"
                startIcon={<DownloadRounded />}
                onClick={handleExportData}
              >
                Export
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Summary Cards */}
        <AnalyticsErrorBoundary componentName="Workflow Summary">
          <Box sx={{ mb: 4 }}>
            <WorkflowSummaryCards data={workflowData?.summary} />
          </Box>
        </AnalyticsErrorBoundary>

        {/* Performance Trends */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} lg={8}>
            <AnalyticsErrorBoundary componentName="Performance Table">
              <WorkflowPerformanceTable 
                workflows={workflowData?.byWorkflowFormatted || []}
                onWorkflowClick={(id) => console.log('View workflow:', id)}
              />
            </AnalyticsErrorBoundary>
          </Grid>
          
          <Grid xs={12} lg={4}>
            <AnalyticsErrorBoundary componentName="Error Distribution">
              <ErrorDistributionChart errors={workflowData?.errorAnalysis.errorsByType || []} />
            </AnalyticsErrorBoundary>
          </Grid>
        </Grid>

        {/* Performance Trend Chart */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Trends
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={workflowData?.performanceTrendsFormatted || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestampFormatted" />
                <YAxis yAxisId="left" label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Executions', angle: 90, position: 'insideRight' }} />
                <RechartsTooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="success_rate"
                  stroke="#4caf50"
                  name="Success Rate"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="executions"
                  stroke="#2196f3"
                  name="Total Executions"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avg_duration"
                  stroke="#ff9800"
                  name="Avg Duration (s)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default WorkflowAnalytics;