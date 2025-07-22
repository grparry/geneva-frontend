/**
 * WebSocket client service for real-time analytics updates
 */

import { EventEmitter } from 'events';
import type { 
  LiveMetricsUpdate, 
  CostAlertMessage 
} from '../types/analytics';

// WebSocket connection states
export enum WebSocketState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

// WebSocket event types
export enum WebSocketEvent {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  LIVE_METRICS = 'live_metrics',
  COST_ALERT = 'cost_alert',
  RECONNECTING = 'reconnecting',
  STATE_CHANGE = 'state_change',
}

// WebSocket configuration
interface WebSocketConfig {
  url: string;
  reconnect: boolean;
  reconnectInterval: number;
  reconnectMaxAttempts: number;
  heartbeatInterval: number;
  requestTimeout: number;
}

// Message types
interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'error' | 'data';
  channel?: string;
  data?: any;
  error?: string;
  timestamp: string;
}

// Subscription options
interface SubscriptionOptions {
  metrics?: string[];
  updateInterval?: number;
  includeForecasts?: boolean;
}

class AnalyticsWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private state: WebSocketState = WebSocketState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscriptions = new Set<string>();
  private messageQueue: WebSocketMessage[] = [];
  private isAuthenticated = false;

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();
    
    this.config = {
      url: config.url || '',
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 5000,
      reconnectMaxAttempts: config.reconnectMaxAttempts ?? 10,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      requestTimeout: config.requestTimeout ?? 10000,
    };
  }

  // Connect to WebSocket server
  connect(projectId: string, token: string): void {
    if (this.state === WebSocketState.CONNECTED || this.state === WebSocketState.CONNECTING) {
      console.log('[Analytics WS] Already connected or connecting');
      return;
    }

    this.setState(WebSocketState.CONNECTING);
    
    try {
      // Construct WebSocket URL with auth
      const wsUrl = `${this.config.url}?project_id=${projectId}&token=${token}`;
      this.ws = new WebSocket(wsUrl);
      
      this.setupEventHandlers();
    } catch (error) {
      console.error('[Analytics WS] Connection error:', error);
      this.setState(WebSocketState.ERROR);
      this.handleReconnect();
    }
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.clearTimers();
    this.reconnectAttempts = 0;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setState(WebSocketState.DISCONNECTED);
    this.subscriptions.clear();
    this.messageQueue = [];
  }

  // Subscribe to live metrics
  subscribeLiveMetrics(options: SubscriptionOptions = {}): void {
    const subscription: WebSocketMessage = {
      type: 'subscribe',
      channel: 'live_metrics',
      data: {
        metrics: options.metrics || ['all'],
        update_interval: options.updateInterval || 10,
        include_forecasts: options.includeForecasts || false,
      },
      timestamp: new Date().toISOString(),
    };
    
    this.subscriptions.add('live_metrics');
    this.sendMessage(subscription);
  }

  // Subscribe to cost alerts
  subscribeCostAlerts(severity?: string[]): void {
    const subscription: WebSocketMessage = {
      type: 'subscribe',
      channel: 'cost_alerts',
      data: {
        severity: severity || ['high', 'critical'],
      },
      timestamp: new Date().toISOString(),
    };
    
    this.subscriptions.add('cost_alerts');
    this.sendMessage(subscription);
  }

  // Unsubscribe from a channel
  unsubscribe(channel: string): void {
    const unsubscribe: WebSocketMessage = {
      type: 'unsubscribe',
      channel,
      timestamp: new Date().toISOString(),
    };
    
    this.subscriptions.delete(channel);
    this.sendMessage(unsubscribe);
  }

  // Get current connection state
  getState(): WebSocketState {
    return this.state;
  }

  // Check if connected
  isConnected(): boolean {
    return this.state === WebSocketState.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }

  // Private methods
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[Analytics WS] Connected');
      this.reconnectAttempts = 0;
      this.setState(WebSocketState.CONNECTED);
      this.emit(WebSocketEvent.CONNECTED);
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Process queued messages
      this.processMessageQueue();
      
      // Resubscribe to channels
      this.resubscribe();
    };

    this.ws.onclose = (event) => {
      console.log('[Analytics WS] Disconnected:', event.code, event.reason);
      this.clearTimers();
      this.setState(WebSocketState.DISCONNECTED);
      this.emit(WebSocketEvent.DISCONNECTED, { code: event.code, reason: event.reason });
      
      if (this.config.reconnect && event.code !== 1000) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('[Analytics WS] Error:', error);
      this.emit(WebSocketEvent.ERROR, error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('[Analytics WS] Failed to parse message:', error);
      }
    };
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'live_metrics':
        this.emit(WebSocketEvent.LIVE_METRICS, message.data as LiveMetricsUpdate);
        break;
        
      case 'cost_alert':
        this.emit(WebSocketEvent.COST_ALERT, message.data as CostAlertMessage);
        break;
        
      case 'pong':
        // Heartbeat response received
        break;
        
      case 'error':
        console.error('[Analytics WS] Server error:', message.error);
        this.emit(WebSocketEvent.ERROR, new Error(message.error));
        break;
        
      case 'auth_required':
        this.isAuthenticated = false;
        this.emit(WebSocketEvent.ERROR, new Error('Authentication required'));
        break;
        
      case 'auth_success':
        this.isAuthenticated = true;
        break;
        
      default:
        console.log('[Analytics WS] Unknown message type:', message.type);
    }
  }

  private sendMessage(message: WebSocketMessage): void {
    if (this.isConnected() && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[Analytics WS] Failed to send message:', error);
        this.messageQueue.push(message);
      }
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        const ping: WebSocketMessage = {
          type: 'ping',
          timestamp: new Date().toISOString(),
        };
        this.sendMessage(ping);
      }
    }, this.config.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleReconnect(): void {
    if (!this.config.reconnect || this.reconnectAttempts >= this.config.reconnectMaxAttempts) {
      console.log('[Analytics WS] Max reconnection attempts reached');
      this.setState(WebSocketState.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.setState(WebSocketState.RECONNECTING);
    this.emit(WebSocketEvent.RECONNECTING, { attempt: this.reconnectAttempts });

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );

    console.log(`[Analytics WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.state !== WebSocketState.CONNECTED) {
        // Reconnect with stored credentials
        // Note: In production, you'd get fresh credentials from Redux/auth service
        this.connect('', '');
      }
    }, delay);
  }

  private resubscribe(): void {
    // Resubscribe to all active channels
    if (this.subscriptions.has('live_metrics')) {
      this.subscribeLiveMetrics();
    }
    if (this.subscriptions.has('cost_alerts')) {
      this.subscribeCostAlerts();
    }
  }

  private setState(newState: WebSocketState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.emit(WebSocketEvent.STATE_CHANGE, { oldState, newState });
    }
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Singleton instance
let wsClient: AnalyticsWebSocketClient | null = null;

// Factory function to get WebSocket client
export const getAnalyticsWebSocketClient = (config?: Partial<WebSocketConfig>): AnalyticsWebSocketClient => {
  if (!wsClient) {
    wsClient = new AnalyticsWebSocketClient({
      url: process.env.REACT_APP_WS_URL || 'ws://localhost:8400/api/analytics/ws',
      ...config,
    });
  }
  return wsClient;
};

// Export types and client
export { AnalyticsWebSocketClient };
export type { WebSocketConfig, SubscriptionOptions };