/**
 * Connection Metrics Component
 * 
 * Displays network connectivity statistics and health metrics.
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  AccountTreeOutlined,
  DeviceHubOutlined,
  LinkOutlined,
  SignalWifiOffOutlined,
} from '@mui/icons-material';

interface NetworkStats {
  totalNodes: number;
  totalEdges: number;
  connectedNodes: number;
  isolatedNodes: number;
  averageConnections: number;
}

interface ConnectionMetricsProps {
  stats: NetworkStats;
}

const ConnectionMetrics: React.FC<ConnectionMetricsProps> = ({ stats }) => {
  const connectivityRate = stats.totalNodes > 0 ? 
    (stats.connectedNodes / stats.totalNodes) * 100 : 0;

  const getConnectivityColor = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'error';
  };

  const getConnectivityStatus = (rate: number) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    if (rate >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        minWidth: 240,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Network Metrics
      </Typography>

      {/* Overall Connectivity */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Connectivity
          </Typography>
          <Chip
            label={getConnectivityStatus(connectivityRate)}
            size="small"
            color={getConnectivityColor(connectivityRate)}
            variant="outlined"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={connectivityRate}
          color={getConnectivityColor(connectivityRate)}
          sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
        />
        <Typography variant="caption" color="text.secondary">
          {connectivityRate.toFixed(1)}% of nodes connected
        </Typography>
      </Box>

      {/* Network Statistics Grid */}
      <Grid container spacing={1}>
        <Grid size={{ xs: 6 }}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
            <DeviceHubOutlined fontSize="small" sx={{ color: 'primary.contrastText', mb: 0.5 }} />
            <Typography variant="h6" color="primary.contrastText" fontWeight="bold">
              {stats.totalNodes}
            </Typography>
            <Typography variant="caption" color="primary.contrastText">
              Total Nodes
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 6 }}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
            <LinkOutlined fontSize="small" sx={{ color: 'info.contrastText', mb: 0.5 }} />
            <Typography variant="h6" color="info.contrastText" fontWeight="bold">
              {stats.totalEdges}
            </Typography>
            <Typography variant="caption" color="info.contrastText">
              Connections
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 6 }}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
            <AccountTreeOutlined fontSize="small" sx={{ color: 'success.contrastText', mb: 0.5 }} />
            <Typography variant="h6" color="success.contrastText" fontWeight="bold">
              {stats.connectedNodes}
            </Typography>
            <Typography variant="caption" color="success.contrastText">
              Connected
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 6 }}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
            <SignalWifiOffOutlined fontSize="small" sx={{ color: 'warning.contrastText', mb: 0.5 }} />
            <Typography variant="h6" color="warning.contrastText" fontWeight="bold">
              {stats.isolatedNodes}
            </Typography>
            <Typography variant="caption" color="warning.contrastText">
              Isolated
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Average Connections */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Average Connections per Node
        </Typography>
        <Typography variant="h6" color="primary" fontWeight="bold">
          {stats.averageConnections}
        </Typography>
      </Box>

      {/* Network Health Indicators */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
          Network Health
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {stats.isolatedNodes === 0 && (
            <Chip
              label="No Isolated Nodes"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          
          {stats.averageConnections >= 2 && (
            <Chip
              label="Well Connected"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          
          {connectivityRate >= 90 && (
            <Chip
              label="High Connectivity"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          
          {stats.totalEdges === 0 && (
            <Chip
              label="No Connections"
              size="small"
              color="error"
              variant="outlined"
            />
          )}
          
          {stats.isolatedNodes > stats.totalNodes * 0.3 && (
            <Chip
              label="Many Isolated"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ConnectionMetrics;