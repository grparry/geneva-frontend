import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
} from '@mui/material';
import {
  AccountTree as WorkflowIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as AgentIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface WorkflowNode {
  id: string;
  type: 'agent' | 'condition' | 'parallel' | 'sequence';
  position: { x: number; y: number };
  data: {
    label: string;
    agentId?: string;
    agentRole?: string;
    task?: string;
    condition?: string;
    timeout?: number;
    retries?: number;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: 'success' | 'failure' | 'timeout';
  condition?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  lastModified: string;
  executionCount: number;
  successRate: number;
}

const mockWorkflows: Workflow[] = [
  {
    id: 'wf-001',
    name: 'Code Review Workflow',
    description: 'Automated code review process with multiple validation stages',
    version: '1.2.0',
    status: 'active',
    nodes: [
      {
        id: 'start',
        type: 'agent',
        position: { x: 100, y: 100 },
        data: { label: 'Code Submission', agentRole: 'Developer', task: 'Submit code changes' }
      },
      {
        id: 'review',
        type: 'agent',
        position: { x: 300, y: 100 },
        data: { label: 'Technical Review', agentRole: 'Director', task: 'Review code quality and architecture' }
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'review', type: 'success' }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    lastModified: '2024-01-20T14:30:00Z',
    executionCount: 47,
    successRate: 94.5
  },
  {
    id: 'wf-002',
    name: 'Feature Development Pipeline',
    description: 'End-to-end feature development from planning to deployment',
    version: '2.1.0',
    status: 'active',
    nodes: [],
    edges: [],
    createdAt: '2024-01-10T09:00:00Z',
    lastModified: '2024-01-18T16:45:00Z',
    executionCount: 23,
    successRate: 87.2
  }
];

const availableAgentTypes = [
  { role: 'CEO', capabilities: ['strategic_planning', 'executive_decision'] },
  { role: 'VP', capabilities: ['team_management', 'resource_allocation'] },
  { role: 'Director', capabilities: ['technical_review', 'code_review', 'architecture_design'] },
  { role: 'Worker', capabilities: ['development', 'testing', 'documentation'] }
];

export const ACORNWorkflowPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [currentNode, setCurrentNode] = useState<WorkflowNode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    nodes: [] as WorkflowNode[],
    edges: [] as WorkflowEdge[]
  });

  const [newNode, setNewNode] = useState({
    type: 'agent' as const,
    label: '',
    agentRole: '',
    task: '',
    timeout: 300,
    retries: 3
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'paused': return 'info';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const createNewWorkflow = () => {
    setNewWorkflow({
      name: '',
      description: '',
      nodes: [],
      edges: []
    });
    setSelectedWorkflow(null);
    setIsEditing(true);
    setShowWorkflowDialog(true);
  };

  const editWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setNewWorkflow({
      name: workflow.name,
      description: workflow.description,
      nodes: [...workflow.nodes],
      edges: [...workflow.edges]
    });
    setIsEditing(true);
    setShowWorkflowDialog(true);
  };

  const saveWorkflow = () => {
    if (selectedWorkflow) {
      // Update existing workflow
      setWorkflows(workflows.map(wf => 
        wf.id === selectedWorkflow.id 
          ? { 
              ...wf, 
              ...newWorkflow,
              lastModified: new Date().toISOString(),
              version: incrementVersion(wf.version)
            }
          : wf
      ));
    } else {
      // Create new workflow
      const newWf: Workflow = {
        id: `wf-${Date.now()}`,
        ...newWorkflow,
        version: '1.0.0',
        status: 'draft',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        executionCount: 0,
        successRate: 0
      };
      setWorkflows([...workflows, newWf]);
    }
    setShowWorkflowDialog(false);
    setIsEditing(false);
  };

  const incrementVersion = (version: string): string => {
    const parts = version.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  };

  const addNode = () => {
    const newNodeObj: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: newNode.type,
      position: { x: 200, y: 200 },
      data: {
        label: newNode.label,
        agentRole: newNode.agentRole,
        task: newNode.task,
        timeout: newNode.timeout,
        retries: newNode.retries
      }
    };

    setNewWorkflow({
      ...newWorkflow,
      nodes: [...newWorkflow.nodes, newNodeObj]
    });

    setNewNode({
      type: 'agent',
      label: '',
      agentRole: '',
      task: '',
      timeout: 300,
      retries: 3
    });
    setShowNodeDialog(false);
  };

  const executeWorkflow = (workflow: Workflow) => {
    console.log('Executing workflow:', workflow.name);
    // Implementation would integrate with backend
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <WorkflowIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              ACORN Workflow Builder
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ImportIcon />}
              onClick={() => console.log('Import workflow')}
            >
              Import
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createNewWorkflow}
            >
              New Workflow
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ mb: 2 }}>
          Design agent workflows with drag-and-drop interface. Define task sequences, 
          conditional logic, and parallel execution paths.
        </Alert>
      </Paper>

      {/* Workflow List */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Stack direction="row" spacing={2} sx={{ height: '100%' }}>
          {/* Workflow Library */}
          <Box sx={{ width: 350, borderRight: 1, borderColor: 'divider' }}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Workflow Library
              </Typography>
              
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List>
                  {workflows.map((workflow) => (
                    <React.Fragment key={workflow.id}>
                      <ListItem
                        sx={{ 
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <ListItemIcon>
                          <WorkflowIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body1">{workflow.name}</Typography>
                              <Chip 
                                label={workflow.status}
                                size="small"
                                color={getStatusColor(workflow.status) as any}
                                variant="outlined"
                              />
                            </Stack>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {workflow.description}
                              </Typography>
                              <Stack direction="row" spacing={2}>
                                <Typography variant="caption">
                                  v{workflow.version}
                                </Typography>
                                <Typography variant="caption">
                                  {workflow.executionCount} runs
                                </Typography>
                                <Typography variant="caption">
                                  {workflow.successRate.toFixed(1)}% success
                                </Typography>
                              </Stack>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            </Paper>
          </Box>

          {/* Workflow Designer */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedWorkflow ? (
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Workflow Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{selectedWorkflow.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedWorkflow.description}
                    </Typography>
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Workflow">
                      <IconButton onClick={() => editWorkflow(selectedWorkflow)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Execute Workflow">
                      <IconButton 
                        color="primary"
                        onClick={() => executeWorkflow(selectedWorkflow)}
                        disabled={selectedWorkflow.status !== 'active'}
                      >
                        <PlayIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export Workflow">
                      <IconButton>
                        <ExportIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {/* Canvas */}
                <Box 
                  ref={canvasRef}
                  sx={{ 
                    flex: 1, 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    position: 'relative',
                    backgroundColor: 'grey.50',
                    overflow: 'auto'
                  }}
                >
                  {/* Workflow Nodes */}
                  {selectedWorkflow.nodes.map((node) => (
                    <Card
                      key={node.id}
                      sx={{
                        position: 'absolute',
                        left: node.position.x,
                        top: node.position.y,
                        width: 200,
                        cursor: 'move',
                        '&:hover': { boxShadow: 4 }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <AgentIcon fontSize="small" />
                          <Typography variant="subtitle2" noWrap>
                            {node.data.label}
                          </Typography>
                        </Stack>
                        
                        {node.data.agentRole && (
                          <Chip 
                            label={node.data.agentRole}
                            size="small"
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        )}
                        
                        {node.data.task && (
                          <Typography variant="caption" display="block">
                            {node.data.task}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {/* Empty State */}
                  {selectedWorkflow.nodes.length === 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Empty Workflow
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Start building your workflow by adding agents and tasks
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => editWorkflow(selectedWorkflow)}
                      >
                        Add Nodes
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <WorkflowIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Select a Workflow
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a workflow from the library to view and edit
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>
        </Stack>
      </Box>

      {/* Workflow Dialog */}
      <Dialog open={showWorkflowDialog} onClose={() => setShowWorkflowDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Workflow Name"
              value={newWorkflow.name}
              onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newWorkflow.description}
              onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})}
            />

            {isEditing && (
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6">Workflow Nodes</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setShowNodeDialog(true)}
                  >
                    Add Node
                  </Button>
                </Stack>

                <List>
                  {newWorkflow.nodes.map((node, index) => (
                    <ListItem key={node.id} divider>
                      <ListItemIcon>
                        <AgentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={node.data.label}
                        secondary={`${node.data.agentRole} - ${node.data.task}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWorkflowDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={saveWorkflow}
            disabled={!newWorkflow.name.trim()}
          >
            {selectedWorkflow ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Node Dialog */}
      <Dialog open={showNodeDialog} onClose={() => setShowNodeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Workflow Node</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Node Type</InputLabel>
              <Select
                value={newNode.type}
                label="Node Type"
                onChange={(e) => setNewNode({...newNode, type: e.target.value as any})}
              >
                <MenuItem value="agent">Agent Task</MenuItem>
                <MenuItem value="condition">Condition</MenuItem>
                <MenuItem value="parallel">Parallel Execution</MenuItem>
                <MenuItem value="sequence">Sequential Tasks</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Node Label"
              value={newNode.label}
              onChange={(e) => setNewNode({...newNode, label: e.target.value})}
            />

            {newNode.type === 'agent' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Agent Role</InputLabel>
                  <Select
                    value={newNode.agentRole}
                    label="Agent Role"
                    onChange={(e) => setNewNode({...newNode, agentRole: e.target.value})}
                  >
                    {availableAgentTypes.map((agent) => (
                      <MenuItem key={agent.role} value={agent.role}>
                        {agent.role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Task Description"
                  multiline
                  rows={2}
                  value={newNode.task}
                  onChange={(e) => setNewNode({...newNode, task: e.target.value})}
                />

                <TextField
                  fullWidth
                  label="Timeout (seconds)"
                  type="number"
                  value={newNode.timeout}
                  onChange={(e) => setNewNode({...newNode, timeout: parseInt(e.target.value)})}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNodeDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={addNode}
            disabled={!newNode.label.trim()}
          >
            Add Node
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};