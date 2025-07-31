// Chronos Type Definitions for Frontend
// Based on Phase 1.10 deployment system implementation

export enum DeploymentEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  CANARY = 'canary',
  PRODUCTION = 'production'
}

export enum DeploymentStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  DEPLOYING = 'deploying',
  ACTIVE = 'active',
  FAILED = 'failed',
  ROLLING_BACK = 'rolling_back',
  ROLLED_BACK = 'rolled_back'
}

export enum ValidationLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  COMPREHENSIVE = 'comprehensive'
}

export interface DeploymentConfig {
  environment: DeploymentEnvironment;
  version: string;
  image_tag?: string;
  validation_level: ValidationLevel;
  health_check_timeout: number;
  migration_timeout: number;
  traffic_ramp_steps: number[];
  traffic_ramp_interval: number;
  error_rate_threshold: number;
  performance_baseline_threshold: number;
  run_migrations: boolean;
  enable_monitoring: boolean;
  backup_before_deploy: boolean;
}

export interface DeploymentResult {
  success: boolean;
  status: DeploymentStatus;
  version: string;
  deployment_id: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  validation_results?: ValidationResults;
  performance_metrics?: PerformanceMetrics;
  rollback_info?: RollbackInfo;
}

export interface ValidationResults {
  passed: boolean;
  checks: {
    configuration?: { valid: boolean; errors?: string[] };
    database?: { ready: boolean; connection_time_ms?: number; errors?: string[] };
    resources?: { sufficient: boolean; errors?: string[] };
  };
}

export interface PerformanceMetrics {
  api_response_time_p95: number;
  throughput_per_second: number;
  success_rate: number;
  resource_usage: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export interface HealthCheckResult {
  healthy: boolean;
  health_score: number;
  checks: Record<string, { passed: boolean; message?: string }>;
  failed_checks: string[];
}

export interface RollbackInfo {
  rollback_id: string;
  target_version: string;
  reason: string;
  success: boolean;
}

// API Request/Response Types
export interface DeploymentRequest {
  version: string;
  environment: DeploymentEnvironment;
  validation_level?: ValidationLevel;
  traffic_ramp_steps?: number[];
  force?: boolean;
  config_overrides?: Partial<DeploymentConfig>;
}

export interface RollbackRequest {
  target_version?: string;
  reason: string;
  force?: boolean;
}

export interface DeploymentResponse {
  success: boolean;
  deployment_id: string;
  version: string;
  environment: string;
  status: DeploymentStatus;
  message?: string;
}

// Dashboard Data Types
export interface DeploymentHistoryItem extends DeploymentResult {
  environment: DeploymentEnvironment;
  duration_minutes?: number;
}

export interface EnvironmentStatus {
  environment: DeploymentEnvironment;
  current_version: string;
  status: DeploymentStatus;
  last_deployed: string;
  health_score: number;
  active_deployments: number;
}

export interface ChronosMetrics {
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  average_deployment_time: number;
  environments: EnvironmentStatus[];
  recent_activity: DeploymentHistoryItem[];
}

export interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  services: {
    deployment_api: boolean;
    database: boolean;
    monitoring: boolean;
    performance_analyzer: boolean;
  };
  resource_usage: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
}

// Real-time Updates
export interface DeploymentProgress {
  deployment_id: string;
  phase: string;
  progress_percent: number;
  current_step: string;
  estimated_completion: string;
  logs: string[];
}

export interface AlertMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  deployment_id?: string;
}

// Schedules and Trinity Integration
export interface ScheduleInfo {
  id: string;
  operation_id: string;
  name: string;
  operation_type: string;
  schedule_pattern: string;
  next_execution: string;
  status: 'active' | 'paused' | 'disabled';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrinityIntegrationStatus {
  connected: boolean;
  health_check_passing: boolean;
  last_operation: string;
  active_schedules: number;
  failed_operations: number;
}

// Performance Dashboard Types
export interface PerformanceTrend {
  timestamp: string;
  response_time_p95: number;
  throughput: number;
  error_rate: number;
  cpu_usage: number;
  memory_usage: number;
}

export interface BenchmarkResult {
  test_name: string;
  duration_ms: number;
  success_rate: number;
  throughput_per_second: number;
  resource_usage: {
    cpu_max: number;
    memory_max: number;
  };
}

// Configuration Management
export interface ConfigurationTemplate {
  environment: DeploymentEnvironment;
  template: DeploymentConfig;
  description: string;
  last_updated: string;
}

// All types are already exported above as interfaces/types