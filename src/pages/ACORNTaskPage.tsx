import React, { useState, useEffect } from 'react';
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
  ListItemSecondaryAction,
  Divider,
  Alert,
  LinearProgress,
  Avatar,
  Badge,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Flag as PriorityIcon,
  Timeline as TimelineIcon,
  Message as MessageIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'blocked' | 'review' | 'completed' | 'failed';
  progress: number;
  estimatedDuration: number; // minutes
  actualDuration?: number;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  dependencies: string[];
  tags: string[];
  workflowId?: string;
  context?: {
    conversation_id?: string;
    execution_id?: string;
    related_files?: string[];
  };
}

interface TaskDelegationRequest {
  fromAgent: string;
  toAgent: string;
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
  reasoning: string;
  urgency: 'low' | 'medium' | 'high';
}

const mockTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Implement User Authentication',
    description: 'Design and implement JWT-based authentication system with refresh tokens',
    assignedTo: 'worker-001',
    assignedBy: 'dir-001',
    priority: 'high',
    status: 'in_progress',
    progress: 65,
    estimatedDuration: 480,
    actualDuration: 312,
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    deadline: '2024-01-22T17:00:00Z',
    dependencies: [],
    tags: ['authentication', 'security', 'backend'],
    workflowId: 'wf-001'
  },
  {
    id: 'task-002',
    title: 'Database Schema Design',
    description: 'Design optimized database schema for user management and permissions',
    assignedTo: 'worker-002',
    assignedBy: 'vp-001',
    priority: 'medium',
    status: 'review',
    progress: 90,
    estimatedDuration: 240,
    actualDuration: 195,
    createdAt: '2024-01-19T14:00:00Z',
    updatedAt: '2024-01-20T11:15:00Z',
    deadline: '2024-01-21T12:00:00Z',
    dependencies: [],
    tags: ['database', 'schema', 'design'],
    context: {
      related_files: ['schema.sql', 'migrations/001_initial.sql']
    }
  },
  {
    id: 'task-003',
    title: 'API Documentation',
    description: 'Create comprehensive API documentation with examples and use cases',
    assignedTo: 'worker-003',
    assignedBy: 'dir-002',
    priority: 'low',
    status: 'pending',
    progress: 0,
    estimatedDuration: 360,
    createdAt: '2024-01-20T16:00:00Z',
    updatedAt: '2024-01-20T16:00:00Z',
    deadline: '2024-01-25T17:00:00Z',
    dependencies: ['task-001', 'task-002'],
    tags: ['documentation', 'api', 'technical-writing']
  }
];

const mockAgents = [
  { id: 'ceo-001', name: 'Executive CEO', role: 'CEO' },
  { id: 'vp-001', name: 'VP Engineering', role: 'VP' },
  { id: 'dir-001', name: 'Director Frontend', role: 'Director' },
  { id: 'worker-001', name: 'Senior Developer', role: 'Worker' },
  { id: 'worker-002', name: 'Database Specialist', role: 'Worker' },
  { id: 'worker-003', name: 'Technical Writer', role: 'Worker' },
];

