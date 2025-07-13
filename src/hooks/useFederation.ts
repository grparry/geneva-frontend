import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { federationApi } from '../api/federation';
import { 
  Substrate, 
  SubstratePeer, 
  FederationMetrics,
  TrustLevel,
  DelegationRequest,
  DelegationResponse
} from '../types/federation';
import { useFederationStore } from '../store/federationStore';

export const useFederation = () => {
  const queryClient = useQueryClient();

  // Fetch current substrate info
  const { data: currentSubstrate, isLoading: loadingSubstrate, error: substrateError } = useQuery({
    queryKey: ['currentSubstrate'],
    queryFn: federationApi.getCurrentSubstrate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Disable retry to see errors immediately
  });

  // Fetch federated peers
  const { 
    data: peers = [], 
    isLoading: loadingPeers,
    error: peersError,
    refetch: refreshPeers 
  } = useQuery({
    queryKey: ['federatedPeers'],
    queryFn: federationApi.getPeers,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  // Fetch metrics
  const { 
    data: metrics,
    isLoading: loadingMetrics,
    error: metricsError,
    refetch: refreshMetrics
  } = useQuery({
    queryKey: ['federationMetrics'],
    queryFn: federationApi.getMetrics,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: false,
  });

  // Add new peer mutation
  const addPeerMutation = useMutation({
    mutationFn: (data: { url: string; name: string; trust_level: TrustLevel; api_key?: string }) =>
      federationApi.addPeer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federatedPeers'] });
      queryClient.invalidateQueries({ queryKey: ['federationMetrics'] });
    },
  });

  // Remove peer mutation
  const removePeerMutation = useMutation({
    mutationFn: (peerId: string) => federationApi.removePeer(peerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federatedPeers'] });
      queryClient.invalidateQueries({ queryKey: ['federationMetrics'] });
    },
  });

  // Update trust level mutation
  const updateTrustMutation = useMutation({
    mutationFn: ({ peerId, trustLevel }: { peerId: string; trustLevel: TrustLevel }) =>
      federationApi.updateTrustLevel(peerId, trustLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federatedPeers'] });
    },
  });

  // Delegate task mutation
  const delegateTaskMutation = useMutation({
    mutationFn: (request: DelegationRequest) => federationApi.delegateTask(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federationMetrics'] });
    },
  });

  // Discover peer function
  const discoverPeer = async (url: string) => {
    return federationApi.discoverPeer(url);
  };

  // Test connection function
  const testConnection = async (peerId: string) => {
    return federationApi.testConnection(peerId);
  };

  // Note: We don't need to sync React Query data to Zustand store
  // as it creates circular dependencies. React Query manages its own cache.

  const loading = loadingSubstrate || loadingPeers || loadingMetrics;
  const error = substrateError || peersError || metricsError;

  return {
    // Data
    currentSubstrate,
    peers,
    metrics,
    loading,
    error,

    // Actions
    addPeer: addPeerMutation.mutate,
    removePeer: removePeerMutation.mutate,
    updateTrustLevel: updateTrustMutation.mutate,
    delegateTask: delegateTaskMutation.mutate,
    discoverPeer,
    testConnection,
    refreshPeers,
    refreshMetrics,

    // Mutation states
    isAddingPeer: addPeerMutation.isPending,
    isDelegating: delegateTaskMutation.isPending,
  };
};

// Hook for peer-specific operations
export const usePeerOperations = (peerId: string) => {
  const queryClient = useQueryClient();

  const { data: peerDetails } = useQuery({
    queryKey: ['peerDetails', peerId],
    queryFn: () => federationApi.getPeerDetails(peerId),
    enabled: !!peerId,
    staleTime: 60000, // 1 minute
  });

  const { data: peerCapabilities } = useQuery({
    queryKey: ['peerCapabilities', peerId],
    queryFn: () => federationApi.getPeerCapabilities(peerId),
    enabled: !!peerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refreshPeerData = () => {
    queryClient.invalidateQueries({ queryKey: ['peerDetails', peerId] });
    queryClient.invalidateQueries({ queryKey: ['peerCapabilities', peerId] });
  };

  return {
    peerDetails,
    peerCapabilities,
    refreshPeerData,
  };
};

// Hook for delegation history
export const useDelegationHistory = (limit = 50) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['delegationHistory', limit],
    queryFn: () => federationApi.getDelegationHistory(limit),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    history,
    isLoading,
  };
};