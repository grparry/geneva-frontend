/**
 * Integrated real-time analytics dashboard
 * Combines REST API data with WebSocket updates
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Fade,
  useTheme,
} from '@mui/material';
import {
  DashboardRounded,
  TrendingUpRounded,
  PeopleRounded,
  NotificationsRounded,
  RefreshRounded,
  FullscreenRounded,
  FullscreenExitRounded,
  AttachMoneyRounded,
} from '@mui/icons-material';
import { useAnalyticsDashboard } from '../../hooks/useAnalytics';
import { useRealtimeAnalytics } from '../../hooks/useAnalyticsWebSocket';
import AnalyticsErrorBoundary from './AnalyticsErrorBoundary';
import { ExecutiveDashboardSkeleton } from './AnalyticsLoadingSkeleton';
import { LiveMetricsDashboard, LiveMetricsBar } from './LiveMetricsDisplay';
import { CostAlertsPanel, CostAlertNotification } from './CostAlertsPanel';
import { ConnectionIndicator } from './WebSocketConnectionManager';
import AnalyticsExample from './AnalyticsExample';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

// Real-time KPI card with live updates
const RealtimeKPICard: React.FC<{
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  liveValue?: number;
  format?: (value: number) => string;
}> = ({ title, value, trend, icon, liveValue, format }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    if (liveValue !== undefined) {
      setDisplayValue(format ? format(liveValue) : liveValue);
    }
  }, [liveValue, format]);

  return (
    <Paper sx={{ p: 3, height: '100%', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {displayValue}
          </Typography>
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUpRounded 
                sx={{ 
                  fontSize: 20, 
                  color: trend > 0 ? 'success.main' : 'error.main',
                  transform: trend < 0 ? 'rotate(180deg)' : 'none'
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: trend > 0 ? 'success.main' : 'error.main',
                  ml: 0.5 
                }}
              >
                {Math.abs(trend).toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ color: 'primary.main', opacity: 0.8 }}>
          {icon}
        </Box>
      </Box>
      
      {liveValue !== undefined && (
        <ConnectionIndicator size="small" showLabel={false} />
      )}
    </Paper>
  );
};

// Main real-time dashboard component
export const RealtimeAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Fetch initial data and subscribe to updates
  const {
    kpiMetrics,
    costAnalysis,
    workflowAnalytics,
    agentPerformance,
    alerts,
    unacknowledgedAlerts,
    isLoading,
    hasError,
    errors,
    refetchAll,
  } = useAnalyticsDashboard(timeRange);
  
  // Real-time data
  const {
    liveMetrics,
    alerts: liveAlerts,
    unreadAlerts,
    connectionStatus,
  } = useRealtimeAnalytics({
    metricsOptions: { updateInterval: 10 },
    alertSeverity: ['high', 'critical'],
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <ExecutiveDashboardSkeleton />
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Live metrics bar */}
      <LiveMetricsBar />
      
      {/* Cost alert notifications */}
      <CostAlertNotification />
      
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Analytics Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time insights and performance metrics
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <ConnectionIndicator />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                </Select>
              </FormControl>
              
              <Tooltip title="Refresh all data">
                <IconButton onClick={refetchAll}>
                  <RefreshRounded />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                <IconButton onClick={toggleFullscreen}>
                  {isFullscreen ? <FullscreenExitRounded /> : <FullscreenRounded />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Alerts summary */}
          {(unacknowledgedAlerts > 0 || unreadAlerts > 0) && (
            <Fade in>
              <Paper 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <NotificationsRounded />
                <Typography variant="body2">
                  You have {unacknowledgedAlerts + unreadAlerts} unacknowledged alerts
                </Typography>
              </Paper>
            </Fade>
          )}
        </Box>

        {/* KPI Overview */}
        <AnalyticsErrorBoundary componentName="KPI Overview">
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <RealtimeKPICard
                title="Active Workflows"
                value={kpiMetrics?.workflows.total || 0}
                trend={kpiMetrics?.workflows.trend}
                icon={<DashboardRounded sx={{ fontSize: 40 }} />}
                liveValue={liveMetrics?.metrics.active_workflows}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <RealtimeKPICard
                title="Success Rate"
                value={kpiMetrics?.workflows.successRateFormatted || '0%'}
                trend={kpiMetrics?.workflows.trend}
                icon={<TrendingUpRounded sx={{ fontSize: 40 }} />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <RealtimeKPICard
                title="Current Cost Rate"
                value={kpiMetrics?.costs.totalFormatted || '$0'}
                trend={kpiMetrics?.costs.trend}
                icon={<AttachMoneyRounded sx={{ fontSize: 40 }} />}
                liveValue={liveMetrics?.metrics.current_cost_rate}
                format={(v) => `$${v.toFixed(2)}/hr`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <RealtimeKPICard
                title="Active Agents"
                value={kpiMetrics?.agents.active_count || 0}
                icon={<PeopleRounded sx={{ fontSize: 40 }} />}
                liveValue={liveMetrics?.metrics.active_agents}
              />
            </Grid>
          </Grid>
        </AnalyticsErrorBoundary>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Live Metrics" />
            <Tab label="Analytics Overview" />
            <Tab label="Cost Alerts" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <AnalyticsErrorBoundary componentName="Live Metrics">
            <LiveMetricsDashboard updateInterval={10} />
          </AnalyticsErrorBoundary>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <AnalyticsErrorBoundary componentName="Analytics Overview">
            <AnalyticsExample />
          </AnalyticsErrorBoundary>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <AnalyticsErrorBoundary componentName="Cost Alerts">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <CostAlertsPanel maxHeight={600} autoExpand />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Alert Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure alert thresholds and notification preferences
                  </Typography>
                  {/* Alert settings would go here */}
                </Paper>
              </Grid>
            </Grid>
          </AnalyticsErrorBoundary>
        </TabPanel>
      </Container>
    </Box>
  );
};

export default RealtimeAnalyticsDashboard;