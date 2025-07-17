/**
 * Analytics routes configuration
 * Defines all analytics-related routes and navigation items
 */

import React from 'react';
import { RouteObject } from 'react-router-dom';
import {
  DashboardRounded,
  AttachMoneyRounded,
  SpeedRounded,
  GroupsRounded,
  AssessmentRounded,
  TrendingUpRounded,
} from '@mui/icons-material';

import { lazyWithRetry, createRoutePreloader } from '../utils/lazyWithRetry';

// Lazy load analytics pages with retry logic for better performance
const ExecutiveDashboard = lazyWithRetry(
  () => import(/* webpackChunkName: "executive-dashboard" */ '../pages/analytics/ExecutiveDashboard'),
  { maxRetries: 3, retryDelay: 1000 }
);

const WorkflowAnalytics = lazyWithRetry(
  () => import(/* webpackChunkName: "workflow-analytics" */ '../pages/analytics/WorkflowAnalytics'),
  { maxRetries: 3, retryDelay: 1000 }
);

const CostAnalysis = lazyWithRetry(
  () => import(/* webpackChunkName: "cost-analysis" */ '../pages/analytics/CostAnalysis'),
  { maxRetries: 3, retryDelay: 1000 }
);

const AgentPerformance = lazyWithRetry(
  () => import(/* webpackChunkName: "agent-performance" */ '../pages/analytics/AgentPerformance'),
  { maxRetries: 3, retryDelay: 1000 }
);

const RealtimeAnalyticsDashboard = lazyWithRetry(
  () => import(/* webpackChunkName: "realtime-dashboard" */ '../components/analytics/RealtimeAnalyticsDashboard'),
  { maxRetries: 3, retryDelay: 1000 }
);

// Create route preloader for analytics pages
export const analyticsRoutePreloader = createRoutePreloader({
  'executive': () => import(/* webpackChunkName: "executive-dashboard" */ '../pages/analytics/ExecutiveDashboard'),
  'workflows': () => import(/* webpackChunkName: "workflow-analytics" */ '../pages/analytics/WorkflowAnalytics'),
  'costs': () => import(/* webpackChunkName: "cost-analysis" */ '../pages/analytics/CostAnalysis'),
  'agents': () => import(/* webpackChunkName: "agent-performance" */ '../pages/analytics/AgentPerformance'),
  'realtime': () => import(/* webpackChunkName: "realtime-dashboard" */ '../components/analytics/RealtimeAnalyticsDashboard'),
});

// Analytics route configuration
export const analyticsRoutes: RouteObject[] = [
  {
    path: 'analytics',
    children: [
      {
        index: true,
        element: <RealtimeAnalyticsDashboard />,
      },
      {
        path: 'executive',
        element: <ExecutiveDashboard />,
      },
      {
        path: 'workflows',
        element: <WorkflowAnalytics />,
      },
      {
        path: 'costs',
        element: <CostAnalysis />,
      },
      {
        path: 'agents',
        element: <AgentPerformance />,
      },
    ],
  },
];

// Navigation menu items for analytics
export const analyticsNavigationItems = {
  main: {
    id: 'analytics',
    title: 'Analytics',
    icon: <AssessmentRounded />,
    path: '/analytics',
    badge: 'NEW',
    children: [
      {
        id: 'analytics-overview',
        title: 'Overview',
        icon: <DashboardRounded />,
        path: '/analytics',
        description: 'Real-time analytics dashboard',
      },
      {
        id: 'analytics-executive',
        title: 'Executive Dashboard',
        icon: <TrendingUpRounded />,
        path: '/analytics/executive',
        description: 'High-level KPIs and insights',
      },
      {
        id: 'analytics-workflows',
        title: 'Workflow Analytics',
        icon: <SpeedRounded />,
        path: '/analytics/workflows',
        description: 'Workflow performance metrics',
      },
      {
        id: 'analytics-costs',
        title: 'Cost Analysis',
        icon: <AttachMoneyRounded />,
        path: '/analytics/costs',
        description: 'Cost breakdown and optimization',
      },
      {
        id: 'analytics-agents',
        title: 'Agent Performance',
        icon: <GroupsRounded />,
        path: '/analytics/agents',
        description: 'Agent efficiency and utilization',
      },
    ],
  },
  quickAccess: [
    {
      id: 'quick-analytics',
      title: 'Analytics Dashboard',
      icon: <AssessmentRounded />,
      path: '/analytics',
      color: 'primary',
    },
    {
      id: 'quick-costs',
      title: 'Cost Analysis',
      icon: <AttachMoneyRounded />,
      path: '/analytics/costs',
      color: 'warning',
    },
  ],
};

// Breadcrumb configuration for analytics pages
export const analyticsBreadcrumbs = {
  '/analytics': [
    { label: 'Home', path: '/' },
    { label: 'Analytics', path: '/analytics' },
  ],
  '/analytics/executive': [
    { label: 'Home', path: '/' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Executive Dashboard', path: '/analytics/executive' },
  ],
  '/analytics/workflows': [
    { label: 'Home', path: '/' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Workflow Analytics', path: '/analytics/workflows' },
  ],
  '/analytics/costs': [
    { label: 'Home', path: '/' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Cost Analysis', path: '/analytics/costs' },
  ],
  '/analytics/agents': [
    { label: 'Home', path: '/' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Agent Performance', path: '/analytics/agents' },
  ],
};

// Analytics feature flags (for gradual rollout)
export const analyticsFeatureFlags = {
  enableRealtimeAnalytics: true,
  enableCostAlerts: true,
  enableAgentPerformance: true,
  enableCustomReports: false, // Coming soon
  enableDataExport: true,
  enableAdvancedFilters: true,
};

// Analytics permissions/roles
export const analyticsPermissions = {
  viewAnalytics: ['admin', 'manager', 'analyst', 'viewer'],
  viewCosts: ['admin', 'manager', 'finance'],
  exportData: ['admin', 'manager', 'analyst'],
  viewExecutiveDashboard: ['admin', 'executive', 'manager'],
  manageAlerts: ['admin', 'manager'],
};