import { useCallback, useEffect, useRef, useState } from 'react';
import { useObservabilityStore } from '../store/observabilityStore';
import { useUIStore } from '../store/uiStore';

interface WebSocketConnection {
  id: string;
  url: string;
  socket: WebSocket | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts: number;
  lastHeartbeat: number;
  subscriptions: Set<string>;
}

interface WebSocketManagerConfig {
  maxConnections: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  reconnectDelay: number;
  connectionTimeout: number;
}

const DEFAULT_CONFIG: WebSocketManagerConfig = {
  maxConnections: 6,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000, // 30 seconds
  reconnectDelay: 1000, // 1 second base delay
  connectionTimeout: 10000, // 10 seconds
};

export const useWebSocketManager = (config: Partial<WebSocketManagerConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Store hooks
  const { addStreamMessage, updateSystemMetrics } = useObservabilityStore();
  const { addNotification } = useUIStore();
  
  // Connection management state
  const [connections, setConnections] = useState<Map<string, WebSocketConnection>>(new Map());
  const [isManagerActive, setIsManagerActive] = useState(true);
  
  // Refs for cleanup and intervals
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const connectionTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Connection pooling and reuse
  const connectionPool = useRef<Map<string, WebSocket[]>>(new Map());
  
  // Message handling with throttling
  const messageQueue = useRef<Map<string, any[]>>(new Map());
  const processingQueue = useRef<boolean>(false);
  
  // Performance metrics
  const [metrics, setMetrics] = useState({
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    reconnectionRate: 0,
  });
  
  // Create optimized WebSocket connection
  const createConnection = useCallback((id: string, url: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      // Check if we can reuse a connection from the pool
      const poolKey = new URL(url).origin;
      const pooledConnections = connectionPool.current.get(poolKey) || [];
      
      if (pooledConnections.length > 0) {
        const reusedSocket = pooledConnections.pop()!;
        connectionPool.current.set(poolKey, pooledConnections);
        resolve(reusedSocket);
        return;
      }
      
      // Create new connection
      const socket = new WebSocket(url);
      
      // Set connection timeout
      const timeoutId = setTimeout(() => {
        socket.close();
        reject(new Error('Connection timeout'));
      }, finalConfig.connectionTimeout);
      
      connectionTimeoutsRef.current.set(id, timeoutId);
      
      socket.onopen = () => {
        clearTimeout(timeoutId);
        connectionTimeoutsRef.current.delete(id);
        resolve(socket);
      };
      
      socket.onerror = (error) => {
        clearTimeout(timeoutId);
        connectionTimeoutsRef.current.delete(id);
        reject(error);
      };
    });
  }, [finalConfig.connectionTimeout]);
  
  // Throttled message processing
  const processMessageQueue = useCallback(async () => {
    if (processingQueue.current) return;
    processingQueue.current = true;
    
    try {
      Array.from(messageQueue.current.entries()).forEach(([connectionId, messages]) => {
        if (messages.length > 0) {
          // Process messages in batches to avoid blocking UI
          const batchSize = 10;
          const batch = messages.splice(0, batchSize);
          
          for (const message of batch) {
            try {
              // Handle different message types
              switch (message.type) {
                case 'stream_update':
                  addStreamMessage(message.data.conversationId, message.data);
                  break;
                case 'metrics_update':
                  updateSystemMetrics(message.data);
                  break;
                case 'heartbeat':
                  // Update last heartbeat for connection
                  setConnections(prev => {
                    const updated = new Map(prev);
                    const conn = updated.get(connectionId);
                    if (conn) {
                      updated.set(connectionId, {
                        ...conn,
                        lastHeartbeat: Date.now()
                      });
                    }
                    return updated;
                  });
                  break;
              }
            } catch (error) {
              console.error(`Error processing message for ${connectionId}:`, error);
            }
          }
        }
      });
    } finally {
      processingQueue.current = false;
      
      // Schedule next processing if there are more messages
      const hasMessages = Array.from(messageQueue.current.values()).some(queue => queue.length > 0);
      if (hasMessages) {
        setTimeout(processMessageQueue, 16); // ~60fps
      }
    }
  }, [addStreamMessage, updateSystemMetrics]);
  
  // Add connection
  const addConnection = useCallback(async (id: string, url: string, subscriptions: string[] = []) => {
    if (connections.size >= finalConfig.maxConnections) {
      throw new Error(`Maximum connections (${finalConfig.maxConnections}) reached`);
    }
    
    if (connections.has(id)) {
      throw new Error(`Connection ${id} already exists`);
    }
    
    try {
      setConnections(prev => new Map(prev).set(id, {
        id,
        url,
        socket: null,
        status: 'connecting',
        reconnectAttempts: 0,
        lastHeartbeat: Date.now(),
        subscriptions: new Set(subscriptions)
      }));
      
      const socket = await createConnection(id, url);
      
      // Setup message handling with throttling
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Add to message queue for throttled processing
          if (!messageQueue.current.has(id)) {
            messageQueue.current.set(id, []);
          }
          messageQueue.current.get(id)!.push(message);
          
          // Trigger processing if not already running
          if (!processingQueue.current) {
            processMessageQueue();
          }
          
          // Update metrics
          setMetrics(prev => ({
            ...prev,
            totalMessages: prev.totalMessages + 1
          }));
        } catch (error) {
          console.error(`Error parsing message from ${id}:`, error);
        }
      };
      
      socket.onclose = (event) => {
        if (event.wasClean) {
          setConnections(prev => {
            const updated = new Map(prev);
            const conn = updated.get(id);
            if (conn) {
              updated.set(id, { ...conn, status: 'disconnected', socket: null });
            }
            return updated;
          });
        } else {
          // Attempt reconnection
          attemptReconnection(id);
        }
      };
      
      socket.onerror = (error) => {
        console.error(`WebSocket error for ${id}:`, error);
        setConnections(prev => {
          const updated = new Map(prev);
          const conn = updated.get(id);
          if (conn) {
            updated.set(id, { ...conn, status: 'error' });
          }
          return updated;
        });
      };
      
      // Update connection state
      setConnections(prev => {
        const updated = new Map(prev);
        const conn = updated.get(id);
        if (conn) {
          updated.set(id, {
            ...conn,
            socket,
            status: 'connected',
            reconnectAttempts: 0
          });
        }
        return updated;
      });
      
      // Send subscriptions
      subscriptions.forEach(subscription => {
        socket.send(JSON.stringify({ type: 'subscribe', channel: subscription }));
      });
      
    } catch (error) {
      setConnections(prev => {
        const updated = new Map(prev);
        const conn = updated.get(id);
        if (conn) {
          updated.set(id, { ...conn, status: 'error' });
        }
        return updated;
      });
      throw error;
    }
  }, [connections, finalConfig.maxConnections, createConnection, processMessageQueue]);
  
  // Attempt reconnection with exponential backoff
  const attemptReconnection = useCallback((id: string) => {
    const connection = connections.get(id);
    if (!connection || !isManagerActive) return;
    
    if (connection.reconnectAttempts >= finalConfig.maxReconnectAttempts) {
      setConnections(prev => {
        const updated = new Map(prev);
        updated.set(id, { ...connection, status: 'error' });
        return updated;
      });
      
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: `Failed to reconnect to ${id} after ${finalConfig.maxReconnectAttempts} attempts`
      });
      return;
    }
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = finalConfig.reconnectDelay * Math.pow(2, connection.reconnectAttempts);
    
    const timeoutId = setTimeout(async () => {
      reconnectTimeoutsRef.current.delete(id);
      
      try {
        setConnections(prev => {
          const updated = new Map(prev);
          const conn = updated.get(id);
          if (conn) {
            updated.set(id, {
              ...conn,
              status: 'connecting',
              reconnectAttempts: conn.reconnectAttempts + 1
            });
          }
          return updated;
        });
        
        const socket = await createConnection(id, connection.url);
        
        setConnections(prev => {
          const updated = new Map(prev);
          const conn = updated.get(id);
          if (conn) {
            updated.set(id, {
              ...conn,
              socket,
              status: 'connected'
            });
          }
          return updated;
        });
        
      } catch (error) {
        attemptReconnection(id); // Try again
      }
    }, delay);
    
    reconnectTimeoutsRef.current.set(id, timeoutId);
  }, [connections, isManagerActive, finalConfig.maxReconnectAttempts, finalConfig.reconnectDelay, createConnection, addNotification]);
  
  // Remove connection
  const removeConnection = useCallback((id: string) => {
    const connection = connections.get(id);
    if (!connection) return;
    
    // Clear timeouts
    const reconnectTimeout = reconnectTimeoutsRef.current.get(id);
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeoutsRef.current.delete(id);
    }
    
    const connectionTimeout = connectionTimeoutsRef.current.get(id);
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeoutsRef.current.delete(id);
    }
    
    // Close socket
    if (connection.socket) {
      connection.socket.close();
    }
    
    // Remove from message queue
    messageQueue.current.delete(id);
    
    // Remove connection
    setConnections(prev => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });
  }, [connections]);
  
  // Send message to specific connection
  const sendMessage = useCallback((id: string, message: any) => {
    const connection = connections.get(id);
    if (!connection || !connection.socket || connection.status !== 'connected') {
      throw new Error(`Connection ${id} is not available`);
    }
    
    connection.socket.send(JSON.stringify(message));
  }, [connections]);
  
  // Broadcast message to all connections
  const broadcast = useCallback((message: any, filter?: (conn: WebSocketConnection) => boolean) => {
    Array.from(connections.values()).forEach(connection => {
      if (connection.status === 'connected' && connection.socket) {
        if (!filter || filter(connection)) {
          try {
            connection.socket.send(JSON.stringify(message));
          } catch (error) {
            console.error(`Error broadcasting to ${connection.id}:`, error);
          }
        }
      }
    });
  }, [connections]);
  
  // Heartbeat management
  useEffect(() => {
    if (!isManagerActive) return;
    
    heartbeatIntervalRef.current = setInterval(() => {
      const now = Date.now();
      let stalledConnections = 0;
      
      Array.from(connections.entries()).forEach(([id, connection]) => {
        if (connection.status === 'connected' && connection.socket) {
          // Send heartbeat
          try {
            connection.socket.send(JSON.stringify({ type: 'ping', timestamp: now }));
          } catch (error) {
            console.error(`Error sending heartbeat to ${id}:`, error);
          }
          
          // Check for stalled connections (no response in 2x heartbeat interval)
          if (now - connection.lastHeartbeat > finalConfig.heartbeatInterval * 2) {
            stalledConnections++;
            attemptReconnection(id);
          }
        }
      });
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalConnections: connections.size,
        activeConnections: Array.from(connections.values()).filter(c => c.status === 'connected').length,
        reconnectionRate: stalledConnections
      }));
      
    }, finalConfig.heartbeatInterval);
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [connections, isManagerActive, finalConfig.heartbeatInterval, attemptReconnection]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsManagerActive(false);
      
      // Close all connections
      Array.from(connections.values()).forEach(connection => {
        if (connection.socket) {
          connection.socket.close();
        }
      });
      
      // Clear all timeouts
      Array.from(reconnectTimeoutsRef.current.values()).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      Array.from(connectionTimeoutsRef.current.values()).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [connections]);
  
  return {
    connections: Array.from(connections.values()),
    metrics,
    addConnection,
    removeConnection,
    sendMessage,
    broadcast,
    isManagerActive,
    setIsManagerActive
  };
};