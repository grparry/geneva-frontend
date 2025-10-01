/**
 * 5D Memory WebSocket Service
 * Real-time event handling for Geneva's 5D Memory Architecture
 *
 * Connects to: ws://localhost:8400/api/memory/ws/events
 * Events: 11 types from backend websocket_memory_5d.py
 * Auth: Uses geneva-sdk-token for development authentication
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { memory5dApi } from './api';

export interface Memory5DEventFilters {
  cognitive_types?: string[];
  temporal_tiers?: string[];
  event_types?: string[];
}

export interface Memory5DWebSocketMessage {
  event: Memory5DEventType;
  data: any;
  timestamp?: string;
}

export type Memory5DEventType =
  | 'memory_created'
  | 'memory_updated'
  | 'memory_deleted'
  | 'memory_batch_operation'
  | 'trinity_processing_started'
  | 'trinity_processing_complete'
  | 'trinity_processing_failed'
  | 'consolidation_triggered'
  | 'consolidation_complete'
  | 'working_memory_capacity_alert'
  | 'constraint_violation';

export interface Memory5DWebSocketConfig {
  projectId: string;
  filters?: Memory5DEventFilters;
  onEvent?: (event: Memory5DWebSocketMessage) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

/**
 * React Hook for 5D Memory WebSocket Connection
 * Manages connection lifecycle and event handling
 */
export function useMemory5DWebSocket(config: Memory5DWebSocketConfig) {
  const dispatch = useDispatch();
  const wsRef = useRef<WebSocket | null>(null);

  const onEventRef = useRef(config.onEvent);
  const onErrorRef = useRef(config.onError);
  const onConnectionChangeRef = useRef(config.onConnectionChange);

  useEffect(() => {
    onEventRef.current = config.onEvent;
    onErrorRef.current = config.onError;
    onConnectionChangeRef.current = config.onConnectionChange;
  }, [config.onEvent, config.onError, config.onConnectionChange]);

  const projectIdRef = useRef(config.projectId);
  const filtersRef = useRef(config.filters);

  useEffect(() => {
    projectIdRef.current = config.projectId;
    filtersRef.current = config.filters;
  }, [config.projectId, config.filters]);

  const buildWebSocketURL = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '8400'; // Geneva backend port

    let url = `${protocol}//${host}:${port}/api/memory/ws/events?project_id=${projectIdRef.current}&token=geneva-sdk-token`;

    if (filtersRef.current) {
      const filterParams = new URLSearchParams();
      if (filtersRef.current.cognitive_types?.length) {
        filterParams.append('cognitive_types', filtersRef.current.cognitive_types.join(','));
      }
      if (filtersRef.current.temporal_tiers?.length) {
        filterParams.append('temporal_tiers', filtersRef.current.temporal_tiers.join(','));
      }
      if (filtersRef.current.event_types?.length) {
        filterParams.append('event_types', filtersRef.current.event_types.join(','));
      }

      if (filterParams.toString()) {
        url += `&${filterParams.toString()}`;
      }
    }

    return url;
  }, []);

  const handleEvent = useCallback((message: Memory5DWebSocketMessage) => {
    console.log('📥 5D Memory Event:', message.event, message.data);

    onEventRef.current?.(message);

    switch (message.event) {
      case 'memory_created':
      case 'memory_updated':
      case 'memory_deleted':
      case 'memory_batch_operation':
        dispatch(memory5dApi.util.invalidateTags([
          'Memory5D',
          'DimensionalStats',
          'SearchResults'
        ]));
        break;

      case 'trinity_processing_started':
        if (message.data?.memory_id) {
          dispatch(memory5dApi.util.invalidateTags([
            { type: 'Memory5D', id: message.data.memory_id },
            'TrinityStatus'
          ]));
        }
        break;

      case 'trinity_processing_complete':
      case 'trinity_processing_failed':
        if (message.data?.memory_id) {
          dispatch(memory5dApi.util.invalidateTags([
            { type: 'Memory5D', id: message.data.memory_id },
            'TrinityStatus',
            'DimensionalStats'
          ]));
        }
        break;

      case 'consolidation_triggered':
      case 'consolidation_complete':
        dispatch(memory5dApi.util.invalidateTags([
          'Memory5D',
          'DimensionalStats',
          'HealthStatus'
        ]));
        break;

      case 'working_memory_capacity_alert':
        console.warn(
          `⚠️ Working Memory Capacity Alert: ${message.data?.current_count || '?'} items (Miller's Law: 7±2)`
        );
        dispatch(memory5dApi.util.invalidateTags(['HealthStatus']));
        break;

      case 'constraint_violation':
        console.error('❌ 5D Constraint Violation:', message.data);
        dispatch(memory5dApi.util.invalidateTags(['HealthStatus']));
        break;

      default:
        console.warn('Unknown 5D memory event type:', message.event);
    }
    // dispatch is stable from Redux, no need to include in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const url = buildWebSocketURL();
      console.log('🔌 Connecting to 5D Memory WebSocket:', url);

      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✅ 5D Memory WebSocket connected');
        onConnectionChangeRef.current?.(true);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message: Memory5DWebSocketMessage = JSON.parse(event.data);
          handleEvent(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ 5D Memory WebSocket error:', error);
        onErrorRef.current?.(new Error('WebSocket connection error'));
      };

      ws.onclose = (event) => {
        console.log('🔌 5D Memory WebSocket disconnected:', event.code, event.reason);
        wsRef.current = null;
        onConnectionChangeRef.current?.(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      onErrorRef.current?.(error as Error);
    }
  }, [buildWebSocketURL, handleEvent]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    onConnectionChangeRef.current?.(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    connect,
    disconnect,
  };
}

/**
 * Standalone WebSocket Manager (for non-React usage)
 */
export class Memory5DWebSocketManager {
  private ws: WebSocket | null = null;
  private config: Memory5DWebSocketConfig;
  private eventHandlers: Map<Memory5DEventType, Set<(data: any) => void>> = new Map();

  constructor(config: Memory5DWebSocketConfig) {
    this.config = config;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '8400';

    let url = `${protocol}//${host}:${port}/api/memory/ws/events?project_id=${this.config.projectId}&token=geneva-sdk-token`;

    if (this.config.filters) {
      const filterParams = new URLSearchParams();
      if (this.config.filters.cognitive_types?.length) {
        filterParams.append('cognitive_types', this.config.filters.cognitive_types.join(','));
      }
      if (this.config.filters.temporal_tiers?.length) {
        filterParams.append('temporal_tiers', this.config.filters.temporal_tiers.join(','));
      }
      if (this.config.filters.event_types?.length) {
        filterParams.append('event_types', this.config.filters.event_types.join(','));
      }

      if (filterParams.toString()) {
        url += `&${filterParams.toString()}`;
      }
    }

    this.ws = new WebSocket(url);

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: Memory5DWebSocketMessage = JSON.parse(event.data);
        this.handleEvent(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.config.onError?.(new Error('WebSocket error'));
    };

    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(eventType: Memory5DEventType, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  off(eventType: Memory5DEventType, handler: (data: any) => void): void {
    this.eventHandlers.get(eventType)?.delete(handler);
  }

  private handleEvent(message: Memory5DWebSocketMessage): void {
    this.config.onEvent?.(message);

    const handlers = this.eventHandlers.get(message.event);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }
}