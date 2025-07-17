/**
 * Peer Management Interface
 * 
 * Main component for managing federated substrate peers with real-time updates.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Chip,
  Alert,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  SearchOutlined,
  RefreshOutlined,
  AddOutlined,
  ViewListOutlined,
  ViewModuleOutlined,
  FilterListOutlined,
} from '@mui/icons-material';

// Federation hooks and services
import { 
  useGetPeersQuery,
  useRefreshPeerMutation,
} from '../../../api/federation';
import { usePeerStatusWebSocket } from '../../../hooks/useFederationWebSocket';

// Federation types and components
import { PeerStatus, TrustLevel, SubstratePeer } from '../../../types/federation';
import { PeerStatusIcon, TrustLevelBadge } from '../shared';

// Sub-components (to be implemented)
import PeerList from './PeerList';
import PeerDiscovery from './PeerDiscovery';

type ViewMode = 'grid' | 'list';

interface PeerFilters {
  searchTerm: string;
  status: PeerStatus | 'all';
  trustLevel: TrustLevel | 'all';
}

export const PeerManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [filters, setFilters] = useState<PeerFilters>({
    searchTerm: '',
    status: 'all',
    trustLevel: 'all',
  });

  // API queries
  const { 
    data: peers = [], 
    isLoading, 
    error, 
    refetch 
  } = useGetPeersQuery({});
  
  const [refreshPeer] = useRefreshPeerMutation();

  // Real-time peer updates
  const { isConnected } = usePeerStatusWebSocket((updatedPeer) => {
    console.log('Peer status updated:', updatedPeer);
    // RTK Query will automatically update the cache due to WebSocket integration
  });

  // Filter peers based on current filters
  const filteredPeers = useMemo(() => {
    return peers.filter((peer) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          peer.name.toLowerCase().includes(searchLower) ||
          peer.url.toLowerCase().includes(searchLower) ||
          peer.substrate_id.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && peer.status !== filters.status) {
        return false;
      }

      // Trust level filter
      if (filters.trustLevel !== 'all' && peer.trust_level !== filters.trustLevel) {
        return false;
      }

      return true;
    });
  }, [peers, filters]);

  // Get summary statistics
  const peerStats = useMemo(() => {
    const total = peers.length;
    const connected = peers.filter(p => 
      p.status === PeerStatus.CONNECTED || p.status === PeerStatus.HEALTHY
    ).length;
    const trusted = peers.filter(p => 
      p.trust_level === TrustLevel.TRUSTED || p.trust_level === TrustLevel.FULL
    ).length;
    const issues = peers.filter(p => 
      p.status === PeerStatus.ERROR || 
      p.status === PeerStatus.OFFLINE || 
      p.status === PeerStatus.DEGRADED
    ).length;

    return { total, connected, trusted, issues };
  }, [peers]);

  const handleRefreshAll = async () => {
    await refetch();
  };

  const handleRefreshPeer = async (peerId: string) => {
    try {
      await refreshPeer(peerId).unwrap();
    } catch (error) {
      console.error('Failed to refresh peer:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: event.target.value }));
  };

  const handleStatusFilter = (status: PeerStatus | 'all') => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handleTrustLevelFilter = (trustLevel: TrustLevel | 'all') => {
    setFilters(prev => ({ ...prev, trustLevel }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      trustLevel: 'all',
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.searchTerm || filters.status !== 'all' || filters.trustLevel !== 'all';

  return (
    <Box>
      {/* Header with Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {peerStats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Peers
            </Typography>
          </Paper>
        </Grid>
        <Grid xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {peerStats.connected}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connected
            </Typography>
          </Paper>
        </Grid>
        <Grid xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {peerStats.trusted}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trusted
            </Typography>
          </Paper>
        </Grid>
        <Grid xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main" fontWeight="bold">
              {peerStats.issues}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Issues
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Real-time updates are unavailable. Peer status may not be current.
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load peers: {error.toString()}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            placeholder="Search peers..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            }}
          />

          {/* Status Filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListOutlined fontSize="small" />
            <Typography variant="caption">Status:</Typography>
            <Chip
              label="All"
              size="small"
              variant={filters.status === 'all' ? 'filled' : 'outlined'}
              onClick={() => handleStatusFilter('all')}
              clickable
            />
            {Object.values(PeerStatus).map((status) => (
              <Chip
                key={status}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeerStatusIcon status={status} size="small" withTooltip={false} />
                    {status}
                  </Box>
                }
                size="small"
                variant={filters.status === status ? 'filled' : 'outlined'}
                onClick={() => handleStatusFilter(status)}
                clickable
              />
            ))}
          </Box>

          {/* Trust Level Filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption">Trust:</Typography>
            <Chip
              label="All"
              size="small"
              variant={filters.trustLevel === 'all' ? 'filled' : 'outlined'}
              onClick={() => handleTrustLevelFilter('all')}
              clickable
            />
            {Object.values(TrustLevel).map((level) => (
              <TrustLevelBadge
                key={level}
                level={level}
                size="small"
                interactive
                onClick={() => handleTrustLevelFilter(level)}
                variant={filters.trustLevel === level ? 'filled' : 'outlined'}
              />
            ))}
          </Box>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Chip
              label="Clear Filters"
              size="small"
              onDelete={clearFilters}
              variant="outlined"
            />
          )}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="grid">
              <ViewModuleOutlined />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListOutlined />
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Refresh Button */}
          <Tooltip title="Refresh all peers">
            <IconButton onClick={handleRefreshAll} disabled={isLoading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Showing {filteredPeers.length} of {peers.length} peers
            </Typography>
            {filters.searchTerm && (
              <Chip
                label={`Search: "${filters.searchTerm}"`}
                size="small"
                variant="outlined"
                onDelete={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
              />
            )}
            {filters.status !== 'all' && (
              <Chip
                label={`Status: ${filters.status}`}
                size="small"
                variant="outlined"
                onDelete={() => setFilters(prev => ({ ...prev, status: 'all' }))}
              />
            )}
            {filters.trustLevel !== 'all' && (
              <Chip
                label={`Trust: ${filters.trustLevel}`}
                size="small"
                variant="outlined"
                onDelete={() => setFilters(prev => ({ ...prev, trustLevel: 'all' }))}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Peer List */}
      <PeerList
        peers={filteredPeers}
        viewMode={viewMode}
        isLoading={isLoading}
        onRefreshPeer={handleRefreshPeer}
      />

      {/* Add Peer FAB */}
      <Tooltip title="Discover new peer">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setDiscoveryOpen(true)}
        >
          <AddOutlined />
        </Fab>
      </Tooltip>

      {/* Peer Discovery Dialog */}
      <PeerDiscovery
        open={discoveryOpen}
        onClose={() => setDiscoveryOpen(false)}
      />
    </Box>
  );
};

export default PeerManagement;