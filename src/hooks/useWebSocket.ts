import { useEffect, useRef, useCallback, useState } from 'react';
import { useObservabilityStore } from '../store/observabilityStore';
import { useUIStore } from '../store/uiStore';

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (config: WebSocketConfig) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const configRef = useRef(config);
  const [isConnected, setIsConnected] = useState(false);
  
  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  
  const { addStreamMessage, updateExecution, addAlert } = useObservabilityStore();
  const { setWebSocketStatus: storeSetWebSocketStatus, updateHeartbeat: storeUpdateHeartbeat, addNotification: storeAddNotification } = useUIStore();
  
  // Store functions in refs to prevent infinite loops
  const storeRefs = useRef({
    addStreamMessage,
    updateExecution,
    addAlert,
    setWebSocketStatus: storeSetWebSocketStatus,
    updateHeartbeat: storeUpdateHeartbeat,
    addNotification: storeAddNotification
  });
  
  // Update refs when functions change
  useEffect(() => {
    storeRefs.current = {
      addStreamMessage,
      updateExecution,
      addAlert,
      setWebSocketStatus: storeSetWebSocketStatus,
      updateHeartbeat: storeUpdateHeartbeat,
      addNotification: storeAddNotification
    };
  }, [addStreamMessage, updateExecution, addAlert, storeSetWebSocketStatus, storeUpdateHeartbeat, storeAddNotification]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'stream.update':
        if (data.conversation_id && data.message) {
          storeRefs.current.addStreamMessage(data.conversation_id, data.message);
        }
        break;
        
      case 'execution.start':
      case 'execution.complete':
      case 'execution.update':
        if (data.execution) {
          storeRefs.current.updateExecution(data.execution);
        }
        break;
        
      case 'agent.status':
        // Handle agent status updates
        storeRefs.current.addNotification({
          type: 'info',
          title: 'Agent Status',
          message: `${data.agent_id}: ${data.status}`,
          autoHide: true,
          duration: 3000
        });
        break;
        
      case 'system.alert':
        storeRefs.current.addAlert({
          type: data.alert.type || 'info',
          title: data.alert.title,
          message: data.alert.message
        });
        break;
        
      case 'heartbeat':
        storeRefs.current.updateHeartbeat();
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  const connect = useCallback(() => {
    const { url, reconnectInterval = 3000, maxReconnectAttempts = 5, onConnect, onDisconnect, onError } = configRef.current;
    
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      storeRefs.current.setWebSocketStatus('reconnecting');
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        storeRefs.current.setWebSocketStatus('connected');
        storeRefs.current.updateHeartbeat();
        reconnectAttemptsRef.current = 0;
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        onConnect?.();
        
        storeRefs.current.addNotification({
          type: 'success',
          title: 'Connected',
          message: 'Real-time updates enabled',
          autoHide: true,
          duration: 3000
        });
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        storeRefs.current.setWebSocketStatus('disconnected');
        onDisconnect?.();
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
          
          storeRefs.current.addNotification({
            type: 'warning',
            title: 'Connection Lost',
            message: `Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
            autoHide: true,
            duration: 4000
          });
        } else {
          storeRefs.current.addAlert({
            type: 'error',
            title: 'Connection Failed',
            message: 'Unable to establish real-time connection. Some features may not work properly.'
          });
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
          storeRefs.current.updateHeartbeat();
          
          // Dispatch custom event for components to listen to
          window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      storeRefs.current.setWebSocketStatus('disconnected');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    storeRefs.current.setWebSocketStatus('disconnected');
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    const timer = setTimeout(() => {
      connect();
    }, 0); // Defer connection to next tick
    
    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, []); // Empty dependency array

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    send,
    disconnect,
    reconnect: connect,
    isConnected
  };
};