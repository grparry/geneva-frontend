import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useWebSocketManager } from '../hooks/useWebSocketManager';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: {
    warning: number;
    critical: number;
  };
}

interface PerformanceMonitorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const { connections, metrics, isManagerActive, setIsManagerActive } = useWebSocketManager();
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<'good' | 'warning' | 'critical'>('good');
  const [memoryUsage, setMemoryUsage] = useState({ used: 0, total: 0 });
  const [networkLatency, setNetworkLatency] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate performance metrics
  const calculateMetrics = useCallback(() => {
    const newMetrics: PerformanceMetric[] = [
      {
        name: 'Active Connections',
        value: metrics.activeConnections,
        unit: '',
        status: metrics.activeConnections > 4 ? 'warning' : 'good',
        trend: metrics.activeConnections > connections.length * 0.8 ? 'up' : 'stable',
        threshold: { warning: 4, critical: 6 }
      },
      {
        name: 'Messages/Second',
        value: metrics.messagesPerSecond,
        unit: '/s',
        status: metrics.messagesPerSecond > 100 ? 'warning' : 'good',
        trend: 'stable',
        threshold: { warning: 100, critical: 200 }
      },
      {
        name: 'Average Latency',
        value: metrics.averageLatency,
        unit: 'ms',
        status: metrics.averageLatency > 500 ? 'critical' : metrics.averageLatency > 200 ? 'warning' : 'good',
        trend: 'stable',
        threshold: { warning: 200, critical: 500 }
      },
      {
        name: 'Reconnection Rate',
        value: metrics.reconnectionRate,
        unit: '%',
        status: metrics.reconnectionRate > 20 ? 'critical' : metrics.reconnectionRate > 10 ? 'warning' : 'good',
        trend: 'stable',
        threshold: { warning: 10, critical: 20 }
      },
      {
        name: 'Total Messages',
        value: metrics.totalMessages,
        unit: '',
        status: 'good',
        trend: 'up',
        threshold: { warning: 10000, critical: 50000 }
      }
    ];
    
    setPerformanceMetrics(newMetrics);
    
    // Calculate overall system health
    const criticalCount = newMetrics.filter(m => m.status === 'critical').length;
    const warningCount = newMetrics.filter(m => m.status === 'warning').length;
    
    if (criticalCount > 0) {
      setSystemHealth('critical');
    } else if (warningCount > 0) {
      setSystemHealth('warning');
    } else {
      setSystemHealth('good');
    }
  }, [metrics, connections.length]);
  
  // Simulate memory usage calculation
  const calculateMemoryUsage = useCallback(() => {
    // In a real app, this would use performance.memory API
    const connectionMemory = connections.length * 50; // 50KB per connection estimate
    const messageMemory = metrics.totalMessages * 0.5; // 0.5KB per message estimate
    const totalUsed = connectionMemory + messageMemory;
    
    setMemoryUsage({
      used: totalUsed,
      total: 1024 * 10 // 10MB estimated total
    });
  }, [connections.length, metrics.totalMessages]);
  
  // Simulate network latency measurement
  const measureLatency = useCallback(async () => {
    const start = performance.now();
    try {
      // Simulate a ping to measure latency
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      const latency = performance.now() - start;
      setNetworkLatency(latency);
    } catch (error) {
      setNetworkLatency(999); // High latency to indicate error
    }
  }, []);
  
  // Auto refresh metrics
  useEffect(() => {
    calculateMetrics();
    calculateMemoryUsage();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        calculateMetrics();
        calculateMemoryUsage();
        measureLatency();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, calculateMetrics, calculateMemoryUsage, measureLatency]);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <CheckCircleIcon />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon fontSize="small" />;
      case 'down': return <TrendingDownIcon fontSize="small" />;
      default: return <TimelineIcon fontSize="small" />;
    }
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* System Health Overview */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Performance Monitor
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              icon={getStatusIcon(systemHealth)}
              label={`System ${systemHealth.toUpperCase()}`}
              color={getStatusColor(systemHealth) as any}
              variant="outlined"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={isManagerActive}
                  onChange={(e) => setIsManagerActive(e.target.checked)}
                />
              }
              label="Active"
            />
            
            <Tooltip title="Refresh Metrics">
              <IconButton onClick={() => {
                calculateMetrics();
                calculateMemoryUsage();
                measureLatency();
              }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        
        {/* Health Alerts */}
        {systemHealth === 'critical' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Critical performance issues detected. Check connection stability and resource usage.
          </Alert>
        )}
        
        {systemHealth === 'warning' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Performance warnings detected. Monitor system closely.
          </Alert>
        )}
        
        {/* Quick Stats */}
        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h4" color="primary">
                  {metrics.activeConnections}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Connections
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h4" color="secondary">
                  {metrics.messagesPerSecond.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Messages/Sec
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h4" color={networkLatency > 200 ? 'error' : 'success'}>
                  {networkLatency.toFixed(0)}ms
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latency
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h4">
                  {formatBytes(memoryUsage.used)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Memory Used
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Paper>

      {/* Detailed Metrics */}
      <Paper sx={{ p: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">
            Performance Metrics
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
              />
            }
            label="Show Details"
          />
        </Stack>
        
        <List>
          {performanceMetrics.map((metric, index) => (
            <React.Fragment key={metric.name}>
              <ListItem>
                <ListItemIcon>
                  {getStatusIcon(metric.status)}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body1">
                        {metric.name}
                      </Typography>
                      {getTrendIcon(metric.trend)}
                    </Stack>
                  }
                  secondary={showDetails ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Warning: {metric.threshold.warning}{metric.unit} | 
                        Critical: {metric.threshold.critical}{metric.unit}
                      </Typography>
                      
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((metric.value / metric.threshold.critical) * 100, 100)}
                          color={getStatusColor(metric.status) as any}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Box>
                  ) : undefined}
                />
                
                <Chip
                  label={`${metric.value}${metric.unit}`}
                  color={getStatusColor(metric.status) as any}
                  variant="outlined"
                  size="small"
                />
              </ListItem>
              
              {index < performanceMetrics.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        
        {/* Connection Details */}
        {showDetails && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Connection Details
            </Typography>
            
            <List dense>
              {connections.map((conn) => (
                <ListItem key={conn.id}>
                  <ListItemIcon>
                    {getStatusIcon(conn.status === 'connected' ? 'good' : 
                                  conn.status === 'connecting' ? 'warning' : 'critical')}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={conn.id}
                    secondary={`${conn.status} | ${conn.subscriptions.size} subscriptions | ${conn.reconnectAttempts} reconnects`}
                  />
                  
                  <Chip
                    label={conn.status}
                    color={getStatusColor(conn.status === 'connected' ? 'good' : 
                                        conn.status === 'connecting' ? 'warning' : 'critical') as any}
                    size="small"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
};