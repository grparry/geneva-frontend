import { useEffect, useRef, useCallback, useState } from 'react';

interface SimpleWebSocketConfig {
  url: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (data: any) => void;
  enabled?: boolean;
}

export const useWebSocketSimple = (config: SimpleWebSocketConfig) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const {
    url,
    onConnect,
    onDisconnect,
    onMessage,
    enabled = true
  } = config;

  const connect = useCallback(() => {
    // Don't connect if disabled or no URL
    if (!enabled || !url || url === '') {
      return;
    }

    // Don't reconnect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected to:', url);
        setIsConnected(true);
        onConnect?.();
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected from:', url);
        setIsConnected(false);
        onDisconnect?.();
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, onConnect, onDisconnect, onMessage, enabled]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  // Connect on mount if enabled
  useEffect(() => {
    if (enabled && url) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [enabled, url]); // Only reconnect if enabled or URL changes

  return {
    send,
    disconnect,
    reconnect: connect,
    isConnected
  };
};