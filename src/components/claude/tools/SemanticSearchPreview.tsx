import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
  Description as DocumentIcon,
  Api as ApiIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import {
  SemanticSearchQuery,
  SemanticSearchResult
} from '../../../types/geneva-tools';

interface SemanticSearchPreviewProps {
  onSearch?: (query: string) => Promise<SemanticSearchResult[]>;
  projectId?: string;
  maxResults?: number;
  showFilters?: boolean;
}

const RESULT_TYPE_ICONS = {
  'code': <CodeIcon />,
  'documentation': <DocumentIcon />,
  'api_spec': <ApiIcon />,
  'memory_node': <StorageIcon />,
  'pattern': <PsychologyIcon />,
  'default': <DocumentIcon />
};

const RESULT_TYPE_COLORS = {
  'code': 'primary',
  'documentation': 'info',
  'api_spec': 'warning',
  'memory_node': 'success',
  'pattern': 'secondary'
} as const;

export const SemanticSearchPreview: React.FC<SemanticSearchPreviewProps> = ({
  onSearch,
  projectId,
  maxResults = 10,
  showFilters = true
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  // Mock search function for demonstration
  const mockSearch = async (searchQuery: string): Promise<SemanticSearchResult[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockResults: SemanticSearchResult[] = [
      {
        id: 'result-1',
        content: 'React component for user authentication with TypeScript support. Includes form validation, error handling, and JWT token management.',
        score: 0.94,
        metadata: {
          type: 'code',
          source: 'src/components/auth/LoginForm.tsx',
          timestamp: '2024-01-15T10:30:00Z',
          tags: ['react', 'typescript', 'authentication', 'jwt']
        },
        context: 'This component implements the main authentication flow for the application, providing secure login functionality with comprehensive error handling.',
        projectId: projectId || 'project-1'
      },
      {
        id: 'result-2',
        content: 'API endpoint documentation for user management operations including CRUD operations, role-based access control, and audit logging.',
        score: 0.89,
        metadata: {
          type: 'api_spec',
          source: 'docs/api/users.yaml',
          timestamp: '2024-01-14T15:45:00Z',
          tags: ['api', 'users', 'rbac', 'crud']
        },
        context: 'Comprehensive API specification covering all user management operations with detailed request/response schemas and authentication requirements.',
        projectId: projectId || 'project-1'
      },
      {
        id: 'result-3',
        content: 'Memory node containing patterns for React state management using Zustand. Includes best practices for store organization and type safety.',
        score: 0.87,
        metadata: {
          type: 'memory_node',
          source: 'memory/patterns/state-management',
          timestamp: '2024-01-13T09:20:00Z',
          tags: ['zustand', 'state-management', 'patterns', 'typescript']
        },
        context: 'Curated collection of proven patterns for managing application state with Zustand, focusing on scalability and type safety.',
        projectId: projectId || 'project-1'
      },
      {
        id: 'result-4',
        content: 'Best practices documentation for implementing responsive design patterns using CSS Grid and Flexbox with Material-UI components.',
        score: 0.82,
        metadata: {
          type: 'documentation',
          source: 'docs/design-system/responsive.md',
          timestamp: '2024-01-12T14:10:00Z',
          tags: ['responsive', 'css', 'mui', 'design-system']
        },
        context: 'Guidelines and examples for creating responsive layouts that work across all device sizes using modern CSS techniques.',
        projectId: projectId || 'project-1'
      },
      {
        id: 'result-5',
        content: 'Code pattern for error boundary implementation in React applications with fallback UI and error reporting integration.',
        score: 0.78,
        metadata: {
          type: 'pattern',
          source: 'patterns/error-boundaries',
          timestamp: '2024-01-11T11:30:00Z',
          tags: ['react', 'error-handling', 'patterns', 'reliability']
        },
        context: 'Robust error boundary pattern that gracefully handles component failures and provides meaningful feedback to users.',
        projectId: projectId || 'project-1'
      }
    ];

    // Filter results based on query relevance
    return mockResults.filter(result => 
      result.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, maxResults);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchResults = onSearch ? await onSearch(query) : await mockSearch(query);
      setResults(searchResults);
      
      // Add to recent queries
      setRecentQueries(prev => {
        const updated = [query, ...prev.filter(q => q !== query)].slice(0, 5);
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredResults = selectedFilters.length > 0 
    ? results.filter(result => selectedFilters.includes(result.metadata.type))
    : results;

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'success';
    if (score >= 0.8) return 'warning';
    return 'error';
  };

  const availableFilters = Array.from(new Set(results.map(r => r.metadata.type)));

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Semantic Search Preview
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Search across the Geneva knowledge base using semantic similarity. 
        Find relevant code, documentation, patterns, and memory nodes.
      </Typography>

      {/* Search Input */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search for patterns, code, documentation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          startIcon={<SearchIcon />}
        >
          Search
        </Button>
      </Box>

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Recent searches:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
            {recentQueries.map((recentQuery, index) => (
              <Chip
                key={index}
                label={recentQuery}
                size="small"
                variant="outlined"
                onClick={() => setQuery(recentQuery)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Filters */}
      {showFilters && availableFilters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FilterIcon fontSize="small" />
            <Typography variant="subtitle2">Filter by type:</Typography>
            {selectedFilters.length > 0 && (
              <IconButton size="small" onClick={() => setSelectedFilters([])}>
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {availableFilters.map((filter) => (
              <Chip
                key={filter}
                label={filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                color={selectedFilters.includes(filter) ? RESULT_TYPE_COLORS[filter as keyof typeof RESULT_TYPE_COLORS] || 'default' : 'default'}
                variant={selectedFilters.includes(filter) ? 'filled' : 'outlined'}
                onClick={() => handleFilterToggle(filter)}
                size="small"
                icon={RESULT_TYPE_ICONS[filter as keyof typeof RESULT_TYPE_ICONS] || RESULT_TYPE_ICONS.default}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Searching semantic space...
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {filteredResults.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            {selectedFilters.length > 0 && ` (filtered by ${selectedFilters.join(', ')})`}
          </Typography>

          <List>
            {filteredResults.map((result, index) => (
              <ListItem key={result.id} sx={{ px: 0, pb: 2 }}>
                <Card sx={{ width: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {RESULT_TYPE_ICONS[result.metadata.type as keyof typeof RESULT_TYPE_ICONS] || RESULT_TYPE_ICONS.default}
                        <Typography variant="subtitle2">
                          {result.metadata.source}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${Math.round(result.score * 100)}%`}
                        size="small"
                        color={getScoreColor(result.score)}
                        icon={<TrendingUpIcon />}
                      />
                    </Box>

                    <Typography variant="body2" paragraph>
                      {result.content}
                    </Typography>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="caption">
                          View context and metadata
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Context:
                            </Typography>
                            <Typography variant="body2">
                              {result.context}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Tags:
                            </Typography>
                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                              {result.metadata.tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Stack>
                          </Box>

                          <Typography variant="caption" color="text.secondary">
                            Last updated: {new Date(result.metadata.timestamp).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* No Results */}
      {!loading && query && filteredResults.length === 0 && (
        <Alert severity="info">
          No results found for "{query}". Try different keywords or remove filters.
        </Alert>
      )}

      {/* Empty State */}
      {!query && results.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Search the Knowledge Base
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a query to find relevant code, documentation, and patterns
          </Typography>
        </Box>
      )}
    </Paper>
  );
};