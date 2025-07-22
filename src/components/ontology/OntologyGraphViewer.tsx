import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FilterListIcon from '@mui/icons-material/FilterList';
// Dynamic import to avoid AFRAME issues
// import { ForceGraph2D } from 'react-force-graph';
import { apiClient } from '../../api/client';
import { NodeDetailsPanel } from './NodeDetailsPanel';
import { ExportMenu } from '../common/ExportMenu';
import { safeForceGraphImport } from '../../utils/aframe-stub';

interface OntologyNode {
  id: string;
  name: string;
  type: string;
  namespace: string;
  description?: string;
  importance: number;
  metadata: Record<string, any>;
}

interface OntologyEdge {
  source: string;
  target: string;
  type: string;
  label: string;
  strength: number;
  metadata: Record<string, any>;
}

interface OntologyGraph {
  elements: OntologyNode[];
  relationships: OntologyEdge[];
  metadata: {
    total_nodes: number;
    total_edges: number;
    namespaces: string[];
    element_types: string[];
  };
}

interface FilterOptions {
  showEntities: boolean;
  showConcepts: boolean;
  showRelations: boolean;
  showProperties: boolean;
  showCapabilities: boolean;
  minImportance: number;
}

interface GraphControls {
  layout: string;
  filterOptions: FilterOptions;
  onLayoutChange: (layout: string) => void;
  onFilterChange: (options: FilterOptions) => void;
}

const GraphControls: React.FC<GraphControls> = ({
  layout,
  filterOptions,
  onLayoutChange,
  onFilterChange,
}) => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Layout
      </Typography>
      <Select
        value={layout}
        onChange={(e) => onLayoutChange(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      >
        <MenuItem value="force">Force Directed</MenuItem>
        <MenuItem value="hierarchical">Hierarchical</MenuItem>
        <MenuItem value="radial">Radial</MenuItem>
      </Select>

      <Typography variant="subtitle2" gutterBottom>
        Element Types
      </Typography>
      <FormGroup sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filterOptions.showEntities}
              onChange={(e) =>
                onFilterChange({ ...filterOptions, showEntities: e.target.checked })
              }
              size="small"
            />
          }
          label="Entities"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filterOptions.showConcepts}
              onChange={(e) =>
                onFilterChange({ ...filterOptions, showConcepts: e.target.checked })
              }
              size="small"
            />
          }
          label="Concepts"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filterOptions.showRelations}
              onChange={(e) =>
                onFilterChange({ ...filterOptions, showRelations: e.target.checked })
              }
              size="small"
            />
          }
          label="Relations"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filterOptions.showProperties}
              onChange={(e) =>
                onFilterChange({ ...filterOptions, showProperties: e.target.checked })
              }
              size="small"
            />
          }
          label="Properties"
        />
      </FormGroup>

      <Typography variant="subtitle2" gutterBottom>
        Min Importance
      </Typography>
      <Slider
        value={filterOptions.minImportance}
        onChange={(_, value) =>
          onFilterChange({ ...filterOptions, minImportance: value as number })
        }
        min={0}
        max={1}
        step={0.1}
        marks
        valueLabelDisplay="auto"
        size="small"
      />
    </Box>
  );
};

interface OntologyGraphViewerProps {
  namespace?: string;
  elementTypes?: string[];
  layout?: 'force' | 'hierarchical' | 'radial';
  onNodeClick?: (node: OntologyNode) => void;
}

