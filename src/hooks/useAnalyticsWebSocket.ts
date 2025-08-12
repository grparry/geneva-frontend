/**
 * React hooks for analytics WebSocket integration
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getAnalyticsWebSocketClient, 
  WebSocketState, 
  WebSocketEvent,
  type SubscriptionOptions 
} from '../services/analyticsWebSocket';
import { analyticsApi } from '../api/analytics';
import type { 
  LiveMetricsUpdate, 
  CostAlertMessage 
} from '../types/analytics';

// Hook configuration options
interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (event: any) => void;
  onError?: (error: Error) => void;
}

// Connection status
export interface WebSocketConnectionStatus {
  state: WebSocketState;
  isConnected: boolean;
  error: Error | null;
  reconnectAttempt: number;
}

// Base WebSocket hook
export const useAnalyticsWebSocket = (options: UseWebSocketOptions = {}) => {
  const dispatch = useDispatch();
  const projectId = useSelector((state: any) => state.project.currentProjectId);
  const token = useSelector((state: any) => state.auth.token);
  
  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>({
    state: WebSocketState.DISCONNECTED,
    isConnected: false,
    error: null,
    reconnectAttempt: 0,
  });

  const wsClient = useRef(getAnalyticsWebSocketClient({ reconnect: options.reconnect ?? true }));

  // Handle connection state changes
  useEffect(() => {
    const client = wsClient.current;

    const handleStateChange = ({ newState }: { oldState: WebSocketState; newState: WebSocketState }) => {
      setConnectionStatus(prev => ({
        ...prev,
        state: newState,
        isConnected: newState === WebSocketState.CONNECTED,
      }));
    };

    const handleConnect = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        error: null,
        reconnectAttempt: 0,
      }));
      options.onConnect?.();
    };

    const handleDisconnect = (event: any) => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
      }));
      options.onDisconnect?.(event);
    };

    const handleError = (error: Error) => {
      setConnectionStatus(prev => ({
        ...prev,
        error,
      }));
      options.onError?.(error);
    };

    const handleReconnecting = ({ attempt }: { attempt: number }) => {
      setConnectionStatus(prev => ({
        ...prev,
        reconnectAttempt: attempt,
      }));
    };

    // Subscribe to events
    client.on(WebSocketEvent.STATE_CHANGE, handleStateChange);
    client.on(WebSocketEvent.CONNECTED, handleConnect);
    client.on(WebSocketEvent.DISCONNECTED, handleDisconnect);
    client.on(WebSocketEvent.ERROR, handleError);
    client.on(WebSocketEvent.RECONNECTING, handleReconnecting);

    // Auto-connect if enabled
    if (options.autoConnect !== false && projectId && token) {
      client.connect(projectId, token);
    }

    // Cleanup
    return () => {
      client.off(WebSocketEvent.STATE_CHANGE, handleStateChange);
      client.off(WebSocketEvent.CONNECTED, handleConnect);
      client.off(WebSocketEvent.DISCONNECTED, handleDisconnect);
      client.off(WebSocketEvent.ERROR, handleError);
      client.off(WebSocketEvent.RECONNECTING, handleReconnecting);
    };
  }, [projectId, token, options.autoConnect]);

  const connect = useCallback(() => {
    if (projectId && token) {
      wsClient.current.connect(projectId, token);
    }
  }, [projectId, token]);

  const disconnect = useCallback(() => {
    wsClient.current.disconnect();
  }, []);

  return {
    connectionStatus,
    connect,
    disconnect,
    client: wsClient.current,
  };
};

// Live metrics hook
export const useLiveMetrics = (
  subscriptionOptions?: SubscriptionOptions,
  enabled: boolean = true
) => {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetricsUpdate | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { client, connectionStatus } = useAnalyticsWebSocket({ autoConnect: enabled });
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled || !connectionStatus.isConnected) return;

    const handleLiveMetrics = (metrics: LiveMetricsUpdate) => {
      setLiveMetrics(metrics);
      setLastUpdate(new Date());

      // Update Redux cache with live data
      (dispatch as any)(
        analyticsApi.util.updateQueryData('getKPIMetrics', 
          { time_range: '24h' }, 
          (draft: any) => {
            // Update relevant fields with live data
            if (draft && metrics) {
              draft.performance.avg_response_time = metrics.metrics.average_response_time;
              draft.performance.error_rate = metrics.metrics.error_rate;
            }
          }
        )
      );
    };

    // Subscribe to live metrics
    client.subscribeLiveMetrics(subscriptionOptions);
    client.on(WebSocketEvent.LIVE_METRICS, handleLiveMetrics);

    // Cleanup
    return () => {
      client.off(WebSocketEvent.LIVE_METRICS, handleLiveMetrics);
      client.unsubscribe('live_metrics');
    };
  }, [enabled, connectionStatus.isConnected, client, dispatch, subscriptionOptions]);

  return {
    liveMetrics,
    lastUpdate,
    connectionStatus,
  };
};

// Cost alerts hook
export const useCostAlerts = (
  severity?: string[],
  enabled: boolean = true,
  onNewAlert?: (alert: CostAlertMessage) => void
) => {
  const [alerts, setAlerts] = useState<CostAlertMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { client, connectionStatus } = useAnalyticsWebSocket({ autoConnect: enabled });
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled || !connectionStatus.isConnected) return;

    const handleCostAlert = (alert: CostAlertMessage) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
      setUnreadCount(prev => prev + 1);
      
      // Callback for new alert
      onNewAlert?.(alert);

      // Invalidate alerts cache to refresh data
      dispatch(analyticsApi.util.invalidateTags(['Alerts']));
    };

    // Subscribe to cost alerts
    client.subscribeCostAlerts(severity);
    client.on(WebSocketEvent.COST_ALERT, handleCostAlert);

    // Cleanup
    return () => {
      client.off(WebSocketEvent.COST_ALERT, handleCostAlert);
      client.unsubscribe('cost_alerts');
    };
  }, [enabled, connectionStatus.isConnected, client, severity, onNewAlert, dispatch]);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setUnreadCount(0);
  }, []);

  return {
    alerts,
    unreadCount,
    markAllAsRead,
    clearAlerts,
    connectionStatus,
  };
};

// Combined real-time analytics hook
export const useRealtimeAnalytics = (options?: {
  metricsOptions?: SubscriptionOptions;
  alertSeverity?: string[];
  enabled?: boolean;
}) => {
  const enabled = options?.enabled ?? true;
  
  const { 
    liveMetrics, 
    lastUpdate: metricsLastUpdate,
    connectionStatus: metricsConnection 
  } = useLiveMetrics(options?.metricsOptions, enabled);
  
  const { 
    alerts, 
    unreadCount: unreadAlerts,
    markAllAsRead,
    connectionStatus: alertsConnection 
  } = useCostAlerts(options?.alertSeverity, enabled);

  // Combine connection status
  const connectionStatus = metricsConnection.isConnected && alertsConnection.isConnected
    ? metricsConnection
    : metricsConnection.error || alertsConnection.error
    ? { ...metricsConnection, error: metricsConnection.error || alertsConnection.error }
    : metricsConnection;

  return {
    liveMetrics,
    metricsLastUpdate,
    alerts,
    unreadAlerts,
    markAllAsRead,
    connectionStatus,
  };
};

// Hook for specific metric subscriptions
export const useMetricSubscription = (
  metric: string,
  updateInterval: number = 10
) => {
  const [value, setValue] = useState<number | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const { client, connectionStatus } = useAnalyticsWebSocket();

  useEffect(() => {
    if (!connectionStatus.isConnected) return;

    const handleLiveMetrics = (metrics: LiveMetricsUpdate) => {
      // Extract specific metric value based on metric name
      let newValue: number | null = null;
      
      switch (metric) {
        case 'active_workflows':
          newValue = metrics.metrics.active_workflows;
          break;
        case 'cost_rate':
          newValue = metrics.metrics.current_cost_rate;
          break;
        case 'api_calls':
          newValue = metrics.metrics.api_calls_per_minute;
          break;
        case 'response_time':
          newValue = metrics.metrics.average_response_time;
          break;
        case 'error_rate':
          newValue = metrics.metrics.error_rate;
          break;
        default:
          return;
      }

      if (newValue !== null) {
        // Calculate trend
        if (value !== null) {
          const diff = newValue - value;
          setTrend(diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable');
        }
        setValue(newValue);
      }
    };

    // Subscribe with specific metric
    client.subscribeLiveMetrics({ 
      metrics: [metric], 
      updateInterval 
    });
    client.on(WebSocketEvent.LIVE_METRICS, handleLiveMetrics);

    return () => {
      client.off(WebSocketEvent.LIVE_METRICS, handleLiveMetrics);
    };
  }, [connectionStatus.isConnected, client, metric, updateInterval, value]);

  return {
    value,
    trend,
    connectionStatus,
  };
};

// Export all hooks
export default {
  useAnalyticsWebSocket,
  useLiveMetrics,
  useCostAlerts,
  useRealtimeAnalytics,
  useMetricSubscription,
};