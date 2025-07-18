/**
 * Trust Management Interface
 * 
 * Interface for managing trust relationships between federation peers.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import {
  SearchOutlined,
  RefreshOutlined,
  SecurityOutlined,
  AccountTreeOutlined,
  HistoryOutlined,
  AssignmentOutlined,
  VerifiedUserOutlined,
  BlockOutlined,
} from '@mui/icons-material';

// Federation hooks and services
import { 
  useGetPeersQuery,
  useGetTrustRelationshipsQuery,
  useGetTrustAuditQuery,
  useUpdateTrustLevelMutation,
} from '../../../api/federation';
import { useTrustWebSocket } from '../../../hooks/useFederationWebSocket';

// Federation types and components
import { TrustLevel } from '../../../types/federation';
import { TrustLevelBadge } from '../shared';

// Sub-components
import TrustMatrix from './TrustMatrix';
import TrustWorkflow from './TrustWorkflow';
import TrustAuditLog from './TrustAuditLog';
import CertificateManager from './CertificateManager';

type TrustTab = 'matrix' | 'workflow' | 'audit' | 'certificates';

interface TrustFilters {
  searchTerm: string;
  trustLevel: TrustLevel | 'all';
  timeRange: 'all' | 'hour' | 'day' | 'week' | 'month';
}

export const TrustManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrustTab>('matrix');
  const [filters, setFilters] = useState<TrustFilters>({
    searchTerm: '',
    trustLevel: 'all',
    timeRange: 'all',
  });

  // API queries
  const { 
    data: peersResponse, 
    isLoading: peersLoading, 
    error: peersError,
    refetch: refetchPeers 
  } = useGetPeersQuery({});
  
  const peers = peersResponse?.items || [];

  const { 
    data: trustRelationships, 
    isLoading: trustLoading, 
    error: trustError,
    refetch: refetchTrust 
  } = useGetTrustRelationshipsQuery({});

  const { 
    data: auditLog, 
    isLoading: auditLoading, 
    error: auditError,
    refetch: refetchAudit 
  } = useGetTrustAuditQuery({
    limit: 100,
    offset: 0,
  });

  const [updateTrustLevel] = useUpdateTrustLevelMutation();

  // Real-time trust updates
  const { isConnected } = useTrustWebSocket((trustUpdate) => {
    console.log('Trust relationship updated:', trustUpdate);
    // RTK Query will automatically update the cache
  });

  // Filter peers based on current filters
  const filteredPeers = useMemo(() => {
    return peers.filter((peer) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          peer.name.toLowerCase().includes(searchLower) ||
          peer.substrate_id.toLowerCase().includes(searchLower) ||
          peer.url.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Trust level filter
      if (filters.trustLevel !== 'all' && peer.trust_level !== filters.trustLevel) {
        return false;
      }

      return true;
    });
  }, [peers, filters]);

  // Get trust statistics
  const trustStats = useMemo(() => {
    const total = peers.length;
    const none = peers.filter(p => p.trust_level === TrustLevel.NONE).length;
    const basic = peers.filter(p => p.trust_level === TrustLevel.BASIC).length;
    const verified = peers.filter(p => p.trust_level === TrustLevel.VERIFIED).length;
    const trusted = peers.filter(p => p.trust_level === TrustLevel.TRUSTED).length;
    const full = peers.filter(p => p.trust_level === TrustLevel.FULL).length;

    return { total, none, basic, verified, trusted, full };
  }, [peers]);

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchPeers(),
      refetchTrust(),
      refetchAudit(),
    ]);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: event.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      trustLevel: 'all',
      timeRange: 'all',
    });
  };

  const hasActiveFilters = filters.searchTerm || 
    filters.trustLevel !== 'all' || 
    filters.timeRange !== 'all';

  const getTrustLevelColor = (level: TrustLevel) => {
    switch (level) {
      case TrustLevel.NONE: return 'default';
      case TrustLevel.BASIC: return 'info';
      case TrustLevel.VERIFIED: return 'warning';
      case TrustLevel.TRUSTED: return 'success';
      case TrustLevel.FULL: return 'primary';
      default: return 'default';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'matrix':
        return (
          <TrustMatrix
            peers={filteredPeers}
            trustRelationships={trustRelationships}
            isLoading={peersLoading || trustLoading}
            onUpdateTrust={updateTrustLevel}
          />
        );
      case 'workflow':
        return (
          <TrustWorkflow
            peers={filteredPeers}
            isLoading={peersLoading}
            onUpdateTrust={updateTrustLevel}
          />
        );
      case 'audit':
        return (
          <TrustAuditLog
            auditLog={auditLog?.items || []}
            isLoading={auditLoading}
            filters={filters}
          />
        );
      case 'certificates':
        return (
          <CertificateManager
            peers={filteredPeers}
            isLoading={peersLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header with Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 2 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {trustStats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Peers
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="text.secondary" fontWeight="bold">
              {trustStats.none}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No Trust
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {trustStats.basic}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Basic
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {trustStats.verified}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Verified
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {trustStats.trusted}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trusted
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {trustStats.full}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Full Trust
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Real-time updates are unavailable. Trust information may not be current.
        </Alert>
      )}

      {/* Error Alerts */}
      {(peersError || trustError || auditError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load trust data: {(peersError || trustError || auditError)?.toString()}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newTab) => setActiveTab(newTab)}
            sx={{ px: 2 }}
          >
            <Tab 
              value="matrix" 
              label="Trust Matrix" 
              icon={<AccountTreeOutlined />}
              iconPosition="start"
            />
            <Tab 
              value="workflow" 
              label="Trust Workflow" 
              icon={<VerifiedUserOutlined />}
              iconPosition="start"
            />
            <Tab 
              value="audit" 
              label="Audit Log" 
              icon={<HistoryOutlined />}
              iconPosition="start"
            />
            <Tab 
              value="certificates" 
              label="Certificates" 
              icon={<AssignmentOutlined />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
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

            {/* Trust Level Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Trust Level</InputLabel>
              <Select
                value={filters.trustLevel}
                label="Trust Level"
                onChange={(e) => setFilters(prev => ({ ...prev, trustLevel: e.target.value as any }))}
              >
                <MenuItem value="all">All Levels</MenuItem>
                {Object.values(TrustLevel).map((level) => (
                  <MenuItem key={level} value={level}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrustLevelBadge level={level} size="small" showLabel={false} />
                      {level}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Time Range Filter (for audit tab) */}
            {activeTab === 'audit' && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={filters.timeRange}
                  label="Time Range"
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="hour">Last Hour</MenuItem>
                  <MenuItem value="day">Last Day</MenuItem>
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outlined"
                size="small"
                onClick={clearFilters}
                startIcon={<BlockOutlined />}
              >
                Clear Filters
              </Button>
            )}

            {/* Refresh Button */}
            <Tooltip title="Refresh trust data">
              <IconButton 
                onClick={handleRefreshAll} 
                disabled={peersLoading || trustLoading || auditLoading}
              >
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
              {filters.trustLevel !== 'all' && (
                <Chip
                  label={`Trust: ${filters.trustLevel}`}
                  size="small"
                  variant="outlined"
                  onDelete={() => setFilters(prev => ({ ...prev, trustLevel: 'all' }))}
                />
              )}
              {filters.timeRange !== 'all' && (
                <Chip
                  label={`Time: ${filters.timeRange}`}
                  size="small"
                  variant="outlined"
                  onDelete={() => setFilters(prev => ({ ...prev, timeRange: 'all' }))}
                />
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Tab Content */}
      {renderTabContent()}
    </Box>
  );
};

export default TrustManagement;