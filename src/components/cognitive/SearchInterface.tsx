/**
 * Search Interface Component
 * Advanced search and filtering for cognitive memories
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Chip,
  Stack,
  Typography,
  Collapse,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Autocomplete,
  Card,
  CardContent,
  Divider,
  Alert,
  Badge,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  Save,
  Restore,
  Download,
  History,
  TuneSharp,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSelector, useDispatch } from 'react-redux';
import {
  useSearchMemoriesMutation,
  useGetConceptsQuery,
} from '../../services/cognitive/api';
import {
  selectCognitiveSearch,
  selectCognitiveConcepts,
  setSearchParams,
  clearSearch,
  setSearchLoading,
  setSearchError,
} from '../../store/cognitive/slice';
import { MemoryCard } from './MemoryCard';
import type {
  CognitiveSearchProps,
  CognitiveSearchParams,
  CognitiveMemory,
  CognitiveTier,
  SecurityRiskLevel,
} from '../../types/cognitive';
import {
  TIER_DEFINITIONS,
  SECURITY_RISK_DEFINITIONS,
  getRiskLevel,
} from '../../types/cognitive';

interface SavedSearch {
  id: string;
  name: string;
  params: CognitiveSearchParams;
  created_at: string;
}

export const SearchInterface: React.FC<CognitiveSearchProps> = ({
  onSearch,
  onMemorySelect,
  placeholder = "Search memories by content, concepts, or metadata...",
  showAdvancedFilters = true,
  compact = false,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Redux state
  const searchState = useSelector(selectCognitiveSearch);
  const conceptsState = useSelector(selectCognitiveConcepts);
  
  // Local state
  const [query, setQuery] = useState(searchState.params.query || '');
  const [showFilters, setShowFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveSearchName, setSaveSearchName] = useState('');
  
  // Filter state
  const [selectedTiers, setSelectedTiers] = useState<CognitiveTier[]>(
    searchState.params.filters?.tier || []
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchState.params.filters?.memory_type || []
  );
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>(
    searchState.params.filters?.concepts || []
  );
  const [riskRange, setRiskRange] = useState<[number, number]>([
    searchState.params.filters?.risk_score?.min || 0,
    searchState.params.filters?.risk_score?.max || 1,
  ]);
  const [importanceRange, setImportanceRange] = useState<[number, number]>([
    searchState.params.filters?.importance?.min || 0,
    searchState.params.filters?.importance?.max || 1,
  ]);
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: searchState.params.filters?.date_range?.start 
      ? new Date(searchState.params.filters.date_range.start) 
      : null,
    end: searchState.params.filters?.date_range?.end 
      ? new Date(searchState.params.filters.date_range.end) 
      : null,
  });

  // API
  const [searchMemories, { isLoading: searchLoading }] = useSearchMemoriesMutation();
  const { data: conceptsData } = useGetConceptsQuery({ limit: 200 });
  
  const availableConcepts = conceptsData?.concepts.map(c => c.concept) || [];
  const memoryTypes = ['llm', 'observation', 'decision'];
  const tiers: CognitiveTier[] = [1, 2, 3, 4];

  // Handle search
  const handleSearch = useCallback(async () => {
    const searchParams: CognitiveSearchParams = {
      query: query.trim() || undefined,
      filters: {
        ...(selectedTiers.length > 0 && { tier: selectedTiers }),
        ...(selectedTypes.length > 0 && { memory_type: selectedTypes as any }),
        ...(selectedConcepts.length > 0 && { concepts: selectedConcepts }),
        ...(riskRange[0] > 0 || riskRange[1] < 1) && {
          risk_score: { min: riskRange[0], max: riskRange[1] }
        },
        ...(importanceRange[0] > 0 || importanceRange[1] < 1) && {
          importance: { min: importanceRange[0], max: importanceRange[1] }
        },
        ...(dateRange.start || dateRange.end) && {
          date_range: {
            start: dateRange.start?.toISOString() || '',
            end: dateRange.end?.toISOString() || new Date().toISOString(),
          }
        },
      },
      limit: 50,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc',
    };

    try {
      dispatch(setSearchLoading(true));
      dispatch(setSearchParams(searchParams));
      
      const result = await searchMemories({
        query: searchParams.query,
        filters: searchParams.filters,
        limit: searchParams.limit,
        offset: searchParams.offset,
      }).unwrap();
      
      onSearch(searchParams);
    } catch (error) {
      dispatch(setSearchError(error?.toString() || 'Search failed'));
    } finally {
      dispatch(setSearchLoading(false));
    }
  }, [
    query, selectedTiers, selectedTypes, selectedConcepts, riskRange, 
    importanceRange, dateRange, searchMemories, dispatch, onSearch
  ]);

  // Handle clear
  const handleClear = () => {
    setQuery('');
    setSelectedTiers([]);
    setSelectedTypes([]);
    setSelectedConcepts([]);
    setRiskRange([0, 1]);
    setImportanceRange([0, 1]);
    setDateRange({ start: null, end: null });
    dispatch(clearSearch());
  };

  // Save search
  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return;
    
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveSearchName,
      params: {
        query,
        filters: {
          tier: selectedTiers,
          memory_type: selectedTypes as any,
          concepts: selectedConcepts,
          risk_score: { min: riskRange[0], max: riskRange[1] },
          importance: { min: importanceRange[0], max: importanceRange[1] },
          date_range: dateRange.start || dateRange.end ? {
            start: dateRange.start?.toISOString() || '',
            end: dateRange.end?.toISOString() || new Date().toISOString(),
          } : undefined,
        },
      },
      created_at: new Date().toISOString(),
    };
    
    setSavedSearches(prev => [newSearch, ...prev]);
    setSaveSearchName('');
  };

  // Load saved search
  const handleLoadSearch = (search: SavedSearch) => {
    setQuery(search.params.query || '');
    setSelectedTiers(search.params.filters?.tier || []);
    setSelectedTypes(search.params.filters?.memory_type || []);
    setSelectedConcepts(search.params.filters?.concepts || []);
    setRiskRange([
      search.params.filters?.risk_score?.min || 0,
      search.params.filters?.risk_score?.max || 1,
    ]);
    setImportanceRange([
      search.params.filters?.importance?.min || 0,
      search.params.filters?.importance?.max || 1,
    ]);
    setDateRange({
      start: search.params.filters?.date_range?.start 
        ? new Date(search.params.filters.date_range.start) 
        : null,
      end: search.params.filters?.date_range?.end 
        ? new Date(search.params.filters.date_range.end) 
        : null,
    });
  };

  // Auto-search on Enter
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const activeFiltersCount = [
    selectedTiers.length,
    selectedTypes.length,
    selectedConcepts.length,
    riskRange[0] > 0 || riskRange[1] < 1 ? 1 : 0,
    importanceRange[0] > 0 || importanceRange[1] < 1 ? 1 : 0,
    dateRange.start || dateRange.end ? 1 : 0,
  ].reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Advanced Memory Search
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search across all cognitive memories with powerful filtering options
          </Typography>
        </Box>

        {/* Search Bar */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack spacing={3}>
            {/* Main Search */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.secondary' }} />,
                }}
                sx={{ flex: 1 }}
              />
              
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={searchLoading}
                sx={{ px: 3 }}
              >
                Search
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleClear}
                startIcon={<Clear />}
              >
                Clear
              </Button>
            </Box>

            {/* Filter Toggle */}
            {showAdvancedFilters && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Advanced Filters
                  {activeFiltersCount > 0 && (
                    <Badge badgeContent={activeFiltersCount} color="primary" sx={{ ml: 1 }} />
                  )}
                </Button>

                {savedSearches.length > 0 && (
                  <Autocomplete
                    size="small"
                    options={savedSearches}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField {...params} label="Saved Searches" sx={{ minWidth: 200 }} />
                    )}
                    onChange={(_, value) => value && handleLoadSearch(value)}
                  />
                )}
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Advanced Filters */}
        <Collapse in={showFilters}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filter Options
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              {/* Tier Filter */}
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Memory Tiers</InputLabel>
                  <Select
                    multiple
                    value={selectedTiers}
                    onChange={(e) => setSelectedTiers(e.target.value as CognitiveTier[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((tier) => (
                          <Chip 
                            key={tier} 
                            label={`Tier ${tier} - ${TIER_DEFINITIONS[tier].name}`}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {tiers.map((tier) => (
                      <MenuItem key={tier} value={tier}>
                        Tier {tier} - {TIER_DEFINITIONS[tier].name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Memory Type Filter */}
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Memory Types</InputLabel>
                  <Select
                    multiple
                    value={selectedTypes}
                    onChange={(e) => setSelectedTypes(e.target.value as string[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((type) => (
                          <Chip key={type} label={type.toUpperCase()} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {memoryTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Concepts Filter */}
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Autocomplete
                  multiple
                  options={availableConcepts}
                  value={selectedConcepts}
                  onChange={(_, newValue) => setSelectedConcepts(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Concepts" placeholder="Select concepts..." />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                />
              </Box>

              {/* Risk Score Range */}
              <Box>
                <Typography gutterBottom>Risk Score Range</Typography>
                <Slider
                  value={riskRange}
                  onChange={(_, newValue) => setRiskRange(newValue as [number, number])}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 0.25, label: '25%' },
                    { value: 0.5, label: '50%' },
                    { value: 0.75, label: '75%' },
                    { value: 1, label: '100%' },
                  ]}
                />
              </Box>

              {/* Importance Range */}
              <Box>
                <Typography gutterBottom>Importance Range</Typography>
                <Slider
                  value={importanceRange}
                  onChange={(_, newValue) => setImportanceRange(newValue as [number, number])}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 0.25, label: '25%' },
                    { value: 0.5, label: '50%' },
                    { value: 0.75, label: '75%' },
                    { value: 1, label: '100%' },
                  ]}
                />
              </Box>

              {/* Date Range */}
              <Box>
                <MuiDatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, start: newValue }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
              
              <Box>
                <MuiDatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, end: newValue }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
            </Box>

            {/* Save Search */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Save this search..."
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                sx={{ flex: 1, maxWidth: 300 }}
              />
              <Button
                variant="outlined"
                startIcon={<Save />}
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
              >
                Save Search
              </Button>
            </Box>
          </Paper>
        </Collapse>

        {/* Search Results */}
        <Box>
          {searchState.error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {searchState.error}
            </Alert>
          )}

          {searchState.results.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Search Results ({searchState.results.length})
              </Typography>
              
              <Stack spacing={2}>
                {searchState.results.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onSelect={onMemorySelect}
                    showMetadata={true}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {!searchLoading && searchState.results.length === 0 && query && (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No memories found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default SearchInterface;