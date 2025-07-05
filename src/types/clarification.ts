// Clarification types for Claude Code integration

export enum ClarificationUrgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ClarificationOption {
  id: string;
  description: string;
  pros?: string[];
  cons?: string[];
  recommended?: boolean;
  metadata?: Record<string, any>;
}

export interface ClarificationContext {
  current_implementation?: string;
  performance_requirements?: Record<string, any>;
  constraints?: Record<string, any>;
  related_files?: string[];
  [key: string]: any;
}

export interface ClarificationRequest {
  id: string;
  task_id: string;
  agent_id: string;
  question: string;
  options: ClarificationOption[];
  context?: ClarificationContext;
  urgency: ClarificationUrgency;
  timeout_seconds: number;
  created_at: string;
  expires_at: string;
}

export interface ClarificationResponse {
  request_id: string;
  selected_option_id: string;
  reasoning?: string;
  additional_context?: Record<string, any>;
  responded_by: string;
  responded_at: string;
}

export interface ClarificationState {
  pending: ClarificationRequest[];
  answered: Map<string, ClarificationResponse>;
  expired: string[]; // request IDs
}