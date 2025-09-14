import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WebSocketService, WebSocketMessage } from '../services/websocket';
import { ACORNWebSocketMessage } from '../types/acorn-messages';

export interface ACORNWebSocketConfig {
  url: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onReconnectFailed?: () => void;
}

export interface ACORNWebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError: string | null;
}

export const useACORNWebSocket = (config: ACORNWebSocketConfig) => {
  const {
    url,
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
    onConnect,
    onDisconnect,
    onMessage,
    onError,
    onReconnectFailed
  } = config;

  // State management
  const [state, setState] = useState<ACORNWebSocketState>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null
  });

  // Store callbacks in refs to avoid recreation on every render
  const callbacksRef = useRef({
    onConnect,
    onDisconnect,
    onMessage,
    onError,
    onReconnectFailed
  });

  // Update callback refs when they change
  useEffect(() => {
    callbacksRef.current = {
      onConnect,
      onDisconnect,
      onMessage,
      onError,
      onReconnectFailed
    };
  }, [onConnect, onDisconnect, onMessage, onError, onReconnectFailed]);

  // Create WebSocketService instance with memoization
  const webSocketService = useMemo(() => {
    if (!enabled || !url) {
      return null;
    }

    console.log('🔄 Creating new WebSocketService for ACORN chat:', { url, enabled });

    return new WebSocketService({
      url,
      reconnectInterval,
      maxReconnectAttempts,
      heartbeatInterval
    });
  }, [url, enabled, reconnectInterval, maxReconnectAttempts, heartbeatInterval]);

  // Event handlers
  const handleConnected = useCallback(() => {
    console.log('✅ ACORN WebSocket connected');
    setState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      reconnectAttempts: 0,
      lastError: null
    }));
    callbacksRef.current.onConnect?.();
  }, []);

  const handleDisconnected = useCallback(() => {
    console.log('❌ ACORN WebSocket disconnected');
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false
    }));
    callbacksRef.current.onDisconnect?.();
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Transform WebSocketService message format to ACORN format
    let acornMessage: any;
    
    try {
      // Check if message is valid
      if (!message || typeof message !== 'object') {
        console.warn('Received invalid message in ACORN WebSocket:', message);
        return;
      }
      
      // Log message types to understand what Geneva is sending
      if (!message.payload && message.type && message.content) {
        const preview = message.content.length > 50 
          ? message.content.substring(0, 50) + '...' 
          : message.content;
        console.log(`📨 Received ${message.type} message (flat format):`, preview);
      }
      
      // Handle both wrapped and flat message formats from Geneva
      if (message.payload) {
        // If payload exists, use it (wrapped format)
        if (typeof message.payload === 'object') {
          acornMessage = message.payload;
        } else {
          // If payload is string, try to parse it
          acornMessage = typeof message.payload === 'string' 
            ? JSON.parse(message.payload) 
            : message.payload;
        }
      } else if (message.type && message.content) {
        // Geneva sends flat format: {type, content, user_id, ...}
        // Use the entire message as the payload
        acornMessage = message;
      } else {
        // No valid message structure
        acornMessage = null;
      }
      
      // Check if acornMessage is valid after parsing
      if (!acornMessage || typeof acornMessage !== 'object') {
        // Don't warn for pong messages or other system messages without payloads
        if (message.type !== 'pong' && message.type !== 'system') {
          console.warn('Invalid ACORN message payload:', message.payload);
        }
        return;
      }
      
      // Ensure we have the required fields
      if (!acornMessage.type) {
        acornMessage.type = message.type;
      }
      if (!acornMessage.timestamp) {
        acornMessage.timestamp = message.timestamp;
      }
      
      callbacksRef.current.onMessage?.(acornMessage);
    } catch (error) {
      console.error('Failed to process ACORN WebSocket message:', error, message);
      callbacksRef.current.onError?.(error);
    }
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('🚫 ACORN WebSocket error:', error);
    setState(prev => ({
      ...prev,
      lastError: error?.message || 'WebSocket error',
      isConnecting: false
    }));
    callbacksRef.current.onError?.(error);
  }, []);

  const handleReconnectFailed = useCallback(() => {
    console.error('💥 ACORN WebSocket reconnection failed after max attempts');
    setState(prev => ({
      ...prev,
      isConnecting: false,
      lastError: `Failed to reconnect after ${maxReconnectAttempts} attempts`
    }));
    callbacksRef.current.onReconnectFailed?.();
  }, [maxReconnectAttempts]);

  // Set up event listeners
  useEffect(() => {
    if (!webSocketService) {
      return;
    }

    // Add event listeners
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('message', handleMessage);
    webSocketService.on('error', handleError);
    webSocketService.on('reconnectFailed', handleReconnectFailed);

    // Auto-connect if enabled
    if (enabled) {
      setState(prev => ({ ...prev, isConnecting: true }));
      webSocketService.connect();
    }

    // Cleanup on unmount or service change
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('message', handleMessage);
      webSocketService.off('error', handleError);
      webSocketService.off('reconnectFailed', handleReconnectFailed);
      webSocketService.disconnect();
    };
  }, [webSocketService, enabled, handleConnected, handleDisconnected, handleMessage, handleError, handleReconnectFailed]);

  // Send message function
  const send = useCallback((data: any) => {
    if (!webSocketService || !state.isConnected) {
      console.warn('🚫 Cannot send ACORN message: WebSocket not connected', {
        hasService: !!webSocketService,
        isConnected: state.isConnected
      });
      return false;
    }

    try {
      // For chat messages and ping/pong, send directly without wrapping to match Geneva's expectations
      // Geneva expects: { type: "message", content: "...", ... }
      // Not: { type: "message", payload: { type: "message", content: "..." }, timestamp: "..." }
      if (data.type === 'message' || data.type === 'ping' || data.type === 'pong') {
        // Send these messages directly to Geneva without wrapping
        webSocketService.send(data);
      } else {
        // For other message types, keep the wrapper format
        const message: WebSocketMessage = {
          type: data.type || 'chat_message',
          payload: data,
          timestamp: new Date().toISOString()
        };
        webSocketService.send(message);
      }
      return true;
    } catch (error) {
      console.error('Failed to send ACORN WebSocket message:', error);
      callbacksRef.current.onError?.(error);
      return false;
    }
  }, [webSocketService, state.isConnected]);

  // Manual control functions
  const connect = useCallback(() => {
    if (webSocketService && !state.isConnected) {
      setState(prev => ({ ...prev, isConnecting: true, lastError: null }));
      webSocketService.connect();
    }
  }, [webSocketService, state.isConnected]);

  const disconnect = useCallback(() => {
    if (webSocketService) {
      webSocketService.disconnect();
    }
  }, [webSocketService]);

  // Get connection info
  const getConnectionInfo = useCallback(() => {
    if (!webSocketService) {
      return { readyState: WebSocket.CLOSED, url: '' };
    }
    
    return {
      readyState: webSocketService.getReadyState(),
      url: url,
      reconnectAttempts: state.reconnectAttempts,
      maxReconnectAttempts,
      lastError: state.lastError
    };
  }, [webSocketService, url, state.reconnectAttempts, state.lastError, maxReconnectAttempts]);

  return {
    // Connection state
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    reconnectAttempts: state.reconnectAttempts,
    lastError: state.lastError,
    
    // Actions
    send,
    sendMessage: send, // Alias for compatibility
    connect,
    disconnect,
    reconnect: connect, // Alias for compatibility
    
    // Info
    getConnectionInfo,
    
    // Legacy compatibility
    error: state.lastError
  };
};