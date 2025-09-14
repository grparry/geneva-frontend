/**
 * Memory5DSearchBar Component
 * Advanced search interface for 5D memories with cross-dimensional capabilities
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  Chip,
  FormControlLabel,
  Switch,
  Collapse,
  Grid,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Autocomplete,
  Slider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Psychology as PsychologyIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  School as SchoolIcon,
  TuneIcon,
} from '@mui/icons-material';
import { debounce } from 'lodash';

import type {
  Memory5DFilters,
  Memory5DSearchRequest,
  COGNITIVE_TYPE_DEFINITIONS,
  TEMPORAL_TIER_DEFINITIONS,
  ORGANIZATIONAL_SCOPE_DEFINITIONS,
  SECURITY_CLASSIFICATION_DEFINITIONS,
  ONTOLOGICAL_SCHEMA_DEFINITIONS,
  formatDimensionValue,
  getDimensionColor,
} from '../../types/memory5d';

interface Memory5DSearchBarProps {
  onSearch: (query: string, filters: Memory5DFilters) => void;
  isLoading?: boolean;
  placeholder?: string;
  enableCrossDimensional?: boolean;
  showAdvancedFilters?: boolean;
  initialQuery?: string;
  initialFilters?: Memory5DFilters;
}

const Memory5DSearchBar: React.FC<Memory5DSearchBarProps> = ({
  onSearch,
  isLoading = false,
  placeholder = "Search memories across all dimensions...",
  enableCrossDimensional = true,
  showAdvancedFilters = true,
  initialQuery = '',
  initialFilters = {},
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<Memory5DFilters>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [crossDimensional, setCrossDimensional] = useState(enableCrossDimensional);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchFilters: Memory5DFilters) => {
      onSearch(searchQuery, searchFilters);
    }, 300),
    [onSearch]
  );

  // Handle query change
  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);

    // Trigger search automatically if query is not empty or filters are active
    if (newQuery.trim() || Object.keys(filters).length > 0) {
      debouncedSearch(newQuery, filters);
    }
  };

  // Handle filter change
  const updateFilter = <K extends keyof Memory5DFilters>(
    dimension: K,
    value: Memory5DFilters[K]
  ) => {
    const newFilters = { ...filters };
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[dimension];
    } else {
      newFilters[dimension] = value;
    }
    setFilters(newFilters);
    debouncedSearch(query, newFilters);
  };

  // Handle search button click
  const handleSearch = () => {
    onSearch(query, filters);
  };

  // Clear all filters and query
  const handleClear = () => {
    setQuery('');
    setFilters({});
    onSearch('', {});
  };

  // Get available options for autocomplete
  const getAutocompleteOptions = (dimension: keyof Memory5DFilters) => {
    switch (dimension) {
      case 'cognitive_type':
        return Object.keys(COGNITIVE_TYPE_DEFINITIONS).map(key => ({
          value: key,
          label: formatDimensionValue('cognitive_type', key),
        }));
      case 'temporal_tier':
        return Object.keys(TEMPORAL_TIER_DEFINITIONS).map(key => ({
          value: key,
          label: formatDimensionValue('temporal_tier', key),
        }));
      case 'organizational_scope':
        return Object.keys(ORGANIZATIONAL_SCOPE_DEFINITIONS).map(key => ({
          value: key,
          label: formatDimensionValue('organizational_scope', key),
        }));
      case 'security_classification':
        return Object.keys(SECURITY_CLASSIFICATION_DEFINITIONS).map(key => ({
          value: key,
          label: formatDimensionValue('security_classification', key),
        }));
      case 'ontological_schema':
        return Object.keys(ONTOLOGICAL_SCHEMA_DEFINITIONS).map(key => ({
          value: key,
          label: formatDimensionValue('ontological_schema', key),
        }));
      default:
        return [];
    }
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <Box>
      {/* Main Search Bar */}
      <Box display="flex" gap={1} mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          value={query}
          onChange={handleQueryChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setQuery('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />

        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={isLoading}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>

        {showAdvancedFilters && (
          <Tooltip title="Advanced Filters">
            <IconButton
              onClick={() => setShowAdvanced(!showAdvanced)}
              color={showAdvanced || activeFilterCount > 0 ? 'primary' : 'default'}
            >
              <FilterIcon />
              {activeFilterCount > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {activeFilterCount}
                </Typography>
              )}
            </IconButton>
          </Tooltip>
        )}

        {(query || activeFilterCount > 0) && (
          <Button variant="outlined" onClick={handleClear}>
            Clear
          </Button>
        )}
      </Box>

      {/* Cross-Dimensional Toggle */}
      {enableCrossDimensional && (
        <Box display="flex" alignItems="center" mb={1}>
          <FormControlLabel
            control={
              <Switch
                checked={crossDimensional}
                onChange={(e) => setCrossDimensional(e.target.checked)}
                size="small"
              />
            }
            label="Enable cross-dimensional search"
            sx={{ fontSize: '0.875rem' }}
          />
          <Tooltip title="Search across relationships between different dimensions for more comprehensive results">
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ℹ️
            </Typography>
          </Tooltip>
        </Box>
      )}

      {/* Advanced Filters */}
      <Collapse in={showAdvanced}>
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Advanced Filters
          </Typography>

          <Grid container spacing={2}>
            {/* Cognitive Type Filter */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <PsychologyIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Cognitive Type</Typography>
              </Box>
              <Autocomplete
                multiple
                options={getAutocompleteOptions('cognitive_type')}
                getOptionLabel={(option) => option.label}
                value={getAutocompleteOptions('cognitive_type').filter(option =>
                  filters.cognitive_type?.includes(option.value)
                )}
                onChange={(_, newValue) => {
                  updateFilter('cognitive_type', newValue.map(v => v.value));
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      sx={{
                        backgroundColor: getDimensionColor('cognitive_type', option.value),
                      }}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder="Select cognitive types..."
                  />
                )}
              />
            </Grid>

            {/* Temporal Tier Filter */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Temporal Tier</Typography>
              </Box>
              <Autocomplete
                multiple
                options={getAutocompleteOptions('temporal_tier')}
                getOptionLabel={(option) => option.label}
                value={getAutocompleteOptions('temporal_tier').filter(option =>
                  filters.temporal_tier?.includes(option.value)
                )}
                onChange={(_, newValue) => {
                  updateFilter('temporal_tier', newValue.map(v => v.value));
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      sx={{
                        backgroundColor: getDimensionColor('temporal_tier', option.value),
                      }}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder="Select temporal tiers..."
                  />
                )}
              />
            </Grid>

            {/* Organizational Scope Filter */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Organizational Scope</Typography>
              </Box>
              <Autocomplete
                multiple
                options={getAutocompleteOptions('organizational_scope')}
                getOptionLabel={(option) => option.label}
                value={getAutocompleteOptions('organizational_scope').filter(option =>
                  filters.organizational_scope?.includes(option.value)
                )}
                onChange={(_, newValue) => {
                  updateFilter('organizational_scope', newValue.map(v => v.value));
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      sx={{
                        backgroundColor: getDimensionColor('organizational_scope', option.value),
                      }}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder="Select organizational scopes..."
                  />
                )}
              />
            </Grid>

            {/* Security Classification Filter */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <SecurityIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Security Classification</Typography>
              </Box>
              <Autocomplete
                multiple
                options={getAutocompleteOptions('security_classification')}
                getOptionLabel={(option) => option.label}
                value={getAutocompleteOptions('security_classification').filter(option =>
                  filters.security_classification?.includes(option.value)
                )}
                onChange={(_, newValue) => {
                  updateFilter('security_classification', newValue.map(v => v.value));
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      sx={{
                        backgroundColor: getDimensionColor('security_classification', option.value),
                      }}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder="Select security levels..."
                  />
                )}
              />
            </Grid>

            {/* Ontological Schema Filter */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <SchoolIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Ontological Schema</Typography>
              </Box>
              <Autocomplete
                multiple
                options={getAutocompleteOptions('ontological_schema')}
                getOptionLabel={(option) => option.label}
                value={getAutocompleteOptions('ontological_schema').filter(option =>
                  filters.ontological_schema?.includes(option.value)
                )}
                onChange={(_, newValue) => {
                  updateFilter('ontological_schema', newValue.map(v => v.value));
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      sx={{
                        backgroundColor: getDimensionColor('ontological_schema', option.value),
                      }}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder="Select ontological schemas..."
                  />
                )}
              />
            </Grid>

            {/* Score Ranges */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Importance Score Range
              </Typography>
              <Slider
                value={[
                  filters.importance_range?.min ?? 0,
                  filters.importance_range?.max ?? 1
                ]}
                onChange={(_, newValue) => {
                  const [min, max] = newValue as number[];
                  updateFilter('importance_range', { min, max });
                }}
                valueLabelDisplay="auto"
                step={0.1}
                min={0}
                max={1}
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Confidence Score Range
              </Typography>
              <Slider
                value={[
                  filters.confidence_range?.min ?? 0,
                  filters.confidence_range?.max ?? 1
                ]}
                onChange={(_, newValue) => {
                  const [min, max] = newValue as number[];
                  updateFilter('confidence_range', { min, max });
                }}
                valueLabelDisplay="auto"
                step={0.1}
                min={0}
                max={1}
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default Memory5DSearchBar;