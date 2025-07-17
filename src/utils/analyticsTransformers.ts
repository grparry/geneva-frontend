/**
 * Data transformation utilities for analytics data
 * Handles formatting, aggregation, and conversion of API responses
 */

import { format, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import type {
  KPIMetricsResponse,
  CostBreakdownResponse,
  WorkflowPerformanceResponse,
  AgentPerformanceResponse,
  TrendData,
  TrendDataResponse
} from '../types/analytics';

// Date formatting utilities
export const formatDate = (dateString: string, formatString: string = 'MMM dd, yyyy'): string => {
  try {
    return format(parseISO(dateString), formatString);
  } catch {
    return dateString;
  }
};

export const formatDateRange = (timeRange: string): { start: Date; end: Date } => {
  const end = new Date();
  let start: Date;

  switch (timeRange) {
    case '24h':
      start = subDays(end, 1);
      break;
    case '7d':
      start = subDays(end, 7);
      break;
    case '30d':
      start = subDays(end, 30);
      break;
    case '90d':
      start = subDays(end, 90);
      break;
    default:
      start = subDays(end, 30);
  }

  return {
    start: startOfDay(start),
    end: endOfDay(end)
  };
};

// Number formatting utilities
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

// KPI transformations
export const transformKPIMetrics = (data: KPIMetricsResponse) => {
  return {
    workflows: {
      ...data.workflows,
      successRateFormatted: formatPercentage(data.workflows.success_rate),
      avgDurationFormatted: formatDuration(data.workflows.avg_duration),
      trendFormatted: formatPercentage(data.workflows.trend),
      trendDirection: data.workflows.trend > 0 ? 'up' : data.workflows.trend < 0 ? 'down' : 'stable'
    },
    costs: {
      ...data.costs,
      totalFormatted: formatCurrency(data.costs.total),
      llmCostsFormatted: formatCurrency(data.costs.llm_costs),
      resourceCostsFormatted: formatCurrency(data.costs.resource_costs),
      avgPerWorkflowFormatted: formatCurrency(data.costs.avg_per_workflow),
      trendFormatted: formatPercentage(data.costs.trend),
      trendDirection: data.costs.trend > 0 ? 'up' : data.costs.trend < 0 ? 'down' : 'stable'
    },
    agents: {
      ...data.agents,
      utilizationFormatted: formatPercentage(data.agents.avg_utilization),
      topPerformers: data.agents.top_performers.map(agent => ({
        ...agent,
        avgResponseTimeFormatted: formatDuration(agent.avg_response_time / 1000)
      }))
    },
    performance: {
      ...data.performance,
      avgResponseTimeFormatted: formatDuration(data.performance.avg_response_time / 1000),
      p95ResponseTimeFormatted: formatDuration(data.performance.p95_response_time / 1000),
      errorRateFormatted: formatPercentage(data.performance.error_rate)
    }
  };
};

// Cost breakdown transformations
export const transformCostBreakdown = (data: CostBreakdownResponse) => {
  // Calculate percentages for pie charts
  const total = data.total_cost;
  const llmPercentage = total > 0 ? (data.llm_costs.total / total) * 100 : 0;
  const resourcePercentage = total > 0 ? (data.resource_costs.total / total) * 100 : 0;

  return {
    ...data,
    totalFormatted: formatCurrency(data.total_cost),
    distribution: [
      {
        name: 'LLM Costs',
        value: data.llm_costs.total,
        percentage: llmPercentage,
        formatted: formatCurrency(data.llm_costs.total)
      },
      {
        name: 'Resource Costs',
        value: data.resource_costs.total,
        percentage: resourcePercentage,
        formatted: formatCurrency(data.resource_costs.total)
      }
    ],
    providerBreakdown: Object.entries(data.llm_costs.by_provider).map(([provider, info]) => ({
      provider,
      ...info,
      costFormatted: formatCurrency(info.cost),
      percentage: total > 0 ? (info.cost / total) * 100 : 0
    })),
    modelBreakdown: Object.entries(data.llm_costs.by_model).map(([model, info]) => ({
      model,
      ...info,
      costFormatted: formatCurrency(info.cost),
      tokensFormatted: formatNumber(info.tokens)
    })),
    resourceBreakdown: Object.entries(data.resource_costs.by_type).map(([type, info]) => ({
      type,
      ...info,
      costFormatted: formatCurrency(info.cost),
      usageFormatted: formatNumber(info.usage, 2)
    })),
    topWorkflowsFormatted: data.top_workflows.map(workflow => ({
      ...workflow,
      totalCostFormatted: formatCurrency(workflow.total_cost),
      llmCostFormatted: formatCurrency(workflow.llm_cost),
      resourceCostFormatted: formatCurrency(workflow.resource_cost)
    })),
    costTrendsFormatted: data.cost_trends.map(trend => ({
      ...trend,
      dateFormatted: formatDate(trend.date, 'MMM dd'),
      totalCostFormatted: formatCurrency(trend.total_cost),
      llmCostFormatted: formatCurrency(trend.llm_cost),
      resourceCostFormatted: formatCurrency(trend.resource_cost)
    }))
  };
};

// Workflow performance transformations
export const transformWorkflowPerformance = (data: WorkflowPerformanceResponse) => {
  return {
    summary: {
      ...data.summary,
      successRateFormatted: formatPercentage(data.summary.success_rate),
      avgDurationFormatted: formatDuration(data.summary.avg_duration),
      p95DurationFormatted: formatDuration(data.summary.p95_duration)
    },
    byWorkflowFormatted: data.by_workflow.map(workflow => ({
      ...workflow,
      successRateFormatted: formatPercentage(workflow.success_rate),
      avgDurationFormatted: formatDuration(workflow.avg_duration),
      totalCostFormatted: formatCurrency(workflow.total_cost),
      efficiency: workflow.success_rate * (1 / workflow.avg_duration) * 100 // Efficiency score
    })),
    performanceTrendsFormatted: data.performance_trends.map(trend => ({
      ...trend,
      timestampFormatted: formatDate(trend.timestamp, 'MMM dd HH:mm'),
      successRateFormatted: formatPercentage(trend.success_rate),
      avgDurationFormatted: formatDuration(trend.avg_duration)
    })),
    errorAnalysis: {
      totalErrors: data.common_errors.reduce((sum, error) => sum + error.count, 0),
      errorsByType: data.common_errors.map(error => ({
        ...error,
        percentageFormatted: formatPercentage(error.percentage)
      }))
    }
  };
};

// Agent performance transformations
export const transformAgentPerformance = (data: AgentPerformanceResponse) => {
  // Calculate total metrics for comparison
  const totalCalls = data.agents.reduce((sum, agent) => sum + agent.total_calls, 0);
  const totalCost = data.agents.reduce((sum, agent) => sum + agent.total_cost, 0);

  return {
    agents: data.agents.map(agent => ({
      ...agent,
      successRate: agent.total_calls > 0 ? (agent.successful_calls / agent.total_calls) * 100 : 0,
      successRateFormatted: formatPercentage(
        agent.total_calls > 0 ? (agent.successful_calls / agent.total_calls) * 100 : 0
      ),
      avgResponseTimeFormatted: formatDuration(agent.avg_response_time / 1000),
      totalCostFormatted: formatCurrency(agent.total_cost),
      efficiencyScoreFormatted: formatPercentage(agent.efficiency_score),
      callsPercentage: totalCalls > 0 ? (agent.total_calls / totalCalls) * 100 : 0,
      costPercentage: totalCost > 0 ? (agent.total_cost / totalCost) * 100 : 0
    })),
    utilizationChartData: data.utilization_over_time.map(point => ({
      timestamp: formatDate(point.timestamp, 'MMM dd HH:mm'),
      ...point.agent_utilization
    })),
    handoffAnalysis: {
      totalHandoffs: data.handoff_patterns.reduce((sum, pattern) => sum + pattern.count, 0),
      avgHandoffTime: data.handoff_patterns.length > 0
        ? data.handoff_patterns.reduce((sum, pattern) => sum + pattern.avg_handoff_time, 0) / data.handoff_patterns.length
        : 0,
      patterns: data.handoff_patterns.map(pattern => ({
        ...pattern,
        avgHandoffTimeFormatted: formatDuration(pattern.avg_handoff_time / 1000)
      }))
    }
  };
};

// Trend data transformations
export const transformTrendData = (data: TrendDataResponse) => {
  const { summary, forecast } = data;
  
  return {
    ...data,
    chartData: data.data_points.map(point => ({
      timestamp: formatDate(point.timestamp, 'MMM dd'),
      value: point.value,
      formattedValue: data.metric.includes('cost') 
        ? formatCurrency(point.value)
        : data.metric.includes('rate') || data.metric.includes('percentage')
        ? formatPercentage(point.value)
        : formatNumber(point.value, 2)
    })),
    summaryFormatted: {
      currentValue: data.metric.includes('cost') 
        ? formatCurrency(summary.current_value)
        : formatNumber(summary.current_value, 2),
      previousValue: data.metric.includes('cost')
        ? formatCurrency(summary.previous_value)
        : formatNumber(summary.previous_value, 2),
      changePercentage: formatPercentage(summary.change_percentage),
      trendDirection: summary.trend_direction,
      trendIcon: summary.trend_direction === 'up' ? '↑' : summary.trend_direction === 'down' ? '↓' : '→'
    },
    forecastFormatted: forecast ? {
      nextPeriodEstimate: data.metric.includes('cost')
        ? formatCurrency(forecast.next_period_estimate)
        : formatNumber(forecast.next_period_estimate, 2),
      confidenceInterval: {
        lower: data.metric.includes('cost')
          ? formatCurrency(forecast.confidence_interval.lower)
          : formatNumber(forecast.confidence_interval.lower, 2),
        upper: data.metric.includes('cost')
          ? formatCurrency(forecast.confidence_interval.upper)
          : formatNumber(forecast.confidence_interval.upper, 2)
      }
    } : null
  };
};

// Aggregation utilities
export const aggregateTrendData = (data: TrendData[], aggregationType: 'sum' | 'avg' | 'max' | 'min'): number => {
  if (data.length === 0) return 0;
  
  const values = data.map(point => point.value);
  
  switch (aggregationType) {
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0);
    case 'avg':
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    default:
      return 0;
  }
};

// Chart data formatters
export const formatChartData = (data: any[], xKey: string, yKey: string, formatter?: (value: any) => string) => {
  return data.map(item => ({
    ...item,
    [xKey]: formatter ? formatter(item[xKey]) : item[xKey],
    formattedValue: formatter ? formatter(item[yKey]) : item[yKey]
  }));
};

// Export utilities for component usage
export const analyticsFormatters = {
  currency: formatCurrency,
  percentage: formatPercentage,
  number: formatNumber,
  duration: formatDuration,
  date: formatDate
};

export const analyticsTransformers = {
  kpiMetrics: transformKPIMetrics,
  costBreakdown: transformCostBreakdown,
  workflowPerformance: transformWorkflowPerformance,
  agentPerformance: transformAgentPerformance,
  trendData: transformTrendData
};