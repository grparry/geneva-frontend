/**
 * Federation Dashboard
 * 
 * Main dashboard for Geneva's federation system providing comprehensive
 * multi-substrate coordination and task delegation management.
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Tabs,
  Tab,
  Box,
  Paper,
  Alert,
  Chip,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  DeviceHub,
  Assignment,
  Security,
  Analytics,
  AccountTree,
} from '@mui/icons-material';

// Federation hooks and services
import { useFederationWebSocket } from '../../hooks/useFederationWebSocket';
import { 
  useGetFederationHealthQuery,
  useGetFederationMetricsQuery,
} from '../../api/federation';

// Federation types
import { FederationTab } from '../../types/federation';

// Federation components
const PeerManagement = React.lazy(() => 
  import('../../components/federation/PeerManagement').then(module => ({ default: module.PeerManagement }))
);

const DelegationQueue = React.lazy(() => 
  import('../../components/federation/DelegationQueue').then(module => ({ default: module.DelegationQueue }))
);

const TrustManagement = React.lazy(() => 
  import('../../components/federation/TrustManagement').then(module => ({ default: module.TrustManagement }))
);

const NetworkTopology = React.lazy(() => 
  import('../../components/federation/NetworkTopology').then(module => ({ default: module.NetworkTopology }))
);

const FederationMetrics = React.lazy(() => 
  import('../../components/federation/FederationMetrics').then(module => ({ default: module.FederationMetrics }))
);

interface TabConfig {
  id: FederationTab;
  label: string;
  icon: React.ReactElement;
  component: React.ComponentType;
  description: string;
}

export const FederationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FederationTab>('peers');
  const [isLoading, setIsLoading] = useState(true);

  // Real-time federation updates
  const { 
    isConnected, 
    connectionStatus, 
    error: websocketError,
    optimizeSubscriptions,
  } = useFederationWebSocket({
    subscriptions: ['peers', 'delegations', 'trust', 'events', 'metrics'],
    onError: (error) => {
      console.error('Federation WebSocket error:', error);
    },
  });

  // Federation health and metrics
  const { 
    data: healthData, 
    isLoading: healthLoading,
    error: healthError 
  } = useGetFederationHealthQuery();
  
  const { 
    data: metricsData, 
    isLoading: metricsLoading 
  } = useGetFederationMetricsQuery({});

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: 'peers',
      label: 'Peer Network',
      icon: <DeviceHub />,
      component: PeerManagement,
      description: 'Manage federated substrate peers',
    },
    {
      id: 'delegations',
      label: 'Task Delegation',
      icon: <Assignment />,
      component: DelegationQueue,
      description: 'Monitor and manage task delegations',
    },
    {
      id: 'trust',
      label: 'Trust Management',
      icon: <Security />,
      component: TrustManagement,
      description: 'Manage peer trust relationships',
    },
    {
      id: 'topology',
      label: 'Network Topology',
      icon: <AccountTree />,
      component: NetworkTopology,
      description: 'Visualize federation network',
    },
    {
      id: 'metrics',
      label: 'Metrics & Analytics',
      icon: <Analytics />,
      component: FederationMetrics,
      description: 'Federation performance analytics',
    },
    {
      id: 'monitoring',
      label: 'Advanced Monitoring',
      icon: <Analytics />,
      component: React.lazy(() => import('../../components/federation/AdvancedMonitoring').then(module => ({ default: module.AdvancedMonitoring }))),
      description: 'Comprehensive system monitoring',
    },
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = currentTab?.component || PeerManagement;

  // Handle tab changes with subscription optimization
  const handleTabChange = (event: React.SyntheticEvent, newValue: FederationTab) => {
    setActiveTab(newValue);
    
    // Optimize WebSocket subscriptions based on active tab
    const optimizedSubs = optimizeSubscriptions(newValue);
    console.log('Optimized subscriptions for tab:', newValue, optimizedSubs);
  };

  // Loading simulation for initial data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'error';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getConnectionStatusLabel = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  // Health status alert
  const getHealthAlert = () => {
    if (healthLoading || !healthData) return null;
    
    if (healthData.overall_status === 'critical') {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Critical Federation Issues</Typography>
          <Typography variant="body2">
            Network health: {Math.round(healthData.network_health * 100)}% | 
            {healthData.issues.length} active issue(s)
          </Typography>
        </Alert>
      );
    }
    
    if (healthData.overall_status === 'degraded') {
      return (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Federation Performance Degraded</Typography>
          <Typography variant="body2">
            Network health: {Math.round(healthData.network_health * 100)}% | 
            Some services may be slower than usual
          </Typography>
        </Alert>
      );
    }
    
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Initializing Federation Dashboard...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Substrate Federation
          </Typography>
          
          <Chip
            label={getConnectionStatusLabel()}
            color={getConnectionStatusColor()}
            size="small"
            variant="outlined"
            icon={connectionStatus === 'connecting' ? <CircularProgress size={16} /> : undefined}
          />
          
          {metricsData && (
            <>
              <Chip
                label={`${metricsData.connected_peers}/${metricsData.total_peers} Peers`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${metricsData.successful_delegations} Delegations`}
                size="small"
                variant="outlined"
              />
            </>
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Multi-substrate coordination and task delegation
        </Typography>
        
        {currentTab && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {currentTab.description}
          </Typography>
        )}
      </Box>

      {/* WebSocket Error Alert */}
      {websocketError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Real-time Connection Error</Typography>
          <Typography variant="body2">{websocketError}</Typography>
        </Alert>
      )}

      {/* Health Status Alert */}
      {getHealthAlert()}

      {/* Health Error Alert */}
      {healthError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Unable to fetch federation health</Typography>
          <Typography variant="body2">
            Some monitoring features may not be available
          </Typography>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }} elevation={1}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              sx={{
                '& .MuiTab-iconWrapper': {
                  marginBottom: 0,
                  marginRight: 1,
                },
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Fade in={true} timeout={300}>
        <Box>
          <React.Suspense 
            fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            }
          >
            <ActiveComponent />
          </React.Suspense>
        </Box>
      </Fade>

      {/* Debug Information (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ mt: 3, p: 2, backgroundColor: 'grey.50' }} elevation={0}>
          <Typography variant="caption" color="text.secondary">
            Debug: WebSocket Status: {connectionStatus} | 
            Health: {healthData?.overall_status || 'unknown'} | 
            Active Tab: {activeTab}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default FederationDashboard;