/**
 * OCL (Organizational Communication Layer) TypeScript Types
 * Complete type definitions for Geneva's OCL frontend integration
 */

// Base OCL message interface
export interface OCLMessage {
  id: string;
  project_id: string;
  thread_id?: string;
  timestamp: string;
  source_type: 'email' | 'webhook' | 'github' | 'chat' | 'redis';
  source_identifier: string;
  subject?: string;
  body: string;
  from_address?: string;
  to_addresses?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  attachments?: OCLAttachment[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// OCL attachment interface
export interface OCLAttachment {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
  metadata?: Record<string, any>;
}

// OCL thread interface
export interface OCLThread {
  id: string;
  project_id: string;
  subject: string;
  participants: string[];
  message_count: number;
  last_message_at: string;
  is_archived: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// OCL subscription interface
export interface OCLSubscription {
  id: string;
  project_id: string;
  agent_id?: string;
  name: string;
  description?: string;
  pattern: string;
  source_types?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notification_types?: string[];
  is_active: boolean;
  filters?: Record<string, any>;
  match_count?: number;
  created_at: string;
  updated_at: string;
}

// API response interfaces
export interface OCLMessagesResponse {
  messages: OCLMessage[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

export interface OCLThreadsResponse {
  threads: OCLThread[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

export interface OCLSubscriptionsResponse {
  subscriptions: OCLSubscription[];
  total: number;
}

// Search and filtering interfaces
export interface OCLSearchParams {
  query?: string;
  search_mode?: 'semantic' | 'keyword' | 'hybrid';
  source_types?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  priority?: string[];
  is_read?: boolean;
  is_starred?: boolean;
  is_archived?: boolean;
  thread_id?: string;
  limit?: number;
  offset?: number;
  min_similarity?: number;
}

// WebSocket event interfaces
export interface OCLWebSocketEvent {
  event: 'new_message' | 'message_updated' | 'thread_updated' | 'subscription_triggered';
  payload: {
    message?: OCLMessage;
    thread?: OCLThread;
    subscription?: OCLSubscription;
    metadata?: Record<string, any>;
  };
  timestamp: string;
}

// Statistics interfaces
export interface OCLStats {
  message_count: number;
  thread_count: number;
  subscription_count: number;
  by_source: Record<string, number>;
  by_priority: Record<string, number>;
  processing_stats: Record<string, number>;
  avg_processing_time_ms: number;
  peak_hours?: Array<{ hour: number; count: number }>;
}

// Performance metrics interface
export interface OCLPerformanceMetrics {
  throughput_per_minute: number;
  active_connections: number;
  queue_depth: number;
  memory_usage_mb: number;
  error_rate: number;
  response_time_ms: {
    avg: number;
    p95: number;
    p99: number;
  };
}

// Component prop interfaces
export interface OCLMessageInboxProps {
  projectId?: string;
  filters?: OCLSearchParams;
  onMessageSelect?: (message: OCLMessage) => void;
  onThreadSelect?: (threadId: string) => void;
  compact?: boolean;
  showFilters?: boolean;
}

export interface OCLThreadViewProps {
  threadId: string;
  onMessageSelect?: (message: OCLMessage) => void;
  showParticipants?: boolean;
  allowReply?: boolean;
  compact?: boolean;
}

export interface OCLSearchBarProps {
  onSearch: (params: OCLSearchParams) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  savedSearches?: OCLSubscription[];
}

export interface OCLSubscriptionManagerProps {
  agentId?: string;
  showCreateButton?: boolean;
  compact?: boolean;
}

export interface OCLMessageActionsProps {
  message: OCLMessage;
  actions?: 'all' | 'primary' | 'organization' | 'automation' | 'management' | string[];
  variant?: 'menu' | 'buttons';
  size?: 'small' | 'medium' | 'large';
  onActionComplete?: (action: string, result: any) => void;
  compact?: boolean;
  disabled?: boolean;
}

export interface OCLAdapterDashboardProps {
  showDetailedMetrics?: boolean;
  refreshInterval?: number;
  compact?: boolean;
}

export interface OCLAnalyticsProps {
  timeRange?: string;
  showExportOptions?: boolean;
  compact?: boolean;
}

export interface OCLChatIntegrationProps {
  chatRoomId?: string;
  threadId?: string;
  showExternalMessages?: boolean;
  allowMessageCreation?: boolean;
  onMessageClick?: (message: OCLMessage) => void;
  onThreadClick?: (threadId: string) => void;
  compact?: boolean;
}

// Redux state interfaces
export interface OCLState {
  messages: {
    items: OCLMessage[];
    loading: boolean;
    error: string | null;
    total: number;
    hasNext: boolean;
  };
  threads: {
    items: OCLThread[];
    loading: boolean;
    error: string | null;
    total: number;
  };
  subscriptions: {
    items: OCLSubscription[];
    loading: boolean;
    error: string | null;
  };
  stats: {
    data: OCLStats | null;
    loading: boolean;
    error: string | null;
  };
  performance: {
    data: OCLPerformanceMetrics | null;
    loading: boolean;
    error: string | null;
  };
  websocket: {
    connected: boolean;
    reconnecting: boolean;
    error: string | null;
  };
  ui: {
    selectedMessage: string | null;
    selectedThread: string | null;
    searchParams: OCLSearchParams;
    showAdvancedFilters: boolean;
  };
}

// Worker bridge interfaces
export interface OCLWorkerTrigger {
  id: string;
  subscription_id: string;
  message_id: string;
  worker_task_id: string;
  triggered_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface OCLWorkerTriggerRule {
  pattern: string;
  agent_id: string;
  task_type: 'analysis' | 'response' | 'classification' | 'summary' | 'translation' | 'extraction';
  priority: number;
  auto_assign?: boolean;
}

// All types are already exported with their declarations above