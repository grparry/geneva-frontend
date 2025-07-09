import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Button,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Memory as MemoryIcon,
  Speed as CPUIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Timer as LatencyIcon,
  Group as AgentsIcon,
  Build as ToolsIcon,
  Timeline as WorkflowIcon
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    latency: number;
    bandwidth: number;
    requests: number;
  };
}

interface ComponentHealth {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastChecked: string;
  metrics?: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  successRate: number;
}

interface ErrorRateMetrics {
  total: number;
  byType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface CapacityMetrics {
  activeWorkflows: number;
  maxWorkflows: number;
  activeAgents: number;
  maxAgents: number;
  queuedTasks: number;
  processingCapacity: number;
}

interface SystemHealthDashboardProps {
  systemMetrics: SystemMetrics;
  componentHealth: ComponentHealth[];
  performanceMetrics: PerformanceMetrics;
  errorRates: ErrorRateMetrics;
  capacityMetrics: CapacityMetrics;
  historicalData?: {
    cpu: Array<{ time: string; value: number }>;
    memory: Array<{ time: string; value: number }>;
    requests: Array<{ time: string; value: number }>;
    errors: Array<{ time: string; value: number }>;
  };
  onRefresh?: () => void;
}

const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  systemMetrics,
  componentHealth,
  performanceMetrics,
  errorRates,
  capacityMetrics,
  historicalData,
  onRefresh
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(onRefresh, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, onRefresh]);

  const getHealthStatus = () => {
    const unhealthyComponents = componentHealth.filter(c => c.status !== 'healthy').length;
    const totalErrorRate = (errorRates.total / 1000) * 100; // Assuming 1000 total requests for error rate calculation
    if (unhealthyComponents === 0 && totalErrorRate < 1) return 'healthy';
    if (unhealthyComponents > 2 || totalErrorRate > 5) return 'critical';
    return 'degraded';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'down':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'increasing' ? <TrendingUpIcon color="error" /> : <TrendingDownIcon color="success" />;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const healthStatus = getHealthStatus();

  const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5">System Health Dashboard</Typography>
            <Chip 
              label={healthStatus.toUpperCase()} 
              color={getStatusColor(healthStatus)}
              icon={getStatusIcon(healthStatus)}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={autoRefresh ? `Auto-refresh: ${refreshInterval}s` : 'Manual refresh'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? 'primary' : 'default'}
            />
            <IconButton onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* System Resources */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CPUIcon sx={{ mr: 1 }} />
                <Typography variant="h6">CPU Usage</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {systemMetrics.cpu.usage}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={systemMetrics.cpu.usage} 
                color={systemMetrics.cpu.usage > 80 ? 'error' : systemMetrics.cpu.usage > 60 ? 'warning' : 'success'}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {systemMetrics.cpu.cores} cores
                {systemMetrics.cpu.temperature && ` • ${systemMetrics.cpu.temperature}°C`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Memory</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {systemMetrics.memory.percentage}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={systemMetrics.memory.percentage} 
                color={systemMetrics.memory.percentage > 80 ? 'error' : systemMetrics.memory.percentage > 60 ? 'warning' : 'success'}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Storage</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {systemMetrics.storage.percentage}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={systemMetrics.storage.percentage} 
                color={systemMetrics.storage.percentage > 80 ? 'error' : systemMetrics.storage.percentage > 60 ? 'warning' : 'success'}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {formatBytes(systemMetrics.storage.used)} / {formatBytes(systemMetrics.storage.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NetworkIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Network</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {systemMetrics.network.latency}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Latency
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {systemMetrics.network.requests} req/s • {formatBytes(systemMetrics.network.bandwidth)}/s
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            
            {historicalData && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData.requests}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="value" stroke="#2196f3" name="Requests/s" />
                </LineChart>
              </ResponsiveContainer>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response Time
                  </Typography>
                  <Typography variant="h6">
                    {performanceMetrics.avgResponseTime}ms
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">
                    P95 Response Time
                  </Typography>
                  <Typography variant="h6">
                    {performanceMetrics.p95ResponseTime}ms
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {performanceMetrics.successRate.toFixed(2)}%
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">
                    Error Rate
                  </Typography>
                  <Typography variant="h6" color={performanceMetrics.errorRate > 2 ? 'error' : 'text.primary'}>
                    {performanceMetrics.errorRate.toFixed(2)}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Error Distribution
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ mr: 1 }}>
                {errorRates.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Errors
              </Typography>
              {getTrendIcon(errorRates.trend)}
            </Box>
            
            <List dense>
              {errorRates.byType.map((error) => (
                <ListItem key={error.type}>
                  <ListItemText
                    primary={error.type}
                    secondary={`${error.count} (${error.percentage.toFixed(1)}%)`}
                  />
                  <LinearProgress 
                    variant="determinate" 
                    value={error.percentage} 
                    sx={{ width: 100 }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Component Health */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Component Health
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Component</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uptime</TableCell>
                <TableCell>Response Time</TableCell>
                <TableCell>Error Rate</TableCell>
                <TableCell>Throughput</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {componentHealth.map((component) => (
                <TableRow key={component.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(component.status)}
                      {component.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={component.status} 
                      size="small" 
                      color={getStatusColor(component.status)}
                    />
                  </TableCell>
                  <TableCell>{formatUptime(component.uptime)}</TableCell>
                  <TableCell>
                    {component.metrics?.responseTime || '-'}ms
                  </TableCell>
                  <TableCell>
                    {component.metrics?.errorRate || 0}%
                  </TableCell>
                  <TableCell>
                    {component.metrics?.throughput || '-'}/s
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Capacity Metrics */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          System Capacity
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <WorkflowIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4">
                {capacityMetrics.activeWorkflows}/{capacityMetrics.maxWorkflows}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Workflows
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(capacityMetrics.activeWorkflows / capacityMetrics.maxWorkflows) * 100}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <AgentsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4">
                {capacityMetrics.activeAgents}/{capacityMetrics.maxAgents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Agents
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(capacityMetrics.activeAgents / capacityMetrics.maxAgents) * 100}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <ToolsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4">
                {capacityMetrics.queuedTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Queued Tasks
              </Typography>
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <LatencyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4">
                {capacityMetrics.processingCapacity}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processing Capacity
              </Typography>
              <CircularProgress 
                variant="determinate" 
                value={capacityMetrics.processingCapacity}
                size={60}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SystemHealthDashboard;