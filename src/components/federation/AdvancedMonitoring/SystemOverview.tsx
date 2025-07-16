/**
 * System Overview Component
 * 
 * High-level system health and metrics overview for federation monitoring.
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  DeviceHubOutlined,
  AssignmentOutlined,
  SecurityOutlined,
  SpeedOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ErrorOutlined,
  InfoOutlined,
} from '@mui/icons-material';

interface SystemOverviewProps {
  metrics: any;
  health: any;
  peers: any[];
  delegations: any[];
  systemStatus: any;
  timeRange: string;
  isLoading: boolean;
}

const SystemOverview: React.FC<SystemOverviewProps> = ({
  metrics,
  health,
  peers,
  delegations,
  systemStatus,
  timeRange,
  isLoading,
}) => {
  // Calculate system metrics
  const systemMetrics = useMemo(() => {
    if (!metrics || !health) return null;

    const totalPeers = peers.length;
    const healthyPeers = peers.filter(p => p.status === 'healthy' || p.status === 'connected').length;
    const trustedPeers = peers.filter(p => p.trust_level === 'trusted' || p.trust_level === 'full').length;
    
    const totalDelegations = delegations.length;
    const successfulDelegations = delegations.filter(d => d.status === 'completed').length;
    const failedDelegations = delegations.filter(d => d.status === 'failed').length;
    const pendingDelegations = delegations.filter(d => d.status === 'pending' || d.status === 'executing').length;
    
    const successRate = totalDelegations > 0 ? (successfulDelegations / totalDelegations) * 100 : 0;
    const healthRate = totalPeers > 0 ? (healthyPeers / totalPeers) * 100 : 0;
    const trustRate = totalPeers > 0 ? (trustedPeers / totalPeers) * 100 : 0;

    return {
      totalPeers,
      healthyPeers,
      trustedPeers,
      totalDelegations,
      successfulDelegations,
      failedDelegations,
      pendingDelegations,
      successRate,
      healthRate,
      trustRate,
      networkHealth: health.network_health * 100,
      avgResponseTime: metrics.avg_delegation_time_ms || 0,
    };
  }, [metrics, health, peers, delegations]);

  // Get recent trends
  const trends = useMemo(() => {
    if (!systemMetrics) return null;

    return {
      health: systemMetrics.healthRate > 80 ? 'up' : systemMetrics.healthRate > 60 ? 'stable' : 'down',
      performance: systemMetrics.successRate > 90 ? 'up' : systemMetrics.successRate > 70 ? 'stable' : 'down',
      trust: systemMetrics.trustRate > 60 ? 'up' : systemMetrics.trustRate > 40 ? 'stable' : 'down',
      activity: systemMetrics.pendingDelegations > 5 ? 'up' : 'stable',
    };
  }, [systemMetrics]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpOutlined color="success" fontSize="small" />;
      case 'down':
        return <TrendingDownOutlined color="error" fontSize="small" />;
      default:
        return <TrendingUpOutlined color="disabled" fontSize="small" />;
    }
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  if (!systemMetrics || !systemStatus) {
    return (
      <Alert severity="info">
        Loading system overview data...
      </Alert>
    );
  }

  return (
    <Box>
      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DeviceHubOutlined color="primary" />
                {trends && getTrendIcon(trends.health)}
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {systemMetrics.totalPeers}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Peers
              </Typography>
              <Typography variant="caption" color="success.main">
                {systemMetrics.healthyPeers} healthy
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemMetrics.healthRate}
                color={getHealthColor(systemMetrics.healthRate)}
                sx={{ mt: 1, height: 4, borderRadius: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <AssignmentOutlined color="info" />
                {trends && getTrendIcon(trends.performance)}
              </Box>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {systemMetrics.totalDelegations}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Delegations
              </Typography>
              <Typography variant="caption" color="success.main">
                {systemMetrics.successRate.toFixed(1)}% success
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemMetrics.successRate}
                color={getHealthColor(systemMetrics.successRate)}
                sx={{ mt: 1, height: 4, borderRadius: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <SecurityOutlined color="success" />
                {trends && getTrendIcon(trends.trust)}
              </Box>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {systemMetrics.trustedPeers}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Trusted Peers
              </Typography>
              <Typography variant="caption" color="success.main">
                {systemMetrics.trustRate.toFixed(1)}% trusted
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemMetrics.trustRate}
                color={getHealthColor(systemMetrics.trustRate)}
                sx={{ mt: 1, height: 4, borderRadius: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <SpeedOutlined color="warning" />
                {trends && getTrendIcon(trends.activity)}
              </Box>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {systemMetrics.avgResponseTime > 1000 ? 
                  `${(systemMetrics.avgResponseTime / 1000).toFixed(1)}s` : 
                  `${systemMetrics.avgResponseTime.toFixed(0)}ms`
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg Response
              </Typography>
              <Typography variant="caption" color="info.main">
                {systemMetrics.pendingDelegations} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Health Dashboard */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health Overview
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    {systemMetrics.networkHealth.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Network Health
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={systemMetrics.networkHealth}
                    color={getHealthColor(systemMetrics.networkHealth)}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main" fontWeight="bold">
                    {systemMetrics.successRate.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={systemMetrics.successRate}
                    color="success"
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="info.main" fontWeight="bold">
                    {systemMetrics.healthRate.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Peer Health
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={systemMetrics.healthRate}
                    color="info"
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Status Breakdown */}
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="h5" color="success.contrastText" fontWeight="bold">
                    {systemMetrics.successfulDelegations}
                  </Typography>
                  <Typography variant="caption" color="success.contrastText">
                    Completed
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="h5" color="warning.contrastText" fontWeight="bold">
                    {systemMetrics.pendingDelegations}
                  </Typography>
                  <Typography variant="caption" color="warning.contrastText">
                    In Progress
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant="h5" color="error.contrastText" fontWeight="bold">
                    {systemMetrics.failedDelegations}
                  </Typography>
                  <Typography variant="caption" color="error.contrastText">
                    Failed
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="h5" color="primary.contrastText" fontWeight="bold">
                    {systemMetrics.trustedPeers}
                  </Typography>
                  <Typography variant="caption" color="primary.contrastText">
                    Trusted
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              System Alerts
            </Typography>

            {health?.issues && health.issues.length > 0 ? (
              <List dense>
                {health.issues.slice(0, 5).map((issue: any, index: number) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {issue.severity === 'critical' ? (
                        <ErrorOutlined color="error" fontSize="small" />
                      ) : issue.severity === 'high' ? (
                        <WarningOutlined color="warning" fontSize="small" />
                      ) : (
                        <InfoOutlined color="info" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={issue.message}
                      secondary={`${issue.severity} • ${issue.component || 'System'}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
                
                {health.issues.length > 5 && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={`+${health.issues.length - 5} more issues`}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                <CheckCircleOutlined color="success" />
                <Typography variant="body2" color="success.main">
                  No active alerts. System is healthy.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Stats Summary */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Summary ({timeRange})
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Chip
              icon={<DeviceHubOutlined />}
              label={`${systemMetrics.totalPeers} Peers (${systemMetrics.healthyPeers} healthy)`}
              color="primary"
              variant="outlined"
              sx={{ width: '100%', justifyContent: 'flex-start' }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Chip
              icon={<AssignmentOutlined />}
              label={`${systemMetrics.totalDelegations} Delegations (${systemMetrics.successRate.toFixed(0)}% success)`}
              color="info"
              variant="outlined"
              sx={{ width: '100%', justifyContent: 'flex-start' }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Chip
              icon={<SecurityOutlined />}
              label={`${systemMetrics.trustedPeers} Trusted (${systemMetrics.trustRate.toFixed(0)}% of peers)`}
              color="success"
              variant="outlined"
              sx={{ width: '100%', justifyContent: 'flex-start' }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Chip
              icon={systemStatus.overallStatus === 'healthy' ? <CheckCircleOutlined /> : <WarningOutlined />}
              label={`System ${systemStatus.overallStatus}`}
              color={getHealthColor(systemMetrics.networkHealth)}
              variant="outlined"
              sx={{ width: '100%', justifyContent: 'flex-start' }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SystemOverview;