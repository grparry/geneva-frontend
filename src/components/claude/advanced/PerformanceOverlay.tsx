import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Alert,
  Collapse,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Grid
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Minimize as MinimizeIcon,
  Maximize as MaximizeIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  DataUsage as DataUsageIcon,
  CloudQueue as CloudIcon,
  Computer as ComputerIcon,
  Code as CodeIcon
} from '@mui/icons-material';

interface PerformanceMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
    trend: 'up' | 'down' | 'stable';
  };
  memory: {
    used: number;
    total: number;
    available: number;
    trend: 'up' | 'down' | 'stable';
  };
  network: {
    download: number;
    upload: number;
    latency: number;
    packets: {
      sent: number;
      received: number;
      lost: number;
    };
  };
  storage: {
    used: number;
    total: number;
    readSpeed: number;
    writeSpeed: number;
  };
  application: {
    renderTime: number;
    bundleSize: number;
    memoryLeaks: number;
    errorRate: number;
    responseTime: number;
  };
  system: {
    uptime: number;
    processes: number;
    loadAverage: number[];
  };
}

interface PerformanceOverlayProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
  updateInterval?: number;
  showAlerts?: boolean;
  autoHide?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  thresholds?: {
    cpu: number;
    memory: number;
    responseTime: number;
    errorRate: number;
  };
}

