import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChronosAPI } from '../../services/chronos/api';
import {
  DeploymentEnvironment,
  PerformanceTrend,
  BenchmarkResult,
  PerformanceMetrics
} from '../../types/chronos';

interface MetricsData {
  performanceTrends: PerformanceTrend[];
  benchmarks: BenchmarkResult[];
  currentMetrics: PerformanceMetrics;
}

const ChronosMetricsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState<DeploymentEnvironment>(DeploymentEnvironment.PRODUCTION);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Colors for charts
  const colors = {
    primary: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    secondary: '#6b7280'
  };

  const pieColors = [colors.primary, colors.success, colors.warning, colors.error];

  useEffect(() => {
    loadMetricsData();
  }, [selectedEnvironment, timeRange]);

  const loadMetricsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load metrics data
      const [metricsResponse, benchmarksData] = await Promise.all([
        ChronosAPI.getDeploymentMetrics(selectedEnvironment, parseInt(timeRange.replace('h', ''))),
        ChronosAPI.getPerformanceBenchmarks()
      ]);

      // Generate mock trend data for demo (in real implementation, this would come from API)
      const mockTrends: PerformanceTrend[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        response_time_p95: 80 + Math.random() * 40,
        throughput: 90 + Math.random() * 20,
        error_rate: Math.random() * 0.05,
        cpu_usage: 40 + Math.random() * 30,
        memory_usage: 50 + Math.random() * 20
      }));

      setMetricsData({
        performanceTrends: mockTrends,
        benchmarks: benchmarksData,
        currentMetrics: metricsResponse.metrics
      });

    } catch (err) {
      console.error('Failed to load metrics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics data');
    } finally {
      setLoading(false);
    }
  };

  const exportMetrics = async () => {
    try {
      const startDate = new Date(Date.now() - parseInt(timeRange.replace('h', '')) * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      
      const reportBlob = await ChronosAPI.exportDeploymentReport(
        selectedEnvironment,
        startDate,
        endDate,
        'csv'
      );
      
      const url = window.URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronos-metrics-${selectedEnvironment}-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export metrics:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ReactNode;
    color: string;
    change?: number;
  }> = ({ title, value, unit, icon, color, change }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color, fontWeight: 'bold' }}>
              {value}{unit && <span style={{ fontSize: '0.7em' }}>{unit}</span>}
            </Typography>
            {change !== undefined && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: change >= 0 ? colors.success : colors.error,
                  display: 'flex',
                  alignItems: 'center',
                  mt: 0.5
                }}
              >
                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5, transform: change < 0 ? 'rotate(180deg)' : 'none' }} />
                {Math.abs(change).toFixed(1)}% from last period
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Metrics Dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          📊 Performance Metrics Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Environment</InputLabel>
            <Select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value as DeploymentEnvironment)}
            >
              <MenuItem value={DeploymentEnvironment.PRODUCTION}>Production</MenuItem>
              <MenuItem value={DeploymentEnvironment.STAGING}>Staging</MenuItem>
              <MenuItem value={DeploymentEnvironment.DEVELOPMENT}>Development</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1h">1 Hour</MenuItem>
              <MenuItem value="6h">6 Hours</MenuItem>
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="168h">7 Days</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportMetrics}
          >
            Export
          </Button>
        </Box>
      </Box>

      {metricsData && (
        <>
          {/* Key Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <MetricCard
                title="Response Time (P95)"
                value={metricsData.currentMetrics.api_response_time_p95.toFixed(0)}
                unit="ms"
                icon={<SpeedIcon fontSize="large" />}
                color={colors.primary}
                change={-2.3}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <MetricCard
                title="Throughput"
                value={metricsData.currentMetrics.throughput_per_second.toFixed(0)}
                unit="/sec"
                icon={<TrendingUpIcon fontSize="large" />}
                color={colors.success}
                change={5.7}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <MetricCard
                title="Success Rate"
                value={(metricsData.currentMetrics.success_rate * 100).toFixed(2)}
                unit="%"
                icon={<AssessmentIcon fontSize="large" />}
                color={colors.success}
                change={0.1}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <MetricCard
                title="CPU Usage"
                value={(metricsData.currentMetrics.resource_usage.cpu * 100).toFixed(1)}
                unit="%"
                icon={<MemoryIcon fontSize="large" />}
                color={colors.warning}
                change={-1.2}
              />
            </Grid>
          </Grid>

          {/* Performance Trends Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Trends - {selectedEnvironment.toUpperCase()}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: any, name: string) => [
                      typeof value === 'number' ? value.toFixed(2) : value,
                      name.replace('_', ' ').toUpperCase()
                    ]}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="response_time_p95" 
                    stroke={colors.primary} 
                    strokeWidth={2}
                    name="Response Time (ms)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="throughput" 
                    stroke={colors.success} 
                    strokeWidth={2}
                    name="Throughput (/sec)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Resource Usage and Error Rate */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resource Usage Over Time
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={metricsData.performanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: any, name: string) => [
                          `${(value as number).toFixed(1)}%`,
                          name.replace('_', ' ').toUpperCase()
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cpu_usage" 
                        stackId="1"
                        stroke={colors.warning} 
                        fill={colors.warning}
                        fillOpacity={0.6}
                        name="CPU Usage"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="memory_usage" 
                        stackId="1"
                        stroke={colors.secondary} 
                        fill={colors.secondary}
                        fillOpacity={0.6}
                        name="Memory Usage"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Error Rate Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metricsData.performanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: any) => [`${((value as number) * 100).toFixed(3)}%`, 'Error Rate']}
                      />
                      <Bar 
                        dataKey="error_rate" 
                        fill={colors.error}
                        name="Error Rate"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Benchmark Results */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Latest Performance Benchmarks
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Name</TableCell>
                      <TableCell align="right">Duration (ms)</TableCell>
                      <TableCell align="right">Success Rate</TableCell>
                      <TableCell align="right">Throughput (/sec)</TableCell>
                      <TableCell align="right">Max CPU</TableCell>
                      <TableCell align="right">Max Memory</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metricsData.benchmarks.map((benchmark, index) => (
                      <TableRow key={index}>
                        <TableCell>{benchmark.test_name}</TableCell>
                        <TableCell align="right">{benchmark.duration_ms.toLocaleString()}</TableCell>
                        <TableCell align="right">{(benchmark.success_rate * 100).toFixed(2)}%</TableCell>
                        <TableCell align="right">{benchmark.throughput_per_second.toFixed(0)}</TableCell>
                        <TableCell align="right">{(benchmark.resource_usage.cpu_max * 100).toFixed(1)}%</TableCell>
                        <TableCell align="right">{(benchmark.resource_usage.memory_max * 100).toFixed(1)}%</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={benchmark.success_rate > 0.95 ? 'Pass' : 'Warn'}
                            color={benchmark.success_rate > 0.95 ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default ChronosMetricsDashboard;