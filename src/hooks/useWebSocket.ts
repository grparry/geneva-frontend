import { useEffect, useRef, useCallback } from 'react';
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
  
  const { addStreamMessage, updateExecution, addAlert } = useObservabilityStore();
  const { setWebSocketStatus, updateHeartbeat, addNotification } = useUIStore();
  
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onConnect,
    onDisconnect,
    onError
  } = config;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setWebSocketStatus('reconnecting');
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWebSocketStatus('connected');
        updateHeartbeat();
        reconnectAttemptsRef.current = 0;
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        onConnect?.();
        
        addNotification({
          type: 'success',
          title: 'Connected',
          message: 'Real-time updates enabled',
          autoHide: true,
          duration: 3000
        });
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWebSocketStatus('disconnected');
        onDisconnect?.();
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
          
          addNotification({
            type: 'warning',
            title: 'Connection Lost',
            message: `Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
            autoHide: true,
            duration: 4000
          });
        } else {
          addAlert({
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
          updateHeartbeat();
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setWebSocketStatus('disconnected');
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onConnect, onDisconnect, onError]);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'stream.update':
        if (data.conversation_id && data.message) {
          addStreamMessage(data.conversation_id, data.message);
        }
        break;
        
      case 'execution.start':
      case 'execution.complete':
      case 'execution.update':
        if (data.execution) {
          updateExecution(data.execution);
        }
        break;
        
      case 'agent.status':
        // Handle agent status updates
        addNotification({
          type: 'info',
          title: 'Agent Status',
          message: `${data.agent_id}: ${data.status}`,
          autoHide: true,
          duration: 3000
        });
        break;
        
      case 'system.alert':
        addAlert({
          type: data.alert.type || 'info',
          title: data.alert.title,
          message: data.alert.message
        });
        break;
        
      case 'heartbeat':
        updateHeartbeat();
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [addStreamMessage, updateExecution, addAlert, addNotification, updateHeartbeat]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setWebSocketStatus('disconnected');
  }, [setWebSocketStatus]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

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
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
};