// Global store types
export interface SystemMetrics {
  totalCommunications: number;
  activeExecutions: number;
  successRate: number;
  avgResponseTime: number;
  lastUpdated: string;
}

export interface AgentMetrics {
  agentId: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  executionCount: number;
  successRate: number;
  lastActivity: string;
  avgResponseTime?: number;
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