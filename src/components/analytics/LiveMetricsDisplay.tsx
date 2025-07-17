/**
 * Real-time metrics display components
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Skeleton,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUpRounded,
  TrendingDownRounded,
  RemoveRounded,
  SpeedRounded,
  AttachMoneyRounded,
  ErrorOutlineRounded,
  GroupsRounded,
  CallMadeRounded,
  PauseRounded,
  PlayArrowRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveMetrics, useMetricSubscription } from '../../hooks/useAnalyticsWebSocket';
import { formatNumber, formatCurrency, formatDuration } from '../../utils/analyticsTransformers';

// Animated number component
const AnimatedNumber: React.FC<{
  value: number;
  format?: (value: number) => string;
  prefix?: string;
  suffix?: string;
}> = ({ value, format, prefix, suffix }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const duration = 500; // Animation duration in ms
    const steps = 20;
    const stepDuration = duration / steps;
    const increment = (value - displayValue) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep === steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(prev => prev + increment);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  const formattedValue = format ? format(displayValue) : displayValue.toFixed(0);

  return (
    <span>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

// Live metric card component
const LiveMetricCard: React.FC<{
  title: string;
  value: number;
  format?: (value: number) => string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  pulse?: boolean;
}> = ({ title, value, format, icon, trend, color, pulse = false }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          ...(pulse && {
            animation: 'pulse-glow 2s ease-in-out infinite',
            '@keyframes pulse-glow': {
              '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}` },
              '50%': { boxShadow: `0 0 20px 2px ${alpha(theme.palette.primary.main, 0.3)}` },
            },
          }),
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                <AnimatedNumber value={value} format={format} />
              </Typography>
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {trend === 'up' && <TrendingUpRounded sx={{ fontSize: 16, color: 'success.main' }} />}
                  {trend === 'down' && <TrendingDownRounded sx={{ fontSize: 16, color: 'error.main' }} />}
                  {trend === 'stable' && <RemoveRounded sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  <Typography
                    variant="caption"
                    sx={{
                      ml: 0.5,
                      color: trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary',
                    }}
                  >
                    {trend}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ color: color || 'primary.main', opacity: 0.8 }}>
              {icon}
            </Box>
          </Box>
          
          {/* Live indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'success.main',
                animation: 'blink 2s ease-in-out infinite',
                '@keyframes blink': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.3 },
                },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              LIVE
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main live metrics dashboard
export const LiveMetricsDashboard: React.FC<{
  updateInterval?: number;
  showPauseControl?: boolean;
}> = ({ updateInterval = 10, showPauseControl = true }) => {
  const [isPaused, setIsPaused] = useState(false);
  const { liveMetrics, lastUpdate, connectionStatus } = useLiveMetrics(
    { updateInterval },
    !isPaused
  );

  // Individual metric subscriptions for trends
  const workflowTrend = useMetricSubscription('active_workflows', updateInterval);
  const costTrend = useMetricSubscription('cost_rate', updateInterval);
  const responseTrend = useMetricSubscription('response_time', updateInterval);
  const errorTrend = useMetricSubscription('error_rate', updateInterval);

  if (!connectionStatus.isConnected) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Connecting to real-time analytics...
        </Typography>
        <LinearProgress sx={{ mt: 2, maxWidth: 200, mx: 'auto' }} />
      </Box>
    );
  }

  if (!liveMetrics) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map(i => (
          <Grid xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      {/* Header with controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Live Metrics
          </Typography>
          {lastUpdate && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        
        {showPauseControl && (
          <Tooltip title={isPaused ? 'Resume updates' : 'Pause updates'}>
            <IconButton onClick={() => setIsPaused(!isPaused)} size="small">
              {isPaused ? <PlayArrowRounded /> : <PauseRounded />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Metric cards */}
      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <LiveMetricCard
            title="Active Workflows"
            value={liveMetrics.metrics.active_workflows}
            format={formatNumber}
            icon={<SpeedRounded sx={{ fontSize: 40 }} />}
            trend={workflowTrend.trend}
            color="primary.main"
          />
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <LiveMetricCard
            title="Cost Rate"
            value={liveMetrics.metrics.current_cost_rate}
            format={(v) => formatCurrency(v) + '/hr'}
            icon={<AttachMoneyRounded sx={{ fontSize: 40 }} />}
            trend={costTrend.trend}
            color="warning.main"
            pulse={liveMetrics.metrics.current_cost_rate > 100}
          />
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <LiveMetricCard
            title="Avg Response Time"
            value={liveMetrics.metrics.average_response_time}
            format={(v) => formatDuration(v / 1000)}
            icon={<CallMadeRounded sx={{ fontSize: 40 }} />}
            trend={responseTrend.trend}
            color="info.main"
          />
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <LiveMetricCard
            title="Error Rate"
            value={liveMetrics.metrics.error_rate}
            format={(v) => `${v.toFixed(1)}%`}
            icon={<ErrorOutlineRounded sx={{ fontSize: 40 }} />}
            trend={errorTrend.trend}
            color="error.main"
            pulse={liveMetrics.metrics.error_rate > 5}
          />
        </Grid>
      </Grid>

      {/* Additional metrics */}
      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            icon={<GroupsRounded />}
            label={`${liveMetrics.metrics.active_agents} Active Agents`}
            size="small"
          />
          <Chip
            icon={<CallMadeRounded />}
            label={`${liveMetrics.metrics.api_calls_per_minute} API Calls/min`}
            size="small"
          />
        </Stack>
      </Box>
    </Box>
  );
};

