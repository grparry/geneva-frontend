import React from 'react';
import { RouteObject } from 'react-router-dom';
import {
  DeviceHub,
  Assignment,
  Security,
  Analytics,
  AccountTree,
  MonitorHeart,
} from '@mui/icons-material';

// import { lazyWithRetry, createRoutePreloader } from '../utils/lazyWithRetry';

// Lazy load federation pages
const FederationDashboard = React.lazy(() => import('../pages/FederationDashboard'));

const PeerManagement = React.lazy(() => 
  import('../components/federation/PeerManagement').then(module => ({ default: module.PeerManagement }))
);

const DelegationQueue = React.lazy(() => 
  import('../components/federation/DelegationQueue').then(module => ({ default: module.DelegationQueue }))
);

const TrustManagement = React.lazy(() => 
  import('../components/federation/TrustManagement').then(module => ({ default: module.TrustManagement }))
);

const NetworkTopology = React.lazy(() => 
  import('../components/federation/NetworkTopology').then(module => ({ default: module.NetworkTopology }))
);

const FederationMetrics = React.lazy(() => 
  import('../components/federation/FederationMetrics').then(module => ({ default: module.FederationMetrics }))
);

const AdvancedMonitoring = React.lazy(() => 
  import('../components/federation/AdvancedMonitoring').then(module => ({ default: module.AdvancedMonitoring }))
);

// Federation route configuration
export const federationRoutes: RouteObject[] = [
  {
    path: 'federation',
    children: [
      {
        index: true,
        element: <FederationDashboard />,
      },
      {
        path: 'peers',
        element: <PeerManagement />,
      },
      {
        path: 'delegations',
        element: <DelegationQueue />,
      },
      {
        path: 'trust',
        element: <TrustManagement />,
      },
      {
        path: 'topology',
        element: <NetworkTopology />,
      },
      {
        path: 'metrics',
        element: <FederationMetrics />,
      },
      {
        path: 'monitoring',
        element: <AdvancedMonitoring />,
      },
    ],
  },
];

// Navigation menu items for federation
export const federationNavigationItems = {
  main: {
    id: 'federation',
    title: 'Federation',
    icon: <DeviceHub />,
    path: '/federation',
    badge: 'ACTIVE',
    children: [
      {
        id: 'federation-dashboard',
        title: 'Dashboard',
        icon: <Analytics />,
        path: '/federation',
        description: 'Federation overview and status',
      },
      {
        id: 'federation-peers',
        title: 'Peer Network',
        icon: <DeviceHub />,
        path: '/federation/peers',
        description: 'Manage substrate peers',
      },
      {
        id: 'federation-delegations',
        title: 'Task Delegation',
        icon: <Assignment />,
        path: '/federation/delegations',
        description: 'Monitor task delegations',
      },
      {
        id: 'federation-trust',
        title: 'Trust Management',
        icon: <Security />,
        path: '/federation/trust',
        description: 'Manage trust relationships',
      },
      {
        id: 'federation-topology',
        title: 'Network Topology',
        icon: <AccountTree />,
        path: '/federation/topology',
        description: 'Network visualization',
      },
      {
        id: 'federation-metrics',
        title: 'Metrics',
        icon: <Analytics />,
        path: '/federation/metrics',
        description: 'Performance analytics',
      },
      {
        id: 'federation-monitoring',
        title: 'Advanced Monitoring',
        icon: <MonitorHeart />,
        path: '/federation/monitoring',
        description: 'System monitoring',
      },
    ],
  },
  quickAccess: [
    {
      id: 'quick-federation',
      title: 'Federation',
      icon: <DeviceHub />,
      path: '/federation',
      color: 'primary',
    },
  ],
};

// Route preloading for performance
export const preloadFederationRoutes = () => {
  // const preloader = createRoutePreloader();
  
  // Preload critical federation routes
  // preloader.preload([
  //   () => import('../pages/FederationDashboard'),
  //   () => import('../components/federation/PeerManagement'),
  //   () => import('../components/federation/DelegationQueue'),
  // ]);
};