export const OntologyGraphViewer: React.FC<OntologyGraphViewerProps> = ({
  namespace = 'geneva.core',
  elementTypes = [],
  layout: initialLayout = 'force',
  onNodeClick,
}) => {
  const [graphData, setGraphData] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [layout, setLayout] = useState(initialLayout);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    showEntities: true,
    showConcepts: true,
    showRelations: true,
    showProperties: true,
    showCapabilities: true,
    minImportance: 0,
  });
  
  // Dynamic ForceGraph2D loading to avoid AFRAME issues
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState(true);

  const loadOntologyGraph = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build filter types based on options
      const types = [];
      if (filterOptions.showEntities) types.push('entity');
      if (filterOptions.showConcepts) types.push('concept');
      if (filterOptions.showRelations) types.push('relation');
      if (filterOptions.showProperties) types.push('property');
      if (filterOptions.showCapabilities) types.push('capability');

      const response = await apiClient.get('/ontology/graph', {
        params: {
          namespace,
          types: types.length > 0 ? types : undefined,
          min_importance: filterOptions.minImportance,
        },
      });

      const data = response.data as OntologyGraph;

      // Convert to ForceGraph format
      const nodes = data.elements.map((element) => ({
        id: element.id,
        name: element.name,
        label: element.name,
        type: element.type,
        namespace: element.namespace,
        color: getNodeColor(element.type),
        size: getNodeSize(element),
        metadata: element,
      }));

      const links = data.relationships.map((rel) => ({
        source: rel.source,
        target: rel.target,
        type: rel.type,
        label: rel.label,
        value: rel.strength,
      }));

      setGraphData({ nodes, links });
    } catch (err) {
      console.error('Failed to load ontology graph:', err);
      setError('Failed to load ontology graph');
    } finally {
      setLoading(false);
    }
  }, [namespace, filterOptions]);

  // Dynamic import ForceGraph2D to avoid AFRAME issues
  useEffect(() => {
    const loadForceGraph = async () => {
      try {
        const module = await safeForceGraphImport();
        setForceGraph2D(() => module.ForceGraph2D);
        setGraphLoading(false);
      } catch (err) {
        console.error('Failed to load ForceGraph2D:', err);
        setGraphLoading(false);
      }
    };

    loadForceGraph();
  }, []);

  useEffect(() => {
    loadOntologyGraph();
  }, [loadOntologyGraph]);

  const handleNodeClick = useCallback(
    (node: any) => {
      const ontologyNode: OntologyNode = node.metadata;
      setSelectedNode(ontologyNode);
      onNodeClick?.(ontologyNode);
    },
    [onNodeClick]
  );

  const getNodeColor = (type: string): string => {
    const colors: Record<string, string> = {
      entity: '#1976d2',
      concept: '#388e3c',
      relation: '#f57c00',
      property: '#7b1fa2',
      capability: '#c2185b',
    };
    return colors[type] || '#757575';
  };

  const getNodeSize = (node: OntologyNode): number => {
    return 5 + (node.importance || 0.5) * 15;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={600}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      {/* Main Graph Area */}
      <Box sx={{ flex: 1, position: 'relative', bgcolor: 'background.default' }}>
        {graphLoading || !ForceGraph2D ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading graph visualization...</Typography>
          </Box>
        ) : (
          graphData && (
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="label"
              nodeColor="color"
              nodeVal="size"
              linkLabel="label"
              linkWidth={(link: any) => (link.value || 1) * 2}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
            />
          )
        )}

        {/* Graph Controls */}
        <Paper
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            p: 2,
            minWidth: 250,
            display: showFilters ? 'block' : 'none',
          }}
        >
          <GraphControls
            layout={layout}
            onLayoutChange={(layout) => setLayout(layout as 'radial' | 'force' | 'hierarchical')}
            filterOptions={filterOptions}
            onFilterChange={setFilterOptions}
          />
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <ExportMenu
            data={graphData.nodes}
            filename="ontology-graph"
            title="Ontology Graph Export"
            headers={['id', 'name', 'type', 'namespace', 'version']}
          />
          <Tooltip title="Toggle Filters">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={loadOntologyGraph}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Legend */}
        <Paper sx={{ position: 'absolute', bottom: 16, left: 16, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Legend
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.5}>
            {Object.entries({
              entity: '#1976d2',
              concept: '#388e3c',
              relation: '#f57c00',
              property: '#7b1fa2',
              capability: '#c2185b',
            }).map(([type, color]) => (
              <Box key={type} display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: color,
                  }}
                />
                <Typography variant="caption" textTransform="capitalize">
                  {type}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Node Details Panel */}
      {selectedNode && (
        <Paper sx={{ width: 400, p: 3, overflowY: 'auto' }}>
          <NodeDetailsPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        </Paper>
      )}
    </Box>
  );
};