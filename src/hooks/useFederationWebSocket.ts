/**
 * Federation WebSocket Hook
 * 
 * Extends existing Geneva WebSocket infrastructure for federation real-time events.
 * Provides type-safe federation event handling with automatic reconnection.
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { federationApi } from '../api/federation';
import { 
  FederationEvent, 
  SubstratePeer, 
  Delegation, 
  TrustRelationship,
  FederationMetrics 
} from '../types/federation';

// Import Geneva's existing WebSocket infrastructure
import { useWebSocketSimple } from './useWebSocketSimple';

interface FederationWebSocketOptions {
  subscriptions?: ('peers' | 'delegations' | 'trust' | 'events' | 'metrics')[];
  autoReconnect?: boolean;
  onPeerStatusChange?: (peer: SubstratePeer) => void;
  onDelegationUpdate?: (delegation: Delegation) => void;
  onTrustChange?: (trustEvent: TrustRelationship) => void;
  onMetricsUpdate?: (metrics: FederationMetrics) => void;
  onError?: (error: string) => void;
}

export const useFederationWebSocket = (options?: FederationWebSocketOptions) => {
  const dispatch = useDispatch();
  const subscriptions = options?.subscriptions ?? ['peers', 'delegations', 'events'];
  
  // Create WebSocket subscriptions
  const websocketSubscriptions = useMemo(() => 
    subscriptions.map(sub => `federation.${sub}`), 
    [subscriptions]
  );
  
  // Use Geneva's WebSocket infrastructure for federation events
  const { 
    isConnected,
    error,
    sendMessage 
  } = useWebSocketSimple('/api/federation/events/stream', {
    onMessage: (event) => {
      try {
        const federationEvent = JSON.parse(event.data);
        handleFederationEvent(federationEvent);
      } catch (e) {
        console.error('Failed to parse federation event:', e);
      }
    },
    onError: (error) => {
      console.error('Federation WebSocket error:', error);
      options?.onError?.(error.toString());
    },
    reconnectInterval: 5000,
    reconnectAttempts: 5,
  });
  
  // Handle federation events with proper typing
  const handleFederationEvent = useCallback((event: FederationEvent) => {
    console.log('Federation event received:', event.type, event.data);
    
    try {
      switch (event.type) {
        case 'federation.peer.discovered':
        case 'federation.peer.status_changed':
        case 'federation.peer.disconnected':
          // Invalidate peers cache for real-time updates
          dispatch(federationApi.util.invalidateTags(['Peers']));
          
          // Call custom handler if provided
          if (options?.onPeerStatusChange && event.data.peer) {
            options.onPeerStatusChange(event.data.peer);
          }
          break;
          
        case 'federation.delegation.created':
        case 'federation.delegation.accepted':
        case 'federation.delegation.completed':
        case 'federation.delegation.failed':
          // Invalidate delegations cache
          dispatch(federationApi.util.invalidateTags(['Delegations']));
          
          // Also update metrics since delegation state changed
          dispatch(federationApi.util.invalidateTags(['Metrics']));
          
          // Call custom handler if provided
          if (options?.onDelegationUpdate && event.data.delegation) {
            options.onDelegationUpdate(event.data.delegation);
          }
          break;
          
        case 'federation.trust.established':
        case 'federation.trust.upgraded':
        case 'federation.trust.revoked':
          // Invalidate trust and peer caches
          dispatch(federationApi.util.invalidateTags(['Trust', 'Peers']));
          
          // Call custom handler if provided
          if (options?.onTrustChange && event.data.relationship) {
            options.onTrustChange(event.data.relationship);
          }
          break;
          
        case 'federation.metrics.updated':
          // Invalidate metrics cache
          dispatch(federationApi.util.invalidateTags(['Metrics']));
          
          // Call custom handler if provided
          if (options?.onMetricsUpdate && event.data.metrics) {
            options.onMetricsUpdate(event.data.metrics);
          }
          break;
          
        case 'federation.alert.critical':
          // Handle critical alerts
          console.warn('Federation critical alert:', event.data);
          
          // You might want to show a notification here
          // dispatch(showNotification({ type: 'error', message: event.data.message }));
          break;
          
        default:
          console.log('Unknown federation event type:', event.type);
      }
    } catch (error) {
      console.error('Error handling federation event:', error);
      options?.onError?.(`Error handling federation event: ${error}`);
    }
  }, [dispatch, options]);
  
  // Subscribe to events when connected
  useEffect(() => {
    if (isConnected && websocketSubscriptions.length > 0 && sendMessage) {
      // Send subscription message
      sendMessage(JSON.stringify({
        action: 'subscribe',
        subscriptions: websocketSubscriptions
      }));
    }
  }, [isConnected, websocketSubscriptions, sendMessage]);
  
  // Handle connection errors
  useEffect(() => {
    if (error) {
      console.error('Federation WebSocket error:', error);
      options?.onError?.(error.toString());
    }
  }, [error, options]);
  
  // Provide optimized subscription management
  const optimizeSubscriptions = useCallback((activeTab: string) => {
    // Optimize subscriptions based on active tab
    const optimizedSubs = ['events']; // Always listen to events
    
    switch (activeTab) {
      case 'peers':
        optimizedSubs.push('peers');
        break;
      case 'delegations':
        optimizedSubs.push('delegations', 'peers'); // Need peers for delegation targets
        break;
      case 'trust':
        optimizedSubs.push('trust', 'peers');
        break;
      case 'metrics':
        optimizedSubs.push('metrics');
        break;
      default:
        // For dashboard overview, subscribe to all
        optimizedSubs.push('peers', 'delegations', 'trust', 'metrics');
    }
    
    return optimizedSubs;
  }, []);
  
  // Manual refresh capabilities
  const refreshPeerData = useCallback(() => {
    dispatch(federationApi.util.invalidateTags(['Peers']));
  }, [dispatch]);
  
  const refreshDelegationData = useCallback(() => {
    dispatch(federationApi.util.invalidateTags(['Delegations']));
  }, [dispatch]);
  
  const refreshTrustData = useCallback(() => {
    dispatch(federationApi.util.invalidateTags(['Trust']));
  }, [dispatch]);
  
  const refreshMetrics = useCallback(() => {
    dispatch(federationApi.util.invalidateTags(['Metrics', 'Health']));
  }, [dispatch]);
  
  const refreshAll = useCallback(() => {
    dispatch(federationApi.util.invalidateTags(['Peers', 'Delegations', 'Trust', 'Metrics', 'Health']));
  }, [dispatch]);
  
  return {
    // Connection status
    isConnected,
    error,
    
    // Event handler
    handleEvent: handleFederationEvent,
    
    // Utility functions
    optimizeSubscriptions,
    
    // Manual refresh functions
    refreshPeerData,
    refreshDelegationData,
    refreshTrustData,
    refreshMetrics,
    refreshAll,
  };
};

// Specialized hooks for specific use cases
export const usePeerStatusWebSocket = (onPeerChange?: (peer: SubstratePeer) => void) => {
  return useFederationWebSocket({
    subscriptions: ['peers'],
    onPeerStatusChange: onPeerChange,
  });
};

export const useDelegationWebSocket = (onDelegationUpdate?: (delegation: Delegation) => void) => {
  return useFederationWebSocket({
    subscriptions: ['delegations', 'peers'],
    onDelegationUpdate,
  });
};

export const useTrustWebSocket = (onTrustChange?: (trust: TrustRelationship) => void) => {
  return useFederationWebSocket({
    subscriptions: ['trust', 'peers'],
    onTrustChange,
  });
};

export const useMetricsWebSocket = (onMetricsUpdate?: (metrics: FederationMetrics) => void) => {
  return useFederationWebSocket({
    subscriptions: ['metrics'],
    onMetricsUpdate,
  });
};

// Export connection status types for components
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export default useFederationWebSocket;