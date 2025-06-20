import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Button,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Launch as LaunchIcon,
  History as HistoryIcon,
  BookmarkBorder as BookmarkIcon,
  Bookmark as BookmarkedIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import { StreamMessage } from './StreamMessage';
import { useObservabilityStore } from '../store/observabilityStore';
import { useUIStore } from '../store/uiStore';

interface SearchResult {
  message_id: string;
  conversation_id: string;
  content: string;
  source_agent_id: string;
  target_agent_id: string;
  communication_type: string;
  direction: string;
  message_type: string;
  timestamp: string;
  metadata: any;
  tokens_used?: number;
  processing_duration_ms?: number;
  relevanceScore: number;
  highlightedContent: string;
}

interface SearchFilters {
  communicationTypes: string[];
  messageTypes: string[];
  agents: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  contentTypes: string[];
  hasMetadata: boolean;
  minRelevance: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  timestamp: string;
  resultCount: number;
}

export const GlobalSearch: React.FC = () => {
  // Store hooks
  const { streamCache, conversations, agents, loadStreamMessages } = useObservabilityStore();
  const { addNotification } = useUIStore();
  
  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [bookmarkedResults, setBookmarkedResults] = useState<Set<string>>(new Set());
  
  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    communicationTypes: [],
    messageTypes: [],
    agents: [],
    dateRange: { start: null, end: null },
    contentTypes: [],
    hasMetadata: false,
    minRelevance: 0
  });
  
  // Get all messages from cache for searching
  const allMessages = useMemo(() => {
    const messages: any[] = [];
    Array.from(streamCache.entries()).forEach(([conversationId, conversationMessages]) => {
      conversationMessages.forEach(msg => {
        messages.push({
          ...msg,
          conversation_id: conversationId
        });
      });
    });
    return messages;
  }, [streamCache]);
  
  // Available filter options
  const availableOptions = useMemo(() => {
    const communicationTypes = new Set<string>();
    const messageTypes = new Set<string>();
    const agentIds = new Set<string>();
    const contentTypes = new Set<string>();
    
    allMessages.forEach(msg => {
      communicationTypes.add(msg.communication_type);
      messageTypes.add(msg.message_type);
      agentIds.add(msg.source_agent_id);
      if (msg.target_agent_id) agentIds.add(msg.target_agent_id);
      
      // Detect content types
      if (msg.content.includes('```')) contentTypes.add('code');
      if (msg.content.includes('http://') || msg.content.includes('https://')) contentTypes.add('links');
      if (msg.content.includes('error') || msg.content.includes('Error')) contentTypes.add('errors');
    });
    
    return {
      communicationTypes: Array.from(communicationTypes),
      messageTypes: Array.from(messageTypes),
      agents: Array.from(agentIds),
      contentTypes: Array.from(contentTypes)
    };
  }, [allMessages]);
  
  // Highlight search terms in content
  const highlightContent = useCallback((content: string, searchQuery: string): string => {
    if (!searchQuery.trim()) return content;
    
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    let highlighted = content;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
  }, []);
  
  // Calculate relevance score
  const calculateRelevance = useCallback((message: any, searchQuery: string): number => {
    if (!searchQuery.trim()) return 1;
    
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const content = message.content.toLowerCase();
    let score = 0;
    
    terms.forEach(term => {
      const termOccurrences = (content.match(new RegExp(term, 'g')) || []).length;
      score += termOccurrences;
      
      // Boost score for exact phrase matches
      if (content.includes(searchQuery.toLowerCase())) {
        score += 10;
      }
      
      // Boost score for matches in metadata
      if (message.metadata && JSON.stringify(message.metadata).toLowerCase().includes(term)) {
        score += 2;
      }
    });
    
    return score;
  }, []);
  
  // Apply filters to messages
  const applyFilters = useCallback((messages: any[]): any[] => {
    return messages.filter(msg => {
      // Communication type filter
      if (filters.communicationTypes.length > 0 && !filters.communicationTypes.includes(msg.communication_type)) {
        return false;
      }
      
      // Message type filter
      if (filters.messageTypes.length > 0 && !filters.messageTypes.includes(msg.message_type)) {
        return false;
      }
      
      // Agent filter
      if (filters.agents.length > 0) {
        const hasAgent = filters.agents.includes(msg.source_agent_id) || 
                         (msg.target_agent_id && filters.agents.includes(msg.target_agent_id));
        if (!hasAgent) return false;
      }
      
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const msgDate = new Date(msg.timestamp);
        if (filters.dateRange.start && msgDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && msgDate > filters.dateRange.end) return false;
      }
      
      // Content type filters
      if (filters.contentTypes.length > 0) {
        const hasContentType = filters.contentTypes.some(type => {
          switch (type) {
            case 'code': return msg.content.includes('```');
            case 'links': return msg.content.includes('http://') || msg.content.includes('https://');
            case 'errors': return msg.content.includes('error') || msg.content.includes('Error');
            default: return false;
          }
        });
        if (!hasContentType) return false;
      }
      
      // Metadata filter
      if (filters.hasMetadata && (!msg.metadata || Object.keys(msg.metadata).length === 0)) {
        return false;
      }
      
      return true;
    });
  }, [filters]);
  
  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Filter messages
      const filteredMessages = applyFilters(allMessages);
      
      // Search and score results
      const searchResults: SearchResult[] = filteredMessages
        .map(msg => {
          const relevanceScore = calculateRelevance(msg, searchQuery);
          return {
            ...msg,
            relevanceScore,
            highlightedContent: highlightContent(msg.content, searchQuery)
          };
        })
        .filter(result => {
          // Text search
          const content = result.content.toLowerCase();
          const queryLower = searchQuery.toLowerCase();
          const hasMatch = content.includes(queryLower) || 
                          result.source_agent_id.toLowerCase().includes(queryLower) ||
                          (result.target_agent_id && result.target_agent_id.toLowerCase().includes(queryLower));
          
          // Relevance filter
          return hasMatch && result.relevanceScore >= filters.minRelevance;
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 100); // Limit results
      
      setResults(searchResults);
      
      // Update recent searches
      const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
      setRecentSearches(updatedRecent);
      
      addNotification({
        type: 'success',
        title: 'Search Complete',
        message: `Found ${searchResults.length} results`
      });
      
    } catch (error) {
      console.error('Search error:', error);
      addNotification({
        type: 'error',
        title: 'Search Failed',
        message: 'An error occurred while searching'
      });
    } finally {
      setIsSearching(false);
    }
  }, [allMessages, applyFilters, calculateRelevance, highlightContent, filters.minRelevance, recentSearches, addNotification]);
  
  // Save current search
  const saveSearch = useCallback(() => {
    if (!query.trim()) return;
    
    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: query.slice(0, 50),
      query,
      filters: { ...filters },
      timestamp: new Date().toISOString(),
      resultCount: results.length
    };
    
    setSavedSearches(prev => [newSearch, ...prev.slice(0, 19)]); // Keep 20 saved searches
    
    addNotification({
      type: 'success',
      title: 'Search Saved',
      message: `Saved search: "${newSearch.name}"`
    });
  }, [query, filters, results.length, addNotification]);
  
  // Load saved search
  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    performSearch(savedSearch.query);
  }, [performSearch]);
  
  // Export results
  const exportResults = useCallback(() => {
    const exportData = {
      query,
      filters,
      timestamp: new Date().toISOString(),
      results: results.map(r => ({
        message_id: r.message_id,
        conversation_id: r.conversation_id,
        content: r.content,
        source_agent_id: r.source_agent_id,
        target_agent_id: r.target_agent_id,
        communication_type: r.communication_type,
        message_type: r.message_type,
        timestamp: r.timestamp,
        relevanceScore: r.relevanceScore
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addNotification({
      type: 'success',
      title: 'Results Exported',
      message: 'Search results downloaded as JSON'
    });
  }, [query, filters, results, addNotification]);
  
  // Toggle bookmark
  const toggleBookmark = useCallback((messageId: string) => {
    setBookmarkedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);
  
  const handleSearch = () => {
    performSearch(query);
  };
  
  const handleClearFilters = () => {
    setFilters({
      communicationTypes: [],
      messageTypes: [],
      agents: [],
      dateRange: { start: null, end: null },
      contentTypes: [],
      hasMetadata: false,
      minRelevance: 0
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Search Header */}
        <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
              Global Search
            </Typography>
            
            <Badge badgeContent={results.length} color="primary">
              <Chip 
                label="Results"
                variant="outlined"
              />
            </Badge>
          </Stack>
          
          {/* Search Input */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Search messages, agents, or content"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              placeholder="Enter search terms..."
            />
            
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              startIcon={isSearching ? <CircularProgress size={16} /> : <SearchIcon />}
            >
              Search
            </Button>
            
            <Tooltip title="Advanced Filters">
              <IconButton 
                onClick={() => setShowFilters(!showFilters)}
                color={showFilters ? 'primary' : 'default'}
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Recent Searches:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <Chip
                    key={index}
                    label={search}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setQuery(search);
                      performSearch(search);
                    }}
                    icon={<HistoryIcon fontSize="small" />}
                  />
                ))}
              </Stack>
            </Box>
          )}
          
          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={saveSearch}
              disabled={!query.trim() || results.length === 0}
              startIcon={<BookmarkIcon />}
            >
              Save Search
            </Button>
            
            <Button
              size="small"
              onClick={exportResults}
              disabled={results.length === 0}
              startIcon={<ExportIcon />}
            >
              Export Results
            </Button>
            
            <Button
              size="small"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              startIcon={<ClearIcon />}
            >
              Clear
            </Button>
          </Stack>
        </Paper>

        {/* Advanced Filters */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Advanced Filters
              </Typography>
              <Button size="small" onClick={handleClearFilters} startIcon={<ClearIcon />}>
                Clear Filters
              </Button>
            </Stack>
            
            <Stack spacing={2}>
              {/* Communication Types */}
              <FormControl>
                <InputLabel>Communication Types</InputLabel>
                <Select
                  multiple
                  value={filters.communicationTypes}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    communicationTypes: e.target.value as string[] 
                  }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availableOptions.communicationTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      <Checkbox checked={filters.communicationTypes.includes(type)} />
                      <ListItemText primary={type} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* More filter controls... */}
            </Stack>
          </Paper>
        )}

        {/* Results */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {isSearching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
            </Box>
          ) : results.length === 0 && query ? (
            <Alert severity="info">
              No results found for "{query}". Try adjusting your search terms or filters.
            </Alert>
          ) : (
            <Box sx={{ height: '100%', overflow: 'auto', px: 1 }}>
              {results.map((result) => (
                <Paper key={result.message_id} sx={{ mb: 2, p: 2 }} elevation={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip 
                        label={`Score: ${result.relevanceScore}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        label={result.conversation_id.slice(0, 8)}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => toggleBookmark(result.message_id)}
                        color={bookmarkedResults.has(result.message_id) ? 'primary' : 'default'}
                      >
                        {bookmarkedResults.has(result.message_id) ? <BookmarkedIcon /> : <BookmarkIcon />}
                      </IconButton>
                      
                      <IconButton size="small" onClick={() => setSelectedResult(result)}>
                        <LaunchIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                  
                  <StreamMessage 
                    message={result}
                    showMetadata={true}
                  />
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
};