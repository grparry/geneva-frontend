import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketService, WebSocketMessage } from '../services/websocket';

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
  autoConnect?: boolean;
}

export function useWebSocket(
  webSocketService: WebSocketService,
  options: UseWebSocketOptions = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    webSocketService.send(message);
  }, [webSocketService]);

  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      setLastMessage(message);
      optionsRef.current.onMessage?.(message);
    };

    const handleConnected = () => {
      setIsConnected(true);
      optionsRef.current.onConnected?.();
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      optionsRef.current.onDisconnected?.();
    };

    const handleError = (error: any) => {
      optionsRef.current.onError?.(error);
    };

    // Add event listeners
    webSocketService.on('message', handleMessage);
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('error', handleError);

    // Auto-connect if enabled
    if (options.autoConnect !== false) {
      webSocketService.connect();
    }

    // Cleanup
    return () => {
      webSocketService.off('message', handleMessage);
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('error', handleError);
    };
  }, [webSocketService, options.autoConnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect(),
  };
}

// Hook for subscribing to specific message types
export function useWebSocketSubscription<T = any>(
  webSocketService: WebSocketService,
  messageType: string,
  handler: (payload: T) => void
) {
  useEffect(() => {
    const handleTypedMessage = (payload: T) => {
      handler(payload);
    };

    webSocketService.on(messageType, handleTypedMessage);

    return () => {
      webSocketService.off(messageType, handleTypedMessage);
    };
  }, [webSocketService, messageType, handler]);
}