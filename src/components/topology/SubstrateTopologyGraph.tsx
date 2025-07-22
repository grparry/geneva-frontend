import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  FormControlLabel,
  Switch,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
// Dynamic import to avoid AFRAME issues
// import { ForceGraph2D } from 'react-force-graph';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import StorageIcon from '@mui/icons-material/Storage';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import { apiClient } from '../../api/client';
import { useWebSocketSubscription } from '../../hooks/useWebSocket';
import { topologyWebSocket } from '../../services/websocket';
import { SubstrateDetailDialog } from '../federation/SubstrateDetailDialog';
import { AgentDetailDialog } from '../ontology/AgentDetailDialog';
import { TrustLevel, PeerStatus } from '../../types/federation';
import { safeForceGraphImport } from '../../utils/aframe-stub';

interface SubstrateNode {
  id: string;
  name: string;
  type: 'substrate' | 'agent' | 'memory' | 'service';
  group: string;
  status: 'active' | 'inactive' | 'error';
  metrics?: {
    cpu?: number;
    memory?: number;
    requests?: number;
    latency?: number;
  };
  capabilities?: string[];
  trust_level?: number;
}

interface SubstrateLink {
  source: string;
  target: string;
  type: 'federation' | 'delegation' | 'data_flow' | 'trust';
  strength: number;
  bidirectional?: boolean;
  metadata?: {
    protocol?: string;
    bandwidth?: number;
    latency?: number;
  };
}

interface TopologyData {
  nodes: SubstrateNode[];
  links: SubstrateLink[];
  clusters?: {
    id: string;
    name: string;
    nodes: string[];
    color?: string;
  }[];
}

interface SubstrateTopologyGraphProps {
  substrateId?: string;
  viewMode?: 'federation' | 'infrastructure' | 'data_flow';
  onNodeClick?: (node: SubstrateNode) => void;
  onLinkClick?: (link: SubstrateLink) => void;
}

