/**
 * Federation Metrics Component
 * 
 * Dashboard displaying federation performance metrics and analytics.
 */

import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  DeviceHubOutlined,
  AssignmentOutlined,
  SecurityOutlined,
  SpeedOutlined,
  WarningAmberOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';

// Federation hooks and services
import { 
  useGetFederationMetricsQuery,
  useGetFederationHealthQuery,
} from '../../../api/federation';
import { useMetricsWebSocket } from '../../../hooks/useFederationWebSocket';

// Federation types
import { FederationMetrics, FederationHealth } from '../../../types/federation';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement;
  trend?: 'up' | 'down' | 'stable';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  progress?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  progress,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUpOutlined color="success" fontSize="small" />;
      case 'down':
        return <TrendingDownOutlined color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
          {trend && getTrendIcon()}
        </Box>
        
        <Typography variant="h4" color={`${color}.main`} fontWeight="bold" gutterBottom>
          {value}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={color}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const FederationMetrics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('hour');

  // API queries
  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    error: metricsError 
  } = useGetFederationMetricsQuery({
    timeRange: { start: '', end: '' }, // TODO: Calculate based on timeRange
  });
  
  const { 
    data: health, 
    isLoading: healthLoading, 
    error: healthError 
  } = useGetFederationHealthQuery();

  // Real-time metrics updates
  const { isConnected } = useMetricsWebSocket((updatedMetrics) => {
    console.log('Metrics updated:', updatedMetrics);
    // RTK Query will automatically update the cache
  });

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const getSuccessRate = (metrics?: FederationMetrics) => {
    if (!metrics || metrics.total_delegations === 0) return 0;
    return (metrics.successful_delegations / metrics.total_delegations) * 100;
  };

  // Loading state
  if ((metricsLoading || healthLoading) && !metrics && !health) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading federation metrics...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Federation Analytics</Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isConnected && (
            <Chip
              label="Real-time updates unavailable"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="hour">Last Hour</MenuItem>
              <MenuItem value="day">Last Day</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Error Alerts */}
      {metricsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load federation metrics: {metricsError.toString()}
        </Alert>
      )}
      
      {healthError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Health information unavailable: {healthError.toString()}
        </Alert>
      )}

      {/* Overall Health Status */}
      {health && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6">Overall Health</Typography>
                <Chip
                  label={health.overall_status.toUpperCase()}
                  color={getHealthColor(health.overall_status)}
                  icon={
                    health.overall_status === 'healthy' ? <CheckCircleOutlined /> :
                    <WarningAmberOutlined />
                  }
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {formatPercentage(health.network_health)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Network Health
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {formatPercentage(health.peer_connectivity)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Peer Connectivity
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {formatPercentage(health.delegation_success_rate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {health.trust_violations}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Trust Violations
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {health.issues.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Active Issues ({health.issues.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {health.issues.slice(0, 3).map((issue, index) => (
                      <Chip
                        key={index}
                        label={issue.message}
                        size="small"
                        color={
                          issue.severity === 'critical' ? 'error' :
                          issue.severity === 'high' ? 'warning' : 'info'
                        }
                        variant="outlined"
                      />
                    ))}
                    {health.issues.length > 3 && (
                      <Chip
                        label={`+${health.issues.length - 3} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Key Metrics Cards */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Peers"
              value={metrics.total_peers}
              subtitle={`${metrics.connected_peers} connected`}
              icon={<DeviceHubOutlined />}
              color="primary"
              progress={(metrics.connected_peers / Math.max(metrics.total_peers, 1)) * 100}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Delegations"
              value={metrics.total_delegations}
              subtitle={`${metrics.successful_delegations} successful`}
              icon={<AssignmentOutlined />}
              color="info"
              progress={getSuccessRate(metrics)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Trusted Peers"
              value={metrics.trusted_peers}
              subtitle={`of ${metrics.total_peers} total`}
              icon={<SecurityOutlined />}
              color="success"
              progress={(metrics.trusted_peers / Math.max(metrics.total_peers, 1)) * 100}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg Response Time"
              value={formatDuration(metrics.avg_delegation_time_ms)}
              subtitle="delegation execution"
              icon={<SpeedOutlined />}
              color="warning"
            />
          </Grid>
        </Grid>
      )}

      {/* Performance Breakdown */}
      {metrics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Delegation Performance
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Success Rate</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatPercentage(getSuccessRate(metrics) / 100)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getSuccessRate(metrics)}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h5" color="success.contrastText" fontWeight="bold">
                      {metrics.successful_delegations}
                    </Typography>
                    <Typography variant="caption" color="success.contrastText">
                      Successful
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="h5" color="error.contrastText" fontWeight="bold">
                      {metrics.failed_delegations}
                    </Typography>
                    <Typography variant="caption" color="error.contrastText">
                      Failed
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Network Status
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Network Health</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {health ? formatPercentage(health.network_health) : 'Unknown'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={health ? health.network_health * 100 : 0}
                  color={health ? getHealthColor(health.overall_status) : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {metrics.total_peers}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {metrics.connected_peers}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Connected
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="info.main" fontWeight="bold">
                      {metrics.trusted_peers}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Trusted
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* No Data State */}
      {!metrics && !metricsLoading && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No metrics data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Metrics will appear here once federation activity begins.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FederationMetrics;