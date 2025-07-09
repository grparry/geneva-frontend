/**
 * OCL WebSocket Hook
 * Manages real-time WebSocket connection for OCL events
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  setWebSocketConnected,
  setWebSocketReconnecting,
  setWebSocketError,
  handleWebSocketEvent,
} from '../../store/ocl/slice';
import type { OCLWebSocketEvent } from '../../types/ocl';

interface UseOCLWebSocketOptions {
  url?: string;
  projectId?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export const useOCLWebSocket = (options: UseOCLWebSocketOptions = {}) => {
  const {
    url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ocl/ws`,
    projectId,
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
  } = options;

  const dispatch = useDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<string[]>([]);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);

  // Event listeners storage
  const eventListenersRef = useRef<Map<string, Set<(event: OCLWebSocketEvent) => void>>>(new Map());

  // Build WebSocket URL with parameters
  const buildWebSocketUrl = useCallback(() => {
    const wsUrl = new URL(url);
    if (projectId) {
      wsUrl.searchParams.set('project_id', projectId);
    }
    return wsUrl.toString();
  }, [url, projectId]);

  // Send heartbeat to keep connection alive
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      }));
      setLastHeartbeat(new Date());
    }
  }, []);

  // Process queued messages when connection is established
  const processMessageQueue = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && messageQueueRef.current.length > 0) {
      messageQueueRef.current.forEach(message => {
        wsRef.current?.send(message);
      });
      messageQueueRef.current = [];
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'heartbeat':
          // Respond to server heartbeat
          setLastHeartbeat(new Date());
          break;
          
        case 'ocl_event':
          // Handle OCL-specific events
          const oclEvent: OCLWebSocketEvent = message.data;
          dispatch(handleWebSocketEvent(oclEvent));
          
          // Notify event listeners
          const listeners = eventListenersRef.current.get(oclEvent.event);
          if (listeners) {
            listeners.forEach(listener => listener(oclEvent));
          }
          break;
          
        case 'error':
          console.error('OCL WebSocket error:', message.data);
          dispatch(setWebSocketError(message.data.message || 'WebSocket error'));
          break;
          
        case 'subscription_triggered':
          // Handle subscription notifications
          console.log('Subscription triggered:', message.data);
          break;
          
        default:
          console.debug('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [dispatch]);

  // Handle WebSocket connection open
  const handleOpen = useCallback(() => {
    console.log('OCL WebSocket connected');
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
    dispatch(setWebSocketConnected(true));
    dispatch(setWebSocketError(null));
    
    // Process any queued messages
    processMessageQueue();
    
    // Start heartbeat
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
    }
    heartbeatTimeoutRef.current = setInterval(sendHeartbeat, heartbeatInterval);
    sendHeartbeat();
  }, [dispatch, processMessageQueue, sendHeartbeat, heartbeatInterval]);

  // Handle WebSocket connection close
  const handleClose = useCallback((event: CloseEvent) => {
    console.log('OCL WebSocket disconnected:', event.code, event.reason);
    setIsConnecting(false);
    dispatch(setWebSocketConnected(false));
    
    // Clear heartbeat
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    
    // Attempt reconnection if not a normal closure
    if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
      dispatch(setWebSocketReconnecting(true));
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        connect();
      }, reconnectInterval);
    } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      dispatch(setWebSocketError('Max reconnection attempts reached'));
    }
  }, [dispatch, maxReconnectAttempts, reconnectInterval]);

  // Handle WebSocket errors
  const handleError = useCallback((error: Event) => {
    console.error('OCL WebSocket error:', error);
    setIsConnecting(false);
    dispatch(setWebSocketError('WebSocket connection error'));
  }, [dispatch]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    setIsConnecting(true);
    dispatch(setWebSocketError(null));

    try {
      const wsUrl = buildWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = handleOpen;
      wsRef.current.onmessage = handleMessage;
      wsRef.current.onclose = handleClose;
      wsRef.current.onerror = handleError;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
      dispatch(setWebSocketError('Failed to create WebSocket connection'));
    }
  }, [isConnecting, dispatch, buildWebSocketUrl, handleOpen, handleMessage, handleClose, handleError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnecting(false);
    dispatch(setWebSocketConnected(false));
    dispatch(setWebSocketReconnecting(false));
  }, [dispatch]);

  // Send message to WebSocket
  const sendMessage = useCallback((message: any) => {
    const messageStr = JSON.stringify(message);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(messageStr);
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(messageStr);
    }
  }, []);

  // Subscribe to specific OCL events
  const subscribe = useCallback((eventType: string, listener: (event: OCLWebSocketEvent) => void) => {
    if (!eventListenersRef.current.has(eventType)) {
      eventListenersRef.current.set(eventType, new Set());
    }
    eventListenersRef.current.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = eventListenersRef.current.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          eventListenersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Update connection when projectId changes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      disconnect();
      setTimeout(connect, 100);
    }
  }, [projectId, connect, disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    subscribe,
    isConnecting,
    lastHeartbeat,
    connectionState: wsRef.current?.readyState,
  };
};

// Hook for listening to specific OCL message events
export const useOCLMessageEvents = (
  listener: (event: OCLWebSocketEvent) => void,
  eventTypes: string[] = ['new_message', 'message_updated']
) => {
  const { subscribe } = useOCLWebSocket();

  useEffect(() => {
    const unsubscribeFunctions = eventTypes.map(eventType => 
      subscribe(eventType, listener)
    );

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe, listener, eventTypes]);
};

export default useOCLWebSocket;