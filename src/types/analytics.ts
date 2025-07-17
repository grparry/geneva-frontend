/**
 * TypeScript types for Geneva analytics API responses and data models
 */

// Base types
export interface TimeRange {
  start: string;
  end: string;
  preset?: '24h' | '7d' | '30d' | '90d';
}

export interface TrendData {
  timestamp: string;
  value: number;
}

// KPI Metrics Response
export interface KPIMetricsResponse {
  workflows: {
    total: number;
    successful: number;
    success_rate: number;
    avg_duration: number;
    trend: number;
  };
  costs: {
    total: number;
    llm_costs: number;
    resource_costs: number;
    trend: number;
    avg_per_workflow: number;
  };
  agents: {
    active_count: number;
    avg_utilization: number;
    top_performers: Array<{
      agent_id: string;
      usage_count: number;
      avg_response_time: number;
    }>;
  };
  performance: {
    avg_response_time: number;
    p95_response_time: number;
    error_rate: number;
  };
}

// Cost Breakdown Response
export interface CostBreakdownResponse {
  total_cost: number;
  llm_costs: {
    total: number;
    by_provider: Record<string, {
      cost: number;
      calls: number;
      tokens: number;
    }>;
    by_model: Record<string, {
      cost: number;
      calls: number;
      tokens: number;
    }>;
  };
  resource_costs: {
    total: number;
    by_type: Record<string, {
      cost: number;
      usage: number;
      unit: string;
    }>;
  };
  top_workflows: Array<{
    workflow_id: string;
    workflow_name: string;
    total_cost: number;
    llm_cost: number;
    resource_cost: number;
  }>;
  cost_trends: Array<{
    date: string;
    llm_cost: number;
    resource_cost: number;
    total_cost: number;
  }>;
}

// Workflow Performance Response
export interface WorkflowPerformanceResponse {
  summary: {
    total_executions: number;
    successful: number;
    failed: number;
    success_rate: number;
    avg_duration: number;
    p95_duration: number;
  };
  by_workflow: Array<{
    workflow_id: string;
    workflow_name: string;
    executions: number;
    success_rate: number;
    avg_duration: number;
    total_cost: number;
  }>;
  performance_trends: Array<{
    timestamp: string;
    executions: number;
    success_rate: number;
    avg_duration: number;
  }>;
  common_errors: Array<{
    error_type: string;
    count: number;
    percentage: number;
    sample_message: string;
  }>;
}

// Agent Performance Response
export interface AgentPerformanceResponse {
  agents: Array<{
    agent_id: string;
    agent_name: string;
    agent_type: string;
    total_calls: number;
    successful_calls: number;
    avg_response_time: number;
    total_cost: number;
    efficiency_score: number;
    specialization: string[];
  }>;
  utilization_over_time: Array<{
    timestamp: string;
    agent_utilization: Record<string, number>;
  }>;
  handoff_patterns: Array<{
    from_agent: string;
    to_agent: string;
    count: number;
    avg_handoff_time: number;
  }>;
}

// Trend Data Response
export interface TrendDataResponse {
  metric: string;
  period: string;
  data_points: TrendData[];
  summary: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend_direction: 'up' | 'down' | 'stable';
  };
  forecast?: {
    next_period_estimate: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  };
}

// Alert Response
export interface AlertResponse {
  alerts: Array<{
    id: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    threshold_value: number;
    current_value: number;
    percentage_exceeded: number;
    alert_time: string;
    time_period: string;
    status: 'active' | 'acknowledged' | 'resolved';
    message?: string;
  }>;
  total: number;
  unacknowledged: number;
}

// WebSocket Message Types
export interface LiveMetricsUpdate {
  timestamp: string;
  metrics: {
    active_workflows: number;
    current_cost_rate: number;
    active_agents: number;
    api_calls_per_minute: number;
    average_response_time: number;
    error_rate: number;
  };
}

export interface CostAlertMessage {
  alert_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  current_value: number;
  threshold_value: number;
  timestamp: string;
}

// Request Parameters
export interface AnalyticsRequestParams {
  project_id: string;
  time_range?: string;
  start_date?: string;
  end_date?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
  offset?: number;
}

export interface AcknowledgeAlertParams {
  alert_id: string;
  acknowledged_by?: string;
  notes?: string;
}

// Enums
export enum CostAlertType {
  DAILY_BUDGET_EXCEEDED = 'daily_budget_exceeded',
  WEEKLY_BUDGET_EXCEEDED = 'weekly_budget_exceeded',
  MONTHLY_BUDGET_EXCEEDED = 'monthly_budget_exceeded',
  UNUSUAL_SPIKE = 'unusual_spike',
  RATE_LIMIT_WARNING = 'rate_limit_warning'
}

export enum MetricType {
  WORKFLOW_COUNT = 'workflow_count',
  SUCCESS_RATE = 'success_rate',
  TOTAL_COST = 'total_cost',
  API_CALLS = 'api_calls',
  RESPONSE_TIME = 'response_time',
  ERROR_RATE = 'error_rate',
  AGENT_UTILIZATION = 'agent_utilization'
}