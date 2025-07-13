import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.emit('connected');
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.emit('message', message);
      
      // Emit specific events based on message type
      if (message.type) {
        this.emit(message.type, message.payload);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }

  private handleClose(): void {
    console.log('WebSocket disconnected');
    this.clearTimers();
    this.emit('disconnected');
    
    if (!this.isIntentionallyClosed) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval || 5000;
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (!this.config.heartbeatInterval) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          payload: {},
          timestamp: new Date().toISOString(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  getReadyState(): number {
    return this.ws?.readyState || WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instances for different WebSocket connections
export const federationWebSocket = new WebSocketService({
  url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/federation`,
});

export const ontologyWebSocket = new WebSocketService({
  url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/ontology`,
});

export const topologyWebSocket = new WebSocketService({
  url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/topology`,
});