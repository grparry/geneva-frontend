import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Group as GroupIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { FederationMetrics } from '../../types/federation';

interface FederationMetricsCardProps {
  metrics: FederationMetrics;
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  trend?: 'up' | 'down' | 'neutral';
}

const MetricItem: React.FC<MetricItemProps> = ({ 
  icon, 
  label, 
  value, 
  subValue,
  color = 'primary',
  trend
}) => (
  <Box>
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      <Box color={`${color}.main`}>{icon}</Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {trend && (
        <Box display="flex" alignItems="center">
          {trend === 'up' ? (
            <TrendingUpIcon fontSize="small" color="success" />
          ) : trend === 'down' ? (
            <TrendingDownIcon fontSize="small" color="error" />
          ) : null}
        </Box>
      )}
    </Box>
    <Typography variant="h5" fontWeight="bold" color={`${color}.main`}>
      {value}
    </Typography>
    {subValue && (
      <Typography variant="caption" color="text.secondary">
        {subValue}
      </Typography>
    )}
  </Box>
);

export const FederationMetricsCard: React.FC<FederationMetricsCardProps> = ({ metrics }) => {
  const successRate = metrics.total_delegations > 0
    ? (metrics.successful_delegations / metrics.total_delegations) * 100
    : 0;

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'success';
    if (rate >= 80) return 'warning';
    return 'error';
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Federation Metrics
        </Typography>

        <Box display="flex" gap={3} flexWrap="wrap">
          {/* Peer Metrics */}
          <Box flex={{ xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }}>
            <MetricItem
              icon={<GroupIcon />}
              label="Connected Peers"
              value={`${metrics.connected_peers}/${metrics.total_peers}`}
              subValue={`${Math.round((metrics.connected_peers / metrics.total_peers) * 100)}% online`}
              color="primary"
            />
          </Box>

          {/* Delegation Success */}
          <Box flex={{ xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }}>
            <MetricItem
              icon={<SuccessIcon />}
              label="Successful Delegations"
              value={metrics.successful_delegations}
              subValue={`${successRate.toFixed(1)}% success rate`}
              color={getSuccessRateColor(successRate)}
            />
          </Box>

          {/* Failed Delegations */}
          <Box flex={{ xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }}>
            <MetricItem
              icon={<ErrorIcon />}
              label="Failed Delegations"
              value={metrics.failed_delegations}
              color="error"
              trend={metrics.failed_delegations > 0 ? 'up' : 'neutral'}
            />
          </Box>

          {/* Average Response Time */}
          <Box flex={{ xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }}>
            <MetricItem
              icon={<SpeedIcon />}
              label="Avg Response Time"
              value={`${metrics.avg_delegation_time_ms}ms`}
              color="info"
            />
          </Box>
        </Box>

        {/* Additional Metrics */}
        <Box mt={3}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Box flex={{ xs: "1 1 100%", md: "1 1 45%" }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                  Total Delegations
                </Typography>
                <Chip label={metrics.total_delegations} size="small" />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Success Rate Progress Bar */}
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Delegation Success Rate
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {successRate.toFixed(1)}%
            </Typography>
          </Box>
          <Tooltip title={`${metrics.successful_delegations} successful out of ${metrics.total_delegations} total`}>
            <LinearProgress
              variant="determinate"
              value={successRate}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getSuccessRateColor(successRate) === 'success' 
                    ? 'success.main' 
                    : getSuccessRateColor(successRate) === 'warning'
                    ? 'warning.main'
                    : 'error.main',
                  borderRadius: 4
                }
              }}
            />
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};