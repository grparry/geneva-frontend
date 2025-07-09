/**
 * Memory Browser Component
 * Main interface for browsing cognitive memories with tier navigation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Skeleton,
  Alert,
  Pagination,
  Button,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Refresh,
  ViewList,
  ViewModule,
  FilterList,
  Sort,
  Download,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetMemoriesByTierQuery,
  useGetTierStatsQuery,
} from '../../services/cognitive/api';
import {
  selectCognitiveMemories,
  selectCognitiveTiers,
  selectCognitiveUI,
  setSelectedTier,
  setSelectedMemory,
  setViewMode,
} from '../../store/cognitive/slice';
import { MemoryCard } from './MemoryCard';
import { TierNavigation } from './TierNavigation';
import type {
  CognitiveMemoryBrowserProps,
  CognitiveMemory,
  CognitiveTier,
} from '../../types/cognitive';

export const MemoryBrowser: React.FC<CognitiveMemoryBrowserProps> = ({
  projectId,
  initialTier = 1,
  onMemorySelect,
  compact = false,
  showStats = true,
}) => {
  const dispatch = useDispatch();
  
  // Redux state
  const memoriesState = useSelector(selectCognitiveMemories);
  const tiersState = useSelector(selectCognitiveTiers);
  const uiState = useSelector(selectCognitiveUI);
  
  // Local state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [viewMode, setLocalViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'created_at' | 'importance' | 'risk_score'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Set initial tier
  useEffect(() => {
    if (!uiState.selectedTier) {
      dispatch(setSelectedTier(initialTier));
    }
  }, [dispatch, initialTier, uiState.selectedTier]);

  // API queries
  const {
    data: memoriesResponse,
    isLoading: memoriesLoading,
    error: memoriesError,
    refetch: refetchMemories,
  } = useGetMemoriesByTierQuery({
    tier: uiState.selectedTier || initialTier,
    page,
    limit,
    sort_by: sortBy,
    sort_order: sortOrder,
  }, {
    skip: !uiState.selectedTier,
  });

  const {
    data: tierStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetTierStatsQuery(undefined, {
    skip: !showStats,
  });

  // Handle tier selection
  const handleTierSelect = (tier: CognitiveTier) => {
    dispatch(setSelectedTier(tier));
    setPage(1); // Reset to first page
  };

  // Handle memory selection
  const handleMemorySelect = (memory: CognitiveMemory) => {
    dispatch(setSelectedMemory(memory.id));
    if (onMemorySelect) {
      onMemorySelect(memory);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchMemories();
    refetchStats();
  };

  // Handle pagination
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  // Handle sort change
  const handleSortChange = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const memories = memoriesResponse?.memories || [];
  const totalPages = memoriesResponse ? Math.ceil(memoriesResponse.total / limit) : 0;
  const isLoading = memoriesLoading || statsLoading;
  const hasError = memoriesError || statsError;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cognitive Memory Browser
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Explore your organization's knowledge hierarchy
        </Typography>
      </Box>

      {/* Error State */}
      {hasError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load cognitive memories. Please try refreshing the page.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Sidebar - Tier Navigation */}
        <Box sx={{ flex: { md: '0 0 25%' } }}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <TierNavigation
              stats={tierStats || null}
              selectedTier={uiState.selectedTier}
              onTierSelect={handleTierSelect}
              loading={statsLoading}
              compact={compact}
              showTrends={showStats}
            />
          </Paper>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: { md: '0 0 75%' } }}>
          {/* Toolbar */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {/* Title */}
              <Typography variant="h6" sx={{ flex: 1, minWidth: 0 }}>
                {uiState.selectedTier && (
                  <>
                    Tier {uiState.selectedTier} Memories
                    {memoriesResponse && (
                      <Badge 
                        badgeContent={memoriesResponse.total} 
                        color="primary" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </>
                )}
              </Typography>

              {/* Controls */}
              <Stack direction="row" spacing={1} alignItems="center">
                {/* Sort */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    label="Sort By"
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field as typeof sortBy);
                      setSortOrder(order as 'asc' | 'desc');
                      setPage(1);
                    }}
                  >
                    <MenuItem value="created_at-desc">Newest First</MenuItem>
                    <MenuItem value="created_at-asc">Oldest First</MenuItem>
                    <MenuItem value="importance-desc">Most Important</MenuItem>
                    <MenuItem value="importance-asc">Least Important</MenuItem>
                    <MenuItem value="risk_score-desc">Highest Risk</MenuItem>
                    <MenuItem value="risk_score-asc">Lowest Risk</MenuItem>
                  </Select>
                </FormControl>

                <Divider orientation="vertical" flexItem />

                {/* View Mode */}
                <Tooltip title="List View">
                  <IconButton
                    size="small"
                    color={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setLocalViewMode('list')}
                  >
                    <ViewList />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Grid View">
                  <IconButton
                    size="small"
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setLocalViewMode('grid')}
                  >
                    <ViewModule />
                  </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                {/* Actions */}
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={handleRefresh}>
                    <Refresh />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Export">
                  <IconButton size="small">
                    <Download />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Paper>

          {/* Memory List */}
          <Box>
            {isLoading ? (
              // Loading State
              <Stack spacing={2}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Paper key={index} sx={{ p: 3 }}>
                    <Skeleton variant="rectangular" height={150} />
                  </Paper>
                ))}
              </Stack>
            ) : memories.length === 0 ? (
              // Empty State
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No memories found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {uiState.selectedTier 
                    ? `No memories in Tier ${uiState.selectedTier} yet.`
                    : 'Select a tier to browse memories.'
                  }
                </Typography>
                <Button variant="outlined" onClick={handleRefresh}>
                  Refresh
                </Button>
              </Paper>
            ) : (
              // Memory Cards
              <Box>
                {viewMode === 'grid' ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {memories.map((memory) => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        selected={uiState.selectedMemory === memory.id}
                        onSelect={handleMemorySelect}
                        compact={compact}
                        showMetadata={true}
                      />
                    ))}
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {memories.map((memory) => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        selected={uiState.selectedMemory === memory.id}
                        onSelect={handleMemorySelect}
                        compact={compact}
                        showMetadata={true}
                      />
                    ))}
                  </Stack>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default MemoryBrowser;