export const SubstrateTopologyGraph: React.FC<SubstrateTopologyGraphProps> = ({
  substrateId,
  viewMode = 'federation',
  onNodeClick,
  onLinkClick,
}) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [topologyData, setTopologyData] = useState<TopologyData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);
  const [linkOpacity, setLinkOpacity] = useState(0.6);
  const [nodeSize, setNodeSize] = useState(8);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeFilters, setActiveFilters] = useState({
    nodeTypes: ['substrate', 'agent', 'memory', 'service'],
    linkTypes: ['federation', 'delegation', 'data_flow', 'trust'],
    minTrustLevel: 0,
  });
  const [selectedNode, setSelectedNode] = useState<SubstrateNode | null>(null);
  const [substrateDialogOpen, setSubstrateDialogOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  
  // Dynamic ForceGraph2D loading to avoid AFRAME issues
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState(true);

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
    loadTopologyData();
  }, [substrateId, viewMode]);

  // Subscribe to real-time topology updates
  useWebSocketSubscription(topologyWebSocket, 'topology.update', (update: any) => {
    if (update.substrate_id === substrateId) {
      setTopologyData(prevData => ({
        nodes: update.nodes || prevData.nodes,
        links: update.links || prevData.links,
      }));
    }
  });

  useWebSocketSubscription(topologyWebSocket, 'node.status', (update: any) => {
    setTopologyData(prevData => ({
      ...prevData,
      nodes: prevData.nodes.map(node =>
        node.id === update.node_id
          ? { ...node, status: update.status, metrics: update.metrics }
          : node
      ),
    }));
  });

  useWebSocketSubscription(topologyWebSocket, 'link.update', (update: any) => {
    setTopologyData(prevData => ({
      ...prevData,
      links: prevData.links.map(link =>
        link.source === update.source && link.target === update.target
          ? { ...link, ...update.properties }
          : link
      ),
    }));
  });

  const loadTopologyData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/topology/graph', {
        params: {
          substrate_id: substrateId,
          view_mode: viewMode,
        },
      });
      setTopologyData(response.data);
    } catch (error) {
      console.error('Failed to load topology:', error);
      // Use mock data for demo
      const mockData: TopologyData = {
        nodes: [
          {
            id: 'substrate-1',
            name: 'Primary Substrate',
            type: 'substrate',
            group: 'core',
            status: 'active',
            metrics: { cpu: 45, memory: 62, requests: 1250, latency: 23 },
            capabilities: ['federation', 'memory_management', 'agent_execution'],
            trust_level: 1.0,
          },
          {
            id: 'substrate-2',
            name: 'Partner Substrate A',
            type: 'substrate',
            group: 'partner',
            status: 'active',
            metrics: { cpu: 38, memory: 55, requests: 890, latency: 31 },
            capabilities: ['federation', 'data_processing'],
            trust_level: 0.8,
          },
          {
            id: 'substrate-3',
            name: 'Partner Substrate B',
            type: 'substrate',
            group: 'partner',
            status: 'active',
            metrics: { cpu: 52, memory: 71, requests: 1560, latency: 28 },
            capabilities: ['federation', 'analytics'],
            trust_level: 0.75,
          },
          {
            id: 'agent-1',
            name: 'Federation Coordinator',
            type: 'agent',
            group: 'substrate-1',
            status: 'active',
            capabilities: ['task_delegation', 'trust_evaluation'],
          },
          {
            id: 'agent-2',
            name: 'Memory Manager',
            type: 'agent',
            group: 'substrate-1',
            status: 'active',
            capabilities: ['memory_operations', 'indexing'],
          },
          {
            id: 'memory-1',
            name: 'Shared Memory Pool',
            type: 'memory',
            group: 'substrate-1',
            status: 'active',
            metrics: { memory: 85, requests: 3200 },
          },
          {
            id: 'service-1',
            name: 'MCP Discovery',
            type: 'service',
            group: 'infrastructure',
            status: 'active',
          },
        ],
        links: [
          {
            source: 'substrate-1',
            target: 'substrate-2',
            type: 'federation',
            strength: 0.8,
            bidirectional: true,
            metadata: { protocol: 'MCP', bandwidth: 1000, latency: 23 },
          },
          {
            source: 'substrate-1',
            target: 'substrate-3',
            type: 'federation',
            strength: 0.75,
            bidirectional: true,
            metadata: { protocol: 'MCP', bandwidth: 850, latency: 28 },
          },
          {
            source: 'substrate-2',
            target: 'substrate-3',
            type: 'trust',
            strength: 0.6,
            bidirectional: false,
          },
          {
            source: 'agent-1',
            target: 'substrate-1',
            type: 'delegation',
            strength: 1.0,
          },
          {
            source: 'agent-2',
            target: 'memory-1',
            type: 'data_flow',
            strength: 0.9,
          },
          {
            source: 'substrate-1',
            target: 'service-1',
            type: 'data_flow',
            strength: 0.7,
          },
        ],
        clusters: [
          {
            id: 'core-cluster',
            name: 'Core Infrastructure',
            nodes: ['substrate-1', 'agent-1', 'agent-2', 'memory-1'],
            color: '#1976d2',
          },
          {
            id: 'partner-cluster',
            name: 'Partner Network',
            nodes: ['substrate-2', 'substrate-3'],
            color: '#388e3c',
          },
        ],
      };
      setTopologyData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (node: SubstrateNode) => {
    if (node.status === 'error') return '#f44336';
    if (node.status === 'inactive') return '#9e9e9e';
    
    switch (node.type) {
      case 'substrate':
        return node.group === 'core' ? '#1976d2' : '#388e3c';
      case 'agent':
        return '#ff9800';
      case 'memory':
        return '#9c27b0';
      case 'service':
        return '#00bcd4';
      default:
        return '#757575';
    }
  };

  const getLinkColor = (link: SubstrateLink) => {
    switch (link.type) {
      case 'federation':
        return '#2196f3';
      case 'delegation':
        return '#ff9800';
      case 'data_flow':
        return '#4caf50';
      case 'trust':
        return '#9c27b0';
      default:
        return '#999';
    }
  };

  const getNodeSize = (node: SubstrateNode) => {
    let baseSize = nodeSize;
    if (node.type === 'substrate') baseSize *= 1.5;
    if (node.metrics?.requests) {
      baseSize *= (1 + node.metrics.requests / 5000);
    }
    return baseSize;
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    
    // Open appropriate dialog based on node type
    if (node.type === 'substrate') {
      setSubstrateDialogOpen(true);
    } else if (node.type === 'agent') {
      setAgentDialogOpen(true);
    }
    
    // Also call the prop callback if provided
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  const handleLinkClick = (link: any) => {
    if (onLinkClick) {
      onLinkClick(link);
    }
  };

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1.2);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(0.8);
    }
  };

  const handleCenterGraph = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setFullscreen(!fullscreen);
  };

  const exportTopology = () => {
    const data = {
      topology: topologyData,
      viewMode,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topology-${viewMode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredNodes = topologyData.nodes.filter(node => 
    activeFilters.nodeTypes.includes(node.type) &&
    (node.trust_level === undefined || node.trust_level >= activeFilters.minTrustLevel)
  );

  const filteredData = {
    nodes: filteredNodes,
    links: topologyData.links.filter(link =>
      activeFilters.linkTypes.includes(link.type) &&
      filteredNodes.some((n: SubstrateNode) => n.id === link.source) &&
      filteredNodes.some((n: SubstrateNode) => n.id === link.target)
    ),
  };

  const nodeLabel = (node: SubstrateNode) => {
    let label = node.name;
    if (showMetrics && node.metrics) {
      if (node.metrics.cpu) label += `\nCPU: ${node.metrics.cpu}%`;
      if (node.metrics.latency) label += `\nLatency: ${node.metrics.latency}ms`;
    }
    return label;
  };

  return (
    <Box ref={containerRef} sx={{ height: '100%', position: 'relative' }}>
      {/* Controls */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 200,
        }}
      >
        <Typography variant="h6">Topology Controls</Typography>
        
        <Box display="flex" gap={1}>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} size="small">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} size="small">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Center View">
            <IconButton onClick={handleCenterGraph} size="small">
              <CenterFocusStrongIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Fullscreen">
            <IconButton onClick={toggleFullscreen} size="small">
              {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              size="small"
            />
          }
          label="Show Labels"
        />

        <FormControlLabel
          control={
            <Switch
              checked={showMetrics}
              onChange={(e) => setShowMetrics(e.target.checked)}
              size="small"
            />
          }
          label="Show Metrics"
        />

        <Box>
          <Typography variant="caption">Link Opacity</Typography>
          <Slider
            value={linkOpacity}
            onChange={(_, value) => setLinkOpacity(value as number)}
            min={0.1}
            max={1}
            step={0.1}
            size="small"
          />
        </Box>

        <Box>
          <Typography variant="caption">Node Size</Typography>
          <Slider
            value={nodeSize}
            onChange={(_, value) => setNodeSize(value as number)}
            min={4}
            max={20}
            step={1}
            size="small"
          />
        </Box>

        <Button
          startIcon={<FilterListIcon />}
          onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          size="small"
          variant="outlined"
        >
          Filters
        </Button>

        <Button
          startIcon={<SaveAltIcon />}
          onClick={exportTopology}
          size="small"
          variant="outlined"
        >
          Export
        </Button>
      </Paper>

      {/* Legend */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          p: 2,
          maxWidth: 200,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Legend
        </Typography>
        
        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: '#1976d2',
              }}
            />
            <Typography variant="caption">Core Substrate</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: '#388e3c',
              }}
            />
            <Typography variant="caption">Partner Substrate</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: '#ff9800',
              }}
            />
            <Typography variant="caption">Agent</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: '#9c27b0',
              }}
            />
            <Typography variant="caption">Memory</Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 30,
                height: 2,
                bgcolor: '#2196f3',
              }}
            />
            <Typography variant="caption">Federation</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 30,
                height: 2,
                bgcolor: '#ff9800',
              }}
            />
            <Typography variant="caption">Delegation</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 30,
                height: 2,
                bgcolor: '#4caf50',
              }}
            />
            <Typography variant="caption">Data Flow</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Graph */}
      <Box sx={{ width: '100%', height: '100%' }}>
        {graphLoading || !ForceGraph2D ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading graph visualization...</Typography>
          </Box>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            nodeLabel={showLabels ? nodeLabel : undefined}
            nodeColor={getNodeColor}
            nodeRelSize={1}
            nodeVal={getNodeSize}
            linkColor={getLinkColor}
            linkWidth={(link: SubstrateLink) => link.strength * 3}
            linkDirectionalParticles={(link: SubstrateLink) => 
              link.type === 'data_flow' ? 2 : 0
            }
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current?.zoomToFit(400)}
          />
        )}
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Node Types</Typography>
        </MenuItem>
        {['substrate', 'agent', 'memory', 'service'].map(type => (
          <MenuItem
            key={type}
            onClick={() => {
              setActiveFilters(prev => ({
                ...prev,
                nodeTypes: prev.nodeTypes.includes(type)
                  ? prev.nodeTypes.filter(t => t !== type)
                  : [...prev.nodeTypes, type],
              }));
            }}
          >
            <ListItemIcon>
              {activeFilters.nodeTypes.includes(type) && '✓'}
            </ListItemIcon>
            <ListItemText>{type}</ListItemText>
          </MenuItem>
        ))}
        
        <MenuItem disabled>
          <Typography variant="subtitle2">Link Types</Typography>
        </MenuItem>
        {['federation', 'delegation', 'data_flow', 'trust'].map(type => (
          <MenuItem
            key={type}
            onClick={() => {
              setActiveFilters(prev => ({
                ...prev,
                linkTypes: prev.linkTypes.includes(type)
                  ? prev.linkTypes.filter(t => t !== type)
                  : [...prev.linkTypes, type],
              }));
            }}
          >
            <ListItemIcon>
              {activeFilters.linkTypes.includes(type) && '✓'}
            </ListItemIcon>
            <ListItemText>{type}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Node Stats (bottom) */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 1000,
          p: 2,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <HubIcon color="primary" />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Total Nodes
                </Typography>
                <Typography variant="h6">
                  {filteredData.nodes.length}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <AccountTreeIcon color="secondary" />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Connections
                </Typography>
                <Typography variant="h6">
                  {filteredData.links.length}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <StorageIcon color="success" />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Active Substrates
                </Typography>
                <Typography variant="h6">
                  {filteredData.nodes.filter((n: SubstrateNode) => n.type === 'substrate' && n.status === 'active').length}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <SecurityIcon color="warning" />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Avg Trust Level
                </Typography>
                <Typography variant="h6">
                  {(
                    filteredData.nodes
                      .filter((n: SubstrateNode) => n.trust_level !== undefined)
                      .reduce((sum: number, n: SubstrateNode) => sum + (n.trust_level || 0), 0) /
                    filteredData.nodes.filter((n: SubstrateNode) => n.trust_level !== undefined).length || 0
                  ).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Detail Dialogs */}
      {selectedNode && selectedNode.type === 'substrate' && (
        <SubstrateDetailDialog
          open={substrateDialogOpen}
          onClose={() => setSubstrateDialogOpen(false)}
          substrate={{
            id: selectedNode.id,
            name: selectedNode.name,
            url: `https://${selectedNode.id}.substrate.network`,
            status: selectedNode.status === 'active' ? 'connected' : 'disconnected',
            capabilities: selectedNode.capabilities || [],
          } as any}
        />
      )}

      {selectedNode && selectedNode.type === 'agent' && (
        <AgentDetailDialog
          open={agentDialogOpen}
          onClose={() => setAgentDialogOpen(false)}
          agentId={selectedNode.id}
          agentName={selectedNode.name}
        />
      )}
    </Box>
  );
};