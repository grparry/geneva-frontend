// Chronos API Client - Connects to the 15 deployment endpoints from Phase 1.10
import axios, { AxiosResponse } from 'axios';
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

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8400';
const CHRONOS_API_BASE = `${API_BASE_URL}/chronos/deployment`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: CHRONOS_API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth if needed
apiClient.interceptors.request.use((config) => {
  // Add any authentication headers here
  // const token = localStorage.getItem('auth_token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Chronos API Error:', error.response?.data || error.message);
    throw error;
  }
);

export class ChronosAPI {
  // 1. Deploy Chronos - Create new deployment
  static async deployChronos(request: DeploymentRequest): Promise<DeploymentResponse> {
    const response: AxiosResponse<DeploymentResponse> = await apiClient.post('/deploy', request);
    return response.data;
  }

  // 2. Rollback Chronos - Rollback to previous version  
  static async rollbackChronos(request: RollbackRequest): Promise<DeploymentResponse> {
    const response: AxiosResponse<DeploymentResponse> = await apiClient.post('/rollback', request);
    return response.data;
  }

  // 3. Get Deployment Status - Check deployment status by environment
  static async getDeploymentStatus(environment?: DeploymentEnvironment): Promise<EnvironmentStatus> {
    const params = environment ? { environment } : {};
    const response: AxiosResponse<EnvironmentStatus> = await apiClient.get('/status', { params });
    return response.data;
  }

  // 4. Validate Deployment Readiness - Pre-deployment validation
  static async validateDeploymentReadiness(): Promise<ValidationResults> {
    const response: AxiosResponse<ValidationResults> = await apiClient.get('/validate/readiness');
    return response.data;
  }

  // 5. Health Check - Get deployment health status
  static async getHealthCheck(environment?: DeploymentEnvironment): Promise<HealthCheckResult> {
    const params = environment ? { environment } : {};
    const response: AxiosResponse<HealthCheckResult> = await apiClient.get('/health', { params });
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
    const response: AxiosResponse<ConfigurationTemplate> = await apiClient.post('/config/template', null, {
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
    const response: AxiosResponse<BenchmarkResult[]> = await apiClient.get('/benchmarks/performance');
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
    const response: AxiosResponse<ChronosMetrics> = await apiClient.get('/analytics/overview', {
      params: { time_range: timeRange }
    });
    return response.data;
  }

  // 14. System Health Overview - Overall system health
  static async getSystemHealth(): Promise<SystemHealth> {
    const response: AxiosResponse<SystemHealth> = await apiClient.get('/system/health');
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
    const response: AxiosResponse<ScheduleInfo[]> = await apiClient.get('/schedules');
    return response.data;
  }

  static async getTrinityIntegrationStatus(): Promise<TrinityIntegrationStatus> {
    const response: AxiosResponse<TrinityIntegrationStatus> = await apiClient.get('/trinity/status');
    return response.data;
  }

  // Real-time monitoring endpoints
  static async subscribeToDeploymentProgress(deploymentId: string): Promise<EventSource> {
    const url = `${CHRONOS_API_BASE}/events/deployment/${deploymentId}`;
    return new EventSource(url);
  }

  static async subscribeToSystemAlerts(): Promise<EventSource> {
    const url = `${CHRONOS_API_BASE}/events/alerts`;
    return new EventSource(url);
  }
}

export default ChronosAPI;