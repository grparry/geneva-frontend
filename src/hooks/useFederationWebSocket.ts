import { useEffect, useRef, useState, useCallback } from 'react';

interface FederationWebSocketOptions {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export const useFederationWebSocket = (
  url: string,
  options: FederationWebSocketOptions = {}
) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [error, setError] = useState<Event | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const {
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnectInterval = 5000,
    reconnectAttempts = 5,
  } = options;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // Create WebSocket URL
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}${url}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = (event) => {
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        wsRef.current = null;
        onClose?.(event);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setConnectionStatus('error');
        setError(event);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        setLastMessage(event.data);
        onMessage?.(event);
      };

    } catch (err) {
      setConnectionStatus('error');
      setError(err as Event);
    }
  }, [url, onOpen, onClose, onError, onMessage, reconnectInterval, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: string | object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  // Auto-connect on mount and cleanup on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect,
    isConnected: connectionStatus === 'connected',
  };
};

// Hook for subscribing to specific federation event types
export const useFederationEvents = (
  eventTypes?: string[],
  onEvent?: (event: any) => void
) => {
  const [events, setEvents] = useState<any[]>([]);
  
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Filter by event types if specified
      if (!eventTypes || eventTypes.includes(data.type)) {
        setEvents(prev => [...prev, data].slice(-100)); // Keep last 100 events
        onEvent?.(data);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }, [eventTypes, onEvent]);

  const { connectionStatus, error, sendMessage } = useFederationWebSocket(
    '/api/federation/events/stream',
    {
      onMessage: handleMessage,
    }
  );

  const subscribe = useCallback((types: string[]) => {
    return sendMessage({
      action: 'subscribe',
      eventTypes: types,
    });
  }, [sendMessage]);

  const unsubscribe = useCallback((types: string[]) => {
    return sendMessage({
      action: 'unsubscribe',
      eventTypes: types,
    });
  }, [sendMessage]);

  // Subscribe to event types on mount/change
  useEffect(() => {
    if (connectionStatus === 'connected' && eventTypes?.length) {
      subscribe(eventTypes);
    }
  }, [connectionStatus, eventTypes, subscribe]);

  return {
    events,
    connectionStatus,
    error,
    subscribe,
    unsubscribe,
  };
};