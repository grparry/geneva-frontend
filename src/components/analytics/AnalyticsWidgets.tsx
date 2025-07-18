/**
 * Analytics widgets for the main dashboard
 * Provides quick insights and links to detailed analytics pages
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUpRounded,
  TrendingDownRounded,
  AttachMoneyRounded,
  SpeedRounded,
  GroupsRounded,
  CheckCircleRounded,
  ArrowForwardRounded,
  RefreshRounded,
  NotificationsRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useKPIMetrics, useCostAnalysis } from '../../hooks/useAnalytics';
import { useLiveMetrics, useCostAlerts } from '../../hooks/useAnalyticsWebSocket';
import { LiveMetricSparkline } from '../analytics/LiveMetricsDisplay';
import { ConnectionIndicator } from '../analytics/WebSocketConnectionManager';

// Mini KPI Card
const MiniKPICard: React.FC<{
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  color?: string;
  onClick?: () => void;
  isLive?: boolean;
}> = ({ title, value, trend, icon, color = 'primary.main', onClick, isLive }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        sx={{ 
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': onClick ? {
            boxShadow: theme.shadows[4],
          } : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 2, pb: 1, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {title}
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                {value}
              </Typography>
              {trend !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {trend > 0 ? (
                    <TrendingUpRounded sx={{ fontSize: 14, color: 'success.main' }} />
                  ) : (
                    <TrendingDownRounded sx={{ fontSize: 14, color: 'error.main' }} />
                  )}
                  <Typography variant="caption" sx={{ ml: 0.5, color: trend > 0 ? 'success.main' : 'error.main' }}>
                    {Math.abs(trend).toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ color, opacity: 0.8 }}>
              {icon}
            </Box>
          </Box>
          {isLive && (
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Analytics Overview Widget
export const AnalyticsOverviewWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data: kpiData, isLoading, refetch } = useKPIMetrics('24h');
  const { liveMetrics } = useLiveMetrics();
  
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Analytics Overview</Typography>
            <ConnectionIndicator size="small" />
          </Box>
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map(i => (
              <Grid size={{ xs: 6 }} key={i}>
                <Skeleton variant="rectangular" height={80} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Analytics Overview</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <ConnectionIndicator size="small" />
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => refetch()}>
                <RefreshRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <MiniKPICard
              title="Workflows"
              value={liveMetrics?.metrics.active_workflows || kpiData?.workflows.total || 0}
              trend={kpiData?.workflows.trend}
              icon={<SpeedRounded />}
              onClick={() => navigate('/analytics/workflows')}
              isLive={!!liveMetrics}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <MiniKPICard
              title="Success Rate"
              value={kpiData?.workflows.successRateFormatted || '0%'}
              icon={<CheckCircleRounded />}
              color="success.main"
              onClick={() => navigate('/analytics/workflows')}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <MiniKPICard
              title="Total Cost"
              value={kpiData?.costs.totalFormatted || '$0'}
              trend={kpiData?.costs.trend}
              icon={<AttachMoneyRounded />}
              color="warning.main"
              onClick={() => navigate('/analytics/costs')}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <MiniKPICard
              title="Active Agents"
              value={liveMetrics?.metrics.active_agents || kpiData?.agents.active_count || 0}
              icon={<GroupsRounded />}
              color="info.main"
              onClick={() => navigate('/analytics/agents')}
              isLive={!!liveMetrics}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button 
          size="small" 
          endIcon={<ArrowForwardRounded />}
          onClick={() => navigate('/analytics')}
        >
          View Full Dashboard
        </Button>
      </CardActions>
    </Card>
  );
};

// Cost Alert Widget
export const CostAlertWidget: React.FC = () => {
  const navigate = useNavigate();
  const { alerts, unreadCount } = useCostAlerts(['high', 'critical']);
  const theme = useTheme();
  
  if (alerts.length === 0) {
    return null;
  }
  
  const latestAlert = alerts[0];
  const severity = latestAlert.severity;
  const severityColor = severity === 'critical' ? 'error' : 'warning';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card 
        sx={{ 
          borderLeft: 4,
          borderColor: `${severityColor}.main`,
          bgcolor: alpha(theme.palette[severityColor].main, 0.05),
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsRounded color={severityColor} />
              <Typography variant="subtitle2" fontWeight="medium">
                Cost Alert
              </Typography>
            </Box>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} new`}
                size="small"
                color={severityColor}
              />
            )}
          </Box>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            {latestAlert.message}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Current: {latestAlert.current_value.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Threshold: {latestAlert.threshold_value.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button 
            size="small" 
            color={severityColor}
            onClick={() => navigate('/analytics/costs')}
          >
            View Details
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};

// Live Metrics Widget
export const LiveMetricsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { liveMetrics, connectionStatus } = useLiveMetrics();
  
  if (!connectionStatus.isConnected || !liveMetrics) {
    return null;
  }
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Live Metrics</Typography>
          <ConnectionIndicator size="small" showLabel />
        </Box>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <LiveMetricSparkline
              metric="cost_rate"
              title="Cost Rate"
              format={(v) => `$${v.toFixed(2)}/hr`}
              threshold={100}
              thresholdType="above"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <LiveMetricSparkline
              metric="error_rate"
              title="Error Rate"
              format={(v) => `${v.toFixed(1)}%`}
              threshold={5}
              thresholdType="above"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <LiveMetricSparkline
              metric="response_time"
              title="Response Time"
              format={(v) => `${(v/1000).toFixed(1)}s`}
              threshold={5000}
              thresholdType="above"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <LiveMetricSparkline
              metric="api_calls"
              title="API Calls/min"
              format={(v) => v.toFixed(0)}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button 
          size="small" 
          endIcon={<ArrowForwardRounded />}
          onClick={() => navigate('/analytics')}
        >
          View Analytics
        </Button>
      </CardActions>
    </Card>
  );
};

// Quick Cost Summary Widget
export const QuickCostSummary: React.FC = () => {
  const navigate = useNavigate();
  const { data: costData, isLoading } = useCostAnalysis('7d');
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }
  
  const costIncrease = costData?.costTrendsFormatted?.[0]?.total_cost || 0;
  const isOverBudget = costIncrease > 10;
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Weekly Cost Summary
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" fontWeight="bold">
            {costData?.totalFormatted || '$0'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            {costIncrease > 0 ? (
              <TrendingUpRounded sx={{ fontSize: 20, color: isOverBudget ? 'error.main' : 'warning.main' }} />
            ) : (
              <TrendingDownRounded sx={{ fontSize: 20, color: 'success.main' }} />
            )}
            <Typography 
              variant="body2" 
              sx={{ color: costIncrease > 0 ? (isOverBudget ? 'error.main' : 'warning.main') : 'success.main' }}
            >
              {Math.abs(costIncrease).toFixed(1)}% from last week
            </Typography>
          </Box>
        </Box>
        
        {costData?.distribution && (
          <Stack spacing={1}>
            {costData.distribution.map((item: any, index: number) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.name}
                  </Typography>
                  <Typography variant="caption" fontWeight="medium">
                    {item.formatted}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.percentage}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button 
          size="small" 
          endIcon={<ArrowForwardRounded />}
          onClick={() => navigate('/analytics/costs')}
        >
          View Cost Analysis
        </Button>
      </CardActions>
    </Card>
  );
};

// Export all widgets
export default {
  AnalyticsOverviewWidget,
  CostAlertWidget,
  LiveMetricsWidget,
  QuickCostSummary,
};