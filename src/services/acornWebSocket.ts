import { WebSocketService } from './websocket';

/**
 * ACORN Chat WebSocket Service Factory
 * Creates WebSocket services for ACORN chat rooms with tenant context
 */
export class ACORNChatWebSocketService {
  private services: Map<string, WebSocketService> = new Map();

  /**
   * Get or create a WebSocket service for a specific room
   */
  getService(roomId: string, tenantParams: string = ''): WebSocketService {
    const serviceKey = `${roomId}_${tenantParams}`;
    
    if (!this.services.has(serviceKey)) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = process.env.REACT_APP_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8400';
      const url = `${wsProtocol}//${wsHost}/api/chat/ws/${roomId}${tenantParams}`;
      
      console.log('🏗️ Creating new ACORN chat WebSocket service:', { roomId, url });
      
      const service = new WebSocketService({
        url,
        reconnectInterval: 3000, // 3 seconds - faster for chat
        maxReconnectAttempts: 15, // More attempts for chat
        heartbeatInterval: 25000  // 25 seconds - slightly more frequent
      });
      
      this.services.set(serviceKey, service);
    }
    
    return this.services.get(serviceKey)!;
  }

  /**
   * Clean up unused services
   */
  cleanupService(roomId: string, tenantParams: string = ''): void {
    const serviceKey = `${roomId}_${tenantParams}`;
    const service = this.services.get(serviceKey);
    
    if (service) {
      console.log('🧹 Cleaning up ACORN chat WebSocket service:', { roomId });
      service.disconnect();
      this.services.delete(serviceKey);
    }
  }

  /**
   * Get all active services
   */
  getActiveServices(): Map<string, WebSocketService> {
    return new Map(this.services);
  }

  /**
   * Disconnect and cleanup all services
   */
  disconnectAll(): void {
    console.log('🛑 Disconnecting all ACORN chat WebSocket services');
    this.services.forEach((service, key) => {
      service.disconnect();
    });
    this.services.clear();
  }
}

/**
 * ACORN Infrastructure WebSocket Service
 * Handles infrastructure events with robust reconnection
 */
export class ACORNInfrastructureWebSocketService extends WebSocketService {
  constructor(tenantParams: string = '') {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.REACT_APP_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8400';
    const url = `${wsProtocol}//${wsHost}/api/chat/infrastructure${tenantParams}`;
    
    console.log('🏗️ Creating ACORN infrastructure WebSocket service:', { url });
    
    super({
      url,
      reconnectInterval: 5000,  // 5 seconds
      maxReconnectAttempts: 10, // Standard attempts for infrastructure
      heartbeatInterval: 30000  // 30 seconds - standard interval
    });
  }
}

// Singleton instances
export const acornChatWebSocketFactory = new ACORNChatWebSocketService();

// Create infrastructure service when needed
let infrastructureService: ACORNInfrastructureWebSocketService | null = null;

export const getACORNInfrastructureWebSocket = (tenantParams: string = ''): ACORNInfrastructureWebSocketService => {
  if (!infrastructureService) {
    infrastructureService = new ACORNInfrastructureWebSocketService(tenantParams);
  }
  return infrastructureService;
};

export const cleanupACORNInfrastructureWebSocket = (): void => {
  if (infrastructureService) {
    console.log('🧹 Cleaning up ACORN infrastructure WebSocket service');
    infrastructureService.disconnect();
    infrastructureService = null;
  }
};