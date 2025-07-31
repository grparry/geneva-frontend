// Chronos WebSocket Service for Real-time Updates
import { DeploymentProgress, AlertMessage } from '../../types/chronos';

export class ChronosWebSocketService {
  private deploymentSocket: WebSocket | null = null;
  private alertSocket: WebSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Base WebSocket URL
  private baseWsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8400';

  // Connect to deployment progress updates
  connectDeploymentProgress(deploymentId: string): void {
    if (this.deploymentSocket) {
      this.deploymentSocket.close();
    }

    const wsUrl = `${this.baseWsUrl}/chronos/deployment/progress/${deploymentId}`;
    this.deploymentSocket = new WebSocket(wsUrl);

    this.deploymentSocket.onopen = () => {
      console.log('Connected to deployment progress WebSocket');
      this.reconnectAttempts = 0;
      this.emit('deployment:connected', { deploymentId });
    };

    this.deploymentSocket.onmessage = (event) => {
      try {
        const data: DeploymentProgress = JSON.parse(event.data);
        this.emit('deployment:progress', data);
      } catch (error) {
        console.error('Failed to parse deployment progress data:', error);
      }
    };

    this.deploymentSocket.onerror = (error) => {
      console.error('Deployment WebSocket error:', error);
      this.emit('deployment:error', { error, deploymentId });
    };

    this.deploymentSocket.onclose = (event) => {
      console.log('Deployment WebSocket connection closed:', event.code, event.reason);
      this.emit('deployment:disconnected', { deploymentId, code: event.code, reason: event.reason });
      
      // Attempt reconnection if not intentional close
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(() => this.connectDeploymentProgress(deploymentId));
      }
    };
  }

  // Connect to system alerts
  connectSystemAlerts(): void {
    if (this.alertSocket) {
      this.alertSocket.close();
    }

    const wsUrl = `${this.baseWsUrl}/chronos/alerts`;
    this.alertSocket = new WebSocket(wsUrl);

    this.alertSocket.onopen = () => {
      console.log('Connected to system alerts WebSocket');
      this.reconnectAttempts = 0;
      this.emit('alerts:connected', {});
    };

    this.alertSocket.onmessage = (event) => {
      try {
        const data: AlertMessage = JSON.parse(event.data);
        this.emit('alerts:message', data);
      } catch (error) {
        console.error('Failed to parse alert data:', error);
      }
    };

    this.alertSocket.onerror = (error) => {
      console.error('Alerts WebSocket error:', error);
      this.emit('alerts:error', { error });
    };

    this.alertSocket.onclose = (event) => {
      console.log('Alerts WebSocket connection closed:', event.code, event.reason);
      this.emit('alerts:disconnected', { code: event.code, reason: event.reason });
      
      // Attempt reconnection if not intentional close
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(() => this.connectSystemAlerts());
      }
    };
  }

  // Schedule reconnection with exponential backoff
  private scheduleReconnect(reconnectFn: () => void): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Max 30 seconds
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      reconnectFn();
    }, delay);
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send message to deployment WebSocket
  sendDeploymentMessage(message: any): void {
    if (this.deploymentSocket && this.deploymentSocket.readyState === WebSocket.OPEN) {
      this.deploymentSocket.send(JSON.stringify(message));
    } else {
      console.warn('Deployment WebSocket is not connected');
    }
  }

  // Send message to alerts WebSocket
  sendAlertMessage(message: any): void {
    if (this.alertSocket && this.alertSocket.readyState === WebSocket.OPEN) {
      this.alertSocket.send(JSON.stringify(message));
    } else {
      console.warn('Alerts WebSocket is not connected');
    }
  }

  // Get connection status
  getDeploymentConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.deploymentSocket) return 'closed';
    
    switch (this.deploymentSocket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }

  getAlertsConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.alertSocket) return 'closed';
    
    switch (this.alertSocket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }

  // Close connections
  disconnectDeploymentProgress(): void {
    if (this.deploymentSocket) {
      this.deploymentSocket.close(1000, 'Intentional disconnect');
      this.deploymentSocket = null;
    }
  }

  disconnectSystemAlerts(): void {
    if (this.alertSocket) {
      this.alertSocket.close(1000, 'Intentional disconnect');
      this.alertSocket = null;
    }
  }

  // Close all connections
  disconnectAll(): void {
    this.disconnectDeploymentProgress();
    this.disconnectSystemAlerts();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  // Check if any connection is active
  isConnected(): boolean {
    return (
      this.getDeploymentConnectionStatus() === 'open' ||
      this.getAlertsConnectionStatus() === 'open'
    );
  }
}

// Singleton instance
export const chronosWebSocket = new ChronosWebSocketService();