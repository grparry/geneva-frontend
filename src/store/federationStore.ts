/**
 * Federation store using Zustand for state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Federation types
export interface Peer {
  id: string;
  name: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSeen: Date;
  trustLevel: number;
  capabilities: string[];
}

export interface DelegationTask {
  id: string;
  type: string;
  status: 'pending' | 'delegated' | 'completed' | 'failed';
  assignedTo?: string;
  createdAt: Date;
  completedAt?: Date;
  result?: any;
}

export interface FederationMetrics {
  totalPeers: number;
  activePeers: number;
  totalDelegations: number;
  successfulDelegations: number;
  averageResponseTime: number;
  networkHealth: number;
}

interface FederationState {
  // Peers
  peers: Peer[];
  activePeer: Peer | null;
  
  // Delegations
  delegationQueue: DelegationTask[];
  delegationHistory: DelegationTask[];
  
  // Metrics
  metrics: FederationMetrics;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Actions
  setPeers: (peers: Peer[]) => void;
  addPeer: (peer: Peer) => void;
  removePeer: (peerId: string) => void;
  updatePeer: (peerId: string, updates: Partial<Peer>) => void;
  setActivePeer: (peer: Peer | null) => void;
  
  addDelegationTask: (task: DelegationTask) => void;
  updateDelegationTask: (taskId: string, updates: Partial<DelegationTask>) => void;
  moveDelegationToHistory: (taskId: string) => void;
  
  updateMetrics: (metrics: Partial<FederationMetrics>) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async actions
  fetchPeers: () => Promise<void>;
  fetchDelegationQueue: () => Promise<void>;
  fetchMetrics: () => Promise<void>;
}

const initialMetrics: FederationMetrics = {
  totalPeers: 0,
  activePeers: 0,
  totalDelegations: 0,
  successfulDelegations: 0,
  averageResponseTime: 0,
  networkHealth: 0,
};

export const useFederationStore = create<FederationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      peers: [],
      activePeer: null,
      delegationQueue: [],
      delegationHistory: [],
      metrics: initialMetrics,
      loading: false,
      error: null,
      
      // Peer actions
      setPeers: (peers) => set({ peers }),
      
      addPeer: (peer) => set((state) => ({
        peers: [...state.peers, peer],
      })),
      
      removePeer: (peerId) => set((state) => ({
        peers: state.peers.filter(p => p.id !== peerId),
        activePeer: state.activePeer?.id === peerId ? null : state.activePeer,
      })),
      
      updatePeer: (peerId, updates) => set((state) => ({
        peers: state.peers.map(p => p.id === peerId ? { ...p, ...updates } : p),
        activePeer: state.activePeer?.id === peerId 
          ? { ...state.activePeer, ...updates }
          : state.activePeer,
      })),
      
      setActivePeer: (peer) => set({ activePeer: peer }),
      
      // Delegation actions
      addDelegationTask: (task) => set((state) => ({
        delegationQueue: [...state.delegationQueue, task],
      })),
      
      updateDelegationTask: (taskId, updates) => set((state) => ({
        delegationQueue: state.delegationQueue.map(t => 
          t.id === taskId ? { ...t, ...updates } : t
        ),
      })),
      
      moveDelegationToHistory: (taskId) => set((state) => {
        const task = state.delegationQueue.find(t => t.id === taskId);
        if (!task) return state;
        
        return {
          delegationQueue: state.delegationQueue.filter(t => t.id !== taskId),
          delegationHistory: [task, ...state.delegationHistory],
        };
      }),
      
      // Metrics actions
      updateMetrics: (metrics) => set((state) => ({
        metrics: { ...state.metrics, ...metrics },
      })),
      
      // UI actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      // Async actions
      fetchPeers: async () => {
        const state = get();
        state.setLoading(true);
        state.setError(null);
        
        try {
          // Mock API call
          const response = await fetch('/api/federation/peers');
          if (!response.ok) throw new Error('Failed to fetch peers');
          
          const peers = await response.json();
          state.setPeers(peers);
        } catch (error) {
          state.setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
          state.setLoading(false);
        }
      },
      
      fetchDelegationQueue: async () => {
        const state = get();
        state.setLoading(true);
        state.setError(null);
        
        try {
          // Mock API call
          const response = await fetch('/api/federation/delegations');
          if (!response.ok) throw new Error('Failed to fetch delegations');
          
          const delegations = await response.json();
          set({ delegationQueue: delegations });
        } catch (error) {
          state.setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
          state.setLoading(false);
        }
      },
      
      fetchMetrics: async () => {
        const state = get();
        state.setLoading(true);
        state.setError(null);
        
        try {
          // Mock API call
          const response = await fetch('/api/federation/metrics');
          if (!response.ok) throw new Error('Failed to fetch metrics');
          
          const metrics = await response.json();
          state.updateMetrics(metrics);
        } catch (error) {
          state.setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
          state.setLoading(false);
        }
      },
    }),
    {
      name: 'federation-store',
    }
  )
);

// Selectors
export const selectPeers = (state: FederationState) => state.peers;
export const selectActivePeers = (state: FederationState) => 
  state.peers.filter(p => p.status === 'connected');
export const selectPendingDelegations = (state: FederationState) => 
  state.delegationQueue.filter(t => t.status === 'pending');
export const selectDelegationMetrics = (state: FederationState) => ({
  total: state.delegationQueue.length + state.delegationHistory.length,
  pending: state.delegationQueue.filter(t => t.status === 'pending').length,
  completed: state.delegationHistory.filter(t => t.status === 'completed').length,
  failed: state.delegationHistory.filter(t => t.status === 'failed').length,
});