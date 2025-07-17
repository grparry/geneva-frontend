/**
 * Real-time Monitor Component
 * 
 * Live monitoring dashboard with real-time metrics and streaming data visualization.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUpOutlined,
  FiberManualRecordOutlined,
  PauseOutlined,
  PlayArrowOutlined,
  ClearOutlined,
  SignalWifiOutlined,
  SignalWifiOffOutlined,
  SpeedOutlined,
  NetworkCheckOutlined,
  NotificationsActiveOutlined,
} from '@mui/icons-material';

interface RealtimeMonitorProps {
  metrics: any;
  health: any;
  peers: any[];
  delegations: any[];
  systemStatus: any;
  timeRange: string;
  isLoading: boolean;
  isConnected: boolean;
}

interface RealtimeEvent {
  id: string;
  timestamp: string;
  type: 'peer_status' | 'delegation' | 'trust_change' | 'error' | 'performance';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  source: string;
  data?: any;
}

interface MetricPoint {
  timestamp: number;
  value: number;
  label?: string;
}

const RealtimeMonitor: React.FC<RealtimeMonitorProps> = ({
  metrics,
  health,
  peers,
  delegations,
  systemStatus,
  timeRange,
  isLoading,
  isConnected,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<{
    delegations: MetricPoint[];
    responseTime: MetricPoint[];
    errorRate: MetricPoint[];
    peerHealth: MetricPoint[];
  }>({
    delegations: [],
    responseTime: [],
    errorRate: [],
    peerHealth: [],
  });

  const eventsListRef = useRef<HTMLDivElement>(null);
  const maxEvents = 100;
  const maxMetricPoints = 50;

  // Handle real-time federation events
  useEffect(() => {
    if (isPaused || !isConnected) return;

    const handleFederationEvent = (event: any) => {
      try {
        let realtimeEvent: RealtimeEvent;

        switch (event.type) {
          case 'federation.peer.discovered':
          case 'federation.peer.status_changed':
          case 'federation.peer.disconnected':
            realtimeEvent = {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: event.timestamp || new Date().toISOString(),
              type: 'peer_status',
              message: `Peer ${event.data.peer?.name || 'Unknown'} ${event.type.split('.').pop()}`,
              severity: event.type.includes('disconnected') ? 'warning' : 'info',
              source: 'Peer Monitor',
              data: event.data,
            };
            break;

          case 'federation.delegation.created':
          case 'federation.delegation.accepted':
          case 'federation.delegation.completed':
          case 'federation.delegation.failed':
            const delegationStatus = event.type.split('.').pop();
            realtimeEvent = {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: event.timestamp || new Date().toISOString(),
              type: 'delegation',
              message: `Delegation ${delegationStatus} for task: ${event.data.delegation?.task_type || 'unknown'}`,
              severity: delegationStatus === 'failed' ? 'error' : delegationStatus === 'completed' ? 'success' : 'info',
              source: 'Delegation Engine',
              data: event.data,
            };
            break;

          case 'federation.trust.established':
          case 'federation.trust.upgraded':
          case 'federation.trust.revoked':
            const trustAction = event.type.split('.').pop();
            realtimeEvent = {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: event.timestamp || new Date().toISOString(),
              type: 'trust_change',
              message: `Trust ${trustAction} - Level: ${event.data.relationship?.trust_level || 'unknown'}`,
              severity: trustAction === 'revoked' ? 'warning' : 'info',
              source: 'Trust Manager',
              data: event.data,
            };
            break;

          case 'federation.metrics.updated':
            realtimeEvent = {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: event.timestamp || new Date().toISOString(),
              type: 'performance',
              message: `Metrics updated - Network health: ${((event.data.metrics?.network_health || 0) * 100).toFixed(1)}%`,
              severity: 'info',
              source: 'Performance Monitor',
              data: event.data,
            };
            break;

          case 'federation.alert.critical':
            realtimeEvent = {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: event.timestamp || new Date().toISOString(),
              type: 'error',
              message: event.data.message || 'Critical federation alert',
              severity: 'error',
              source: 'System Monitor',
              data: event.data,
            };
            break;

          default:
            return; // Don't add unknown events
        }

        setEvents(prev => {
          const newEvents = [realtimeEvent, ...prev.slice(0, maxEvents - 1)];
          return newEvents;
        });
      } catch (error) {
        console.error('Error processing federation event for real-time monitor:', error);
      }
    };

    // Subscribe to federation events through WebSocket
    const eventHandler = (event: MessageEvent) => {
      try {
        const federationEvent = JSON.parse(event.data);
        handleFederationEvent(federationEvent);
      } catch (error) {
        console.error('Error parsing federation event:', error);
      }
    };

    // In a real implementation, this would be connected through the federation WebSocket hook
    // For now, we'll set up a placeholder that can be connected to the real WebSocket
    window.addEventListener('federation-event', eventHandler as any);

    return () => {
      window.removeEventListener('federation-event', eventHandler as any);
    };
  }, [isPaused, isConnected]);

  // Update metrics history with real data
  useEffect(() => {
    if (isPaused || !isConnected) return;

    const updateMetrics = () => {
      const now = Date.now();
      
      setMetricsHistory(prev => ({
        delegations: [
          { timestamp: now, value: delegations.length },
          ...prev.delegations.slice(0, maxMetricPoints - 1),
        ],
        responseTime: [
          { timestamp: now, value: metrics?.avg_delegation_time_ms || 0 },
          ...prev.responseTime.slice(0, maxMetricPoints - 1),
        ],
        errorRate: [
          { 
            timestamp: now, 
            value: delegations.length > 0 ? 
              (delegations.filter(d => d.status === 'failed').length / delegations.length) * 100 : 0
          },
          ...prev.errorRate.slice(0, maxMetricPoints - 1),
        ],
        peerHealth: [
          { 
            timestamp: now, 
            value: peers.length > 0 ? 
              (peers.filter(p => p.status === 'healthy' || p.status === 'connected').length / peers.length) * 100 : 0
          },
          ...prev.peerHealth.slice(0, maxMetricPoints - 1),
        ],
      }));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [isPaused, isConnected, delegations, peers, metrics]);

  // Auto-scroll to latest events
  useEffect(() => {
    if (autoScroll && eventsListRef.current) {
      eventsListRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  // Current system metrics
  const currentMetrics = useMemo(() => {
    return {
      activeDelegations: delegations.filter(d => d.status === 'executing' || d.status === 'pending').length,
      avgResponseTime: metrics?.avg_delegation_time_ms || 0,
      errorRate: delegations.length > 0 ? 
        (delegations.filter(d => d.status === 'failed').length / delegations.length) * 100 : 0,
      peerHealth: peers.length > 0 ? 
        (peers.filter(p => p.status === 'healthy' || p.status === 'connected').length / peers.length) * 100 : 0,
      networkHealth: health?.network_health ? health.network_health * 100 : 0,
    };
  }, [delegations, peers, metrics, health]);

  const getEventIcon = (type: string, severity: string) => {
    const iconMap = {
      peer_status: <NetworkCheckOutlined />,
      delegation: <SpeedOutlined />,
      trust_change: <NotificationsActiveOutlined />,
      performance: <TrendingUpOutlined />,
      error: <NotificationsActiveOutlined />,
    };
    
    const iconColor = {
      success: 'success',
      info: 'info',
      warning: 'warning',
      error: 'error',
    };

    return React.cloneElement(
      iconMap[type as keyof typeof iconMap] || <FiberManualRecordOutlined />,
      { color: iconColor[severity as keyof typeof iconColor] || 'default', fontSize: 'small' }
    );
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const getMetricTrend = (history: MetricPoint[]) => {
    if (history.length < 2) return 'stable';
    const recent = history[0].value;
    const previous = history[1].value;
    const change = ((recent - previous) / previous) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  return (
    <Box>
      {/* Connection Status */}
      <Alert 
        severity={isConnected ? 'success' : 'warning'} 
        sx={{ mb: 3 }}
        icon={isConnected ? <SignalWifiOutlined /> : <SignalWifiOffOutlined />}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">
            Real-time monitoring: {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!isPaused}
                  onChange={(e) => setIsPaused(!e.target.checked)}
                  size="small"
                />
              }
              label="Live Updates"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  size="small"
                />
              }
              label="Auto Scroll"
            />
          </Box>
        </Box>
      </Alert>

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FiberManualRecordOutlined 
                  color={isConnected && !isPaused ? 'success' : 'disabled'} 
                  sx={{ fontSize: 12 }} 
                />
                <Typography variant="subtitle2">Active Delegations</Typography>
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {currentMetrics.activeDelegations}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getMetricTrend(metricsHistory.delegations) === 'up' && (
                  <TrendingUpOutlined fontSize="small" color="success" />
                )}
                <Typography variant="caption" color="text.secondary">
                  of {delegations.length} total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FiberManualRecordOutlined 
                  color={isConnected && !isPaused ? 'success' : 'disabled'} 
                  sx={{ fontSize: 12 }} 
                />
                <Typography variant="subtitle2">Response Time</Typography>
              </Box>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {formatDuration(currentMetrics.avgResponseTime)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getMetricTrend(metricsHistory.responseTime) === 'down' && (
                  <TrendingUpOutlined fontSize="small" color="success" />
                )}
                <Typography variant="caption" color="text.secondary">
                  average
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FiberManualRecordOutlined 
                  color={isConnected && !isPaused ? 'success' : 'disabled'} 
                  sx={{ fontSize: 12 }} 
                />
                <Typography variant="subtitle2">Error Rate</Typography>
              </Box>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {currentMetrics.errorRate.toFixed(1)}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  last {timeRange}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FiberManualRecordOutlined 
                  color={isConnected && !isPaused ? 'success' : 'disabled'} 
                  sx={{ fontSize: 12 }} 
                />
                <Typography variant="subtitle2">Peer Health</Typography>
              </Box>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {currentMetrics.peerHealth.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={currentMetrics.peerHealth}
                color="success"
                sx={{ mt: 1, height: 4, borderRadius: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Event Stream */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">Live Event Stream</Typography>
              <Chip
                label={`${events.length} events`}
                size="small"
                color={isConnected ? 'success' : 'default'}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={isPaused ? 'Resume monitoring' : 'Pause monitoring'}>
                <IconButton
                  onClick={() => setIsPaused(!isPaused)}
                  size="small"
                  color={isPaused ? 'warning' : 'primary'}
                >
                  {isPaused ? <PlayArrowOutlined /> : <PauseOutlined />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear events">
                <IconButton onClick={clearEvents} size="small">
                  <ClearOutlined />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Box 
          ref={eventsListRef}
          sx={{ 
            height: 400, 
            overflow: 'auto',
            bgcolor: 'grey.50',
          }}
        >
          {events.length > 0 ? (
            <List sx={{ py: 0 }}>
              {events.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {getEventIcon(event.type, event.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {event.message}
                          </Typography>
                          <Chip
                            label={event.type}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {event.source} • {formatTime(event.timestamp)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < events.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {isPaused ? 'Monitoring paused' : 'Waiting for events...'}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default RealtimeMonitor;