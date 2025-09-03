// Global store types - aligned with backend API structure
export interface SystemMetrics {
  health_score: number;
  health_status: string;
  health_issues: string[];
  timestamp: string;
  total_agent_executions: number;
  total_communications: number;
  total_memory_operations: number;
  total_llm_calls: number;
  total_policy_violations: number;
  active_traces: number;
}

export interface AgentMetrics {
  agent_id: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  average_duration_ms: number;
  last_execution: string | null;
}

export interface AgentExecution {
  execution_id: string;
  agent_id: string;
  conversation_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  action: string;
  duration_ms?: number;
  has_claude_execution: boolean;
  message_count: number;
  success_rate?: number;
  error_message?: string;
}

export interface StreamEntry {
  message_id: string;
  source_agent_id: string;
  target_agent_id: string;
  communication_type: string;
  direction: string;
  message_type: string;
  content: string;
  timestamp: string;
  metadata: any;
  tokens_used?: number;
  processing_duration_ms?: number;
}

export interface Conversation {
  conversation_id: string;
  started_at: string;
  last_activity: string;
  message_count: number;
  participants: string[];
}

export interface ExecutionContext {
  context_id: string;
  execution_id: string;
  working_directory: string;
  git_repository?: string;
  initial_files: string[];
  modified_files: string[];
  created_files: string[];
  deleted_files: string[];
  environment_variables: Record<string, string>;
  tool_availability: string[];
  memory_context: Record<string, any>;
  final_state: Record<string, any>;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: string;
  autoHide?: boolean;
  duration?: number;
}

// Additional backend response types
export interface HealthStatusResponse {
  health_score: number;
  health_status: string; 
  health_issues: string[];
  timestamp: string;
}

export interface SystemOverviewResponse {
  timestamp: string;
  total_agent_executions: number;
  total_communications: number;
  total_memory_operations: number;
  total_llm_calls: number;
  total_policy_violations: number;
  active_traces: number;
}

export interface MemoryMetricsResponse {
  project_id: string;
  time_window_hours: number;
  total_operations: number;
  search_operations: number;
  create_operations: number;
  update_operations: number;
  delete_operations: number;
  average_search_duration_ms: number;
  search_effectiveness: number;
}