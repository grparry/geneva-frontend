import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import {
  ToolNode,
  ToolConnection,
  ToolType,
  ToolStatus,
  ToolFlowExecution,
  FlowDirection
} from '../../../types/geneva-tools';

interface ToolFlowDiagramProps {
  nodes: ToolNode[];
  connections: ToolConnection[];
  execution?: ToolFlowExecution;
  onNodeSelect?: (nodeId: string) => void;
  onConnectionSelect?: (connectionId: string) => void;
  onExecutionControl?: (action: 'play' | 'pause' | 'stop') => void;
  interactive?: boolean;
  height?: number;
}

const TOOL_COLORS = {
  [ToolType.SEMANTIC_SEARCH]: '#2196f3',
  [ToolType.MEMORY_ACCESS]: '#4caf50',
  [ToolType.KNOWLEDGE_GRAPH]: '#ff9800',
  [ToolType.PROJECT_CONSTRAINT]: '#f44336',
  [ToolType.SUBSTRATE_INDEXER]: '#9c27b0',
  [ToolType.SUBSTRATE_READER]: '#00bcd4',
  [ToolType.SUBSTRATE_WRITER]: '#795548',
  [ToolType.VALIDATOR]: '#607d8b',
  [ToolType.CODEX_CLASSIFIER]: '#e91e63',
  [ToolType.CODEX_STORAGE]: '#3f51b5'
};

const STATUS_COLORS = {
  [ToolStatus.IDLE]: '#9e9e9e',
  [ToolStatus.ACTIVE]: '#4caf50',
  [ToolStatus.PROCESSING]: '#ff9800',
  [ToolStatus.ERROR]: '#f44336',
  [ToolStatus.SUCCESS]: '#8bc34a'
};

