/**
 * Custom React hooks for analytics data management
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import {
  useGetKPIMetricsQuery,
  useGetCostBreakdownQuery,
  useGetWorkflowPerformanceQuery,
  useGetAgentPerformanceQuery,
  useGetTrendDataQuery,
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
  subscribeToAnalytics,
} from '../api/analytics';
import {
  analyticsTransformers,
  formatDateRange,
} from '../utils/analyticsTransformers';
import { formatAnalyticsError } from '../services/analyticsApiConfig';
import type {
  AnalyticsRequestParams,
  MetricType,
} from '../types/analytics';

// Type for the Redux state (adjust based on your actual state structure)
interface RootState {
  auth: {
    user: {
      id: string;
      email: string;
    };
    token: string;
  };
  project: {
    currentProjectId: string;
  };
}

const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;

// KPI Metrics Hook
export const useKPIMetrics = (timeRange: string = '30d', options?: { pollingInterval?: number }) => {
  const { data, error, isLoading, isFetching, refetch } = useGetKPIMetricsQuery(
    { time_range: timeRange },
    {
      pollingInterval: options?.pollingInterval,
    }
  );

  // Subscribe to real-time updates
  useEffect(() => {
    if (options?.pollingInterval) {
      const unsubscribe = subscribeToAnalytics.kpiMetrics();
      return unsubscribe;
    }
  }, [options?.pollingInterval]);

  const transformedData = useMemo(() => {
    if (!data) return null;
    return analyticsTransformers.kpiMetrics(data);
  }, [data]);

  return {
    data: transformedData,
    error: error ? formatAnalyticsError(error) : null,
    isLoading,
    isFetching,
    refetch,
  };
};

// Cost Analysis Hook
export const useCostAnalysis = (timeRange: string = '30d', granularity: 'hour' | 'day' | 'week' | 'month' = 'day') => {
  const { data, error, isLoading, isFetching, refetch } = useGetCostBreakdownQuery(
    { time_range: timeRange, granularity },
    {}
  );

  const transformedData = useMemo(() => {
    if (!data) return null;
    return analyticsTransformers.costBreakdown(data);
  }, [data]);

  const dateRange = useMemo(() => formatDateRange(timeRange), [timeRange]);

  return {
    data: transformedData,
    dateRange,
    error: error ? formatAnalyticsError(error) : null,
    isLoading,
    isFetching,
    refetch,
  };
};

// Workflow Analytics Hook
export const useWorkflowAnalytics = (timeRange: string = '30d', limit: number = 50) => {
  const { data, error, isLoading, isFetching, refetch } = useGetWorkflowPerformanceQuery(
    { time_range: timeRange, limit },
    {}
  );

  const transformedData = useMemo(() => {
    if (!data) return null;
    return analyticsTransformers.workflowPerformance(data);
  }, [data]);

  return {
    data: transformedData,
    error: error ? formatAnalyticsError(error) : null,
    isLoading,
    isFetching,
    refetch,
  };
};

// Agent Performance Hook
export const useAgentPerformance = (timeRange: string = '30d') => {
  const { data, error, isLoading, isFetching, refetch } = useGetAgentPerformanceQuery(
    { time_range: timeRange },
    {}
  );

  const transformedData = useMemo(() => {
    if (!data) return null;
    return analyticsTransformers.agentPerformance(data);
  }, [data]);

  return {
    data: transformedData,
    error: error ? formatAnalyticsError(error) : null,
    isLoading,
    isFetching,
    refetch,
  };
};

// Trend Data Hook
export const useTrendData = (
  metric: MetricType,
  timeRange: string = '30d',
  granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
) => {
  const { data, error, isLoading, isFetching, refetch } = useGetTrendDataQuery(
    { metric, time_range: timeRange, granularity },
    {}
  );

  const transformedData = useMemo(() => {
    if (!data) return null;
    return analyticsTransformers.trendData(data);
  }, [data]);

  return {
    data: transformedData,
    error: error ? formatAnalyticsError(error) : null,
    isLoading,
    isFetching,
    refetch,
  };
};

// Alerts Hook
export const useAlerts = (status?: 'active' | 'acknowledged' | 'resolved', autoRefresh: boolean = true) => {
  const { data, error, isLoading, isFetching, refetch } = useGetAlertsQuery(
    { status },
    {}
  );

  const [acknowledgeAlert, { isLoading: isAcknowledging }] = useAcknowledgeAlertMutation();

  // Subscribe to real-time alerts
  useEffect(() => {
    if (autoRefresh) {
      const unsubscribe = subscribeToAnalytics.alerts();
      return unsubscribe;
    }
  }, [autoRefresh]);

  const handleAcknowledgeAlert = useCallback(async (alertId: string, notes?: string) => {
    try {
      await acknowledgeAlert({ alert_id: alertId, notes }).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error: formatAnalyticsError(error) };
    }
  }, [acknowledgeAlert]);

  return {
    alerts: data?.alerts || [],
    totalAlerts: data?.total || 0,
    unacknowledgedCount: data?.unacknowledged || 0,
    acknowledgeAlert: handleAcknowledgeAlert,
    isAcknowledging,
    error: error ? formatAnalyticsError(error) : null,
    isLoading,
    isFetching,
    refetch,
  };
};

// Combined Analytics Dashboard Hook
export const useAnalyticsDashboard = (timeRange: string = '30d') => {
  const kpiMetrics = useKPIMetrics(timeRange, { pollingInterval: 30000 });
  const costAnalysis = useCostAnalysis(timeRange);
  const workflowAnalytics = useWorkflowAnalytics(timeRange);
  const agentPerformance = useAgentPerformance(timeRange);
  const alerts = useAlerts('active', true);

  const isLoading = 
    kpiMetrics.isLoading || 
    costAnalysis.isLoading || 
    workflowAnalytics.isLoading || 
    agentPerformance.isLoading ||
    alerts.isLoading;

  const hasError = 
    kpiMetrics.error || 
    costAnalysis.error || 
    workflowAnalytics.error || 
    agentPerformance.error ||
    alerts.error;

  const refetchAll = useCallback(() => {
    kpiMetrics.refetch();
    costAnalysis.refetch();
    workflowAnalytics.refetch();
    agentPerformance.refetch();
    alerts.refetch();
  }, [kpiMetrics, costAnalysis, workflowAnalytics, agentPerformance, alerts]);

  return {
    kpiMetrics: kpiMetrics.data,
    costAnalysis: costAnalysis.data,
    workflowAnalytics: workflowAnalytics.data,
    agentPerformance: agentPerformance.data,
    alerts: alerts.alerts,
    unacknowledgedAlerts: alerts.unacknowledgedCount,
    isLoading,
    hasError,
    errors: {
      kpiMetrics: kpiMetrics.error,
      costAnalysis: costAnalysis.error,
      workflowAnalytics: workflowAnalytics.error,
      agentPerformance: agentPerformance.error,
      alerts: alerts.error,
    },
    refetchAll,
  };
};

// Chart-specific hooks
export const useCostTrendChart = (timeRange: string = '30d') => {
  const costData = useCostAnalysis(timeRange);
  
  const chartData = useMemo(() => {
    if (!costData.data?.costTrendsFormatted) return [];
    
    return costData.data.costTrendsFormatted.map(trend => ({
      date: trend.dateFormatted,
      llmCost: trend.llm_cost,
      resourceCost: trend.resource_cost,
      totalCost: trend.total_cost,
      tooltip: {
        llm: trend.llmCostFormatted,
        resource: trend.resourceCostFormatted,
        total: trend.totalCostFormatted,
      },
    }));
  }, [costData.data]);

  return {
    chartData,
    isLoading: costData.isLoading,
    error: costData.error,
  };
};

export const useWorkflowSuccessRateChart = (timeRange: string = '30d') => {
  const workflowData = useWorkflowAnalytics(timeRange);
  
  const chartData = useMemo(() => {
    if (!workflowData.data?.performanceTrendsFormatted) return [];
    
    return workflowData.data.performanceTrendsFormatted.map(trend => ({
      timestamp: trend.timestampFormatted,
      successRate: trend.success_rate,
      executions: trend.executions,
      tooltip: {
        successRate: trend.successRateFormatted,
        avgDuration: trend.avgDurationFormatted,
      },
    }));
  }, [workflowData.data]);

  return {
    chartData,
    isLoading: workflowData.isLoading,
    error: workflowData.error,
  };
};

// Export all hooks
export default {
  useKPIMetrics,
  useCostAnalysis,
  useWorkflowAnalytics,
  useAgentPerformance,
  useTrendData,
  useAlerts,
  useAnalyticsDashboard,
  useCostTrendChart,
  useWorkflowSuccessRateChart,
};