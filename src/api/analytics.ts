/**
 * Analytics API service using RTK Query for Geneva platform
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import type { 
  KPIMetricsResponse, 
  CostBreakdownResponse, 
  WorkflowPerformanceResponse,
  AgentPerformanceResponse,
  TrendDataResponse,
  AlertResponse,
  AnalyticsRequestParams,
  AcknowledgeAlertParams
} from '../types/analytics';
import { baseQueryWithRetry, CACHE_CONFIG } from './analyticsConfig';

// Create the analytics API service
export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['KPIMetrics', 'CostBreakdown', 'WorkflowPerformance', 'AgentPerformance', 'Trends', 'Alerts'],
  endpoints: (builder) => ({
    // Get KPI metrics
    getKPIMetrics: builder.query<KPIMetricsResponse, AnalyticsRequestParams>({
      query: ({ project_id, time_range = '30d' }) => ({
        url: '/kpi-metrics',
        params: { project_id, time_range },
      }),
      providesTags: ['KPIMetrics'],
      keepUnusedDataFor: CACHE_CONFIG.kpiMetrics,
    }),

    // Get cost breakdown
    getCostBreakdown: builder.query<CostBreakdownResponse, AnalyticsRequestParams>({
      query: ({ project_id, time_range = '30d', granularity = 'day' }) => ({
        url: '/cost-breakdown',
        params: { project_id, time_range, granularity },
      }),
      providesTags: ['CostBreakdown'],
      keepUnusedDataFor: CACHE_CONFIG.costBreakdown,
    }),

    // Get workflow performance
    getWorkflowPerformance: builder.query<WorkflowPerformanceResponse, AnalyticsRequestParams>({
      query: ({ project_id, time_range = '30d', limit = 50 }) => ({
        url: '/workflow-performance',
        params: { project_id, time_range, limit },
      }),
      providesTags: ['WorkflowPerformance'],
      keepUnusedDataFor: CACHE_CONFIG.workflowPerformance,
    }),

    // Get agent performance
    getAgentPerformance: builder.query<AgentPerformanceResponse, AnalyticsRequestParams>({
      query: ({ project_id, time_range = '30d' }) => ({
        url: '/agent-performance',
        params: { project_id, time_range },
      }),
      providesTags: ['AgentPerformance'],
      keepUnusedDataFor: CACHE_CONFIG.agentPerformance,
    }),

    // Get trend data for specific metric
    getTrendData: builder.query<TrendDataResponse, AnalyticsRequestParams & { metric: string }>({
      query: ({ project_id, metric, time_range = '30d', granularity = 'day' }) => ({
        url: `/trends/${metric}`,
        params: { project_id, time_range, granularity },
      }),
      providesTags: (result, error, arg) => [{ type: 'Trends', id: arg.metric }],
      keepUnusedDataFor: CACHE_CONFIG.trends,
    }),

    // Get alerts
    getAlerts: builder.query<AlertResponse, AnalyticsRequestParams & { status?: string }>({
      query: ({ project_id, status }) => ({
        url: '/alerts',
        params: { project_id, ...(status && { status }) },
      }),
      providesTags: ['Alerts'],
      keepUnusedDataFor: CACHE_CONFIG.alerts,
    }),

    // Acknowledge alert
    acknowledgeAlert: builder.mutation<void, AcknowledgeAlertParams>({
      query: ({ alert_id, ...body }) => ({
        url: `/alerts/${alert_id}/acknowledge`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Alerts'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetKPIMetricsQuery,
  useGetCostBreakdownQuery,
  useGetWorkflowPerformanceQuery,
  useGetAgentPerformanceQuery,
  useGetTrendDataQuery,
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
} = analyticsApi;

// Lazy query hooks for manual control
export const {
  useLazyGetKPIMetricsQuery,
  useLazyGetCostBreakdownQuery,
  useLazyGetWorkflowPerformanceQuery,
  useLazyGetAgentPerformanceQuery,
  useLazyGetTrendDataQuery,
  useLazyGetAlertsQuery,
} = analyticsApi;

// Prefetch utilities
export const prefetchAnalytics = {
  kpiMetrics: (dispatch: any, project_id: string, time_range: string = '30d') => 
    dispatch(analyticsApi.util.prefetch('getKPIMetrics', { project_id, time_range })),
  
  costBreakdown: (dispatch: any, project_id: string, time_range: string = '30d') =>
    dispatch(analyticsApi.util.prefetch('getCostBreakdown', { project_id, time_range })),
  
  workflowPerformance: (dispatch: any, project_id: string, time_range: string = '30d') =>
    dispatch(analyticsApi.util.prefetch('getWorkflowPerformance', { project_id, time_range })),
  
  agentPerformance: (dispatch: any, project_id: string, time_range: string = '30d') =>
    dispatch(analyticsApi.util.prefetch('getAgentPerformance', { project_id, time_range })),
};

// Subscription endpoints for real-time updates
export const subscribeToAnalytics = {
  // Subscribe to KPI updates with automatic cache updates
  kpiMetrics: (project_id: string) => {
    const updateInterval = setInterval(() => {
      analyticsApi.util.invalidateTags(['KPIMetrics']);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(updateInterval);
  },

  // Subscribe to alerts with automatic refresh
  alerts: (project_id: string) => {
    const updateInterval = setInterval(() => {
      analyticsApi.util.invalidateTags(['Alerts']);
    }, 10000); // Check for new alerts every 10 seconds

    return () => clearInterval(updateInterval);
  },
};