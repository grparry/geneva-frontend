/**
 * Alerts and Notifications Component
 * 
 * Real-time alerts, notifications, and issue management for federation system.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  NotificationsOutlined,
  ErrorOutlined,
  WarningOutlined,
  InfoOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  MarkEmailReadOutlined,
  FilterListOutlined,
  VolumeOffOutlined,
  VolumeUpOutlined,
  SettingsOutlined,
} from '@mui/icons-material';

interface AlertsAndNotificationsProps {
  metrics: any;
  health: any;
  peers: any[];
  delegations: any[];
  systemStatus: any;
  timeRange: string;
  isLoading: boolean;
  filters: {
    alertLevel: string;
    autoRefresh: boolean;
  };
}

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
  resolved: boolean;
  category: 'performance' | 'security' | 'connectivity' | 'system';
}

const AlertsAndNotifications: React.FC<AlertsAndNotificationsProps> = ({
  metrics,
  health,
  peers,
  delegations,
  systemStatus,
  timeRange,
  isLoading,
  filters,
}) => {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [mutedCategories, setMutedCategories] = useState<Set<string>>(new Set());
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Generate system alerts based on current state
  const systemAlerts = useMemo((): SystemAlert[] => {
    const alerts: SystemAlert[] = [];
    const now = new Date();

    // Health-based alerts
    if (health?.issues) {
      health.issues.forEach((issue: any, index: number) => {
        alerts.push({
          id: `health-${index}`,
          severity: issue.severity === 'critical' ? 'critical' : 'warning',
          title: issue.message,
          message: `Health issue detected in ${issue.component || 'system'}`,
          timestamp: now.toISOString(),
          source: 'Health Monitor',
          acknowledged: false,
          resolved: false,
          category: 'system',
        });
      });
    }

    // Peer connectivity alerts
    const offlinePeers = peers.filter(p => p.status === 'offline');
    if (offlinePeers.length > 0) {
      alerts.push({
        id: 'peers-offline',
        severity: offlinePeers.length > 2 ? 'critical' : 'warning',
        title: `${offlinePeers.length} Peer${offlinePeers.length !== 1 ? 's' : ''} Offline`,
        message: `The following peers are currently offline: ${offlinePeers.map(p => p.name).join(', ')}`,
        timestamp: now.toISOString(),
        source: 'Connectivity Monitor',
        acknowledged: false,
        resolved: false,
        category: 'connectivity',
      });
    }

    // Performance alerts
    const failedDelegations = delegations.filter(d => d.status === 'failed');
    const recentFailures = failedDelegations.filter(d => {
      const delegationTime = new Date(d.created_at);
      return (now.getTime() - delegationTime.getTime()) < 60 * 60 * 1000; // Last hour
    });

    if (recentFailures.length > 5) {
      alerts.push({
        id: 'delegation-failures',
        severity: recentFailures.length > 10 ? 'critical' : 'warning',
        title: 'High Delegation Failure Rate',
        message: `${recentFailures.length} delegation failures in the last hour`,
        timestamp: now.toISOString(),
        source: 'Performance Monitor',
        acknowledged: false,
        resolved: false,
        category: 'performance',
      });
    }

    // Security alerts
    const untrustedPeers = peers.filter(p => p.trust_level === 'none');
    if (untrustedPeers.length > 0) {
      const untrustedActivities = delegations.filter(d => 
        untrustedPeers.some(p => p.substrate_id === d.source_substrate || p.substrate_id === d.target_substrate)
      );

      if (untrustedActivities.length > 10) {
        alerts.push({
          id: 'untrusted-activity',
          severity: 'warning',
          title: 'High Activity from Untrusted Peers',
          message: `${untrustedActivities.length} activities detected from ${untrustedPeers.length} untrusted peers`,
          timestamp: now.toISOString(),
          source: 'Security Monitor',
          acknowledged: false,
          resolved: false,
          category: 'security',
        });
      }
    }

    // System health alerts
    if (systemStatus) {
      if (systemStatus.networkHealth < 0.5) {
        alerts.push({
          id: 'low-network-health',
          severity: 'critical',
          title: 'Critical Network Health',
          message: `Network health is at ${(systemStatus.networkHealth * 100).toFixed(1)}%, which is below the critical threshold`,
          timestamp: now.toISOString(),
          source: 'System Monitor',
          acknowledged: false,
          resolved: false,
          category: 'system',
        });
      }

      if (systemStatus.connectionStatus === 'disconnected') {
        alerts.push({
          id: 'websocket-disconnected',
          severity: 'warning',
          title: 'Real-time Connection Lost',
          message: 'WebSocket connection to federation system is down. Real-time updates unavailable.',
          timestamp: now.toISOString(),
          source: 'Connection Monitor',
          acknowledged: false,
          resolved: false,
          category: 'connectivity',
        });
      }
    }

    // Info alerts for positive events
    const healthyPeers = peers.filter(p => p.status === 'healthy');
    if (healthyPeers.length === peers.length && peers.length > 0) {
      alerts.push({
        id: 'all-peers-healthy',
        severity: 'info',
        title: 'All Peers Healthy',
        message: `All ${peers.length} peers are currently healthy and operational`,
        timestamp: now.toISOString(),
        source: 'System Monitor',
        acknowledged: false,
        resolved: false,
        category: 'system',
      });
    }

    return alerts.sort((a, b) => {
      // Sort by severity, then by timestamp
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [health, peers, delegations, systemStatus]);

  // Filter alerts based on settings
  const filteredAlerts = useMemo(() => {
    return systemAlerts.filter(alert => {
      // Filter by severity
      if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) {
        return false;
      }

      // Filter by muted categories
      if (mutedCategories.has(alert.category)) {
        return false;
      }

      // Filter by acknowledgment status
      if (acknowledgedAlerts.has(alert.id)) {
        return false;
      }

      return true;
    });
  }, [systemAlerts, selectedSeverity, mutedCategories, acknowledgedAlerts]);

  // Alert statistics
  const alertStats = useMemo(() => {
    const stats = {
      total: systemAlerts.length,
      critical: systemAlerts.filter(a => a.severity === 'critical').length,
      warning: systemAlerts.filter(a => a.severity === 'warning').length,
      info: systemAlerts.filter(a => a.severity === 'info').length,
      acknowledged: acknowledgedAlerts.size,
    };
    return stats;
  }, [systemAlerts, acknowledgedAlerts]);

  const handleAcknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set(prev).add(alertId));
  };

  const handleClearAllAlerts = () => {
    const allAlertIds = systemAlerts.map(a => a.id);
    setAcknowledgedAlerts(new Set(allAlertIds));
  };

  const handleToggleMuteCategory = (category: string) => {
    setMutedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorOutlined color="error" />;
      case 'warning':
        return <WarningOutlined color="warning" />;
      case 'info':
        return <InfoOutlined color="info" />;
      default:
        return <NotificationsOutlined />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Box>
      {/* Alert Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ErrorOutlined color="error" />
                <Typography variant="subtitle2">Critical</Typography>
              </Box>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {alertStats.critical}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningOutlined color="warning" />
                <Typography variant="subtitle2">Warnings</Typography>
              </Box>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {alertStats.warning}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoOutlined color="info" />
                <Typography variant="subtitle2">Info</Typography>
              </Box>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {alertStats.info}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MarkEmailReadOutlined color="success" />
                <Typography variant="subtitle2">Acknowledged</Typography>
              </Box>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {alertStats.acknowledged}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={selectedSeverity}
              label="Severity"
              onChange={(e) => setSelectedSeverity(e.target.value)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption">Mute:</Typography>
            {['performance', 'security', 'connectivity', 'system'].map(category => (
              <Tooltip key={category} title={`Toggle ${category} alerts`}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleMuteCategory(category)}
                  color={mutedCategories.has(category) ? 'default' : 'primary'}
                >
                  {mutedCategories.has(category) ? <VolumeOffOutlined /> : <VolumeUpOutlined />}
                </IconButton>
              </Tooltip>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            startIcon={<ClearOutlined />}
            onClick={handleClearAllAlerts}
            size="small"
            disabled={filteredAlerts.length === 0}
          >
            Clear All
          </Button>
        </Box>
      </Paper>

      {/* Active Alerts */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={filteredAlerts.length} color="error">
              <NotificationsOutlined />
            </Badge>
            <Typography variant="h6">
              Active Alerts ({filteredAlerts.length})
            </Typography>
          </Box>
        </Box>

        {filteredAlerts.length > 0 ? (
          <List sx={{ py: 0 }}>
            {filteredAlerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem>
                  <ListItemIcon>
                    {getAlertIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {alert.title}
                        </Typography>
                        <Chip
                          label={alert.severity}
                          size="small"
                          color={getAlertColor(alert.severity)}
                          variant="outlined"
                        />
                        <Chip
                          label={alert.category}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.source} • {formatTimestamp(alert.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Acknowledge alert">
                      <IconButton
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        size="small"
                      >
                        <CheckCircleOutlined />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredAlerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleOutlined color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="success.main" gutterBottom>
              No Active Alerts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All systems are operating normally. Check back here for important notifications.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Recent Notifications */}
      {acknowledgedAlerts.size > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recently Acknowledged ({acknowledgedAlerts.size})
          </Typography>
          
          <List dense>
            {systemAlerts
              .filter(alert => acknowledgedAlerts.has(alert.id))
              .slice(0, 5)
              .map((alert) => (
                <ListItem key={alert.id}>
                  <ListItemIcon>
                    <CheckCircleOutlined color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.title}
                    secondary={`${alert.source} • ${formatTimestamp(alert.timestamp)}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default AlertsAndNotifications;