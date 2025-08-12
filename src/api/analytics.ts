/**
 * Analytics API service using RTK Query for Geneva platform
 * Migrated to use TenantApiClient - no longer needs project_id parameters
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import type { 
  KPIMetricsResponse, 
  CostBreakdownResponse, 
  WorkflowPerformanceResponse,
  AgentPerformanceResponse,
  TrendDataResponse,
  AlertResponse,
  AcknowledgeAlertParams
} from '../types/analytics';
import { baseQueryWithRetry, CACHE_CONFIG } from './analyticsConfig';

// Updated request params without project_id (handled by TenantApiClient headers)
export interface AnalyticsRequestParams {
  time_range?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
}

// Create the analytics API service
export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['KPIMetrics', 'CostBreakdown', 'WorkflowPerformance', 'AgentPerformance', 'Trends', 'Alerts'],
  endpoints: (builder) => ({
    // Get KPI metrics
    getKPIMetrics: builder.query<KPIMetricsResponse, AnalyticsRequestParams>({
      query: ({ time_range = '30d' }) => ({
        url: '/kpi-metrics',
        params: { time_range },
      }),
      providesTags: ['KPIMetrics'],
      keepUnusedDataFor: CACHE_CONFIG.kpiMetrics,
    }),

    // Get cost breakdown
    getCostBreakdown: builder.query<CostBreakdownResponse, AnalyticsRequestParams>({
      query: ({ time_range = '30d', granularity = 'day' }) => ({
        url: '/cost-breakdown',
        params: { time_range, granularity },
      }),
      providesTags: ['CostBreakdown'],
      keepUnusedDataFor: CACHE_CONFIG.costBreakdown,
    }),

    // Get workflow performance
    getWorkflowPerformance: builder.query<WorkflowPerformanceResponse, AnalyticsRequestParams>({
      query: ({ time_range = '30d', limit = 50 }) => ({
        url: '/workflow-performance',
        params: { time_range, limit },
      }),
      providesTags: ['WorkflowPerformance'],
      keepUnusedDataFor: CACHE_CONFIG.workflowPerformance,
    }),

    // Get agent performance
    getAgentPerformance: builder.query<AgentPerformanceResponse, AnalyticsRequestParams>({
      query: ({ time_range = '30d' }) => ({
        url: '/agent-performance',
        params: { time_range },
      }),
      providesTags: ['AgentPerformance'],
      keepUnusedDataFor: CACHE_CONFIG.agentPerformance,
    }),

    // Get trend data for specific metric
    getTrendData: builder.query<TrendDataResponse, AnalyticsRequestParams & { metric: string }>({
      query: ({ metric, time_range = '30d', granularity = 'day' }) => ({
        url: `/trends/${metric}`,
        params: { time_range, granularity },
      }),
      providesTags: (result, error, arg) => [{ type: 'Trends', id: arg.metric }],
      keepUnusedDataFor: CACHE_CONFIG.trends,
    }),

    // Get alerts
    getAlerts: builder.query<AlertResponse, AnalyticsRequestParams & { status?: string }>({
      query: ({ status }) => ({
        url: '/alerts',
        params: { ...(status && { status }) },
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

// Prefetch utilities (no longer need project_id - handled by TenantApiClient headers)
export const prefetchAnalytics = {
  kpiMetrics: (dispatch: any, time_range: string = '30d') => 
    dispatch(analyticsApi.util.prefetch('getKPIMetrics', { time_range }, {})),
  
  costBreakdown: (dispatch: any, time_range: string = '30d') =>
    dispatch(analyticsApi.util.prefetch('getCostBreakdown', { time_range }, {})),
  
  workflowPerformance: (dispatch: any, time_range: string = '30d') =>
    dispatch(analyticsApi.util.prefetch('getWorkflowPerformance', { time_range }, {})),
  
  agentPerformance: (dispatch: any, time_range: string = '30d') =>
    dispatch(analyticsApi.util.prefetch('getAgentPerformance', { time_range }, {})),
};

// Subscription endpoints for real-time updates (no project_id needed - TenantApiClient handles tenant context)
export const subscribeToAnalytics = {
  // Subscribe to KPI updates with automatic cache updates
  kpiMetrics: () => {
    const updateInterval = setInterval(() => {
      analyticsApi.util.invalidateTags(['KPIMetrics']);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(updateInterval);
  },

  // Subscribe to alerts with automatic refresh
  alerts: () => {
    const updateInterval = setInterval(() => {
      analyticsApi.util.invalidateTags(['Alerts']);
    }, 10000); // Check for new alerts every 10 seconds

    return () => clearInterval(updateInterval);
  },
};