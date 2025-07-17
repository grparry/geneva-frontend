/**
 * Redux middleware for WebSocket integration
 * Automatically updates RTK Query cache with real-time data
 */

import { Middleware, MiddlewareAPI, Dispatch, AnyAction, UnknownAction } from '@reduxjs/toolkit';
import { 
  getAnalyticsWebSocketClient, 
  WebSocketEvent 
} from './analyticsWebSocket';
import { analyticsApi } from '../api/analytics';
import type { 
  LiveMetricsUpdate, 
  CostAlertMessage,
  KPIMetricsResponse 
} from '../types/analytics';

// Action types for WebSocket events
export const WS_CONNECT = 'analytics/ws/connect';
export const WS_DISCONNECT = 'analytics/ws/disconnect';
export const WS_SUBSCRIBE_METRICS = 'analytics/ws/subscribeMetrics';
export const WS_SUBSCRIBE_ALERTS = 'analytics/ws/subscribeAlerts';
export const WS_UNSUBSCRIBE = 'analytics/ws/unsubscribe';

// Action creators
export const wsConnect = (projectId: string, token: string) => ({
  type: WS_CONNECT,
  payload: { projectId, token },
});

export const wsDisconnect = () => ({
  type: WS_DISCONNECT,
});

export const wsSubscribeMetrics = (options?: any) => ({
  type: WS_SUBSCRIBE_METRICS,
  payload: options,
});

export const wsSubscribeAlerts = (severity?: string[]) => ({
  type: WS_SUBSCRIBE_ALERTS,
  payload: { severity },
});

export const wsUnsubscribe = (channel: string) => ({
  type: WS_UNSUBSCRIBE,
  payload: { channel },
});

// Create the middleware
export const createAnalyticsWebSocketMiddleware = (): Middleware => {
  let wsClient = getAnalyticsWebSocketClient();
  let isSetup = false;

  return (store: MiddlewareAPI) => (next: Dispatch<UnknownAction>) => (action: AnyAction) => {
    // Setup event listeners once
    if (!isSetup) {
      setupEventListeners(wsClient, store);
      isSetup = true;
    }

    // Handle WebSocket actions
    switch (action.type) {
      case WS_CONNECT:
        const { projectId, token } = action.payload;
        wsClient.connect(projectId, token);
        break;

      case WS_DISCONNECT:
        wsClient.disconnect();
        break;

      case WS_SUBSCRIBE_METRICS:
        wsClient.subscribeLiveMetrics(action.payload);
        break;

      case WS_SUBSCRIBE_ALERTS:
        wsClient.subscribeCostAlerts(action.payload?.severity);
        break;

      case WS_UNSUBSCRIBE:
        wsClient.unsubscribe(action.payload.channel);
        break;

      // Auto-connect on auth success
      case 'auth/loginSuccess':
      case 'auth/tokenRefreshed':
        const state = store.getState();
        if (state.auth?.token && state.project?.currentProjectId) {
          wsClient.connect(state.project.currentProjectId, state.auth.token);
        }
        break;

      // Auto-disconnect on logout
      case 'auth/logout':
        wsClient.disconnect();
        break;
    }

    return next(action);
  };
};

// Setup WebSocket event listeners
const setupEventListeners = (
  wsClient: ReturnType<typeof getAnalyticsWebSocketClient>,
  store: MiddlewareAPI
) => {
  // Handle live metrics updates
  wsClient.on(WebSocketEvent.LIVE_METRICS, (metrics: LiveMetricsUpdate) => {
    updateKPIMetricsCache(store, metrics);
    updateTrendDataCache(store, metrics);
    
    // Dispatch custom action for other reducers
    store.dispatch({
      type: 'analytics/liveMetricsReceived',
      payload: metrics,
    });
  });

  // Handle cost alerts
  wsClient.on(WebSocketEvent.COST_ALERT, (alert: CostAlertMessage) => {
    // Invalidate alerts cache to force refresh
    store.dispatch(
      analyticsApi.util.invalidateTags(['Alerts'])
    );
    
    // Dispatch custom action
    store.dispatch({
      type: 'analytics/costAlertReceived',
      payload: alert,
    });
    
    // Update cost-related caches
    updateCostMetricsCache(store, alert);
  });

  // Handle connection events
  wsClient.on(WebSocketEvent.CONNECTED, () => {
    store.dispatch({
      type: 'analytics/wsConnected',
    });
  });

  wsClient.on(WebSocketEvent.DISCONNECTED, (event) => {
    store.dispatch({
      type: 'analytics/wsDisconnected',
      payload: event,
    });
  });

  wsClient.on(WebSocketEvent.ERROR, (error) => {
    store.dispatch({
      type: 'analytics/wsError',
      payload: error,
    });
  });
};

