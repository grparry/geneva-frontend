// Custom React Hook for Chronos Integration
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChronosAPI } from '../services/chronos/api';
import { chronosWebSocket } from '../services/chronos/websocket';
import {
  DeploymentEnvironment,
  ChronosMetrics,
  SystemHealth,
  EnvironmentStatus,
  DeploymentProgress,
  AlertMessage,
  DeploymentHistoryItem,
  PerformanceMetrics,
  ScheduleInfo,
  TrinityIntegrationStatus
} from '../types/chronos';

interface ChronosState {
  // Data
  metrics: ChronosMetrics | null;
  systemHealth: SystemHealth | null;
  environments: EnvironmentStatus[];
  deploymentHistory: DeploymentHistoryItem[];
  schedules: ScheduleInfo[];
  trinityStatus: TrinityIntegrationStatus | null;
  
  // Real-time updates
  currentDeployment: DeploymentProgress | null;
  alerts: AlertMessage[];
  
  // Loading states
  loading: boolean;
  metricsLoading: boolean;
  environmentsLoading: boolean;
  schedulesLoading: boolean;
  
  // Error states
  error: string | null;
  
  // WebSocket connection status
  wsConnected: boolean;
}

interface ChronosActions {
  // Data fetching
  refreshMetrics: () => Promise<void>;
  refreshEnvironments: () => Promise<void>;
  refreshSchedules: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // WebSocket management
  connectToDeployment: (deploymentId: string) => void;
  connectToAlerts: () => void;
  disconnectWebSocket: () => void;
  
  // Alert management
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  
  // Deployment actions
  getEnvironmentMetrics: (environment: DeploymentEnvironment, hours?: number) => Promise<PerformanceMetrics | null>;
  exportReport: (environment: DeploymentEnvironment, startDate: string, endDate: string) => Promise<void>;
}