// Compact live metrics bar
export const LiveMetricsBar: React.FC = () => {
  const { liveMetrics, connectionStatus } = useLiveMetrics();

  if (!connectionStatus.isConnected || !liveMetrics) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            px: 3,
            py: 1,
          }}
        >
          <Stack direction="row" spacing={4} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SpeedRounded fontSize="small" color="action" />
              <Typography variant="body2">
                {liveMetrics.metrics.active_workflows} workflows
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoneyRounded fontSize="small" color="action" />
              <Typography variant="body2">
                {formatCurrency(liveMetrics.metrics.current_cost_rate)}/hr
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CallMadeRounded fontSize="small" color="action" />
              <Typography variant="body2">
                {formatDuration(liveMetrics.metrics.average_response_time / 1000)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorOutlineRounded fontSize="small" color="action" />
              <Typography variant="body2">
                {liveMetrics.metrics.error_rate.toFixed(1)}% errors
              </Typography>
            </Box>
            
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  animation: 'blink 2s ease-in-out infinite',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                LIVE
              </Typography>
            </Box>
          </Stack>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

// Single metric display with sparkline
export const LiveMetricSparkline: React.FC<{
  metric: string;
  title: string;
  format?: (value: number) => string;
  threshold?: number;
  thresholdType?: 'above' | 'below';
}> = ({ metric, title, format, threshold, thresholdType = 'above' }) => {
  const [history, setHistory] = useState<number[]>([]);
  const { value, trend } = useMetricSubscription(metric);

  useEffect(() => {
    if (value !== null) {
      setHistory(prev => [...prev.slice(-19), value]);
    }
  }, [value]);

  const isAlert = threshold !== undefined && value !== null && (
    (thresholdType === 'above' && value > threshold) ||
    (thresholdType === 'below' && value < threshold)
  );

  return (
    <Box
      sx={{
        p: 2,
        border: 1,
        borderColor: isAlert ? 'error.main' : 'divider',
        borderRadius: 1,
        bgcolor: isAlert ? alpha('#f44336', 0.05) : 'transparent',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color={isAlert ? 'error.main' : 'text.primary'}>
        {value !== null ? (format ? format(value) : value.toFixed(1)) : '—'}
      </Typography>
      
      {/* Simple sparkline visualization */}
      <Box sx={{ mt: 1, height: 30, position: 'relative' }}>
        <svg width="100%" height="30" style={{ overflow: 'visible' }}>
          {history.length > 1 && (
            <polyline
              fill="none"
              stroke={isAlert ? '#f44336' : '#1976d2'}
              strokeWidth="2"
              points={history
                .map((val, i) => {
                  const x = (i / (history.length - 1)) * 100;
                  const max = Math.max(...history);
                  const min = Math.min(...history);
                  const y = 30 - ((val - min) / (max - min)) * 30;
                  return `${x}%,${y}`;
                })
                .join(' ')}
            />
          )}
        </svg>
      </Box>
    </Box>
  );
};

export default {
  LiveMetricsDashboard,
  LiveMetricsBar,
  LiveMetricSparkline,
  LiveMetricCard,
};