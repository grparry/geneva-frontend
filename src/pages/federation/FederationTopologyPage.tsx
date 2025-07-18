import React from 'react';
import { Box } from '@mui/material';
import { FederationTopologyGraph } from '../../components/federation/FederationTopologyGraph';
import { useFederationStore } from '../../store/federationStore';

export const FederationTopologyPage: React.FC = () => {
  const { peers, activePeer } = useFederationStore();
  
  // Create a mock current substrate from active peer or first peer
  const currentSubstrate = activePeer || peers[0];
  
  if (!currentSubstrate) {
    return (
      <Box sx={{ p: 3 }}>
        Loading federation data...
      </Box>
    );
  }
  
  // Convert Peer[] to SubstratePeer[] format
  const substratePeers = peers.map(peer => ({
    id: peer.id,
    substrate_id: peer.id,
    name: peer.name,
    url: peer.endpoint,
    status: peer.status as any,
    trust_level: 'basic' as any,
    capabilities: peer.capabilities.reduce((acc, cap) => ({ ...acc, [cap]: true }), {}),
    mcp_version: '1.0.0',
    error_count: 0,
    discovered_at: peer.lastSeen.toISOString(),
  }));
  
  return <FederationTopologyGraph currentSubstrate={currentSubstrate} peers={substratePeers} />;
};