export const ACORNTaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showDelegationDialog, setShowDelegationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    estimatedDuration: 120,
    tags: [],
    dependencies: []
  });

  const [delegationRequest, setDelegationRequest] = useState<Partial<TaskDelegationRequest>>({
    fromAgent: 'dir-001',
    toAgent: '',
    reasoning: '',
    urgency: 'medium'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'review': return 'warning';
      case 'blocked': return 'error';
      case 'failed': return 'error';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CompleteIcon />;
      case 'in_progress': return <StartIcon />;
      case 'review': return <ViewIcon />;
      case 'blocked': return <ErrorIcon />;
      case 'failed': return <ErrorIcon />;
      case 'pending': return <ScheduleIcon />;
      default: return <InfoIcon />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  const createTask = () => {
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
      assignedBy: 'current-user', // Would come from auth context
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dependencies: newTask.dependencies || [],
      tags: newTask.tags || []
    } as Task;

    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      estimatedDuration: 120,
      tags: [],
      dependencies: []
    });
    setShowTaskDialog(false);
  };

  const delegateTask = () => {
    if (delegationRequest.toAgent && selectedTask) {
      console.log('Delegating task:', {
        task: selectedTask,
        delegation: delegationRequest
      });
      // Implementation would send delegation request to backend
      setShowDelegationDialog(false);
    }
  };

  const updateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    ));
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getAgentName = (agentId: string): string => {
    return mockAgents.find(a => a.id === agentId)?.name || agentId;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <TaskIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              ACORN Task Management
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<MessageIcon />}
              onClick={() => setShowDelegationDialog(true)}
            >
              Delegate Task
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowTaskDialog(true)}
            >
              Create Task
            </Button>
          </Stack>
        </Stack>

        {/* Task Statistics */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip label={`${tasksByStatus.pending} Pending`} color="default" variant="outlined" />
          <Chip label={`${tasksByStatus.in_progress} In Progress`} color="info" variant="outlined" />
          <Chip label={`${tasksByStatus.review} In Review`} color="warning" variant="outlined" />
          <Chip label={`${tasksByStatus.completed} Completed`} color="success" variant="outlined" />
          <Chip label={`${tasksByStatus.blocked} Blocked`} color="error" variant="outlined" />
        </Stack>
      </Paper>

      {/* Filters and Tabs */}
      <Paper sx={{ mb: 2 }} elevation={1}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Task List" />
            <Tab label="Task Board" />
            <Tab label="Timeline" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                label="Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {task.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {task.description}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          {task.tags.map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <PersonIcon />
                        </Avatar>
                        <Typography variant="body2">
                          {getAgentName(task.assignedTo)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={task.priority}
                        size="small"
                        color={getPriorityColor(task.priority) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={task.status}
                        size="small"
                        color={getStatusColor(task.status) as any}
                        icon={getStatusIcon(task.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={task.progress} 
                          color={task.progress === 100 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {task.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {task.deadline && (
                        <Typography variant="body2">
                          {new Date(task.deadline).toLocaleDateString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small"
                            onClick={() => setSelectedTask(task)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Task">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {task.status === 'pending' && (
                          <Tooltip title="Start Task">
                            <IconButton 
                              size="small"
                              color="primary"
                              onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            >
                              <StartIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 1 && (
          <Alert severity="info">
            Task Board view - Kanban-style interface coming soon
          </Alert>
        )}

        {activeTab === 2 && (
          <Alert severity="info">
            Timeline view - Gantt chart interface coming soon
          </Alert>
        )}

        {activeTab === 3 && (
          <Alert severity="info">
            Analytics view - Task performance metrics coming soon
          </Alert>
        )}
      </Box>

      {/* Create Task Dialog */}
      <Dialog open={showTaskDialog} onClose={() => setShowTaskDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select
                  value={newTask.assignedTo}
                  label="Assign To"
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                >
                  {mockAgents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newTask.priority}
                  label="Priority"
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              fullWidth
              label="Estimated Duration (minutes)"
              type="number"
              value={newTask.estimatedDuration}
              onChange={(e) => setNewTask({...newTask, estimatedDuration: parseInt(e.target.value)})}
            />

            <TextField
              fullWidth
              label="Deadline"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setNewTask({...newTask, deadline: new Date(e.target.value).toISOString()})}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTaskDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={createTask}
            disabled={!newTask.title?.trim() || !newTask.assignedTo}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Delegation Dialog */}
      <Dialog open={showDelegationDialog} onClose={() => setShowDelegationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delegate Task</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>From Agent</InputLabel>
              <Select
                value={delegationRequest.fromAgent}
                label="From Agent"
                onChange={(e) => setDelegationRequest({...delegationRequest, fromAgent: e.target.value})}
              >
                {mockAgents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>To Agent</InputLabel>
              <Select
                value={delegationRequest.toAgent}
                label="To Agent"
                onChange={(e) => setDelegationRequest({...delegationRequest, toAgent: e.target.value})}
              >
                {mockAgents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Delegation Reasoning"
              multiline
              rows={3}
              value={delegationRequest.reasoning}
              onChange={(e) => setDelegationRequest({...delegationRequest, reasoning: e.target.value})}
              placeholder="Explain why this task should be delegated..."
            />

            <FormControl fullWidth>
              <InputLabel>Urgency</InputLabel>
              <Select
                value={delegationRequest.urgency}
                label="Urgency"
                onChange={(e) => setDelegationRequest({...delegationRequest, urgency: e.target.value as any})}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDelegationDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={delegateTask}
            disabled={!delegationRequest.toAgent || !delegationRequest.reasoning?.trim()}
          >
            Send Delegation Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};