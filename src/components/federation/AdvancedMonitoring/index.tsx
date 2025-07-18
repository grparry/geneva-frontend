/**
 * Advanced Monitoring Dashboard
 * 
 * Comprehensive monitoring interface for federation system health, performance, and analytics.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Chip,
  Button,
} from '@mui/material';
import {
  DashboardOutlined,
  TrendingUpOutlined,
  SecurityOutlined,
  SpeedOutlined,
  BugReportOutlined,
  RefreshOutlined,
  SettingsOutlined,
  NotificationsOutlined,
  GetAppOutlined,
  FilterListOutlined,
} from '@mui/icons-material';

// Federation hooks and services
import { 
  useGetFederationMetricsQuery,
  useGetFederationHealthQuery,
  useGetPeersQuery,
  useGetDelegationsQuery,
  useGetAuditLogQuery,
} from '../../../api/federation';
import { useFederationWebSocket } from '../../../hooks/useFederationWebSocket';

// Federation types
import { FederationMetrics, FederationHealth, SubstratePeer } from '../../../types/federation';

// Sub-components
import SystemOverview from './SystemOverview';
import PerformanceAnalytics from './PerformanceAnalytics';
import SecurityDashboard from './SecurityDashboard';
import AlertsAndNotifications from './AlertsAndNotifications';
import DiagnosticsPanel from './DiagnosticsPanel';
import RealtimeMonitor from './RealtimeMonitor';

type MonitoringTab = 'overview' | 'performance' | 'security' | 'alerts' | 'diagnostics' | 'realtime';

interface MonitoringFilters {
  timeRange: 'hour' | 'day' | 'week' | 'month';
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  alertLevel: 'all' | 'critical' | 'warning' | 'info';
  showHealthy: boolean;
}

export const AdvancedMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MonitoringTab>('overview');
  const [filters, setFilters] = useState<MonitoringFilters>({
    timeRange: 'hour',
    autoRefresh: true,
    refreshInterval: 30,
    alertLevel: 'all',
    showHealthy: true,
  });

  // API queries with time range
  const timeRangeParams = useMemo(() => {
    const now = new Date();
    const start = new Date();
    
    switch (filters.timeRange) {
      case 'hour':
        start.setHours(now.getHours() - 1);
        break;
      case 'day':
        start.setDate(now.getDate() - 1);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
    }
    
    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  }, [filters.timeRange]);

  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    error: metricsError,
    refetch: refetchMetrics 
  } = useGetFederationMetricsQuery({
    timeRange: timeRangeParams,
  });

  const { 
    data: health, 
    isLoading: healthLoading, 
    error: healthError,
    refetch: refetchHealth 
  } = useGetFederationHealthQuery();

  const { 
    data: peersResponse, 
    isLoading: peersLoading,
    refetch: refetchPeers 
  } = useGetPeersQuery({});
  
  const peers = peersResponse || [];

  const { 
    data: delegationsResponse, 
    isLoading: delegationsLoading,
    refetch: refetchDelegations 
  } = useGetDelegationsQuery({
    limit: 100,
    offset: 0,
  });
  
  const delegations = delegationsResponse?.items || [];

  const { 
    data: auditResponse, 
    isLoading: auditLoading,
    refetch: refetchAudit 
  } = useGetAuditLogQuery({
    limit: 50,
    offset: 0,
    timeRange: timeRangeParams,
  });
  
  const auditEntries = auditResponse?.items || [];

  // Real-time updates
  const { isConnected, error } = useFederationWebSocket({
    subscriptions: ['peers', 'delegations', 'trust', 'events', 'metrics'],
  });

  // Auto-refresh functionality
  React.useEffect(() => {
    if (!filters.autoRefresh) return;

    const interval = setInterval(() => {
      handleRefreshAll();
    }, filters.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [filters.autoRefresh, filters.refreshInterval]);

  // Compute comprehensive system status
  const systemStatus = useMemo(() => {
    if (!metrics || !health) return null;

    const criticalIssues = health.issues?.filter(i => i.severity === 'critical').length || 0;
    const warningIssues = health.issues?.filter(i => i.severity === 'high' || i.severity === 'medium').length || 0;
    
    const offlinePeers = peers.filter((p: SubstratePeer) => p.status === 'offline').length;
    const degradedPeers = peers.filter((p: SubstratePeer) => p.status === 'degraded').length;
    
    const failedDelegations = delegations.filter(d => d.status === 'failed').length;
    const pendingDelegations = delegations.filter(d => d.status === 'pending').length;
    
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (criticalIssues > 0 || health.overall_status === 'critical') {
      overallStatus = 'critical';
    } else if (warningIssues > 0 || offlinePeers > 0 || health.overall_status === 'degraded') {
      overallStatus = 'warning';
    }
    
    return {
      overallStatus,
      criticalIssues,
      warningIssues,
      offlinePeers,
      degradedPeers,
      failedDelegations,
      pendingDelegations,
      networkHealth: health.network_health,
      connectionStatus: isConnected ? 'connected' : 'disconnected',
    };
  }, [metrics, health, peers, delegations, isConnected]);

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchMetrics(),
      refetchHealth(),
      refetchPeers(),
      refetchDelegations(),
      refetchAudit(),
    ]);
  };

  const handleExportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange: filters.timeRange,
      metrics,
      health,
      peers: peers.length,
      delegations: delegations.length,
      systemStatus,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `federation-monitoring-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const renderTabContent = () => {
    const commonProps = {
      metrics,
      health,
      peers,
      delegations,
      auditEntries,
      systemStatus,
      timeRange: filters.timeRange,
      isLoading: metricsLoading || healthLoading || peersLoading || delegationsLoading,
    };

    switch (activeTab) {
      case 'overview':
        return <SystemOverview {...commonProps} />;
      case 'performance':
        return <PerformanceAnalytics {...commonProps} />;
      case 'security':
        return <SecurityDashboard {...commonProps} />;
      case 'alerts':
        return <AlertsAndNotifications {...commonProps} filters={filters} />;
      case 'diagnostics':
        return <DiagnosticsPanel {...commonProps} />;
      case 'realtime':
        return <RealtimeMonitor {...commonProps} isConnected={isConnected} />;
      default:
        return null;
    }
  };

  // Loading state
  if ((metricsLoading || healthLoading) && !metrics && !health) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Loading Monitoring Dashboard...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gathering system metrics and health data
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header with System Status */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="h6">System Status</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Last updated: {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
                
                {systemStatus && (
                  <>
                    <Chip
                      label={systemStatus.overallStatus.toUpperCase()}
                      color={getStatusColor(systemStatus.overallStatus)}
                      icon={
                        systemStatus.overallStatus === 'healthy' ? <TrendingUpOutlined /> :
                        systemStatus.overallStatus === 'warning' ? <SecurityOutlined /> :
                        <BugReportOutlined />
                      }
                    />
                    
                    <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="error.main">
                          {systemStatus.criticalIssues}
                        </Typography>
                        <Typography variant="caption">Critical</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                          {systemStatus.warningIssues}
                        </Typography>
                        <Typography variant="caption">Warnings</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="info.main">
                          {systemStatus.networkHealth ? (systemStatus.networkHealth * 100).toFixed(0) : 0}%
                        </Typography>
                        <Typography variant="caption">Health</Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsOutlined color={isConnected ? 'success' : 'error'} />
                <Box>
                  <Typography variant="body2">
                    Real-time: {isConnected ? 'Connected' : 'Disconnected'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Auto-refresh: {filters.autoRefresh ? `${filters.refreshInterval}s` : 'Off'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Real-time monitoring is unavailable. Data may not reflect current system state.
        </Alert>
      )}

      {/* Error Alerts */}
      {(metricsError || healthError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load monitoring data: {(metricsError || healthError)?.toString()}
        </Alert>
      )}

      {/* Controls and Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newTab) => setActiveTab(newTab)}
            sx={{ px: 2 }}
          >
            <Tab 
              value="overview" 
              label="System Overview" 
              icon={<DashboardOutlined />}
              iconPosition="start"
            />
            <Tab 
              value="performance" 
              label="Performance" 
              icon={<SpeedOutlined />}
              iconPosition="start"
            />
            <Tab 
              value="security" 
              label="Security" 
              icon={<SecurityOutlined />}
              iconPosition="start"
            />
            <Tab 
              value="alerts" 
              label="Alerts" 
              icon={<NotificationsOutlined />}
              iconPosition="start"
            />
            <Tab 
              value="diagnostics" 
              label="Diagnostics" 
              icon={<BugReportOutlined />}
              iconPosition="start"
            />
            <Tab 
              value="realtime" 
              label="Real-time" 
              icon={<TrendingUpOutlined />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Control Panel */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Time Range */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={filters.timeRange}
              label="Time Range"
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
            >
              <MenuItem value="hour">Last Hour</MenuItem>
              <MenuItem value="day">Last Day</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
            </Select>
          </FormControl>

          {/* Auto Refresh */}
          <FormControlLabel
            control={
              <Switch
                checked={filters.autoRefresh}
                onChange={(e) => setFilters(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                size="small"
              />
            }
            label="Auto Refresh"
          />

          {/* Refresh Interval */}
          {filters.autoRefresh && (
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Interval</InputLabel>
              <Select
                value={filters.refreshInterval}
                label="Interval"
                onChange={(e) => setFilters(prev => ({ ...prev, refreshInterval: e.target.value as number }))}
              >
                <MenuItem value={15}>15s</MenuItem>
                <MenuItem value={30}>30s</MenuItem>
                <MenuItem value={60}>1m</MenuItem>
                <MenuItem value={300}>5m</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Action Buttons */}
          <Button
            startIcon={<GetAppOutlined />}
            onClick={handleExportData}
            size="small"
            variant="outlined"
          >
            Export
          </Button>

          <Tooltip title="Refresh all data">
            <IconButton 
              onClick={handleRefreshAll} 
              disabled={metricsLoading || healthLoading}
              size="small"
            >
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tab Content */}
      {renderTabContent()}
    </Box>
  );
};

export default AdvancedMonitoring;