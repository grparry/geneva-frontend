import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
  Alert,
  Button,
  Tooltip,
  Badge,
  CircularProgress,
  FormControlLabel,
  Switch,
  useTheme,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import CloudIcon from '@mui/icons-material/Cloud';
import DnsIcon from '@mui/icons-material/Dns';
import LayersIcon from '@mui/icons-material/Layers';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import { apiClient } from '../../api/client';

interface InfrastructureNode {
  node_id: string;
  name: string;
  type: 'substrate' | 'database' | 'cache' | 'service' | 'network';
  status: 'healthy' | 'degraded' | 'down';
  region?: string;
  metrics: {
    cpu_usage?: number;
    memory_usage?: number;
    disk_usage?: number;
    network_io?: number;
    request_rate?: number;
    error_rate?: number;
    latency_p99?: number;
  };
  components?: InfrastructureComponent[];
  dependencies?: string[];
  last_heartbeat?: string;
}

interface InfrastructureComponent {
  component_id: string;
  name: string;
  type: string;
  status: 'healthy' | 'degraded' | 'down';
  version?: string;
  metrics?: Record<string, any>;
}

interface ServiceHealth {
  service_id: string;
  service_name: string;
  health_score: number; // 0-100
  checks: HealthCheck[];
  dependencies: ServiceDependency[];
}

interface HealthCheck {
  check_name: string;
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  last_checked: string;
  duration_ms: number;
}

interface ServiceDependency {
  service_id: string;
  service_name: string;
  status: 'healthy' | 'degraded' | 'down';
  impact: 'critical' | 'high' | 'medium' | 'low';
}

interface InfrastructureMetrics {
  total_nodes: number;
  healthy_nodes: number;
  degraded_nodes: number;
  down_nodes: number;
  avg_cpu_usage: number;
  avg_memory_usage: number;
  total_requests_per_min: number;
  avg_latency_ms: number;
  alerts: InfrastructureAlert[];
}

