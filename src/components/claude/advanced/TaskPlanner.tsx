import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Divider,
  LinearProgress,
  Alert,
  Badge,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  DatePicker
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timeline as TimelineIcon,
  AccountTree as TreeIcon,
  Assignment as TaskIcon,
  Flag as MilestoneIcon,
  CallSplit as DecisionIcon,
  Merge as MergeIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Priority as PriorityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Unlink as UnlinkIcon,
  Visibility as ViewIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import {
  TaskPlan,
  TaskPlanNode,
  TaskPlanConnection
} from '../../../types/geneva-tools';

interface TaskPlannerProps {
  planId?: string;
  initialPlan?: TaskPlan;
  onPlanUpdate?: (plan: TaskPlan) => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<TaskPlanNode>) => void;
  onConnectionUpdate?: (connectionId: string, updates: Partial<TaskPlanConnection>) => void;
  readOnly?: boolean;
  showTimeline?: boolean;
  enableCollaboration?: boolean;
  height?: number;
}

const NODE_TYPES = {
  task: { label: 'Task', icon: TaskIcon, color: '#2196f3' },
  milestone: { label: 'Milestone', icon: MilestoneIcon, color: '#4caf50' },
  decision: { label: 'Decision', icon: DecisionIcon, color: '#ff9800' },
  parallel: { label: 'Parallel', icon: TreeIcon, color: '#9c27b0' },
  merge: { label: 'Merge', icon: MergeIcon, color: '#607d8b' }
};

const PRIORITY_COLORS = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#d32f2f'
};

const STATUS_COLORS = {
  pending: '#9e9e9e',
  in_progress: '#2196f3',
  completed: '#4caf50',
  blocked: '#f44336'
};

