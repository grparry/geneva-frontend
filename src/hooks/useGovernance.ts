/**
 * Governance React Hooks
 * 
 * React hooks for managing governance state without Zustand.
 * Provides direct state management, WebSocket integration, and real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { governanceService, GovernanceWebSocketUtils } from '../services/governanceService';
import {
  RoomGovernanceState,
  TrinityQueueStatus,
  GovernanceSystemSummary,
  GovernanceWebSocketEvent,
  GovernanceNotification,
  UseGovernanceStateReturn,
  UseTrinityQueueReturn,
  UseGovernanceSummaryReturn
} from '../types/governance';

/**
 * Hook for managing room governance state with real-time updates
 */
export const useGovernanceState = (roomId: string | null): UseGovernanceStateReturn => {
  const [governance, setGovernance] = useState<RoomGovernanceState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGovernance = useCallback(async () => {
    if (!roomId) {
      setGovernance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const governanceState = await governanceService.getRoomGovernanceState(roomId);
      console.log('🏛️ Governance data received:', governanceState);
      setGovernance(governanceState);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch governance state';
      setError(errorMessage);
      console.error('Failed to fetch governance state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Initial fetch
  useEffect(() => {
    fetchGovernance();
  }, [fetchGovernance]);

  return {
    governance,
    isLoading,
    error,
    refreshGovernance: fetchGovernance
  };
};

/**
 * Hook for managing Trinity queue status with real-time updates
 */
export const useTrinityQueue = (roomId: string | null): UseTrinityQueueReturn => {
  const [queueStatus, setQueueStatus] = useState<TrinityQueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!roomId) {
      setQueueStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const status = await governanceService.getTrinityQueueStatus(roomId);
      setQueueStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Trinity queue status';
      setError(errorMessage);
      console.error('Failed to fetch Trinity queue status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Initial fetch
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return {
    queueStatus,
    isLoading,
    error,
    refreshQueue: fetchQueue
  };
};

/**
 * Hook for system-wide governance summary
 */
export const useGovernanceSummary = (): UseGovernanceSummaryReturn => {
  const [summary, setSummary] = useState<GovernanceSystemSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const systemSummary = await governanceService.getGovernanceSystemSummary();
      setSummary(systemSummary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch governance summary';
      setError(errorMessage);
      console.error('Failed to fetch governance summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary: fetchSummary
  };
};

/**
 * Hook for governance WebSocket events and real-time updates
 */
export const useGovernanceWebSocket = (roomId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<GovernanceWebSocketEvent[]>([]);
  const [notifications, setNotifications] = useState<GovernanceNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const eventsRef = useRef<GovernanceWebSocketEvent[]>([]);
  const notificationsRef = useRef<GovernanceNotification[]>([]);

  // Event handlers
  const onGovernanceEvent = useCallback((event: GovernanceWebSocketEvent) => {
    // Update events list
    eventsRef.current = [...eventsRef.current.slice(-49), event]; // Keep last 50 events
    setEvents([...eventsRef.current]);

    // Create notification if applicable
    const notification = GovernanceWebSocketUtils.createNotificationFromEvent(event);
    if (notification) {
      notificationsRef.current = [...notificationsRef.current.slice(-9), notification]; // Keep last 10 notifications
      setNotifications([...notificationsRef.current]);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const wsUrl = governanceService.getGovernanceWebSocketUrl(roomId);
      console.log('Connecting to governance WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Governance WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onclose = () => {
        console.log('Governance WebSocket disconnected');
        setIsConnected(false);
      };

      wsRef.current.onerror = (errorEvent) => {
        console.error('Governance WebSocket error:', errorEvent);
        setError('WebSocket connection error');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Check if this is a governance event
          if (GovernanceWebSocketUtils.isGovernanceEvent(data)) {
            const governanceEvent = GovernanceWebSocketUtils.parseEvent(data);
            if (governanceEvent) {
              onGovernanceEvent(governanceEvent);
            }
          }
        } catch (error) {
          console.error('Failed to parse governance WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Failed to create governance WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [roomId, onGovernanceEvent]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Auto-connect/disconnect
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const clearNotifications = useCallback(() => {
    notificationsRef.current = [];
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    notificationsRef.current = notificationsRef.current.filter(n => n.id !== notificationId);
    setNotifications([...notificationsRef.current]);
  }, []);

  return {
    isConnected,
    events,
    notifications,
    error,
    connect,
    disconnect,
    clearNotifications,
    removeNotification
  };
};

/**
 * Combined hook for complete governance state management
 */
export const useRoomGovernance = (roomId: string | null) => {
  const governanceState = useGovernanceState(roomId);
  const trinityQueue = useTrinityQueue(roomId);
  const webSocket = useGovernanceWebSocket(roomId || undefined);

  // Update governance state when WebSocket events arrive
  useEffect(() => {
    const latestEvent = webSocket.events[webSocket.events.length - 1];
    if (latestEvent?.type === 'room_state_change' && latestEvent.room_id === roomId) {
      // Refresh governance state after state change
      governanceState.refreshGovernance();
    }
    if (latestEvent?.type === 'trinity_queue_update' && latestEvent.room_id === roomId) {
      // Refresh queue status after queue update
      trinityQueue.refreshQueue();
    }
  }, [webSocket.events, roomId, governanceState.refreshGovernance, trinityQueue.refreshQueue]);

  return {
    ...governanceState,
    trinityQueue: trinityQueue.queueStatus,
    trinityQueueError: trinityQueue.error,
    trinityQueueLoading: trinityQueue.isLoading,
    webSocket,
    refreshAll: useCallback(async () => {
      await Promise.all([
        governanceState.refreshGovernance(),
        trinityQueue.refreshQueue()
      ]);
    }, [governanceState.refreshGovernance, trinityQueue.refreshQueue])
  };
};

/**
 * Hook for governance notifications management
 */
export const useGovernanceNotifications = () => {
  const [notifications, setNotifications] = useState<GovernanceNotification[]>([]);

  const addNotification = useCallback((notification: Omit<GovernanceNotification, 'id' | 'timestamp'>) => {
    const newNotification: GovernanceNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev.slice(-9), newNotification]); // Keep last 10
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};