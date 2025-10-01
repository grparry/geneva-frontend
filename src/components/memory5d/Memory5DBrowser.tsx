/**
 * Memory5DBrowser Component
 * Primary interface for exploring and managing 5D memories
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider,
  Badge,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  School as SchoolIcon
} from '@mui/icons-material';

import {
  useGetMemoriesQuery,
  useGetDimensionalStatsQuery,
  useGetDimensionValuesQuery,
  useSearchMemories5DMutation,
} from '../../services/memory5d/api';

import type {
  Memory5D,
  Memory5DFilters,
  Memory5DBrowserProps,
} from '../../types/memory5d';
import {
  getDimensionColor,
  getDimensionIcon,
  formatDimensionValue,
} from '../../types/memory5d';

// Component imports (we'll create these next)
import DimensionFilter from './DimensionFilter';
import Memory5DCard from './Memory5DCard';
import Memory5DSearchBar from './Memory5DSearchBar';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`memory5d-tabpanel-${index}`}
    aria-labelledby={`memory5d-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

const Memory5DBrowser: React.FC<Memory5DBrowserProps> = ({
  projectId,
  initialFilters = {},
  onMemorySelect,
  enableCrossDimensionalSearch = true,
  showDimensionStats = true,
  compact = false,
}) => {
  // State management
  const [filters, setFilters] = useState<Memory5DFilters>(initialFilters);
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedMemory, setSelectedMemory] = useState<Memory5D | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // API queries
  const {
    data: memoriesResponse,
    isLoading: memoriesLoading,
    error: memoriesError,
    refetch: refetchMemories,
  } = useGetMemoriesQuery({
    filters,
    limit: 24,
    offset: page * 24,
  });

  const {
    data: dimensionalStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetDimensionalStatsQuery({
    time_range: '30d',
    include_trends: true,
  }, {
    skip: !showDimensionStats,
  });

  const {
    data: dimensionValues,
    isLoading: valuesLoading,
  } = useGetDimensionValuesQuery();

  const [searchMemories, {
    data: searchResults,
    isLoading: searchLoading,
  }] = useSearchMemories5DMutation();

  // Computed values
  const displayMemories = searchResults?.memories || memoriesResponse?.memories || [];
  const totalCount = searchResults?.total || memoriesResponse?.total || 0;
  const hasMore = searchResults?.has_more || memoriesResponse?.has_more || false;

  // Filter management
  const updateFilter = (dimension: keyof Memory5DFilters, values: string[]) => {
    const newFilters = { ...filters };
    if (values.length === 0) {
      delete newFilters[dimension];
    } else {
      (newFilters as any)[dimension] = values;
    }
    setFilters(newFilters);
    setPage(0); // Reset pagination
  };

  const clearAllFilters = () => {
    setFilters({});
    setPage(0);
    setSearchQuery('');
  };

  const handleSearch = async (query: string, searchFilters: Memory5DFilters) => {
    setSearchQuery(query);
    await searchMemories({
      query,
      filters: { ...filters, ...searchFilters },
      cross_dimensional_search: enableCrossDimensionalSearch,
      limit: 24,
      offset: 0,
    });
    setPage(0);
  };

  const handleMemorySelect = (memory: Memory5D) => {
    setSelectedMemory(memory);
    onMemorySelect?.(memory);
  };

  const handleRefresh = () => {
    refetchMemories();
    refetchStats();
  };

  // Dimension overview component
  const DimensionOverview: React.FC<{
    dimension: keyof Memory5DFilters;
    title: string;
    icon: React.ReactNode;
    data: Record<string, { count: number; percentage: number }>;
  }> = ({ dimension, title, icon, data }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Grid container spacing={1}>
          {Object.entries(data || {}).map(([value, stats]) => (
            <Grid size={{ xs: 6, md: 4 }} key={value}>
              <Chip
                label={`${formatDimensionValue(dimension, value)} (${stats.count})`}
                onClick={() => updateFilter(dimension, [value])}
                sx={{
                  backgroundColor: getDimensionColor(dimension, value),
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
                size="small"
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  if (memoriesLoading && !memoriesResponse) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading 5D Memory Browser...
        </Typography>
      </Box>
    );
  }

  if (memoriesError) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Failed to load memories: {(memoriesError as any)?.message || 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: compact ? 1 : 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant={compact ? "h5" : "h4"} component="h1">
          🧠 5D Memory Explorer
        </Typography>

        <Box display="flex" gap={1}>
          <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? "primary" : "default"}
            >
              <Badge badgeContent={Object.keys(filters).length} color="primary">
                <FilterIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={viewMode === 'grid' ? "Switch to List View" : "Switch to Grid View"}>
            <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
              {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={memoriesLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box mb={3}>
        <Memory5DSearchBar
          onSearch={handleSearch}
          isLoading={searchLoading}
          placeholder="Search across all 5 dimensions..."
          enableCrossDimensional={enableCrossDimensionalSearch}
        />
      </Box>

      {/* Active Filters Display */}
      {Object.keys(filters).length > 0 && (
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="body2" color="text.secondary">
              Active Filters:
            </Typography>
            <Button size="small" onClick={clearAllFilters}>
              Clear All
            </Button>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {Object.entries(filters).map(([dimension, values]) =>
              Array.isArray(values) ? values.map((value) => (
                <Chip
                  key={`${dimension}-${value}`}
                  label={`${dimension}: ${formatDimensionValue(dimension as keyof Memory5DFilters, value)}`}
                  onDelete={() => {
                    const newValues = (values as string[]).filter(v => v !== value);
                    updateFilter(dimension as keyof Memory5DFilters, newValues);
                  }}
                  size="small"
                  sx={{
                    backgroundColor: getDimensionColor(dimension as keyof Memory5DFilters, value),
                  }}
                />
              )) : null
            )}
          </Box>
        </Box>
      )}

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Sidebar - Filters and Stats */}
        {(showFilters || showDimensionStats) && (
          <Grid size={{ xs: 12, lg: 3 }}>
            {/* Dimension Filters */}
            {showFilters && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Dimension Filters
                  </Typography>

                  {dimensionValues && (
                    <Box>
                      <DimensionFilter
                        dimension="cognitive_type"
                        selectedValues={filters.cognitive_type || []}
                        onSelectionChange={(values) => updateFilter('cognitive_type', values)}
                        showCounts={true}
                        maxSelections={3}
                      />

                      <DimensionFilter
                        dimension="temporal_tier"
                        selectedValues={filters.temporal_tier || []}
                        onSelectionChange={(values) => updateFilter('temporal_tier', values)}
                        showCounts={true}
                        maxSelections={3}
                      />

                      <DimensionFilter
                        dimension="organizational_scope"
                        selectedValues={filters.organizational_scope || []}
                        onSelectionChange={(values) => updateFilter('organizational_scope', values)}
                        showCounts={true}
                        maxSelections={3}
                      />

                      <DimensionFilter
                        dimension="security_classification"
                        selectedValues={filters.security_classification || []}
                        onSelectionChange={(values) => updateFilter('security_classification', values)}
                        showCounts={true}
                        maxSelections={2}
                      />

                      <DimensionFilter
                        dimension="ontological_schema"
                        selectedValues={filters.ontological_schema || []}
                        onSelectionChange={(values) => updateFilter('ontological_schema', values)}
                        showCounts={true}
                        maxSelections={3}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dimension Statistics */}
            {showDimensionStats && dimensionalStats && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Dimensional Overview
                </Typography>

                <DimensionOverview
                  dimension="cognitive_type"
                  title="Cognitive Types"
                  icon={<PsychologyIcon />}
                  data={dimensionalStats.cognitive_type}
                />

                <DimensionOverview
                  dimension="temporal_tier"
                  title="Temporal Tiers"
                  icon={<ScheduleIcon />}
                  data={dimensionalStats.temporal_tier}
                />

                <DimensionOverview
                  dimension="organizational_scope"
                  title="Organizational Scope"
                  icon={<BusinessIcon />}
                  data={dimensionalStats.organizational_scope}
                />

                <DimensionOverview
                  dimension="security_classification"
                  title="Security Classification"
                  icon={<SecurityIcon />}
                  data={dimensionalStats.security_classification}
                />

                <DimensionOverview
                  dimension="ontological_schema"
                  title="Ontological Schema"
                  icon={<SchoolIcon />}
                  data={dimensionalStats.ontological_schema}
                />
              </Box>
            )}
          </Grid>
        )}

        {/* Main Memory List */}
        <Grid size={{
          xs: 12,
          lg: (showFilters || showDimensionStats) ? 9 : 12
        }}>
          {/* Results Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {searchQuery ? 'Search Results' : 'All Memories'} ({totalCount.toLocaleString()})
            </Typography>
            {memoriesLoading && <CircularProgress size={20} />}
          </Box>

          {/* Memory Grid/List */}
          {displayMemories.length > 0 ? (
            <Grid container spacing={viewMode === 'grid' ? 2 : 1}>
              {displayMemories.map((memory) => (
                <Grid
                  size={{
                    xs: 12,
                    sm: viewMode === 'grid' ? 6 : 12,
                    md: viewMode === 'grid' ? 4 : 12,
                    lg: viewMode === 'grid' ? 3 : 12
                  }}
                  key={memory.id}
                >
                  <Memory5DCard
                    memory={memory}
                    selected={selectedMemory?.id === memory.id}
                    onSelect={handleMemorySelect}
                    showAllDimensions={!compact}
                    enableQuickEdit={true}
                    compact={viewMode === 'list'}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchQuery ? 'No memories found matching your search' : 'No memories found'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Create your first 5D memory to get started'
                }
              </Typography>
            </Paper>
          )}

          {/* Pagination */}
          {(hasMore || page > 0) && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                variant="outlined"
                onClick={() => setPage(page - 1)}
                disabled={page === 0 || memoriesLoading}
                sx={{ mr: 1 }}
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ mx: 2, alignSelf: 'center' }}>
                Page {page + 1}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setPage(page + 1)}
                disabled={!hasMore || memoriesLoading}
                sx={{ ml: 1 }}
              >
                Next
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Memory5DBrowser;