export const TaskPlanner: React.FC<TaskPlannerProps> = ({
  planId = 'default-plan',
  initialPlan,
  onPlanUpdate,
  onNodeUpdate,
  onConnectionUpdate,
  readOnly = false,
  showTimeline = true,
  enableCollaboration = true,
  height = 700
}) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const [selectedNode, setSelectedNode] = useState<TaskPlanNode | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<TaskPlanConnection | null>(null);
  const [draggedNode, setDraggedNode] = useState<TaskPlanNode | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTimelineView, setShowTimelineView] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [newNode, setNewNode] = useState({
    type: 'task' as const,
    title: '',
    description: '',
    priority: 'medium' as const,
    estimatedHours: 1,
    assignedTo: '',
    tags: [] as string[]
  });

  // Mock data for demonstration
  const mockPlan: TaskPlan = initialPlan || {
    id: planId,
    name: 'Geneva Frontend Enhancement',
    description: 'Comprehensive plan for implementing Claude Code integration features',
    nodes: [
      {
        id: 'node-1',
        type: 'milestone',
        title: 'Project Kickoff',
        description: 'Initialize project structure and development environment',
        position: { x: 100, y: 100 },
        status: 'completed',
        priority: 'high',
        estimatedHours: 4,
        actualHours: 4,
        assignedTo: 'team-lead',
        dependencies: [],
        tags: ['setup', 'milestone'],
        dueDate: '2024-01-15'
      },
      {
        id: 'node-2',
        type: 'task',
        title: 'Implement Progress Streaming',
        description: 'Create real-time progress visualization with SSE integration',
        position: { x: 300, y: 150 },
        status: 'completed',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 6,
        assignedTo: 'alice',
        dependencies: ['node-1'],
        tags: ['frontend', 'streaming', 'sse']
      },
      {
        id: 'node-3',
        type: 'task',
        title: 'Build Clarification System',
        description: 'Interactive modal dialogs for dynamic Q&A during execution',
        position: { x: 300, y: 250 },
        status: 'completed',
        priority: 'high',
        estimatedHours: 6,
        actualHours: 7,
        assignedTo: 'bob',
        dependencies: ['node-1'],
        tags: ['frontend', 'interaction', 'modal']
      },
      {
        id: 'node-4',
        type: 'parallel',
        title: 'Multi-Modal Features',
        description: 'Parallel development of capability browser and media viewer',
        position: { x: 500, y: 200 },
        status: 'completed',
        priority: 'medium',
        estimatedHours: 0,
        dependencies: ['node-2', 'node-3'],
        tags: ['parallel', 'multimodal']
      },
      {
        id: 'node-5',
        type: 'task',
        title: 'Capability Browser',
        description: 'Searchable interface for Claude capabilities discovery',
        position: { x: 700, y: 150 },
        status: 'completed',
        priority: 'medium',
        estimatedHours: 5,
        actualHours: 5,
        assignedTo: 'charlie',
        dependencies: ['node-4'],
        tags: ['frontend', 'search', 'capabilities']
      },
      {
        id: 'node-6',
        type: 'task',
        title: 'Multi-Modal Viewer',
        description: 'Support for images, diagrams, code, and API specs',
        position: { x: 700, y: 250 },
        status: 'completed',
        priority: 'medium',
        estimatedHours: 8,
        actualHours: 9,
        assignedTo: 'diana',
        dependencies: ['node-4'],
        tags: ['frontend', 'media', 'viewer']
      },
      {
        id: 'node-7',
        type: 'decision',
        title: 'Learning Analytics Approach',
        description: 'Choose between real-time vs batch processing for analytics',
        position: { x: 900, y: 200 },
        status: 'completed',
        priority: 'low',
        dependencies: ['node-5', 'node-6'],
        tags: ['decision', 'analytics']
      },
      {
        id: 'node-8',
        type: 'task',
        title: 'Learning Dashboard',
        description: 'Pattern recognition and actionable insights interface',
        position: { x: 1100, y: 200 },
        status: 'completed',
        priority: 'medium',
        estimatedHours: 10,
        actualHours: 12,
        assignedTo: 'alice',
        dependencies: ['node-7'],
        tags: ['frontend', 'analytics', 'dashboard']
      },
      {
        id: 'node-9',
        type: 'task',
        title: 'Constraint Validator',
        description: 'UI for project constraints and compliance monitoring',
        position: { x: 300, y: 400 },
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 6,
        actualHours: 4,
        assignedTo: 'bob',
        dependencies: ['node-8'],
        tags: ['security', 'validation', 'constraints']
      },
      {
        id: 'node-10',
        type: 'task',
        title: 'Collaborative Editor',
        description: 'Monaco editor integration with real-time collaboration',
        position: { x: 500, y: 400 },
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 12,
        actualHours: 8,
        assignedTo: 'charlie',
        dependencies: ['node-8'],
        tags: ['editor', 'collaboration', 'monaco']
      },
      {
        id: 'node-11',
        type: 'task',
        title: 'Performance Overlay',
        description: 'Real-time system metrics HUD component',
        position: { x: 700, y: 400 },
        status: 'pending',
        priority: 'medium',
        estimatedHours: 4,
        assignedTo: 'diana',
        dependencies: ['node-9', 'node-10'],
        tags: ['performance', 'metrics', 'hud']
      },
      {
        id: 'node-12',
        type: 'merge',
        title: 'Integration Testing',
        description: 'Combine all Phase 4 components and test integration',
        position: { x: 900, y: 450 },
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
        assignedTo: 'team-lead',
        dependencies: ['node-11'],
        tags: ['testing', 'integration', 'qa']
      },
      {
        id: 'node-13',
        type: 'milestone',
        title: 'Phase 4 Complete',
        description: 'All advanced integration features delivered and tested',
        position: { x: 1100, y: 450 },
        status: 'pending',
        priority: 'critical',
        dependencies: ['node-12'],
        tags: ['milestone', 'delivery'],
        dueDate: '2024-02-15'
      }
    ],
    connections: [
      { id: 'conn-1', sourceId: 'node-1', targetId: 'node-2', type: 'dependency' },
      { id: 'conn-2', sourceId: 'node-1', targetId: 'node-3', type: 'dependency' },
      { id: 'conn-3', sourceId: 'node-2', targetId: 'node-4', type: 'dependency' },
      { id: 'conn-4', sourceId: 'node-3', targetId: 'node-4', type: 'dependency' },
      { id: 'conn-5', sourceId: 'node-4', targetId: 'node-5', type: 'parallel' },
      { id: 'conn-6', sourceId: 'node-4', targetId: 'node-6', type: 'parallel' },
      { id: 'conn-7', sourceId: 'node-5', targetId: 'node-7', type: 'dependency' },
      { id: 'conn-8', sourceId: 'node-6', targetId: 'node-7', type: 'dependency' },
      { id: 'conn-9', sourceId: 'node-7', targetId: 'node-8', type: 'dependency' },
      { id: 'conn-10', sourceId: 'node-8', targetId: 'node-9', type: 'dependency' },
      { id: 'conn-11', sourceId: 'node-8', targetId: 'node-10', type: 'dependency' },
      { id: 'conn-12', sourceId: 'node-9', targetId: 'node-11', type: 'dependency' },
      { id: 'conn-13', sourceId: 'node-10', targetId: 'node-11', type: 'dependency' },
      { id: 'conn-14', sourceId: 'node-11', targetId: 'node-12', type: 'dependency' },
      { id: 'conn-15', sourceId: 'node-12', targetId: 'node-13', type: 'dependency' }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: new Date().toISOString(),
    projectId: 'geneva-frontend',
    createdBy: 'team-lead'
  };

  useEffect(() => {
    setPlan(mockPlan);
  }, []);

  const handleNodeDragStart = useCallback((node: TaskPlanNode, event: React.MouseEvent) => {
    if (readOnly) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDraggedNode(node);
      setDragOffset({
        x: event.clientX - rect.left - node.position.x * zoom - pan.x,
        y: event.clientY - rect.top - node.position.y * zoom - pan.y
      });
    }
  }, [readOnly, zoom, pan]);

  const handleNodeDrag = useCallback((event: React.MouseEvent) => {
    if (!draggedNode || readOnly) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const newX = (event.clientX - rect.left - dragOffset.x - pan.x) / zoom;
      const newY = (event.clientY - rect.top - dragOffset.y - pan.y) / zoom;
      
      const updatedNode = {
        ...draggedNode,
        position: { x: Math.max(0, newX), y: Math.max(0, newY) }
      };
      
      setPlan(prev => prev ? {
        ...prev,
        nodes: prev.nodes.map(n => n.id === draggedNode.id ? updatedNode : n)
      } : null);
    }
  }, [draggedNode, dragOffset, pan, zoom, readOnly]);

  const handleNodeDragEnd = useCallback(() => {
    if (draggedNode && plan) {
      const updatedNode = plan.nodes.find(n => n.id === draggedNode.id);
      if (updatedNode) {
        onNodeUpdate?.(draggedNode.id, { position: updatedNode.position });
      }
    }
    setDraggedNode(null);
  }, [draggedNode, plan, onNodeUpdate]);

  const handleNodeClick = useCallback((node: TaskPlanNode) => {
    if (isConnecting && connectionStart && connectionStart !== node.id) {
      // Create new connection
      const newConnection: TaskPlanConnection = {
        id: `conn-${Date.now()}`,
        sourceId: connectionStart,
        targetId: node.id,
        type: 'dependency'
      };
      
      setPlan(prev => prev ? {
        ...prev,
        connections: [...prev.connections, newConnection]
      } : null);
      
      setIsConnecting(false);
      setConnectionStart(null);
    } else if (isConnecting) {
      setConnectionStart(node.id);
    } else {
      setSelectedNode(node);
    }
  }, [isConnecting, connectionStart]);

  const handleAddNode = () => {
    if (!plan || !newNode.title) return;

    const node: TaskPlanNode = {
      id: `node-${Date.now()}`,
      type: newNode.type,
      title: newNode.title,
      description: newNode.description,
      position: { x: 100, y: 100 },
      status: 'pending',
      priority: newNode.priority,
      estimatedHours: newNode.estimatedHours,
      assignedTo: newNode.assignedTo,
      dependencies: [],
      tags: newNode.tags
    };

    setPlan(prev => prev ? {
      ...prev,
      nodes: [...prev.nodes, node]
    } : null);

    setShowAddDialog(false);
    setNewNode({
      type: 'task',
      title: '',
      description: '',
      priority: 'medium',
      estimatedHours: 1,
      assignedTo: '',
      tags: []
    });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleCenter = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const calculateProgress = () => {
    if (!plan) return 0;
    const completedTasks = plan.nodes.filter(n => n.status === 'completed').length;
    return Math.round((completedTasks / plan.nodes.length) * 100);
  };

  const getNodeIcon = (type: keyof typeof NODE_TYPES) => {
    const IconComponent = NODE_TYPES[type].icon;
    return <IconComponent />;
  };

  if (!plan) return null;

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5">
              {plan.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {plan.description}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Badge badgeContent={plan.nodes.filter(n => n.status === 'in_progress').length} color="primary">
              <Tooltip title="Active Tasks">
                <IconButton>
                  <TaskIcon />
                </IconButton>
              </Tooltip>
            </Badge>
            
            <Tooltip title="Add Node">
              <IconButton onClick={() => setShowAddDialog(true)} disabled={readOnly}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isConnecting ? "Cancel Connection" : "Connect Nodes"}>
              <IconButton 
                onClick={() => {
                  setIsConnecting(!isConnecting);
                  setConnectionStart(null);
                }}
                color={isConnecting ? 'primary' : 'default'}
                disabled={readOnly}
              >
                <LinkIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Timeline View">
              <IconButton 
                onClick={() => setShowTimelineView(!showTimelineView)}
                color={showTimelineView ? 'primary' : 'default'}
              >
                <TimelineIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton onClick={(e) => setSettingsAnchor(e.currentTarget)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {calculateProgress()}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={calculateProgress()} />
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Card sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h6">{plan.nodes.length}</Typography>
              <Typography variant="caption">Total Tasks</Typography>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h6">{plan.nodes.filter(n => n.status === 'completed').length}</Typography>
              <Typography variant="caption">Completed</Typography>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h6">{plan.nodes.filter(n => n.status === 'in_progress').length}</Typography>
              <Typography variant="caption">In Progress</Typography>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h6">{plan.nodes.filter(n => n.status === 'blocked').length}</Typography>
              <Typography variant="caption">Blocked</Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Canvas Controls */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center">
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
          
          <Typography variant="body2" sx={{ ml: 2 }}>
            Zoom: {Math.round(zoom * 100)}%
          </Typography>
          
          {isConnecting && (
            <Alert severity="info" sx={{ ml: 2 }}>
              Click on two nodes to connect them
            </Alert>
          )}
        </Stack>
      </Box>

      {/* Canvas */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <svg
          ref={canvasRef}
          width="100%"
          height="100%"
          style={{ cursor: draggedNode ? 'grabbing' : 'default' }}
          onMouseMove={handleNodeDrag}
          onMouseUp={handleNodeDragEnd}
        >
          {/* Grid Background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connections */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {plan.connections.map(connection => {
              const sourceNode = plan.nodes.find(n => n.id === connection.sourceId);
              const targetNode = plan.nodes.find(n => n.id === connection.targetId);
              
              if (!sourceNode || !targetNode) return null;

              const sourceX = sourceNode.position.x + 60;
              const sourceY = sourceNode.position.y + 30;
              const targetX = targetNode.position.x + 60;
              const targetY = targetNode.position.y + 30;

              return (
                <g key={connection.id}>
                  <line
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                    stroke={connection.type === 'parallel' ? '#9c27b0' : '#666'}
                    strokeWidth={selectedConnection?.id === connection.id ? 3 : 2}
                    strokeDasharray={connection.type === 'conditional' ? '5,5' : 'none'}
                    markerEnd="url(#arrowhead)"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedConnection(connection)}
                  />
                  
                  {/* Connection label */}
                  <text
                    x={(sourceX + targetX) / 2}
                    y={(sourceY + targetY) / 2 - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#666"
                  >
                    {connection.type}
                  </text>
                </g>
              );
            })}

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
              </marker>
            </defs>

            {/* Nodes */}
            {plan.nodes.map(node => {
              const nodeType = NODE_TYPES[node.type];
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.position.x}, ${node.position.y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseDown={(e) => handleNodeDragStart(node, e as any)}
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Node background */}
                  <rect
                    width="120"
                    height="60"
                    rx="8"
                    fill={nodeType.color}
                    fillOpacity={selectedNode?.id === node.id ? 0.3 : 0.1}
                    stroke={nodeType.color}
                    strokeWidth={selectedNode?.id === node.id ? 3 : 2}
                  />
                  
                  {/* Status indicator */}
                  <circle
                    cx="110"
                    cy="10"
                    r="4"
                    fill={STATUS_COLORS[node.status]}
                  />
                  
                  {/* Priority indicator */}
                  <rect
                    x="5"
                    y="5"
                    width="8"
                    height="8"
                    fill={PRIORITY_COLORS[node.priority]}
                  />
                  
                  {/* Node title */}
                  <text
                    x="60"
                    y="25"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#333"
                  >
                    {node.title.length > 15 ? `${node.title.substring(0, 15)}...` : node.title}
                  </text>
                  
                  {/* Assigned person */}
                  {node.assignedTo && (
                    <text
                      x="60"
                      y="40"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#666"
                    >
                      @{node.assignedTo}
                    </text>
                  )}
                  
                  {/* Estimated hours */}
                  {node.estimatedHours && (
                    <text
                      x="60"
                      y="52"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#888"
                    >
                      {node.estimatedHours}h
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </Box>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card sx={{ m: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Box>
                <Typography variant="h6">
                  {selectedNode.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedNode.description}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip 
                  label={selectedNode.type}
                  size="small"
                  color="primary"
                />
                <Chip 
                  label={selectedNode.status}
                  size="small"
                  sx={{ bgcolor: STATUS_COLORS[selectedNode.status], color: 'white' }}
                />
                <Chip 
                  label={selectedNode.priority}
                  size="small"
                  sx={{ bgcolor: PRIORITY_COLORS[selectedNode.priority], color: 'white' }}
                />
              </Stack>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Assigned To
                </Typography>
                <Typography variant="body2">
                  {selectedNode.assignedTo || 'Unassigned'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Estimated Hours
                </Typography>
                <Typography variant="body2">
                  {selectedNode.estimatedHours || 'Not estimated'}
                </Typography>
              </Grid>
              {selectedNode.actualHours && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Actual Hours
                  </Typography>
                  <Typography variant="body2">
                    {selectedNode.actualHours}
                  </Typography>
                </Grid>
              )}
              {selectedNode.dueDate && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedNode.dueDate).toLocaleDateString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            {selectedNode.tags.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Tags
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                  {selectedNode.tags.map(tag => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
          
          <CardActions>
            <Button 
              size="small"
              onClick={() => setShowEditDialog(true)}
              disabled={readOnly}
            >
              Edit
            </Button>
            <Button 
              size="small"
              onClick={() => setSelectedNode(null)}
            >
              Close
            </Button>
          </CardActions>
        </Card>
      )}

      {/* Add Node Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Node Type</InputLabel>
              <Select
                value={newNode.type}
                label="Node Type"
                onChange={(e) => setNewNode(prev => ({ ...prev, type: e.target.value as any }))}
              >
                {Object.entries(NODE_TYPES).map(([key, type]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {React.createElement(type.icon, { sx: { color: type.color } })}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Title"
              value={newNode.title}
              onChange={(e) => setNewNode(prev => ({ ...prev, title: e.target.value }))}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newNode.description}
              onChange={(e) => setNewNode(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newNode.priority}
                    label="Priority"
                    onChange={(e) => setNewNode(prev => ({ ...prev, priority: e.target.value as any }))}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Estimated Hours"
                  type="number"
                  value={newNode.estimatedHours}
                  onChange={(e) => setNewNode(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              label="Assigned To"
              value={newNode.assignedTo}
              onChange={(e) => setNewNode(prev => ({ ...prev, assignedTo: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddNode}
            variant="contained"
            disabled={!newNode.title}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
      >
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Export Plan
        </MenuItem>
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Import Plan
        </MenuItem>
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Auto Layout
        </MenuItem>
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Plan Settings
        </MenuItem>
      </Menu>
    </Paper>
  );
};