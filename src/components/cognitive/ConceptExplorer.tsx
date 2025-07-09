/**
 * Concept Explorer Component
 * Semantic concept navigation and exploration interface
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  TextField,
  InputAdornment,
  Autocomplete,
  Badge,
  Collapse,
  LinearProgress,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccountTree,
  Search,
  TrendingUp,
  TrendingDown,
  Refresh,
  FilterList,
  ExpandMore,
  ExpandLess,
  Link as LinkIcon,
  Visibility,
  Timeline,
  Analytics,
  Share,
  BookmarkBorder,
  Bookmark,
  CloudQueue,
} from '@mui/icons-material';
// import { 
//   ForceGraph2D,
//   ForceGraph3D,
// } from 'react-force-graph';
// import { TagCloud } from 'react-tagcloud';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetConceptsQuery,
  useGetMemoriesByConceptQuery,
  useGetConceptRelationshipsQuery,
} from '../../services/cognitive/api';
import {
  selectCognitiveConcepts,
  selectCognitiveUI,
  setSelectedConcept,
} from '../../store/cognitive/slice';
import { MemoryCard } from './MemoryCard';
import type {
  ConceptExplorerProps,
  ConceptUsage,
  CognitiveMemory,
} from '../../types/cognitive';

interface ConceptNode {
  id: string;
  name: string;
  count: number;
  category?: string;
  level: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface ConceptLink {
  source: string;
  target: string;
  strength: number;
  co_occurrence: number;
}

interface ConceptCluster {
  id: string;
  name: string;
  concepts: string[];
  color: string;
  count: number;
}

export const ConceptExplorer: React.FC<ConceptExplorerProps> = ({
  projectId,
  onConceptSelect,
  showUsageStats = true,
  maxConcepts = 100,
  compact = false,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Redux state
  const conceptsState = useSelector(selectCognitiveConcepts);
  const uiState = useSelector(selectCognitiveUI);
  
  // Local state
  const [viewMode, setViewMode] = useState<'cloud' | 'graph' | 'list'>('cloud');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minUsageCount, setMinUsageCount] = useState(1);
  const [showRelationships, setShowRelationships] = useState(true);
  const [graphDimensions, setGraphDimensions] = useState<'2d' | '3d'>('2d');
  const [conceptClusters, setConceptClusters] = useState<ConceptCluster[]>([]);
  const [bookmarkedConcepts, setBookmarkedConcepts] = useState<Set<string>>(new Set());

  // API queries
  const { 
    data: conceptsData, 
    isLoading: conceptsLoading, 
    refetch: refetchConcepts 
  } = useGetConceptsQuery({ 
    limit: maxConcepts, 
    min_count: minUsageCount,
    sort_by: 'count',
    sort_order: 'desc'
  });

  const { 
    data: selectedConceptMemories, 
    isLoading: memoriesLoading 
  } = useGetMemoriesByConceptQuery({
    concept: uiState.selectedConcept || '',
    limit: 20,
  }, {
    skip: !uiState.selectedConcept
  });

  const { 
    data: conceptRelationships,
    isLoading: relationshipsLoading 
  } = useGetConceptRelationshipsQuery({
    concept: uiState.selectedConcept || '',
    limit: 50,
    min_strength: 0.1
  }, {
    skip: !uiState.selectedConcept || !showRelationships
  });

  // Process concepts data
  const concepts = conceptsData?.concepts || [];
  const filteredConcepts = useMemo(() => {
    return concepts.filter(concept => {
      const matchesSearch = !searchQuery || 
        concept.concept.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        concept.concept.startsWith(selectedCategory);
      const matchesUsage = concept.count >= minUsageCount;
      
      return matchesSearch && matchesCategory && matchesUsage;
    });
  }, [concepts, searchQuery, selectedCategory, minUsageCount]);

  // Generate concept categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    concepts.forEach(concept => {
      // Simple categorization by first word or common prefixes
      const parts = concept.concept.split(/[-_\s]/);
      if (parts.length > 1) {
        cats.add(parts[0]);
      }
    });
    return ['all', ...Array.from(cats).sort()];
  }, [concepts]);

  // Generate concept clusters
  useEffect(() => {
    const clusters: ConceptCluster[] = [
      {
        id: 'security',
        name: 'Security & Privacy',
        concepts: concepts.filter(c => 
          ['security', 'auth', 'privacy', 'credential', 'encryption', 'permission']
            .some(term => c.concept.toLowerCase().includes(term))
        ).map(c => c.concept),
        color: theme.palette.error.main,
        count: 0,
      },
      {
        id: 'technical',
        name: 'Technical & Infrastructure',
        concepts: concepts.filter(c => 
          ['api', 'database', 'server', 'network', 'system', 'infrastructure']
            .some(term => c.concept.toLowerCase().includes(term))
        ).map(c => c.concept),
        color: theme.palette.info.main,
        count: 0,
      },
      {
        id: 'business',
        name: 'Business & Strategy',
        concepts: concepts.filter(c => 
          ['business', 'strategy', 'process', 'workflow', 'organization', 'team']
            .some(term => c.concept.toLowerCase().includes(term))
        ).map(c => c.concept),
        color: theme.palette.success.main,
        count: 0,
      },
      {
        id: 'data',
        name: 'Data & Analytics',
        concepts: concepts.filter(c => 
          ['data', 'analytics', 'metric', 'report', 'analysis', 'insight']
            .some(term => c.concept.toLowerCase().includes(term))
        ).map(c => c.concept),
        color: theme.palette.warning.main,
        count: 0,
      },
    ];

    // Calculate cluster counts
    clusters.forEach(cluster => {
      cluster.count = cluster.concepts.reduce((sum, conceptName) => {
        const concept = concepts.find(c => c.concept === conceptName);
        return sum + (concept?.count || 0);
      }, 0);
    });

    setConceptClusters(clusters);
  }, [concepts, theme]);

  // Handle concept selection
  const handleConceptSelect = (concept: string) => {
    dispatch(setSelectedConcept(concept));
    if (onConceptSelect) {
      onConceptSelect(concept);
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = (concept: string) => {
    setBookmarkedConcepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(concept)) {
        newSet.delete(concept);
      } else {
        newSet.add(concept);
      }
      return newSet;
    });
  };

  // Prepare tag cloud data
  const tagCloudData = filteredConcepts.map(concept => ({
    value: concept.concept,
    count: concept.count,
    color: conceptClusters.find(cluster => 
      cluster.concepts.includes(concept.concept)
    )?.color || theme.palette.primary.main,
  }));

  // Prepare graph data
  const graphData = useMemo(() => {
    if (!conceptRelationships || !showRelationships) {
      return { nodes: [], links: [] };
    }

    const nodes: ConceptNode[] = [];
    const links: ConceptLink[] = [];
    
    // Add main concept
    const mainConcept = concepts.find(c => c.concept === uiState.selectedConcept);
    if (mainConcept) {
      nodes.push({
        id: mainConcept.concept,
        name: mainConcept.concept,
        count: mainConcept.count,
        level: 0,
      });
    }

    // Add related concepts
    conceptRelationships.related_concepts.forEach(related => {
      const relatedConcept = concepts.find(c => c.concept === related.concept);
      if (relatedConcept) {
        nodes.push({
          id: related.concept,
          name: related.concept,
          count: relatedConcept.count,
          level: 1,
        });

        links.push({
          source: uiState.selectedConcept!,
          target: related.concept,
          strength: related.relationship_strength,
          co_occurrence: related.co_occurrence_count,
        });
      }
    });

    return { nodes, links };
  }, [conceptRelationships, concepts, uiState.selectedConcept, showRelationships]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Concept Explorer
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Navigate and explore semantic concepts across your cognitive memory
        </Typography>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' } }}>
          <Box sx={{ flex: { md: '0 0 33%' } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Box sx={{ flex: { md: '0 0 16%' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ flex: { md: '0 0 16%' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Min Usage</InputLabel>
              <Select
                value={minUsageCount}
                label="Min Usage"
                onChange={(e) => setMinUsageCount(Number(e.target.value))}
              >
                <MenuItem value={1}>1+</MenuItem>
                <MenuItem value={5}>5+</MenuItem>
                <MenuItem value={10}>10+</MenuItem>
                <MenuItem value={25}>25+</MenuItem>
                <MenuItem value={50}>50+</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ flex: { md: '0 0 33%' } }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant={viewMode === 'cloud' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('cloud')}
                startIcon={<CloudQueue />}
              >
                Cloud
              </Button>
              <Button
                variant={viewMode === 'graph' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('graph')}
                startIcon={<AccountTree />}
              >
                Graph
              </Button>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('list')}
                startIcon={<FilterList />}
              >
                List
              </Button>
              
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => refetchConcepts()}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Main Content */}
        <Box sx={{ flex: { md: '0 0 66.67%' } }}>
          {/* Concept Visualization */}
          <Paper sx={{ p: 3, mb: 3, minHeight: 500 }}>
            {conceptsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {viewMode === 'cloud' && (
                  <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <CloudQueue sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Tag Cloud View
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Interactive concept cloud visualization
                      </Typography>
                    </Box>
                  </Box>
                )}

                {viewMode === 'graph' && uiState.selectedConcept && (
                  <Box sx={{ height: 400, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    {relationshipsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <AccountTree sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            Concept Relationship Graph
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Interactive network visualization of concept relationships
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {viewMode === 'list' && (
                  <List>
                    {filteredConcepts.map((concept) => (
                      <ListItem key={concept.concept} disablePadding>
                        <ListItemButton
                          selected={uiState.selectedConcept === concept.concept}
                          onClick={() => handleConceptSelect(concept.concept)}
                        >
                          <ListItemText
                            primary={concept.concept}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip 
                                  label={`${concept.count} uses`} 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {concept.percentage.toFixed(1)}% of total
                                </Typography>
                              </Box>
                            }
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmarkToggle(concept.concept);
                            }}
                            sx={{ color: bookmarkedConcepts.has(concept.concept) ? 'warning.main' : 'action.secondary' }}
                          >
                            {bookmarkedConcepts.has(concept.concept) ? <Bookmark /> : <BookmarkBorder />}
                          </IconButton>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            )}
          </Paper>

          {/* Selected Concept Memories */}
          {uiState.selectedConcept && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Memories containing "{uiState.selectedConcept}"
              </Typography>
              
              {memoriesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : selectedConceptMemories?.memories.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No memories found for this concept
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {selectedConceptMemories?.memories.slice(0, 5).map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      compact={true}
                      showMetadata={true}
                    />
                  ))}
                  
                  {(selectedConceptMemories?.memories.length || 0) > 5 && (
                    <Button variant="outlined" fullWidth>
                      View All {selectedConceptMemories?.total} Memories
                    </Button>
                  )}
                </Stack>
              )}
            </Paper>
          )}
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: { md: '0 0 33.33%' } }}>
          {/* Concept Clusters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Concept Clusters
            </Typography>
            
            <Stack spacing={2}>
              {conceptClusters.map((cluster) => (
                <Card
                  key={cluster.id}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${cluster.color}`,
                    '&:hover': {
                      bgcolor: alpha(cluster.color, 0.05),
                    },
                  }}
                >
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {cluster.name}
                      </Typography>
                      <Chip
                        label={cluster.concepts.length}
                        size="small"
                        sx={{ bgcolor: alpha(cluster.color, 0.1), color: cluster.color }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {cluster.count.toLocaleString()} total uses
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {cluster.concepts.slice(0, 5).map((concept) => (
                        <Chip
                          key={concept}
                          label={concept}
                          size="small"
                          variant="outlined"
                          onClick={() => handleConceptSelect(concept)}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                      {cluster.concepts.length > 5 && (
                        <Chip
                          label={`+${cluster.concepts.length - 5} more`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>

          {/* Usage Statistics */}
          {showUsageStats && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Usage Statistics
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total Concepts</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {concepts.length.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Filtered Results</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {filteredConcepts.length.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Bookmarked</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {bookmarkedConcepts.size}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Top Concepts by Usage
                  </Typography>
                  
                  {concepts.slice(0, 5).map((concept, index) => (
                    <Box key={concept.concept} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption">
                          {index + 1}. {concept.concept}
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {concept.count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={concept.percentage}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  ))}
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Relationship Network */}
          {uiState.selectedConcept && conceptRelationships && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Related Concepts
              </Typography>
              
              <List dense>
                {conceptRelationships.related_concepts.slice(0, 10).map((related) => (
                  <ListItem key={related.concept} disablePadding>
                    <ListItemButton onClick={() => handleConceptSelect(related.concept)}>
                    <ListItemText
                      primary={related.concept}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`${(related.relationship_strength * 100).toFixed(0)}% match`}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="caption">
                            {related.co_occurrence_count} co-occurrences
                          </Typography>
                        </Box>
                      }
                    />
                      <IconButton size="small">
                        <LinkIcon />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ConceptExplorer;