/**
 * Performance Analytics Component
 * 
 * Detailed performance metrics and analytics for federation system.
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  SpeedOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  TimerOutlined,
  AssignmentOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';

interface PerformanceAnalyticsProps {
  metrics: any;
  health: any;
  peers: any[];
  delegations: any[];
  timeRange: string;
  isLoading: boolean;
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  metrics,
  health,
  peers,
  delegations,
  timeRange,
  isLoading,
}) => {
  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!metrics || !delegations.length) return null;

    // Response time analysis
    const completedDelegations = delegations.filter(d => d.status === 'completed' && d.execution_time_ms);
    const avgResponseTime = completedDelegations.length > 0 ? 
      completedDelegations.reduce((sum, d) => sum + d.execution_time_ms, 0) / completedDelegations.length : 0;
    
    const p95ResponseTime = completedDelegations.length > 0 ? 
      completedDelegations.sort((a, b) => a.execution_time_ms - b.execution_time_ms)[Math.floor(completedDelegations.length * 0.95)]?.execution_time_ms || 0 : 0;
    
    // Throughput analysis
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentDelegations = delegations.filter(d => new Date(d.created_at) > oneHourAgo);
    const throughputPerHour = recentDelegations.length;
    
    // Error analysis
    const errorRate = delegations.length > 0 ? 
      (delegations.filter(d => d.status === 'failed').length / delegations.length) * 100 : 0;
    
    // Peer performance
    const peerPerformance = peers.map(peer => {
      const peerDelegations = delegations.filter(d => d.target_substrate === peer.substrate_id);
      const completed = peerDelegations.filter(d => d.status === 'completed');
      const failed = peerDelegations.filter(d => d.status === 'failed');
      const avgTime = completed.length > 0 ? 
        completed.reduce((sum, d) => sum + (d.execution_time_ms || 0), 0) / completed.length : 0;
      
      return {
        peer,
        totalDelegations: peerDelegations.length,
        successRate: peerDelegations.length > 0 ? (completed.length / peerDelegations.length) * 100 : 0,
        avgResponseTime: avgTime,
        errorCount: failed.length,
      };
    }).sort((a, b) => b.totalDelegations - a.totalDelegations);

    // Task type performance
    const taskTypePerformance = new Map();
    delegations.forEach(d => {
      if (!taskTypePerformance.has(d.task_type)) {
        taskTypePerformance.set(d.task_type, {
          total: 0,
          completed: 0,
          failed: 0,
          totalTime: 0,
        });
      }
      const stats = taskTypePerformance.get(d.task_type);
      stats.total++;
      if (d.status === 'completed') {
        stats.completed++;
        stats.totalTime += d.execution_time_ms || 0;
      } else if (d.status === 'failed') {
        stats.failed++;
      }
    });

    const taskTypes = Array.from(taskTypePerformance.entries()).map(([type, stats]: [string, any]) => ({
      taskType: type,
      total: stats.total,
      successRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      avgResponseTime: stats.completed > 0 ? stats.totalTime / stats.completed : 0,
      errorRate: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
    })).sort((a, b) => b.total - a.total);

    return {
      avgResponseTime,
      p95ResponseTime,
      throughputPerHour,
      errorRate,
      peerPerformance: peerPerformance.slice(0, 10),
      taskTypes: taskTypes.slice(0, 10),
      totalDelegations: delegations.length,
      completedDelegations: delegations.filter(d => d.status === 'completed').length,
    };
  }, [metrics, delegations, peers]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'success';
    if (value >= thresholds.warning) return 'warning';
    return 'error';
  };

  const getResponseTimeColor = (ms: number) => {
    if (ms < 1000) return 'success';
    if (ms < 5000) return 'warning';
    return 'error';
  };

  if (!performanceMetrics) {
    return (
      <Alert severity="info">
        No performance data available for the selected time range.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Performance Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SpeedOutlined color="primary" />
                <Typography variant="subtitle2">Avg Response Time</Typography>
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatDuration(performanceMetrics.avgResponseTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                P95: {formatDuration(performanceMetrics.p95ResponseTime)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpOutlined color="info" />
                <Typography variant="subtitle2">Throughput</Typography>
              </Box>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {performanceMetrics.throughputPerHour}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                delegations/hour
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircleOutlined color="success" />
                <Typography variant="subtitle2">Success Rate</Typography>
              </Box>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {((1 - performanceMetrics.errorRate / 100) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {performanceMetrics.completedDelegations} of {performanceMetrics.totalDelegations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningOutlined color="warning" />
                <Typography variant="subtitle2">Error Rate</Typography>
              </Box>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {performanceMetrics.errorRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {performanceMetrics.totalDelegations - performanceMetrics.completedDelegations} failures
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Details */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Peer Performance ({timeRange})
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Peer</TableCell>
                    <TableCell align="right">Delegations</TableCell>
                    <TableCell align="right">Success Rate</TableCell>
                    <TableCell align="right">Avg Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceMetrics.peerPerformance.map((peerStats, index) => (
                    <TableRow key={peerStats.peer.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" noWrap>
                            {peerStats.peer.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {peerStats.peer.status}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {peerStats.totalDelegations}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                          <Typography variant="body2">
                            {peerStats.successRate.toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={peerStats.successRate}
                            color={getPerformanceColor(peerStats.successRate, { good: 90, warning: 70 })}
                            sx={{ width: 40, height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatDuration(peerStats.avgResponseTime)}
                          size="small"
                          color={getResponseTimeColor(peerStats.avgResponseTime)}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Type Performance ({timeRange})
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Success Rate</TableCell>
                    <TableCell align="right">Avg Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceMetrics.taskTypes.map((taskStats, index) => (
                    <TableRow key={taskStats.taskType} hover>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {taskStats.taskType}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {taskStats.total}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                          <Typography variant="body2">
                            {taskStats.successRate.toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={taskStats.successRate}
                            color={getPerformanceColor(taskStats.successRate, { good: 90, warning: 70 })}
                            sx={{ width: 40, height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatDuration(taskStats.avgResponseTime)}
                          size="small"
                          color={getResponseTimeColor(taskStats.avgResponseTime)}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Performance Insights */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Performance Insights
        </Typography>
        
        <List>
          {performanceMetrics.avgResponseTime > 5000 && (
            <ListItem>
              <ListItemText
                primary="High Response Times Detected"
                secondary={`Average response time is ${formatDuration(performanceMetrics.avgResponseTime)}, which is above the recommended 5s threshold.`}
                primaryTypographyProps={{ color: 'warning.main' }}
              />
            </ListItem>
          )}
          
          {performanceMetrics.errorRate > 10 && (
            <ListItem>
              <ListItemText
                primary="Elevated Error Rate"
                secondary={`Current error rate of ${performanceMetrics.errorRate.toFixed(1)}% is above the acceptable 10% threshold.`}
                primaryTypographyProps={{ color: 'error.main' }}
              />
            </ListItem>
          )}
          
          {performanceMetrics.throughputPerHour < 10 && (
            <ListItem>
              <ListItemText
                primary="Low Throughput"
                secondary={`Current throughput of ${performanceMetrics.throughputPerHour} delegations/hour may indicate underutilization.`}
                primaryTypographyProps={{ color: 'info.main' }}
              />
            </ListItem>
          )}
          
          {performanceMetrics.avgResponseTime < 1000 && performanceMetrics.errorRate < 5 && (
            <ListItem>
              <ListItemText
                primary="Excellent Performance"
                secondary="System is performing optimally with fast response times and low error rates."
                primaryTypographyProps={{ color: 'success.main' }}
              />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default PerformanceAnalytics;