// Update KPI metrics cache with live data
const updateKPIMetricsCache = (
  store: MiddlewareAPI,
  liveMetrics: LiveMetricsUpdate
) => {
  const state = store.getState();
  const projectId = state.project?.currentProjectId;
  
  if (!projectId) return;

  // Update all cached KPI queries
  ['24h', '7d', '30d', '90d'].forEach(timeRange => {
    store.dispatch(
      analyticsApi.util.updateQueryData(
        'getKPIMetrics',
        { project_id: projectId, time_range: timeRange },
        (draft: KPIMetricsResponse) => {
          if (!draft) return;

          // Update performance metrics with live data
          draft.performance.avg_response_time = liveMetrics.metrics.average_response_time;
          draft.performance.error_rate = liveMetrics.metrics.error_rate;
          
          // Update agent count
          draft.agents.active_count = liveMetrics.metrics.active_agents;
          
          // Calculate new trends based on current values
          const costRate = liveMetrics.metrics.current_cost_rate * 24; // Convert to daily
          if (draft.costs.total > 0) {
            const previousDailyCost = draft.costs.total / 30; // Rough daily average
            draft.costs.trend = ((costRate - previousDailyCost) / previousDailyCost) * 100;
          }
        }
      )
    );
  });
};

// Update trend data cache
const updateTrendDataCache = (
  store: MiddlewareAPI,
  liveMetrics: LiveMetricsUpdate
) => {
  const state = store.getState();
  const projectId = state.project?.currentProjectId;
  
  if (!projectId) return;

  // Map of metric names to live values
  const metricUpdates = {
    'workflow_count': liveMetrics.metrics.active_workflows,
    'api_calls': liveMetrics.metrics.api_calls_per_minute,
    'response_time': liveMetrics.metrics.average_response_time,
    'error_rate': liveMetrics.metrics.error_rate,
  };

  // Update each metric's trend data
  Object.entries(metricUpdates).forEach(([metric, value]) => {
    ['24h', '7d', '30d'].forEach(timeRange => {
      store.dispatch(
        analyticsApi.util.updateQueryData(
          'getTrendData',
          { project_id: projectId, metric, time_range: timeRange },
          (draft) => {
            if (!draft) return;

            // Update current value in summary
            draft.summary.current_value = value;
            
            // Add new data point to the end
            const newDataPoint = {
              timestamp: liveMetrics.timestamp,
              value: value,
            };
            
            // Keep only recent data points
            draft.data_points = [...draft.data_points.slice(-99), newDataPoint];
            
            // Recalculate trend
            if (draft.data_points.length > 1) {
              const previousValue = draft.data_points[draft.data_points.length - 2].value;
              draft.summary.change_percentage = ((value - previousValue) / previousValue) * 100;
              draft.summary.trend_direction = 
                value > previousValue ? 'up' : 
                value < previousValue ? 'down' : 
                'stable';
            }
          }
        )
      );
    });
  });
};

// Update cost metrics when alerts are received
const updateCostMetricsCache = (
  store: MiddlewareAPI,
  alert: CostAlertMessage
) => {
  const state = store.getState();
  const projectId = state.project?.currentProjectId;
  
  if (!projectId) return;

  // Update cost breakdown cache to reflect alert
  store.dispatch(
    analyticsApi.util.updateQueryData(
      'getCostBreakdown',
      { project_id: projectId, time_range: '24h' },
      (draft) => {
        if (!draft) return;
        
        // Update total cost if alert indicates overage
        if (alert.alert_type.includes('budget_exceeded')) {
          draft.total_cost = Math.max(draft.total_cost, alert.current_value);
        }
      }
    )
  );
};

// Selector to get WebSocket connection status
export const selectWebSocketStatus = (state: any) => ({
  isConnected: state.analytics?.wsConnected || false,
  error: state.analytics?.wsError || null,
});

// Export the middleware
export const analyticsWebSocketMiddleware = createAnalyticsWebSocketMiddleware();