export const ToolFlowDiagram: React.FC<ToolFlowDiagramProps> = ({
  nodes,
  connections,
  execution,
  onNodeSelect,
  onConnectionSelect,
  onExecutionControl,
  interactive = true,
  height = 500
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);

  // Mock data for demonstration
  const mockNodes: ToolNode[] = [
    {
      id: 'search-1',
      type: ToolType.SEMANTIC_SEARCH,
      name: 'Semantic Search',
      description: 'Vector similarity search across knowledge base',
      status: execution?.status === 'running' ? ToolStatus.PROCESSING : ToolStatus.ACTIVE,
      position: { x: 100, y: 100 },
      capabilities: ['Vector Search', 'Semantic Similarity', 'Context Ranking'],
      currentOperation: execution?.status === 'running' ? 'Searching for React patterns...' : undefined,
      performance: {
        executionTime: 245,
        successRate: 0.94,
        lastUsed: new Date().toISOString()
      },
      connections: []
    },
    {
      id: 'memory-1',
      type: ToolType.MEMORY_ACCESS,
      name: 'Memory Access',
      description: 'Read/write access to substrate memory',
      status: ToolStatus.ACTIVE,
      position: { x: 400, y: 100 },
      capabilities: ['Read Nodes', 'Write Relationships', 'Update Properties'],
      performance: {
        executionTime: 89,
        successRate: 0.98,
        lastUsed: new Date(Date.now() - 5000).toISOString()
      },
      connections: []
    },
    {
      id: 'validator-1',
      type: ToolType.VALIDATOR,
      name: 'Constraint Validator',
      description: 'Validates project constraints and business rules',
      status: execution?.status === 'running' ? ToolStatus.PROCESSING : ToolStatus.IDLE,
      position: { x: 250, y: 300 },
      capabilities: ['Rule Validation', 'Permission Check', 'Security Audit'],
      currentOperation: execution?.status === 'running' ? 'Validating security constraints...' : undefined,
      performance: {
        executionTime: 156,
        successRate: 0.91,
        lastUsed: new Date(Date.now() - 15000).toISOString()
      },
      connections: []
    },
    {
      id: 'codex-1',
      type: ToolType.CODEX_STORAGE,
      name: 'Codex Storage',
      description: 'Persistent storage for code knowledge',
      status: ToolStatus.SUCCESS,
      position: { x: 550, y: 250 },
      capabilities: ['Code Storage', 'Version Control', 'Metadata Management'],
      performance: {
        executionTime: 67,
        successRate: 0.99,
        lastUsed: new Date(Date.now() - 30000).toISOString()
      },
      connections: []
    }
  ];

  const mockConnections: ToolConnection[] = [
    {
      id: 'conn-1',
      sourceId: 'search-1',
      targetId: 'memory-1',
      direction: FlowDirection.OUTPUT,
      dataType: 'SearchResults',
      isActive: execution?.status === 'running',
      throughput: 12,
      latency: 45
    },
    {
      id: 'conn-2',
      sourceId: 'memory-1',
      targetId: 'validator-1',
      direction: FlowDirection.OUTPUT,
      dataType: 'MemoryNodes',
      isActive: execution?.status === 'running',
      throughput: 8,
      latency: 67
    },
    {
      id: 'conn-3',
      sourceId: 'validator-1',
      targetId: 'codex-1',
      direction: FlowDirection.OUTPUT,
      dataType: 'ValidatedData',
      isActive: false,
      throughput: 15,
      latency: 23
    },
    {
      id: 'conn-4',
      sourceId: 'memory-1',
      targetId: 'codex-1',
      direction: FlowDirection.BIDIRECTIONAL,
      dataType: 'CodeMetadata',
      isActive: true,
      throughput: 20,
      latency: 34
    }
  ];

  const effectiveNodes = nodes.length > 0 ? nodes : mockNodes;
  const effectiveConnections = connections.length > 0 ? connections : mockConnections;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const svgRect = svg.getBoundingClientRect();
    
    // Clear previous content
    svg.innerHTML = '';

    // Create defs for markers and gradients
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Arrow marker
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#666');
    marker.appendChild(polygon);
    defs.appendChild(marker);

    // Active connection marker
    const activeMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    activeMarker.setAttribute('id', 'arrowhead-active');
    activeMarker.setAttribute('markerWidth', '10');
    activeMarker.setAttribute('markerHeight', '7');
    activeMarker.setAttribute('refX', '9');
    activeMarker.setAttribute('refY', '3.5');
    activeMarker.setAttribute('orient', 'auto');
    
    const activePolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    activePolygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    activePolygon.setAttribute('fill', '#4caf50');
    activeMarker.appendChild(activePolygon);
    defs.appendChild(activeMarker);

    svg.appendChild(defs);

    // Create connections group
    const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connectionsGroup.setAttribute('class', 'connections');

    effectiveConnections.forEach(connection => {
      const sourceNode = effectiveNodes.find(n => n.id === connection.sourceId);
      const targetNode = effectiveNodes.find(n => n.id === connection.targetId);
      
      if (!sourceNode || !targetNode) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', (sourceNode.position.x + 60).toString());
      line.setAttribute('y1', (sourceNode.position.y + 30).toString());
      line.setAttribute('x2', (targetNode.position.x + 60).toString());
      line.setAttribute('y2', (targetNode.position.y + 30).toString());
      line.setAttribute('stroke', connection.isActive ? '#4caf50' : '#ccc');
      line.setAttribute('stroke-width', connection.isActive ? '3' : '2');
      line.setAttribute('marker-end', connection.isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)');
      
      if (connection.isActive) {
        line.setAttribute('stroke-dasharray', '5,5');
        
        // Add animation for active connections
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'stroke-dashoffset');
        animate.setAttribute('values', '0;-10');
        animate.setAttribute('dur', '1s');
        animate.setAttribute('repeatCount', 'indefinite');
        line.appendChild(animate);
      }

      line.style.cursor = 'pointer';
      line.addEventListener('click', () => {
        setSelectedConnection(connection.id);
        onConnectionSelect?.(connection.id);
      });

      connectionsGroup.appendChild(line);

      // Add connection label
      const midX = (sourceNode.position.x + targetNode.position.x) / 2 + 60;
      const midY = (sourceNode.position.y + targetNode.position.y) / 2 + 30;
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', midX.toString());
      label.setAttribute('y', (midY - 10).toString());
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', '#666');
      label.setAttribute('font-size', '10');
      label.textContent = connection.dataType;
      connectionsGroup.appendChild(label);
    });

    svg.appendChild(connectionsGroup);

    // Create nodes group
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.setAttribute('class', 'nodes');

    effectiveNodes.forEach(node => {
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodeGroup.setAttribute('class', 'node');
      nodeGroup.style.cursor = 'pointer';

      // Node background
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', node.position.x.toString());
      rect.setAttribute('y', node.position.y.toString());
      rect.setAttribute('width', '120');
      rect.setAttribute('height', '60');
      rect.setAttribute('rx', '8');
      rect.setAttribute('fill', TOOL_COLORS[node.type] || '#ccc');
      rect.setAttribute('opacity', '0.1');
      rect.setAttribute('stroke', TOOL_COLORS[node.type] || '#ccc');
      rect.setAttribute('stroke-width', selectedNode === node.id ? '3' : '2');
      
      nodeGroup.appendChild(rect);

      // Status indicator
      const statusCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      statusCircle.setAttribute('cx', (node.position.x + 110).toString());
      statusCircle.setAttribute('cy', (node.position.y + 10).toString());
      statusCircle.setAttribute('r', '4');
      statusCircle.setAttribute('fill', STATUS_COLORS[node.status]);
      nodeGroup.appendChild(statusCircle);

      // Node title
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', (node.position.x + 60).toString());
      title.setAttribute('y', (node.position.y + 25).toString());
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('fill', '#333');
      title.setAttribute('font-size', '12');
      title.setAttribute('font-weight', 'bold');
      title.textContent = node.name;
      nodeGroup.appendChild(title);

      // Current operation (if any)
      if (node.currentOperation) {
        const operation = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        operation.setAttribute('x', (node.position.x + 60).toString());
        operation.setAttribute('y', (node.position.y + 45).toString());
        operation.setAttribute('text-anchor', 'middle');
        operation.setAttribute('fill', '#666');
        operation.setAttribute('font-size', '9');
        operation.textContent = node.currentOperation.length > 20 
          ? node.currentOperation.substring(0, 20) + '...'
          : node.currentOperation;
        nodeGroup.appendChild(operation);
      }

      // Performance indicator
      const perfText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      perfText.setAttribute('x', (node.position.x + 60).toString());
      perfText.setAttribute('y', (node.position.y + 55).toString());
      perfText.setAttribute('text-anchor', 'middle');
      perfText.setAttribute('fill', '#888');
      perfText.setAttribute('font-size', '8');
      perfText.textContent = `${node.performance.executionTime}ms | ${Math.round(node.performance.successRate * 100)}%`;
      nodeGroup.appendChild(perfText);

      nodeGroup.addEventListener('click', () => {
        setSelectedNode(node.id);
        onNodeSelect?.(node.id);
      });

      nodesGroup.appendChild(nodeGroup);
    });

    svg.appendChild(nodesGroup);

    // Apply zoom and pan
    const transform = `translate(${pan.x}, ${pan.y}) scale(${zoom})`;
    connectionsGroup.setAttribute('transform', transform);
    nodesGroup.setAttribute('transform', transform);

  }, [effectiveNodes, effectiveConnections, selectedNode, zoom, pan, execution]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleCenter = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleExecutionControl = (action: 'play' | 'pause' | 'stop') => {
    onExecutionControl?.(action);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Geneva Tool Flow
        </Typography>
        
        <Stack direction="row" spacing={1}>
          {interactive && (
            <>
              <Tooltip title="Play Execution">
                <IconButton 
                  onClick={() => handleExecutionControl('play')}
                  color={execution?.status === 'running' ? 'primary' : 'default'}
                >
                  <PlayIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Pause Execution">
                <IconButton onClick={() => handleExecutionControl('pause')}>
                  <PauseIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Stop Execution">
                <IconButton onClick={() => handleExecutionControl('stop')}>
                  <StopIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Center View">
            <IconButton onClick={handleCenter}>
              <CenterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton onClick={(e) => setSettingsAnchor(e.currentTarget)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {execution && (
        <Alert 
          severity={execution.status === 'running' ? 'info' : execution.status === 'failed' ? 'error' : 'success'}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <strong>{execution.name}</strong> - {execution.description}
          </Typography>
          <Typography variant="caption">
            Progress: {Math.round(execution.progress * 100)}% | 
            Step {execution.currentStepIndex + 1} of {execution.steps.length}
          </Typography>
        </Alert>
      )}

      <Box ref={containerRef} sx={{ position: 'relative', overflow: 'hidden', height }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}
        />
      </Box>

      {selectedNode && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6">
              {effectiveNodes.find(n => n.id === selectedNode)?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {effectiveNodes.find(n => n.id === selectedNode)?.description}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {effectiveNodes.find(n => n.id === selectedNode)?.capabilities.map(cap => (
                <Chip key={cap} label={cap} size="small" variant="outlined" />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
      >
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Show Performance Metrics
        </MenuItem>
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Export Diagram
        </MenuItem>
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Reset Layout
        </MenuItem>
      </Menu>
    </Paper>
  );
};