const POSITION_STYLES = {
  'top-left': { top: 16, left: 16 },
  'top-right': { top: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
  'bottom-right': { bottom: 16, right: 16 }
};

const ALERT_THRESHOLDS = {
  cpu: 80,
  memory: 85,
  responseTime: 1000,
  errorRate: 5
};

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  position = 'top-right',
  compact = false,
  updateInterval = 2000,
  showAlerts = true,
  autoHide = false,
  onMetricsUpdate,
  thresholds = ALERT_THRESHOLDS
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(compact);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showAlertsState, setShowAlertsState] = useState(showAlerts);
  const [historicalData, setHistoricalData] = useState<PerformanceMetrics[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data generator for demonstration
  const generateMockMetrics = (): PerformanceMetrics => {
    const baseTime = Date.now();
    const variation = () => Math.random() * 0.2 - 0.1; // ±10% variation
    
    return {
      cpu: {
        usage: Math.max(0, Math.min(100, 45 + variation() * 100)),
        cores: 8,
        temperature: 68 + variation() * 20,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
      },
      memory: {
        used: 6.2 + variation() * 2,
        total: 16,
        available: 9.8 - variation() * 2,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
      },
      network: {
        download: Math.max(0, 125 + variation() * 200),
        upload: Math.max(0, 45 + variation() * 100),
        latency: Math.max(5, 25 + variation() * 50),
        packets: {
          sent: Math.floor(1000 + variation() * 500),
          received: Math.floor(980 + variation() * 500),
          lost: Math.floor(Math.max(0, 5 + variation() * 20))
        }
      },
      storage: {
        used: 450 + variation() * 50,
        total: 1000,
        readSpeed: Math.max(0, 850 + variation() * 200),
        writeSpeed: Math.max(0, 650 + variation() * 200)
      },
      application: {
        renderTime: Math.max(1, 16 + variation() * 10),
        bundleSize: 2.4 + variation() * 0.5,
        memoryLeaks: Math.floor(Math.max(0, 2 + variation() * 5)),
        errorRate: Math.max(0, 1.2 + variation() * 3),
        responseTime: Math.max(50, 180 + variation() * 200)
      },
      system: {
        uptime: 86400 + Math.floor(variation() * 3600),
        processes: Math.floor(120 + variation() * 50),
        loadAverage: [
          Math.max(0, 1.5 + variation()),
          Math.max(0, 1.3 + variation()),
          Math.max(0, 1.1 + variation())
        ]
      }
    };
  };

  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics = generateMockMetrics();
      setMetrics(newMetrics);
      setHistoricalData(prev => [...prev.slice(-29), newMetrics]); // Keep last 30 readings
      onMetricsUpdate?.(newMetrics);

      // Check for alerts
      const newAlerts: string[] = [];
      if (newMetrics.cpu.usage > thresholds.cpu) {
        newAlerts.push(`CPU usage high: ${newMetrics.cpu.usage.toFixed(1)}%`);
      }
      if ((newMetrics.memory.used / newMetrics.memory.total) * 100 > thresholds.memory) {
        newAlerts.push(`Memory usage high: ${((newMetrics.memory.used / newMetrics.memory.total) * 100).toFixed(1)}%`);
      }
      if (newMetrics.application.responseTime > thresholds.responseTime) {
        newAlerts.push(`Response time high: ${newMetrics.application.responseTime}ms`);
      }
      if (newMetrics.application.errorRate > thresholds.errorRate) {
        newAlerts.push(`Error rate high: ${newMetrics.application.errorRate.toFixed(1)}%`);
      }
      
      setAlerts(newAlerts);
    };

    updateMetrics(); // Initial update
    intervalRef.current = setInterval(updateMetrics, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval, onMetricsUpdate, thresholds]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUpIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      case 'down': return <TrendingDownIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      default: return null;
    }
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value > threshold * 0.9) return 'error';
    if (value > threshold * 0.7) return 'warning';
    return 'success';
  };

  if (!isVisible) {
    return (
      <Box
        sx={{
          position: 'fixed',
          ...POSITION_STYLES[position],
          zIndex: 1300
        }}
      >
        <IconButton
          onClick={() => setIsVisible(true)}
          sx={{ bgcolor: 'background.paper', boxShadow: 2 }}
        >
          <SpeedIcon />
        </IconButton>
      </Box>
    );
  }

  if (!metrics) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        ...POSITION_STYLES[position],
        zIndex: 1300,
        maxWidth: isMinimized ? 300 : showDetailedView ? 600 : 400
      }}
    >
      <Paper sx={{ p: isMinimized ? 1 : 2, boxShadow: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: isMinimized ? 0 : 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon color="primary" />
            {!isMinimized && (
              <Typography variant="h6">
                Performance Monitor
              </Typography>
            )}
            {alerts.length > 0 && showAlertsState && (
              <Badge badgeContent={alerts.length} color="error">
                <WarningIcon />
              </Badge>
            )}
          </Box>
          
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={isMinimized ? "Expand" : "Minimize"}>
              <IconButton size="small" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <MaximizeIcon /> : <MinimizeIcon />}
              </IconButton>
            </Tooltip>
            
            {!isMinimized && (
              <Tooltip title="Settings">
                <IconButton size="small" onClick={(e) => setSettingsAnchor(e.currentTarget)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Hide">
              <IconButton size="small" onClick={() => setIsVisible(false)}>
                <VisibilityOffIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Alerts */}
        {!isMinimized && alerts.length > 0 && showAlertsState && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {alerts.join(', ')}
            </Typography>
          </Alert>
        )}

        {/* Quick Metrics (Minimized View) */}
        {isMinimized ? (
          <Grid container spacing={1}>
            <Grid size={3}>
              <Tooltip title={`CPU: ${metrics.cpu.usage.toFixed(1)}%`}>
                <Box sx={{ textAlign: 'center' }}>
                  <ComputerIcon sx={{ fontSize: 20, color: getStatusColor(metrics.cpu.usage, thresholds.cpu) }} />
                  <Typography variant="caption" display="block">
                    {metrics.cpu.usage.toFixed(0)}%
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
            <Grid size={3}>
              <Tooltip title={`Memory: ${((metrics.memory.used / metrics.memory.total) * 100).toFixed(1)}%`}>
                <Box sx={{ textAlign: 'center' }}>
                  <MemoryIcon sx={{ fontSize: 20, color: getStatusColor((metrics.memory.used / metrics.memory.total) * 100, thresholds.memory) }} />
                  <Typography variant="caption" display="block">
                    {((metrics.memory.used / metrics.memory.total) * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
            <Grid size={3}>
              <Tooltip title={`Network: ${metrics.network.latency.toFixed(0)}ms`}>
                <Box sx={{ textAlign: 'center' }}>
                  <NetworkIcon sx={{ fontSize: 20, color: metrics.network.latency > 100 ? 'error.main' : 'success.main' }} />
                  <Typography variant="caption" display="block">
                    {metrics.network.latency.toFixed(0)}ms
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
            <Grid size={3}>
              <Tooltip title={`Response: ${metrics.application.responseTime}ms`}>
                <Box sx={{ textAlign: 'center' }}>
                  <CodeIcon sx={{ fontSize: 20, color: getStatusColor(metrics.application.responseTime, thresholds.responseTime) }} />
                  <Typography variant="caption" display="block">
                    {metrics.application.responseTime}ms
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
          </Grid>
        ) : (
          <Stack spacing={2}>
            {/* CPU Metrics */}
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ComputerIcon color="primary" />
                    <Typography variant="subtitle2">CPU</Typography>
                    {getTrendIcon(metrics.cpu.trend)}
                  </Box>
                  <Typography variant="h6" color={getStatusColor(metrics.cpu.usage, thresholds.cpu)}>
                    {metrics.cpu.usage.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics.cpu.usage} 
                  color={getStatusColor(metrics.cpu.usage, thresholds.cpu)}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption">
                    {metrics.cpu.cores} cores
                  </Typography>
                  {metrics.cpu.temperature && (
                    <Typography variant="caption">
                      {metrics.cpu.temperature.toFixed(0)}°C
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Memory Metrics */}
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MemoryIcon color="primary" />
                    <Typography variant="subtitle2">Memory</Typography>
                    {getTrendIcon(metrics.memory.trend)}
                  </Box>
                  <Typography variant="h6" color={getStatusColor((metrics.memory.used / metrics.memory.total) * 100, thresholds.memory)}>
                    {((metrics.memory.used / metrics.memory.total) * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(metrics.memory.used / metrics.memory.total) * 100} 
                  color={getStatusColor((metrics.memory.used / metrics.memory.total) * 100, thresholds.memory)}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption">
                    {metrics.memory.used.toFixed(1)} GB used
                  </Typography>
                  <Typography variant="caption">
                    {metrics.memory.available.toFixed(1)} GB free
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Network Metrics */}
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NetworkIcon color="primary" />
                    <Typography variant="subtitle2">Network</Typography>
                  </Box>
                  <Typography variant="h6">
                    {metrics.network.latency.toFixed(0)}ms
                  </Typography>
                </Box>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Typography variant="caption" color="success.main">
                      ↓ {metrics.network.download.toFixed(0)} KB/s
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="info.main">
                      ↑ {metrics.network.upload.toFixed(0)} KB/s
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Application Metrics */}
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon color="primary" />
                    <Typography variant="subtitle2">Application</Typography>
                  </Box>
                  <Typography variant="h6" color={getStatusColor(metrics.application.responseTime, thresholds.responseTime)}>
                    {metrics.application.responseTime}ms
                  </Typography>
                </Box>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Typography variant="caption">
                      Render: {metrics.application.renderTime.toFixed(1)}ms
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption">
                      Bundle: {metrics.application.bundleSize.toFixed(1)}MB
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color={metrics.application.errorRate > thresholds.errorRate ? 'error.main' : 'text.secondary'}>
                      Errors: {metrics.application.errorRate.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color={metrics.application.memoryLeaks > 0 ? 'warning.main' : 'text.secondary'}>
                      Leaks: {metrics.application.memoryLeaks}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Detailed View Toggle */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                size="small"
                onClick={() => setShowDetailedView(!showDetailedView)}
                startIcon={<TimelineIcon />}
              >
                {showDetailedView ? 'Hide' : 'Show'} Details
              </Button>
            </Box>

            {/* Detailed View */}
            <Collapse in={showDetailedView}>
              <Stack spacing={2}>
                {/* System Information */}
                <Card>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      System Information
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid size={6}>
                        <Typography variant="caption">
                          Uptime: {formatUptime(metrics.system.uptime)}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="caption">
                          Processes: {metrics.system.processes}
                        </Typography>
                      </Grid>
                      <Grid size={12}>
                        <Typography variant="caption">
                          Load Average: {metrics.system.loadAverage.map(l => l.toFixed(2)).join(', ')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Storage Information */}
                <Card>
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">Storage</Typography>
                      <Typography variant="body2">
                        {((metrics.storage.used / metrics.storage.total) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(metrics.storage.used / metrics.storage.total) * 100}
                    />
                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                      <Grid size={6}>
                        <Typography variant="caption">
                          Read: {metrics.storage.readSpeed.toFixed(0)} MB/s
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="caption">
                          Write: {metrics.storage.writeSpeed.toFixed(0)} MB/s
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Stack>
            </Collapse>
          </Stack>
        )}

        {/* Settings Menu */}
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
        >
          <MenuItem onClick={() => setSettingsAnchor(null)}>
            <FormControlLabel
              control={<Switch checked={showAlertsState} onChange={(e) => setShowAlertsState(e.target.checked)} />}
              label="Show Alerts"
            />
          </MenuItem>
          <MenuItem onClick={() => setSettingsAnchor(null)}>
            <FormControlLabel
              control={<Switch checked={autoHide} />}
              label="Auto Hide"
            />
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setSettingsAnchor(null)}>
            Export Metrics
          </MenuItem>
          <MenuItem onClick={() => setSettingsAnchor(null)}>
            Reset Data
          </MenuItem>
        </Menu>
      </Paper>
    </Box>
  );
};