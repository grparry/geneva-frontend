import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Undo as UndoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChronosAPI } from '../../services/chronos/api';
import {
  DeploymentEnvironment,
  DeploymentStatus,
  ValidationLevel,
  EnvironmentStatus,
  ChronosMetrics,
  SystemHealth,
  DeploymentRequest,
  RollbackRequest,
  AlertMessage
} from '../../types/chronos';

const ChronosDeploymentDashboard: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ChronosMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentStatus[]>([]);
  
  // Dialog states
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<DeploymentEnvironment>(DeploymentEnvironment.STAGING);
  
  // Form states
  const [deployVersion, setDeployVersion] = useState('');
  const [validationLevel, setValidationLevel] = useState<ValidationLevel>(ValidationLevel.STANDARD);
  const [rollbackReason, setRollbackReason] = useState('');
  
  // Real-time updates
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [metricsData, healthData, productionStatus, stagingStatus, developmentStatus] = await Promise.all([
        ChronosAPI.getDeploymentAnalytics('24h'),
        ChronosAPI.getSystemHealth(),
        ChronosAPI.getDeploymentStatus(DeploymentEnvironment.PRODUCTION),
        ChronosAPI.getDeploymentStatus(DeploymentEnvironment.STAGING),
        ChronosAPI.getDeploymentStatus(DeploymentEnvironment.DEVELOPMENT)
      ]);
      
      setMetrics(metricsData);
      setSystemHealth(healthData);
      setEnvironments([productionStatus, stagingStatus, developmentStatus]);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      addAlert('error', 'Failed to load dashboard data', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addAlert = (type: AlertMessage['type'], title: string, message: string) => {
    const alert: AlertMessage = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date().toISOString()
    };
    setAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep only 5 most recent alerts
  };

  const handleDeploy = async () => {
    if (!deployVersion.trim()) {
      addAlert('warning', 'Invalid Input', 'Please enter a version number');
      return;
    }
    
    try {
      const request: DeploymentRequest = {
        version: deployVersion,
        environment: selectedEnvironment,
        validation_level: validationLevel,
        traffic_ramp_steps: [25, 50, 100]
      };
      
      const response = await ChronosAPI.deployChronos(request);
      
      if (response.success) {
        addAlert('success', 'Deployment Started', `Deploying version ${deployVersion} to ${selectedEnvironment}`);
        setDeployDialogOpen(false);
        setDeployVersion('');
        loadDashboardData();
      } else {
        addAlert('error', 'Deployment Failed', response.message || 'Unknown error');
      }
    } catch (error) {
      addAlert('error', 'Deployment Error', error instanceof Error ? error.message : 'Failed to start deployment');
    }
  };

  const handleRollback = async () => {
    if (!rollbackReason.trim()) {
      addAlert('warning', 'Invalid Input', 'Please provide a rollback reason');
      return;
    }
    
    try {
      const request: RollbackRequest = {
        reason: rollbackReason
      };
      
      const response = await ChronosAPI.rollbackChronos(request);
      
      if (response.success) {
        addAlert('success', 'Rollback Started', `Rolling back ${selectedEnvironment} environment`);
        setRollbackDialogOpen(false);
        setRollbackReason('');
        loadDashboardData();
      } else {
        addAlert('error', 'Rollback Failed', response.message || 'Unknown error');
      }
    } catch (error) {
      addAlert('error', 'Rollback Error', error instanceof Error ? error.message : 'Failed to start rollback');
    }
  };

  const getStatusColor = (status: DeploymentStatus) => {
    switch (status) {
      case DeploymentStatus.ACTIVE: return 'success';
      case DeploymentStatus.FAILED: return 'error';
      case DeploymentStatus.PENDING: return 'warning';
      case DeploymentStatus.DEPLOYING: return 'info';
      default: return 'default';
    }
  };

  const getHealthColor = (healthy: boolean) => healthy ? 'success' : 'error';

  if (loading && !metrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Chronos Dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          🚀 Chronos Deployment Dashboard
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={() => setDeployDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Deploy
          </Button>
          <Button
            variant="outlined"
            startIcon={<UndoIcon />}
            onClick={() => setRollbackDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Rollback
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box mb={3}>
          {alerts.map((alert) => (
            <Alert key={alert.id} severity={alert.type} sx={{ mb: 1 }}>
              <strong>{alert.title}:</strong> {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* System Health Overview */}
      {systemHealth && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Health Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" color={systemHealth.overall_status === 'healthy' ? 'success.main' : 'error.main'}>
                    {systemHealth.overall_status === 'healthy' ? <CheckIcon fontSize="large" /> : <ErrorIcon fontSize="large" />}
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {systemHealth.overall_status}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 9 }}>
                <Grid container spacing={2}>
                  {Object.entries(systemHealth.services).map(([service, status]) => (
                    <Grid size={{ xs: 6, md: 3 }} key={service}>
                      <Chip
                        label={service.replace('_', ' ')}
                        color={status ? 'success' : 'error'}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  ))}
                </Grid>
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>Resource Usage</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={systemHealth.resource_usage.cpu_percent}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="caption">
                    CPU: {systemHealth.resource_usage.cpu_percent}% | 
                    Memory: {systemHealth.resource_usage.memory_percent}% | 
                    Disk: {systemHealth.resource_usage.disk_percent}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Environment Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {environments.map((env) => (
          <Grid size={{ xs: 12, md: 4 }} key={env.environment}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {env.environment}
                  </Typography>
                  <Chip
                    label={env.status}
                    color={getStatusColor(env.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Version: {env.current_version}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Deployed: {new Date(env.last_deployed).toLocaleString()}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Health Score:
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={env.health_score * 100}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    color={env.health_score > 0.8 ? 'success' : env.health_score > 0.5 ? 'warning' : 'error'}
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {(env.health_score * 100).toFixed(0)}%
                  </Typography>
                </Box>
                {env.active_deployments > 0 && (
                  <Chip
                    label={`${env.active_deployments} active`}
                    color="info"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Metrics Charts */}
      {metrics && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Deployment Success Rate
                </Typography>
                <Box textAlign="center" py={2}>
                  <Typography variant="h3" color="success.main">
                    {metrics.total_deployments > 0 
                      ? ((metrics.successful_deployments / metrics.total_deployments) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metrics.successful_deployments} of {metrics.total_deployments} successful
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Deployment Time
                </Typography>
                <Box textAlign="center" py={2}>
                  <Typography variant="h3" color="primary.main">
                    {metrics.average_deployment_time.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    minutes
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Deployment Activity
                </Typography>
                {metrics.recent_activity.length > 0 ? (
                  <Box>
                    {metrics.recent_activity.slice(0, 5).map((deployment, index) => (
                      <Box key={deployment.deployment_id} display="flex" justifyContent="space-between" alignItems="center" py={1} sx={{ borderBottom: index < 4 ? '1px solid #eee' : 'none' }}>
                        <Box>
                          <Typography variant="body1">
                            {deployment.version} → {deployment.environment}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(deployment.started_at).toLocaleString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={deployment.status}
                          color={getStatusColor(deployment.status)}
                          size="small"
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent deployment activity
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Deploy Dialog */}
      <Dialog open={deployDialogOpen} onClose={() => setDeployDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deploy New Version</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Environment</InputLabel>
              <Select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value as DeploymentEnvironment)}
              >
                <MenuItem value={DeploymentEnvironment.DEVELOPMENT}>Development</MenuItem>
                <MenuItem value={DeploymentEnvironment.STAGING}>Staging</MenuItem>
                <MenuItem value={DeploymentEnvironment.CANARY}>Canary</MenuItem>
                <MenuItem value={DeploymentEnvironment.PRODUCTION}>Production</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              label="Version"
              value={deployVersion}
              onChange={(e) => setDeployVersion(e.target.value)}
              placeholder="e.g., v1.8.1"
              helperText="Enter the version to deploy"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Validation Level</InputLabel>
              <Select
                value={validationLevel}
                onChange={(e) => setValidationLevel(e.target.value as ValidationLevel)}
              >
                <MenuItem value={ValidationLevel.BASIC}>Basic</MenuItem>
                <MenuItem value={ValidationLevel.STANDARD}>Standard</MenuItem>
                <MenuItem value={ValidationLevel.COMPREHENSIVE}>Comprehensive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeploy} variant="contained" disabled={!deployVersion.trim()}>
            Deploy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollback Dialog */}
      <Dialog open={rollbackDialogOpen} onClose={() => setRollbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rollback Deployment</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Environment</InputLabel>
              <Select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value as DeploymentEnvironment)}
              >
                <MenuItem value={DeploymentEnvironment.DEVELOPMENT}>Development</MenuItem>
                <MenuItem value={DeploymentEnvironment.STAGING}>Staging</MenuItem>
                <MenuItem value={DeploymentEnvironment.CANARY}>Canary</MenuItem>
                <MenuItem value={DeploymentEnvironment.PRODUCTION}>Production</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              label="Rollback Reason"
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              multiline
              rows={3}
              placeholder="Explain why you're rolling back..."
              helperText="This will be logged for audit purposes"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRollback} variant="contained" color="warning" disabled={!rollbackReason.trim()}>
            Rollback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChronosDeploymentDashboard;