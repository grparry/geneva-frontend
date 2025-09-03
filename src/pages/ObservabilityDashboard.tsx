import React, { useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Chat as ChatIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';
import { useObservabilityStore } from '../store/observabilityStore';

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
}> = ({ title, value, subtitle, icon, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ color: `${color}.main` }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const ObservabilityDashboard: React.FC = () => {
  const { 
    systemMetrics, 
    systemHealth, 
    loadSystemMetrics, 
    loading 
  } = useObservabilityStore();

  useEffect(() => {
    loadSystemMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadSystemMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadSystemMetrics]);

  if (loading.systemMetrics && !systemMetrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Observability Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Real-time monitoring and analysis of the Geneva platform
      </Typography>

      {/* Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Communications"
            value={systemMetrics?.total_communications.toLocaleString() || "Loading..."}
            subtitle="Last 24 hours"
            icon={<ChatIcon />}
            color="primary"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Agent Executions"
            value={systemMetrics?.total_agent_executions || "Loading..."}
            subtitle="Total executions"
            icon={<SmartToyIcon />}
            color="success"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Health Score"
            value={systemMetrics ? `${systemMetrics.health_score}%` : "Loading..."}
            subtitle={systemMetrics?.health_status || ""}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="LLM Calls"
            value={systemMetrics?.total_llm_calls || "Loading..."}
            subtitle="Total API calls"
            icon={<SpeedIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Status Overview */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Communication Activity
            </Typography>
            <Box 
              sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Communication timeline chart will be implemented here
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Database</Typography>
                  <Chip 
                    label={systemHealth.database} 
                    color={systemHealth.database === 'healthy' ? 'success' : 'error'} 
                    size="small" 
                  />
                </Stack>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">WebSocket</Typography>
                  <Chip 
                    label={systemHealth.websocket} 
                    color={systemHealth.websocket === 'connected' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </Stack>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Memory Service</Typography>
                  <Chip 
                    label={systemHealth.memoryService} 
                    color={systemHealth.memoryService === 'healthy' ? 'success' : 'error'} 
                    size="small" 
                  />
                </Stack>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Agent Framework</Typography>
                  <Chip 
                    label={systemHealth.agentFramework} 
                    color={systemHealth.agentFramework === 'running' ? 'success' : 'error'} 
                    size="small" 
                  />
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};