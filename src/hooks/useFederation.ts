/**
 * Federation Hook
 * 
 * Custom hook for federation operations and state management
 */

import { useState, useCallback } from 'react';
import { 
  useGetPeersQuery,
  useDiscoverPeerMutation,
  useUpdatePeerStatusMutation,
  useRefreshPeerMutation,
  useGetDelegationsQuery,
  useDelegateTaskMutation,
  useGetTrustRelationshipsQuery,
  useUpdateTrustLevelMutation,
} from '../api/federation';
import { 
  TrustLevel,
  PeerStatus 
} from '../types/federation';
import type { 
  SubstratePeer, 
  DelegateTaskRequest
} from '../types/federation';

export interface UseFederationOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseFederationReturn {
  // Peer management
  peers: SubstratePeer[];
  peersLoading: boolean;
  peersError: any;
  addPeer: (peer: Omit<SubstratePeer, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  removePeer: (peerId: string) => Promise<void>;
  updatePeer: (peerId: string, updates: Partial<SubstratePeer>) => Promise<void>;
  discoverPeer: (url: string) => Promise<any>;
  
  // Task delegation
  delegations: any[];
  delegationsLoading: boolean;
  isDelegating: boolean;
  delegateTask: (request: DelegateTaskRequest) => Promise<void>;
  
  // Trust management
  trustRelationships: any[];
  trustLoading: boolean;
  updateTrustLevel: (fromPeerId: string, toPeerId: string, level: TrustLevel) => Promise<void>;
  
  // Dashboard-specific properties
  currentSubstrate?: any;
  metrics?: any;
  loading: boolean;
  error: any;
  refreshPeers: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  
  // Utility functions
  refresh: () => Promise<void>;
  getHealthyPeers: () => SubstratePeer[];
  getTrustedPeers: () => SubstratePeer[];
}

export const useFederation = (options: UseFederationOptions = {}): UseFederationReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDelegating, setIsDelegating] = useState(false);

  // API queries
  const { 
    data: peersResponse, 
    isLoading: peersLoading, 
    error: peersError,
    refetch: refetchPeers 
  } = useGetPeersQuery({}, {
    pollingInterval: autoRefresh ? refreshInterval : 0,
  });
  
  const peers = (peersResponse as any)?.items || peersResponse || [];

  const { 
    data: delegationsResponse, 
    isLoading: delegationsLoading,
    refetch: refetchDelegations 
  } = useGetDelegationsQuery({
    limit: 100,
    offset: 0,
  });
  
  const delegations = (delegationsResponse as any)?.items || delegationsResponse || [];

  const { 
    data: trustRelationships = [], 
    isLoading: trustLoading,
    refetch: refetchTrust 
  } = useGetTrustRelationshipsQuery({});

  // Mutations
  const [addPeerMutation] = useDiscoverPeerMutation();
  const [removePeerMutation] = useUpdatePeerStatusMutation();
  const [updatePeerMutation] = useRefreshPeerMutation();
  const [delegateTaskMutation] = useDelegateTaskMutation();
  const [updateTrustLevelMutation] = useUpdateTrustLevelMutation();

  // Actions
  const addPeer = useCallback(async (peer: Omit<SubstratePeer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await addPeerMutation({ peer_url: peer.url }).unwrap();
    } catch (error) {
      console.error('Failed to add peer:', error);
      throw error;
    }
  }, [addPeerMutation]);

  const removePeer = useCallback(async (peerId: string) => {
    try {
      await removePeerMutation({ peer_id: peerId, status: PeerStatus.OFFLINE }).unwrap();
    } catch (error) {
      console.error('Failed to remove peer:', error);
      throw error;
    }
  }, [removePeerMutation]);

  const updatePeer = useCallback(async (peerId: string, updates: Partial<SubstratePeer>) => {
    try {
      await updatePeerMutation(peerId).unwrap();
    } catch (error) {
      console.error('Failed to update peer:', error);
      throw error;
    }
  }, [updatePeerMutation]);

  const delegateTask = useCallback(async (request: DelegateTaskRequest) => {
    try {
      await delegateTaskMutation(request).unwrap();
    } catch (error) {
      console.error('Failed to delegate task:', error);
      throw error;
    }
  }, [delegateTaskMutation]);

  const updateTrustLevel = useCallback(async (fromPeerId: string, toPeerId: string, level: TrustLevel) => {
    try {
      await updateTrustLevelMutation({
        peer_id: toPeerId,
        trust_level: level,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update trust level:', error);
      throw error;
    }
  }, [updateTrustLevelMutation]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchPeers(),
        refetchDelegations(),
        refetchTrust(),
      ]);
    } catch (error) {
      console.error('Failed to refresh federation data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchPeers, refetchDelegations, refetchTrust]);

  // Utility functions
  const discoverPeer = useCallback(async (url: string) => {
    try {
      // Mock peer discovery - replace with actual implementation
      const response = await fetch(`${url}/api/federation/info`);
      if (!response.ok) throw new Error('Failed to discover peer');
      return await response.json();
    } catch (error) {
      console.error('Failed to discover peer:', error);
      throw error;
    }
  }, []);

  const getHealthyPeers = useCallback(() => {
    return peers.filter((peer: SubstratePeer) => peer.status === PeerStatus.HEALTHY);
  }, [peers]);

  const getTrustedPeers = useCallback(() => {
    return peers.filter((peer: SubstratePeer) => 
      peer.trust_level === TrustLevel.TRUSTED || 
      peer.trust_level === TrustLevel.FULL
    );
  }, [peers]);

  return {
    // Peer management
    peers,
    peersLoading: peersLoading || isRefreshing,
    peersError,
    addPeer,
    removePeer,
    updatePeer,
    discoverPeer,
    
    // Task delegation
    delegations,
    delegationsLoading,
    isDelegating,
    delegateTask,
    
    // Trust management
    trustRelationships,
    trustLoading,
    updateTrustLevel,
    
    // Dashboard-specific properties
    currentSubstrate: undefined,
    metrics: undefined,
    loading: peersLoading || delegationsLoading || trustLoading || isRefreshing,
    error: peersError,
    refreshPeers: async () => { await refetchPeers(); },
    refreshMetrics: async () => {}, // TODO: implement when metrics API is ready
    
    // Utility functions
    refresh,
    getHealthyPeers,
    getTrustedPeers,
  };
};