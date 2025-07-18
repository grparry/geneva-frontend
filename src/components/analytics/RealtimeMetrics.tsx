/**
 * Realtime metrics display component
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  useTheme,
} from '@mui/material';
import { 
  TrendingUpRounded,
  TrendingDownRounded,
  SpeedRounded,
  MemoryRounded 
} from '@mui/icons-material';

interface MetricData {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: 'primary' | 'success' | 'warning' | 'error';
}

interface RealtimeMetricsProps {
  className?: string;
}

const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      label: 'Active Users',
      value: 1247,
      unit: '',
      trend: 'up',
      color: 'success',
    },
    {
      label: 'Response Time',
      value: 120,
      unit: 'ms',
      trend: 'down',
      color: 'success',
    },
    {
      label: 'Error Rate',
      value: 0.5,
      unit: '%',
      trend: 'stable',
      color: 'primary',
    },
    {
      label: 'Memory Usage',
      value: 68.5,
      unit: '%',
      trend: 'up',
      color: 'warning',
    },
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 10,
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpRounded fontSize="small" />;
      case 'down':
        return <TrendingDownRounded fontSize="small" />;
      default:
        return <SpeedRounded fontSize="small" />;
    }
  };

  return (
    <Box className={className}>
      <Typography variant="h6" gutterBottom>
        Real-time Metrics
      </Typography>
      <Grid container spacing={2}>
        {metrics.map((metric, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {metric.label}
                    </Typography>
                    <Typography variant="h6">
                      {metric.value.toFixed(1)}{metric.unit}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getTrendIcon(metric.trend)}
                    label={metric.trend}
                    color={metric.color}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RealtimeMetrics;