export function useChronos(): ChronosState & ChronosActions {
  // State management
  const [state, setState] = useState<ChronosState>({
    metrics: null,
    systemHealth: null,
    environments: [],
    deploymentHistory: [],
    schedules: [],
    trinityStatus: null,
    currentDeployment: null,
    alerts: [],
    loading: true,
    metricsLoading: false,
    environmentsLoading: false,
    schedulesLoading: false,
    error: null,
    wsConnected: false
  });

  // Refs to track mounted state
  const isMountedRef = useRef(true);
  const alertTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Auto-dismiss alerts after 10 seconds
  const scheduleAlertDismissal = useCallback((alertId: string) => {
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          alerts: prev.alerts.filter(alert => alert.id !== alertId)
        }));
        alertTimeoutsRef.current.delete(alertId);
      }
    }, 10000);
    
    alertTimeoutsRef.current.set(alertId, timeout);
  }, []);

  // WebSocket event handlers
  useEffect(() => {
    const handleDeploymentProgress = (progress: DeploymentProgress) => {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, currentDeployment: progress }));
      }
    };

    const handleAlert = (alert: AlertMessage) => {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          alerts: [alert, ...prev.alerts.slice(0, 9)] // Keep last 10 alerts
        }));
        scheduleAlertDismissal(alert.id);
      }
    };

    const handleWebSocketConnection = () => {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, wsConnected: true }));
      }
    };

    const handleWebSocketDisconnection = () => {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, wsConnected: false }));
      }
    };

    // Set up WebSocket listeners
    chronosWebSocket.on('deployment:progress', handleDeploymentProgress);
    chronosWebSocket.on('deployment:connected', handleWebSocketConnection);
    chronosWebSocket.on('deployment:disconnected', handleWebSocketDisconnection);
    chronosWebSocket.on('alerts:message', handleAlert);
    chronosWebSocket.on('alerts:connected', handleWebSocketConnection);
    chronosWebSocket.on('alerts:disconnected', handleWebSocketDisconnection);

    return () => {
      chronosWebSocket.off('deployment:progress', handleDeploymentProgress);
      chronosWebSocket.off('deployment:connected', handleWebSocketConnection);
      chronosWebSocket.off('deployment:disconnected', handleWebSocketDisconnection);
      chronosWebSocket.off('alerts:message', handleAlert);
      chronosWebSocket.off('alerts:connected', handleWebSocketConnection);
      chronosWebSocket.off('alerts:disconnected', handleWebSocketDisconnection);
    };
  }, [scheduleAlertDismissal]);

  // Data fetching functions
  const refreshMetrics = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setState(prev => ({ ...prev, metricsLoading: true, error: null }));
    
    try {
      const [metricsData, healthData] = await Promise.all([
        ChronosAPI.getDeploymentAnalytics('24h'),
        ChronosAPI.getSystemHealth()
      ]);
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          metrics: metricsData,
          systemHealth: healthData,
          metricsLoading: false
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load metrics',
          metricsLoading: false
        }));
      }
    }
  }, []);

  const refreshEnvironments = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setState(prev => ({ ...prev, environmentsLoading: true, error: null }));
    
    try {
      const [production, staging, development] = await Promise.all([
        ChronosAPI.getDeploymentStatus(DeploymentEnvironment.PRODUCTION),
        ChronosAPI.getDeploymentStatus(DeploymentEnvironment.STAGING),
        ChronosAPI.getDeploymentStatus(DeploymentEnvironment.DEVELOPMENT)
      ]);
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          environments: [production, staging, development],
          environmentsLoading: false
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load environments',
          environmentsLoading: false
        }));
      }
    }
  }, []);

  const refreshSchedules = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setState(prev => ({ ...prev, schedulesLoading: true, error: null }));
    
    try {
      const [schedulesData, trinityData] = await Promise.all([
        ChronosAPI.getSchedules(),
        ChronosAPI.getTrinityIntegrationStatus()
      ]);
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          schedules: schedulesData,
          trinityStatus: trinityData,
          schedulesLoading: false
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load schedules',
          schedulesLoading: false
        }));
      }
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await Promise.all([
        refreshMetrics(),
        refreshEnvironments(),
        refreshSchedules()
      ]);
      
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to refresh data',
          loading: false
        }));
      }
    }
  }, [refreshMetrics, refreshEnvironments, refreshSchedules]);

  // WebSocket management
  const connectToDeployment = useCallback((deploymentId: string) => {
    chronosWebSocket.connectDeploymentProgress(deploymentId);
  }, []);

  const connectToAlerts = useCallback(() => {
    chronosWebSocket.connectSystemAlerts();
  }, []);

  const disconnectWebSocket = useCallback(() => {
    chronosWebSocket.disconnectAll();
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, wsConnected: false, currentDeployment: null }));
    }
  }, []);

  // Alert management
  const dismissAlert = useCallback((alertId: string) => {
    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.filter(alert => alert.id !== alertId)
      }));
    }
    
    // Clear timeout if exists
    const timeout = alertTimeoutsRef.current.get(alertId);
    if (timeout) {
      clearTimeout(timeout);
      alertTimeoutsRef.current.delete(alertId);
    }
  }, []);

  const clearAllAlerts = useCallback(() => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, alerts: [] }));
    }
    
    // Clear all timeouts
    alertTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    alertTimeoutsRef.current.clear();
  }, []);

  // Additional API functions
  const getEnvironmentMetrics = useCallback(async (
    environment: DeploymentEnvironment, 
    hours: number = 24
  ): Promise<PerformanceMetrics | null> => {
    try {
      const response = await ChronosAPI.getDeploymentMetrics(environment, hours);
      return response.metrics;
    } catch (error) {
      console.error('Failed to get environment metrics:', error);
      return null;
    }
  }, []);

  const exportReport = useCallback(async (
    environment: DeploymentEnvironment,
    startDate: string,
    endDate: string
  ) => {
    try {
      const blob = await ChronosAPI.exportDeploymentReport(environment, startDate, endDate, 'csv');
      
      // Create download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronos-report-${environment}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  }, []);

  // Initial data load
  useEffect(() => {
    refreshAll();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        refreshMetrics();
        refreshEnvironments();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [refreshAll, refreshMetrics, refreshEnvironments]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      chronosWebSocket.disconnectAll();
      
      // Clear all alert timeouts
      alertTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      alertTimeoutsRef.current.clear();
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    refreshMetrics,
    refreshEnvironments,
    refreshSchedules,
    refreshAll,
    connectToDeployment,
    connectToAlerts,
    disconnectWebSocket,
    dismissAlert,
    clearAllAlerts,
    getEnvironmentMetrics,
    exportReport
  };
}

export default useChronos;