interface InfrastructureAlert {
  alert_id: string;
  severity: 'critical' | 'warning' | 'info';
  node_id: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface InfrastructureMapProps {
  viewMode?: 'topology' | 'health' | 'performance';
  onNodeClick?: (node: InfrastructureNode) => void;
}

export const InfrastructureMap: React.FC<InfrastructureMapProps> = ({
  viewMode = 'topology',
  onNodeClick,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(viewMode);
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<InfrastructureMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<InfrastructureNode | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadInfrastructureData();
    const interval = autoRefresh ? setInterval(loadInfrastructureData, 10000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadInfrastructureData = async () => {
    try {
      const [nodesRes, healthRes, metricsRes] = await Promise.all([
        apiClient.get('/api/infrastructure/nodes'),
        apiClient.get('/api/infrastructure/health'),
        apiClient.get('/api/infrastructure/metrics'),
      ]);
      
      setNodes(nodesRes.data);
      setServiceHealth(healthRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error('Failed to load infrastructure data:', error);
      // Use mock data for demo
      const mockNodes: InfrastructureNode[] = [
        {
          node_id: 'node-1',
          name: 'Primary Geneva Substrate',
          type: 'substrate',
          status: 'healthy',
          region: 'us-east-1',
          metrics: {
            cpu_usage: 45,
            memory_usage: 62,
            disk_usage: 38,
            network_io: 125,
            request_rate: 1250,
            error_rate: 0.2,
            latency_p99: 45,
          },
          components: [
            {
              component_id: 'api-1',
              name: 'Geneva API',
              type: 'service',
              status: 'healthy',
              version: '2.1.0',
            },
            {
              component_id: 'worker-1',
              name: 'Task Worker',
              type: 'service',
              status: 'healthy',
              version: '2.1.0',
            },
          ],
        },
        {
          node_id: 'node-2',
          name: 'PostgreSQL Primary',
          type: 'database',
          status: 'healthy',
          region: 'us-east-1',
          metrics: {
            cpu_usage: 32,
            memory_usage: 78,
            disk_usage: 45,
            network_io: 89,
            request_rate: 3200,
            error_rate: 0.01,
            latency_p99: 12,
          },
        },
        {
          node_id: 'node-3',
          name: 'Redis Cache',
          type: 'cache',
          status: 'degraded',
          region: 'us-east-1',
          metrics: {
            cpu_usage: 15,
            memory_usage: 92,
            network_io: 156,
            request_rate: 8500,
            error_rate: 0.5,
            latency_p99: 8,
          },
        },
        {
          node_id: 'node-4',
          name: 'Federation Gateway',
          type: 'network',
          status: 'healthy',
          region: 'us-east-1',
          metrics: {
            cpu_usage: 28,
            memory_usage: 45,
            network_io: 450,
            request_rate: 2100,
            error_rate: 0.1,
            latency_p99: 35,
          },
        },
      ];

      const mockHealth: ServiceHealth[] = [
        {
          service_id: 'geneva-api',
          service_name: 'Geneva API',
          health_score: 98,
          checks: [
            {
              check_name: 'Database Connection',
              status: 'pass',
              last_checked: new Date().toISOString(),
              duration_ms: 5,
            },
            {
              check_name: 'Redis Connection',
              status: 'warn',
              message: 'High memory usage detected',
              last_checked: new Date().toISOString(),
              duration_ms: 3,
            },
          ],
          dependencies: [
            {
              service_id: 'postgresql',
              service_name: 'PostgreSQL',
              status: 'healthy',
              impact: 'critical',
            },
            {
              service_id: 'redis',
              service_name: 'Redis',
              status: 'degraded',
              impact: 'medium',
            },
          ],
        },
      ];

      const mockMetrics: InfrastructureMetrics = {
        total_nodes: 4,
        healthy_nodes: 3,
        degraded_nodes: 1,
        down_nodes: 0,
        avg_cpu_usage: 42.5,
        avg_memory_usage: 69.25,
        total_requests_per_min: 15050,
        avg_latency_ms: 25,
        alerts: [
          {
            alert_id: 'alert-1',
            severity: 'warning',
            node_id: 'node-3',
            message: 'Redis memory usage above 90%',
            timestamp: new Date().toISOString(),
            resolved: false,
          },
        ],
      };

      setNodes(mockNodes);
      setServiceHealth(mockHealth);
      setMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'substrate':
        return <LayersIcon />;
      case 'database':
        return <StorageIcon />;
      case 'cache':
        return <MemoryIcon />;
      case 'service':
        return <CloudIcon />;
      case 'network':
        return <DnsIcon />;
      default:
        return <StorageIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return theme.palette.success.main;
      case 'degraded':
        return theme.palette.warning.main;
      case 'down':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const renderTopologyView = () => (
    <Grid container spacing={3}>
      {nodes.map(node => (
        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={node.node_id}>
          <Card
            sx={{
              cursor: 'pointer',
              border: selectedNode?.node_id === node.node_id ? 2 : 0,
              borderColor: 'primary.main',
              position: 'relative',
            }}
            onClick={() => {
              setSelectedNode(node);
              if (onNodeClick) onNodeClick(node);
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Badge
                    badgeContent=""
                    color={
                      node.status === 'healthy' ? 'success' :
                      node.status === 'degraded' ? 'warning' : 'error'
                    }
                    variant="dot"
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                  >
                    {getNodeIcon(node.type)}
                  </Badge>
                  <Box>
                    <Typography variant="subtitle1">{node.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {node.type} • {node.region}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={node.status}
                  size="small"
                  color={
                    node.status === 'healthy' ? 'success' :
                    node.status === 'degraded' ? 'warning' : 'error'
                  }
                />
              </Box>

              {/* Metrics */}
              <Grid container spacing={1}>
                {node.metrics.cpu_usage !== undefined && (
                  <Grid size={6}>
                    <Typography variant="caption" color="textSecondary">
                      CPU Usage
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={node.metrics.cpu_usage}
                        sx={{ flex: 1, height: 4 }}
                        color={node.metrics.cpu_usage > 80 ? 'error' : 'primary'}
                      />
                      <Typography variant="caption">
                        {node.metrics.cpu_usage}%
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {node.metrics.memory_usage !== undefined && (
                  <Grid size={6}>
                    <Typography variant="caption" color="textSecondary">
                      Memory
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={node.metrics.memory_usage}
                        sx={{ flex: 1, height: 4 }}
                        color={node.metrics.memory_usage > 85 ? 'error' : 'primary'}
                      />
                      <Typography variant="caption">
                        {node.metrics.memory_usage}%
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {node.metrics.request_rate !== undefined && (
                  <Grid size={6}>
                    <Typography variant="caption" color="textSecondary">
                      Requests/min
                    </Typography>
                    <Typography variant="body2">
                      {node.metrics.request_rate.toLocaleString()}
                    </Typography>
                  </Grid>
                )}

                {node.metrics.latency_p99 !== undefined && (
                  <Grid size={6}>
                    <Typography variant="caption" color="textSecondary">
                      P99 Latency
                    </Typography>
                    <Typography variant="body2">
                      {node.metrics.latency_p99}ms
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Components */}
              {node.components && node.components.length > 0 && (
                <Box mt={2}>
                  <Typography variant="caption" color="textSecondary">
                    Components
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {node.components.map(comp => (
                      <Chip
                        key={comp.component_id}
                        label={comp.name}
                        size="small"
                        variant="outlined"
                        icon={
                          comp.status === 'healthy' ? <CheckCircleIcon /> :
                          comp.status === 'degraded' ? <WarningIcon /> :
                          <ErrorIcon />
                        }
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderHealthView = () => (
    <Grid container spacing={3}>
      {serviceHealth.map(service => (
        <Grid size={{ xs: 12, md: 6 }} key={service.service_id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">{service.service_name}</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress
                    variant="determinate"
                    value={service.health_score}
                    size={40}
                    thickness={4}
                    color={
                      service.health_score > 90 ? 'success' :
                      service.health_score > 70 ? 'warning' : 'error'
                    }
                  />
                  <Typography variant="h6">
                    {service.health_score}%
                  </Typography>
                </Box>
              </Box>

              {/* Health Checks */}
              <Typography variant="subtitle2" gutterBottom>
                Health Checks
              </Typography>
              <List dense>
                {service.checks.map((check, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {check.status === 'pass' ? <CheckCircleIcon color="success" /> :
                       check.status === 'warn' ? <WarningIcon color="warning" /> :
                       <ErrorIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={check.check_name}
                      secondary={check.message || `${check.duration_ms}ms`}
                    />
                  </ListItem>
                ))}
              </List>

              {/* Dependencies */}
              {service.dependencies.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Dependencies
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {service.dependencies.map(dep => (
                      <Chip
                        key={dep.service_id}
                        label={dep.service_name}
                        size="small"
                        color={
                          dep.status === 'healthy' ? 'success' :
                          dep.status === 'degraded' ? 'warning' : 'error'
                        }
                        variant={dep.impact === 'critical' ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderPerformanceView = () => (
    <Grid container spacing={3}>
      {/* Overall Metrics */}
      <Grid size={12}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <SpeedIcon color="primary" />
                  <Box>
                    <Typography color="textSecondary" variant="caption">
                      Avg CPU Usage
                    </Typography>
                    <Typography variant="h6">
                      {metrics?.avg_cpu_usage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <MemoryIcon color="secondary" />
                  <Box>
                    <Typography color="textSecondary" variant="caption">
                      Avg Memory
                    </Typography>
                    <Typography variant="h6">
                      {metrics?.avg_memory_usage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <NetworkCheckIcon color="success" />
                  <Box>
                    <Typography color="textSecondary" variant="caption">
                      Requests/min
                    </Typography>
                    <Typography variant="h6">
                      {metrics?.total_requests_per_min.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <SpeedIcon color="warning" />
                  <Box>
                    <Typography color="textSecondary" variant="caption">
                      Avg Latency
                    </Typography>
                    <Typography variant="h6">
                      {metrics?.avg_latency_ms}ms
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Node Performance Details */}
      <Grid size={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Node Performance
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Node</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>CPU</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Memory</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Disk</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Network I/O</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Requests</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Errors</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map(node => (
                  <tr key={node.node_id}>
                    <td style={{ padding: 8 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Badge
                          color={
                            node.status === 'healthy' ? 'success' :
                            node.status === 'degraded' ? 'warning' : 'error'
                          }
                          variant="dot"
                        >
                          {getNodeIcon(node.type)}
                        </Badge>
                        {node.name}
                      </Box>
                    </td>
                    <td style={{ padding: 8 }}>{node.type}</td>
                    <td style={{ padding: 8 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={node.metrics.cpu_usage || 0}
                          sx={{ width: 60, height: 4 }}
                          color={node.metrics.cpu_usage! > 80 ? 'error' : 'primary'}
                        />
                        {node.metrics.cpu_usage || '-'}%
                      </Box>
                    </td>
                    <td style={{ padding: 8 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={node.metrics.memory_usage || 0}
                          sx={{ width: 60, height: 4 }}
                          color={node.metrics.memory_usage! > 85 ? 'error' : 'primary'}
                        />
                        {node.metrics.memory_usage || '-'}%
                      </Box>
                    </td>
                    <td style={{ padding: 8 }}>
                      {node.metrics.disk_usage ? `${node.metrics.disk_usage}%` : '-'}
                    </td>
                    <td style={{ padding: 8 }}>
                      {node.metrics.network_io ? `${node.metrics.network_io} MB/s` : '-'}
                    </td>
                    <td style={{ padding: 8 }}>
                      {node.metrics.request_rate ? `${node.metrics.request_rate}/min` : '-'}
                    </td>
                    <td style={{ padding: 8 }}>
                      <Chip
                        label={node.metrics.error_rate ? `${node.metrics.error_rate}%` : '0%'}
                        size="small"
                        color={node.metrics.error_rate! > 1 ? 'error' : 'default'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Infrastructure Map</Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadInfrastructureData}
            disabled={loading}
          >
            Refresh
          </Button>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto-refresh"
          />
        </Box>
      </Box>

      {/* Alerts */}
      {metrics && metrics.alerts.length > 0 && (
        <Box mb={3}>
          {metrics.alerts.filter(a => !a.resolved).map(alert => (
            <Alert
              key={alert.alert_id}
              severity={alert.severity === 'critical' ? 'error' : alert.severity}
              sx={{ mb: 1 }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
        >
          <Tab label="Topology" value="topology" icon={<LayersIcon />} />
          <Tab label="Health" value="health" icon={<SecurityIcon />} />
          <Tab label="Performance" value="performance" icon={<SpeedIcon />} />
        </Tabs>
      </Paper>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 'topology' && renderTopologyView()}
          {activeTab === 'health' && renderHealthView()}
          {activeTab === 'performance' && renderPerformanceView()}
        </>
      )}
    </Box>
  );
};