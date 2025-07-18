/**
 * Peer List Component
 * 
 * Displays federation peers in grid or list view with real-time status updates.
 */

import React, { useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';

// Federation types and components
import { SubstratePeer } from '../../../types/federation';
import PeerCard from './PeerCard';

interface PeerListProps {
  peers: SubstratePeer[];
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  onRefreshPeer: (peerId: string) => Promise<void>;
}

const PeerList: React.FC<PeerListProps> = ({
  peers,
  viewMode,
  isLoading,
  onRefreshPeer,
}) => {
  const [refreshingPeers, setRefreshingPeers] = useState<Set<string>>(new Set());

  const handleRefreshPeer = async (peerId: string) => {
    setRefreshingPeers(prev => new Set(prev).add(peerId));
    try {
      await onRefreshPeer(peerId);
    } finally {
      setRefreshingPeers(prev => {
        const newSet = new Set(prev);
        newSet.delete(peerId);
        return newSet;
      });
    }
  };

  // Loading state
  if (isLoading && peers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading peers...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Empty state
  if (peers.length === 0) {
    return (
      <Alert severity="info" sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No peers found
        </Typography>
        <Typography variant="body2">
          {isLoading 
            ? 'Loading peers...' 
            : 'No peers match the current filters. Try adjusting your search or adding a new peer.'
          }
        </Typography>
      </Alert>
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <Grid container spacing={3}>
        {peers.map((peer) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={peer.id}>
            <PeerCard
              peer={peer}
              onRefresh={() => handleRefreshPeer(peer.id)}
              isRefreshing={refreshingPeers.has(peer.id)}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  // List view
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {peers.map((peer) => (
        <PeerCard
          key={peer.id}
          peer={peer}
          onRefresh={() => handleRefreshPeer(peer.id)}
          isRefreshing={refreshingPeers.has(peer.id)}
          variant="list"
        />
      ))}
    </Box>
  );
};

export default PeerList;