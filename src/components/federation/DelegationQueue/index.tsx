/**
 * Delegation Queue Interface
 * 
 * Main component for managing task delegations with real-time updates.
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  SearchOutlined,
  RefreshOutlined,
  AddOutlined,
  ViewListOutlined,
  TableViewOutlined,
  FilterListOutlined,
  PlaylistAddOutlined,
} from '@mui/icons-material';

// Federation hooks and services
import { 
  useGetDelegationsQuery,
  useRetryDelegationMutation,
  useCancelDelegationMutation,
} from '../../../api/federation';
import { useDelegationWebSocket } from '../../../hooks/useFederationWebSocket';

// Federation types and components
import { DelegationStatus, Delegation } from '../../../types/federation';
import { DelegationStatusChip } from '../shared';

// Sub-components (to be implemented)
import DelegationTable from './DelegationTable';
import DelegationCards from './DelegationCards';
import DelegationForm from './DelegationForm';

type ViewMode = 'table' | 'cards';

interface DelegationFilters {
  searchTerm: string;
  status: DelegationStatus | 'all';
  taskType: string | 'all';
  timeRange: 'all' | 'hour' | 'day' | 'week';
}

export const DelegationQueue: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState<DelegationFilters>({
    searchTerm: '',
    status: 'all',
    taskType: 'all',
    timeRange: 'all',
  });

  // API queries
  const { 
    data: delegationsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useGetDelegationsQuery({
    limit: 100,
    offset: 0,
  });
  
  const delegations = delegationsResponse?.items || [];
  
  const [retryDelegation] = useRetryDelegationMutation();
  const [cancelDelegation] = useCancelDelegationMutation();

  // Real-time delegation updates
  const { isConnected } = useDelegationWebSocket((updatedDelegation) => {
    console.log('Delegation updated:', updatedDelegation);
    // RTK Query will automatically update the cache due to WebSocket integration
  });

  // Filter delegations based on current filters
  const filteredDelegations = useMemo(() => {
    return delegations.filter((delegation) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          delegation.task_type.toLowerCase().includes(searchLower) ||
          delegation.task_id.toLowerCase().includes(searchLower) ||
          delegation.target_substrate.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && delegation.status !== filters.status) {
        return false;
      }

      // Task type filter
      if (filters.taskType !== 'all' && delegation.task_type !== filters.taskType) {
        return false;
      }

      // Time range filter
      if (filters.timeRange !== 'all') {
        const now = new Date();
        const delegationTime = new Date(delegation.created_at);
        const diffMs = now.getTime() - delegationTime.getTime();
        
        switch (filters.timeRange) {
          case 'hour':
            if (diffMs > 60 * 60 * 1000) return false;
            break;
          case 'day':
            if (diffMs > 24 * 60 * 60 * 1000) return false;
            break;
          case 'week':
            if (diffMs > 7 * 24 * 60 * 60 * 1000) return false;
            break;
        }
      }

      return true;
    });
  }, [delegations, filters]);

  // Get summary statistics
  const delegationStats = useMemo(() => {
    const total = delegations.length;
    const pending = delegations.filter(d => d.status === DelegationStatus.PENDING).length;
    const executing = delegations.filter(d => d.status === DelegationStatus.EXECUTING).length;
    const completed = delegations.filter(d => d.status === DelegationStatus.COMPLETED).length;
    const failed = delegations.filter(d => 
      d.status === DelegationStatus.FAILED || d.status === DelegationStatus.REJECTED
    ).length;

    return { total, pending, executing, completed, failed };
  }, [delegations]);

  // Get unique task types for filter
  const taskTypes = useMemo(() => {
    const types = new Set(delegations.map(d => d.task_type));
    return Array.from(types).sort();
  }, [delegations]);

  const handleRefreshAll = async () => {
    await refetch();
  };

  const handleRetryDelegation = async (delegationId: string) => {
    try {
      await retryDelegation({ delegation_id: delegationId }).unwrap();
    } catch (error) {
      console.error('Failed to retry delegation:', error);
    }
  };

  const handleCancelDelegation = async (delegationId: string) => {
    try {
      await cancelDelegation(delegationId).unwrap();
    } catch (error) {
      console.error('Failed to cancel delegation:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: event.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      taskType: 'all',
      timeRange: 'all',
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.searchTerm || 
    filters.status !== 'all' || 
    filters.taskType !== 'all' || 
    filters.timeRange !== 'all';

  return (
    <Box>
      {/* Header with Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {delegationStats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {delegationStats.pending}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {delegationStats.executing}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Executing
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {delegationStats.completed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main" fontWeight="bold">
              {delegationStats.failed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Failed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Real-time updates are unavailable. Delegation status may not be current.
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load delegations: {error.toString()}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            placeholder="Search delegations..."
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
              onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
              clickable
            />
            {Object.values(DelegationStatus).map((status) => (
              <Box 
                key={status}
                sx={{ cursor: 'pointer' }}
                onClick={() => setFilters(prev => ({ ...prev, status }))}
              >
                <DelegationStatusChip
                  status={status}
                  size="small"
                  variant={filters.status === status ? 'filled' : 'outlined'}
                  withTooltip={false}
                />
              </Box>
            ))}
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Time Range Filter */}
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
            </Select>
          </FormControl>

          {/* Task Type Filter */}
          {taskTypes.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={filters.taskType}
                label="Task Type"
                onChange={(e) => setFilters(prev => ({ ...prev, taskType: e.target.value }))}
              >
                <MenuItem value="all">All Types</MenuItem>
                {taskTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Chip
              label="Clear Filters"
              size="small"
              onDelete={clearFilters}
              variant="outlined"
            />
          )}

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="table">
              <TableViewOutlined />
            </ToggleButton>
            <ToggleButton value="cards">
              <ViewListOutlined />
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Refresh Button */}
          <Tooltip title="Refresh delegations">
            <IconButton onClick={handleRefreshAll} disabled={isLoading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Showing {filteredDelegations.length} of {delegations.length} delegations
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
            {filters.taskType !== 'all' && (
              <Chip
                label={`Type: ${filters.taskType}`}
                size="small"
                variant="outlined"
                onDelete={() => setFilters(prev => ({ ...prev, taskType: 'all' }))}
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
      </Paper>

      {/* Delegation List */}
      {viewMode === 'table' ? (
        <DelegationTable
          delegations={filteredDelegations}
          isLoading={isLoading}
          onRetry={handleRetryDelegation}
          onCancel={handleCancelDelegation}
        />
      ) : (
        <DelegationCards
          delegations={filteredDelegations}
          isLoading={isLoading}
          onRetry={handleRetryDelegation}
          onCancel={handleCancelDelegation}
        />
      )}

      {/* Create Delegation FAB */}
      <Tooltip title="Create new delegation">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setFormOpen(true)}
        >
          <AddOutlined />
        </Fab>
      </Tooltip>

      {/* Delegation Creation Dialog */}
      <DelegationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </Box>
  );
};

export default DelegationQueue;