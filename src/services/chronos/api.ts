// Chronos API Client - Connects to the 15 deployment endpoints from Phase 1.10
// Migrated to use TenantApiClient for consistent tenant header injection
import { createChronosApiClient } from '../../api/createApiClient';
import {
  DeploymentRequest,
  DeploymentResponse,
  RollbackRequest,
  DeploymentResult,
  DeploymentHistoryItem,
  HealthCheckResult,
  ValidationResults,
  PerformanceMetrics,
  ChronosMetrics,
  SystemHealth,
  ConfigurationTemplate,
  EnvironmentStatus,
  DeploymentEnvironment,
  ScheduleInfo,
  TrinityIntegrationStatus,
  BenchmarkResult
} from '../../types/chronos';

// Create tenant-aware API client for Chronos
const apiClient = createChronosApiClient();

export class ChronosAPI {
  // 1. Deploy Chronos - Create new deployment
  static async deployChronos(request: DeploymentRequest): Promise<DeploymentResponse> {
    const response = await apiClient.post<DeploymentResponse>('/deploy', request);
    return response.data;
  }

  // 2. Rollback Chronos - Rollback to previous version  
  static async rollbackChronos(request: RollbackRequest): Promise<DeploymentResponse> {
    const response = await apiClient.post<DeploymentResponse>('/rollback', request);
    return response.data;
  }

  // 3. Get Deployment Status - Check deployment status by environment
  static async getDeploymentStatus(environment?: DeploymentEnvironment): Promise<EnvironmentStatus> {
    const params = environment ? { params: { environment } } : {};
    const response = await apiClient.get<EnvironmentStatus>('/status', params);
    return response.data;
  }

  // 4. Validate Deployment Readiness - Pre-deployment validation
  static async validateDeploymentReadiness(): Promise<ValidationResults> {
    const response = await apiClient.get<ValidationResults>('/validate/readiness');
    return response.data;
  }

  // 5. Health Check - Get deployment health status
  static async getHealthCheck(environment?: DeploymentEnvironment): Promise<HealthCheckResult> {
    const params = environment ? { environment } : {};
    const response = await apiClient.get<HealthCheckResult>('/health', { params });
    return response.data;
  }

  // 6. Get Deployment History - Historical deployment data
  static async getDeploymentHistory(limit: number = 50, page: number = 1): Promise<{
    deployments: DeploymentHistoryItem[];
    total_count: number;
    page: number;
    page_size: number;
  }> {
    const response = await apiClient.get('/history', {
      params: { limit, page }
    });
    return response.data;
  }

  // 7. Get Deployment Metrics - Deployment performance metrics
  static async getDeploymentMetrics(
    environment: DeploymentEnvironment,
    hours: number = 24
  ): Promise<{
    environment: string;
    time_range_hours: number;
    metrics: PerformanceMetrics;
    trends: any[];
  }> {
    const response = await apiClient.get('/metrics/deployment', {
      params: { environment, hours }
    });
    return response.data;
  }

  // 8. Validate Configuration - Validate deployment configuration
  static async validateConfiguration(
    environment: DeploymentEnvironment,
    version: string
  ): Promise<{
    valid: boolean;
    environment: string;
    version: string;
    errors?: string[];
  }> {
    const response = await apiClient.get('/config/validate', {
      params: { environment, version }
    });
    return response.data;
  }

  // 9. Get Configuration Template - Get deployment configuration template
  static async getConfigurationTemplate(environment: DeploymentEnvironment): Promise<ConfigurationTemplate> {
    const response = await apiClient.post<ConfigurationTemplate>('/config/template', null, {
      params: { environment }
    });
    return response.data;
  }

  // 10. Emergency Stop - Emergency deployment stop
  static async emergencyStop(deploymentId: string, reason: string): Promise<{
    success: boolean;
    deployment_id: string;
    cleanup_initiated: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/emergency/stop', null, {
      params: { deployment_id: deploymentId, reason }
    });
    return response.data;
  }

  // 11. Get Performance Benchmarks - Performance benchmark results
  static async getPerformanceBenchmarks(): Promise<BenchmarkResult[]> {
    const response = await apiClient.get<BenchmarkResult[]>('/benchmarks/performance');
    return response.data;
  }

  // 12. Export Deployment Report - Export deployment analytics
  static async exportDeploymentReport(
    environment: DeploymentEnvironment,
    startDate: string,
    endDate: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<Blob> {
    const response = await apiClient.get('/export/report', {
      params: { environment, start_date: startDate, end_date: endDate, format },
      responseType: 'blob'
    });
    return response.data;
  }

  // 13. Deployment Analytics - Get comprehensive analytics
  static async getDeploymentAnalytics(timeRange: string = '24h'): Promise<ChronosMetrics> {
    const response = await apiClient.get<ChronosMetrics>('/analytics/overview', {
      params: { time_range: timeRange }
    });
    return response.data;
  }

  // 14. System Health Overview - Overall system health
  static async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<SystemHealth>('/system/health');
    return response.data;
  }

  // 15. API Health Check - Check if deployment API is healthy
  static async getApiHealth(): Promise<{
    status: string;
    timestamp: string;
    capabilities: string[];
    version: string;
  }> {
    const response = await apiClient.get('/api/health');
    return response.data;
  }

  // Additional utility methods for schedule management
  static async getSchedules(): Promise<ScheduleInfo[]> {
    const response = await apiClient.get<ScheduleInfo[]>('/schedules');
    return response.data;
  }

  static async getTrinityIntegrationStatus(): Promise<TrinityIntegrationStatus> {
    const response = await apiClient.get<TrinityIntegrationStatus>('/trinity/status');
    return response.data;
  }

  // Real-time monitoring endpoints
  static async subscribeToDeploymentProgress(deploymentId: string): Promise<EventSource> {
    // Get the base URL from the API client
    const baseURL = apiClient.getAxiosInstance().defaults.baseURL || '';
    const url = `${baseURL}/events/deployment/${deploymentId}`;
    return new EventSource(url);
  }

  static async subscribeToSystemAlerts(): Promise<EventSource> {
    // Get the base URL from the API client  
    const baseURL = apiClient.getAxiosInstance().defaults.baseURL || '';
    const url = `${baseURL}/events/alerts`;
    return new EventSource(url);
  }
}

export default ChronosAPI;