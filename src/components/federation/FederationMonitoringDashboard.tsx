import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tab,
  Tabs,
  Card,
  CardContent,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as LatencyIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Security as TrustIcon
} from '@mui/icons-material';
import { FederationMetrics, DelegationStatus, TrustLevel } from '../../types/federation';
import { useFederation } from '../../hooks/useFederation';
import { formatDistanceToNow } from 'date-fns';

interface FederationMonitoringDashboardProps {
  metrics: FederationMetrics;
  historicalData?: any[]; // Would come from API
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  trend,
  icon,
  color
}) => {
  const getTrendIcon = () => {
    if (!trend || trend === 'neutral') return null;
    return trend === 'up' ? (
      <TrendingUpIcon fontSize="small" color="success" />
    ) : (
      <TrendingDownIcon fontSize="small" color="error" />
    );
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Box color={color}>{icon}</Box>
        </Box>
        <Box display="flex" alignItems="baseline" gap={1}>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {value}
          </Typography>
          {getTrendIcon()}
        </Box>
        {subValue && (
          <Typography variant="caption" color="text.secondary">
            {subValue}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export const FederationMonitoringDashboard: React.FC<FederationMonitoringDashboardProps> = ({
  metrics,
  historicalData = []
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');
  const { peers } = useFederation();

  // Calculate derived metrics
  const successRate = metrics.total_delegations > 0
    ? (metrics.successful_delegations / metrics.total_delegations) * 100
    : 100;

  const peerAvailability = metrics.total_peers > 0
    ? (metrics.connected_peers / metrics.total_peers) * 100
    : 0;

  // Mock historical data - would come from API
  const mockHistoricalData = useMemo(() => {
    const now = Date.now();
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    
    return Array.from({ length: hours / 6 }, (_, i) => {
      const timestamp = new Date(now - (hours - i * 6) * 60 * 60 * 1000);
      return {
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        successful: Math.floor(Math.random() * 50) + 80,
        failed: Math.floor(Math.random() * 10) + 5,
        latency: Math.floor(Math.random() * 50) + 30,
        peers: Math.floor(Math.random() * 3) + metrics.connected_peers
      };
    });
  }, [timeRange, metrics.connected_peers]);

  // Trust level distribution
  const trustDistribution = useMemo(() => {
    const distribution = {
      [TrustLevel.NONE]: 0,
      [TrustLevel.BASIC]: 0,
      [TrustLevel.VERIFIED]: 0,
      [TrustLevel.TRUSTED]: 0,
      [TrustLevel.FULL]: 0
    };

    peers.forEach(peer => {
      distribution[peer.trust_level]++;
    });

    return Object.entries(distribution)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => ({
        name: level,
        value: count,
        color: {
          [TrustLevel.NONE]: theme.palette.error.main,
          [TrustLevel.BASIC]: theme.palette.warning.main,
          [TrustLevel.VERIFIED]: theme.palette.info.main,
          [TrustLevel.TRUSTED]: theme.palette.success.light,
          [TrustLevel.FULL]: theme.palette.success.main
        }[level as TrustLevel]
      }));
  }, [peers, theme]);

  // Delegation status breakdown
  const statusBreakdown = [
    { name: 'Successful', value: metrics.successful_delegations, color: theme.palette.success.main },
    { name: 'Failed', value: metrics.failed_delegations, color: theme.palette.error.main },
    { name: 'Pending', value: metrics.total_delegations - metrics.successful_delegations - metrics.failed_delegations, color: theme.palette.warning.main }
  ].filter(item => item.value > 0);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Federation Monitoring</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Box flex={{ xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }}>
          <MetricCard
            title="Success Rate"
            value={`${successRate.toFixed(1)}%`}
            subValue={`${metrics.successful_delegations} successful`}
            trend={successRate >= 95 ? 'up' : 'down'}
            icon={<SuccessIcon />}
            color={theme.palette.success.main}
          />
        </Box>
        
        <Box flex={{ xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }}>
          <MetricCard
            title="Avg Latency"
            value={`${metrics.avg_delegation_time_ms}ms`}
            subValue="Response time"
            trend={metrics.avg_delegation_time_ms < 100 ? 'up' : 'down'}
            icon={<LatencyIcon />}
            color={theme.palette.info.main}
          />
        </Box>
        
        <Box flex={{ xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }}>
          <MetricCard
            title="Peer Availability"
            value={`${peerAvailability.toFixed(0)}%`}
            subValue={`${metrics.connected_peers}/${metrics.total_peers} online`}
            trend={peerAvailability >= 80 ? 'up' : 'down'}
            icon={<TrustIcon />}
            color={theme.palette.primary.main}
          />
        </Box>
        
        <Box flex={{ xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }}>
          <MetricCard
            title="Network Health"
            value={`${(metrics.network_health * 100).toFixed(1)}%`}
            subValue="Overall health"
            trend={metrics.network_health > 0.8 ? 'up' : 'down'}
            icon={<TrustIcon />}
            color={metrics.network_health > 0.8 ? theme.palette.success.main : theme.palette.warning.main}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Delegation Trends" />
          <Tab label="Latency Analysis" />
          <Tab label="Trust Distribution" />
          <Tab label="Peer Availability" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delegation Success/Failure Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockHistoricalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="successful"
                  stackId="1"
                  stroke={theme.palette.success.main}
                  fill={theme.palette.success.light}
                  name="Successful"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke={theme.palette.error.main}
                  fill={theme.palette.error.light}
                  name="Failed"
                />
              </AreaChart>
            </ResponsiveContainer>
            
            <Box mt={3} display="flex" gap={3}>
              <Box flex={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Status Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Paper>
        )}

        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Average Latency Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockHistoricalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  name="Latency (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Peer Trust Level Distribution
            </Typography>
            <Box display="flex" gap={3} alignItems="center">
              <Box flex={1}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trustDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {trustDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box>
                {Object.values(TrustLevel).map(level => (
                  <Box key={level} display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        backgroundColor: {
                          [TrustLevel.NONE]: theme.palette.error.main,
                          [TrustLevel.BASIC]: theme.palette.warning.main,
                          [TrustLevel.VERIFIED]: theme.palette.info.main,
                          [TrustLevel.TRUSTED]: theme.palette.success.light,
                          [TrustLevel.FULL]: theme.palette.success.main
                        }[level],
                        borderRadius: '50%'
                      }}
                    />
                    <Typography variant="body2">{level}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        )}

        {activeTab === 3 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Peer Availability Timeline
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockHistoricalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="stepAfter"
                  dataKey="peers"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  name="Connected Peers"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        )}
      </Box>
    </Box>
  );
};