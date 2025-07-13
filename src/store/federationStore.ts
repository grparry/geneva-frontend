import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Substrate, 
  SubstratePeer, 
  FederationMetrics, 
  FederationEvent,
  DelegationRequest,
  DelegationResponse
} from '../types/federation';

interface FederationState {
  // Data
  currentSubstrate: Substrate | null;
  peers: SubstratePeer[];
  metrics: FederationMetrics | null;
  events: FederationEvent[];
  delegationHistory: DelegationResponse[];
  
  // UI State
  selectedPeerId: string | null;
  isAddPeerDialogOpen: boolean;
  isDelegateDialogOpen: boolean;
  
  // Actions
  setCurrentSubstrate: (substrate: Substrate | null) => void;
  setPeers: (peers: SubstratePeer[]) => void;
  updatePeer: (peerId: string, updates: Partial<SubstratePeer>) => void;
  removePeer: (peerId: string) => void;
  setMetrics: (metrics: FederationMetrics | null) => void;
  addEvent: (event: FederationEvent) => void;
  clearOldEvents: (keepCount?: number) => void;
  addDelegationToHistory: (delegation: DelegationResponse) => void;
  
  // UI Actions
  selectPeer: (peerId: string | null) => void;
  openAddPeerDialog: () => void;
  closeAddPeerDialog: () => void;
  openDelegateDialog: () => void;
  closeDelegateDialog: () => void;
  
  // Utility
  getPeerById: (peerId: string) => SubstratePeer | undefined;
  getConnectedPeers: () => SubstratePeer[];
  getRecentEvents: (count?: number) => FederationEvent[];
}

export const useFederationStore = create<FederationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSubstrate: null,
        peers: [],
        metrics: null,
        events: [],
        delegationHistory: [],
        selectedPeerId: null,
        isAddPeerDialogOpen: false,
        isDelegateDialogOpen: false,

        // Actions
        setCurrentSubstrate: (substrate) => set({ currentSubstrate: substrate }),
        
        setPeers: (peers) => set({ peers }),
        
        updatePeer: (peerId, updates) => set((state) => ({
          peers: state.peers.map(peer => 
            peer.id === peerId ? { ...peer, ...updates } : peer
          )
        })),
        
        removePeer: (peerId) => set((state) => ({
          peers: state.peers.filter(peer => peer.id !== peerId),
          selectedPeerId: state.selectedPeerId === peerId ? null : state.selectedPeerId
        })),
        
        setMetrics: (metrics) => set({ metrics }),
        
        addEvent: (event) => set((state) => ({
          events: [event, ...state.events].slice(0, 1000) // Keep last 1000 events
        })),
        
        clearOldEvents: (keepCount = 100) => set((state) => ({
          events: state.events.slice(0, keepCount)
        })),
        
        addDelegationToHistory: (delegation) => set((state) => ({
          delegationHistory: [delegation, ...state.delegationHistory].slice(0, 500) // Keep last 500
        })),
        
        // UI Actions
        selectPeer: (peerId) => set({ selectedPeerId: peerId }),
        
        openAddPeerDialog: () => set({ isAddPeerDialogOpen: true }),
        closeAddPeerDialog: () => set({ isAddPeerDialogOpen: false }),
        
        openDelegateDialog: () => set({ isDelegateDialogOpen: true }),
        closeDelegateDialog: () => set({ isDelegateDialogOpen: false }),
        
        // Utility
        getPeerById: (peerId) => {
          return get().peers.find(peer => peer.id === peerId);
        },
        
        getConnectedPeers: () => {
          return get().peers.filter(peer => peer.status === 'connected');
        },
        
        getRecentEvents: (count = 10) => {
          return get().events.slice(0, count);
        }
      }),
      {
        name: 'federation-store',
        partialize: (state) => ({
          // Only persist essential data
          currentSubstrate: state.currentSubstrate,
          peers: state.peers,
          selectedPeerId: state.selectedPeerId
        })
      }
    ),
    {
      name: 'Federation Store'
    }
  )
);

// Selector hooks for common queries
export const useSelectedPeer = () => {
  const selectedPeerId = useFederationStore(state => state.selectedPeerId);
  const getPeerById = useFederationStore(state => state.getPeerById);
  return selectedPeerId ? getPeerById(selectedPeerId) : null;
};

export const useConnectedPeersCount = () => {
  return useFederationStore(state => 
    state.peers.filter(peer => peer.status === 'connected').length
  );
};

export const useFederationHealth = () => {
  const metrics = useFederationStore(state => state.metrics);
  const connectedPeers = useFederationStore(state => state.getConnectedPeers());
  
  if (!metrics) return 'unknown';
  
  const successRate = metrics.total_delegations > 0
    ? (metrics.successful_delegations / metrics.total_delegations) * 100
    : 100;
    
  const peerConnectivity = metrics.total_peers > 0
    ? (connectedPeers.length / metrics.total_peers) * 100
    : 100;
  
  if (successRate >= 95 && peerConnectivity >= 80) return 'healthy';
  if (successRate >= 80 && peerConnectivity >= 60) return 'degraded';
  return 'unhealthy';
};