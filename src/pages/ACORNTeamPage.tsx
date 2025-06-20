import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  AccountTree as HierarchyIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Assignment as TaskIcon,
  Speed as PerformanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Message as MessageIcon,
  PlayArrow as ExecuteIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
} from '@mui/icons-material';

interface ACORNAgent {
  id: string;
  name: string;
  role: 'CEO' | 'VP' | 'Director' | 'Worker';
  department: string;
  status: 'active' | 'idle' | 'busy' | 'offline';
  currentTask?: string;
  completedTasks: number;
  successRate: number;
  avgResponseTime: number;
  lastActivity: string;
  subordinates?: string[];
  supervisor?: string;
  capabilities: string[];
}

interface TeamMetrics {
  totalAgents: number;
  activeAgents: number;
  tasksInProgress: number;
  completedToday: number;
  avgSuccessRate: number;
  bottlenecks: string[];
}

const mockAgents: ACORNAgent[] = [
  {
    id: 'ceo-001',
    name: 'Executive CEO',
    role: 'CEO',
    department: 'Executive',
    status: 'active',
    currentTask: 'Strategic Planning Review',
    completedTasks: 45,
    successRate: 98.5,
    avgResponseTime: 2300,
    lastActivity: '2 minutes ago',
    subordinates: ['vp-001', 'vp-002', 'vp-003'],
    capabilities: ['strategic_planning', 'executive_decision', 'team_coordination']
  },
  {
    id: 'vp-001',
    name: 'VP Engineering',
    role: 'VP',
    department: 'Engineering',
    status: 'busy',
    currentTask: 'Architecture Review',
    completedTasks: 127,
    successRate: 94.2,
    avgResponseTime: 1800,
    lastActivity: '5 minutes ago',
    supervisor: 'ceo-001',
    subordinates: ['dir-001', 'dir-002'],
    capabilities: ['technical_review', 'team_management', 'architecture_design']
  },
  {
    id: 'vp-002',
    name: 'VP Operations',
    role: 'VP',
    department: 'Operations',
    status: 'active',
    currentTask: 'Process Optimization',
    completedTasks: 89,
    successRate: 96.1,
    avgResponseTime: 1500,
    lastActivity: '1 minute ago',
    supervisor: 'ceo-001',
    subordinates: ['dir-003'],
    capabilities: ['process_optimization', 'resource_management', 'quality_assurance']
  },
  {
    id: 'dir-001',
    name: 'Director Frontend',
    role: 'Director',
    department: 'Engineering',
    status: 'active',
    currentTask: 'UI Component Review',
    completedTasks: 203,
    successRate: 92.8,
    avgResponseTime: 1200,
    lastActivity: '30 seconds ago',
    supervisor: 'vp-001',
    subordinates: ['worker-001', 'worker-002'],
    capabilities: ['frontend_development', 'ui_design', 'code_review']
  },
  {
    id: 'worker-001',
    name: 'Senior Developer',
    role: 'Worker',
    department: 'Engineering',
    status: 'busy',
    currentTask: 'React Component Implementation',
    completedTasks: 342,
    successRate: 89.3,
    avgResponseTime: 900,
    lastActivity: '10 seconds ago',
    supervisor: 'dir-001',
    capabilities: ['react_development', 'typescript', 'testing']
  }
];

const mockMetrics: TeamMetrics = {
  totalAgents: 12,
  activeAgents: 9,
  tasksInProgress: 7,
  completedToday: 23,
  avgSuccessRate: 93.4,
  bottlenecks: ['Code Review Queue', 'External API Dependencies']
};

export const ACORNTeamPage: React.FC = () => {
  const [agents, setAgents] = useState<ACORNAgent[]>(mockAgents);
  const [metrics, setMetrics] = useState<TeamMetrics>(mockMetrics);
  const [selectedAgent, setSelectedAgent] = useState<ACORNAgent | null>(null);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>('grid');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'busy': return 'warning';
      case 'idle': return 'info';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CEO': return <BusinessIcon />;
      case 'VP': return <HierarchyIcon />;
      case 'Director': return <PersonIcon />;
      case 'Worker': return <TaskIcon />;
      default: return <PersonIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CEO': return '#1976d2';
      case 'VP': return '#388e3c';
      case 'Director': return '#f57c00';
      case 'Worker': return '#7b1fa2';
      default: return '#666';
    }
  };

  const openAgentDetails = (agent: ACORNAgent) => {
    setSelectedAgent(agent);
    setShowAgentDialog(true);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <HierarchyIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              ACORN Team Overview
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('grid')}
              size="small"
            >
              Grid View
            </Button>
            <Button
              variant={viewMode === 'hierarchy' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('hierarchy')}
              size="small"
            >
              Hierarchy View
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAgentDialog(true)}
            >
              Add Agent
            </Button>
          </Stack>
        </Stack>

        {/* Team Metrics */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Card variant="outlined" sx={{ minWidth: 120 }}>
            <CardContent sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h4" color="primary">{metrics.totalAgents}</Typography>
              <Typography variant="caption">Total Agents</Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ minWidth: 120 }}>
            <CardContent sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h4" color="success.main">{metrics.activeAgents}</Typography>
              <Typography variant="caption">Active Now</Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ minWidth: 120 }}>
            <CardContent sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h4" color="warning.main">{metrics.tasksInProgress}</Typography>
              <Typography variant="caption">In Progress</Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ minWidth: 120 }}>
            <CardContent sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h4" color="info.main">{metrics.completedToday}</Typography>
              <Typography variant="caption">Completed Today</Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ minWidth: 120 }}>
            <CardContent sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h4" color="success.main">{metrics.avgSuccessRate.toFixed(1)}%</Typography>
              <Typography variant="caption">Success Rate</Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ minWidth: 120 }}>
            <CardContent sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h4" color="error.main">{metrics.bottlenecks.length}</Typography>
              <Typography variant="caption">Bottlenecks</Typography>
            </CardContent>
          </Card>
        </Stack>
      </Paper>

      {/* Agent Grid */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Stack 
          direction="row" 
          flexWrap="wrap" 
          spacing={2} 
          sx={{ 
            '& > *': { 
              minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 10.67px)', lg: 'calc(25% - 12px)' }
            }
          }}
        >
          {agents.map((agent) => (
            <Card
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => openAgentDetails(agent)}
            >
              <CardContent>
                {/* Agent Header */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Badge
                    badgeContent={agent.subordinates?.length || 0}
                    color="primary"
                    invisible={!agent.subordinates?.length}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: getRoleColor(agent.role),
                        width: 48,
                        height: 48
                      }}
                    >
                      {getRoleIcon(agent.role)}
                    </Avatar>
                  </Badge>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" noWrap>
                      {agent.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip 
                        label={agent.role}
                        size="small"
                        sx={{ bgcolor: getRoleColor(agent.role), color: 'white' }}
                      />
                      <Chip 
                        label={agent.status}
                        size="small"
                        color={getStatusColor(agent.status) as any}
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                </Stack>

                {/* Current Task */}
                {agent.currentTask && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Current Task:
                    </Typography>
                    <Typography variant="body2" noWrap>
                      {agent.currentTask}
                    </Typography>
                  </Box>
                )}

                {/* Metrics */}
                <Stack spacing={1}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption">Success Rate</Typography>
                      <Typography variant="caption">{agent.successRate.toFixed(1)}%</Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={agent.successRate} 
                      color={agent.successRate > 95 ? 'success' : agent.successRate > 90 ? 'warning' : 'error'}
                    />
                  </Box>
                  
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption">
                      <TaskIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      {agent.completedTasks} tasks
                    </Typography>
                    <Typography variant="caption">
                      <PerformanceIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      {agent.avgResponseTime}ms
                    </Typography>
                  </Stack>
                  
                  <Typography variant="caption" color="text.secondary">
                    Last active: {agent.lastActivity}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Agent Details Dialog */}
      <Dialog 
        open={showAgentDialog} 
        onClose={() => setShowAgentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAgent ? `${selectedAgent.name} Details` : 'Add New Agent'}
        </DialogTitle>
        <DialogContent>
          {selectedAgent && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Basic Info */}
              <Box>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                  <Typography variant="body2">
                    <strong>Role:</strong> {selectedAgent.role}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Department:</strong> {selectedAgent.department}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedAgent.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Response Time:</strong> {selectedAgent.avgResponseTime}ms
                  </Typography>
                </Stack>
              </Box>

              {/* Capabilities */}
              <Box>
                <Typography variant="h6" gutterBottom>Capabilities</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {selectedAgent.capabilities.map((capability, idx) => (
                    <Chip key={idx} label={capability.replace(/_/g, ' ')} size="small" />
                  ))}
                </Stack>
              </Box>

              {/* Hierarchy */}
              {(selectedAgent.supervisor || selectedAgent.subordinates?.length) && (
                <Box>
                  <Typography variant="h6" gutterBottom>Hierarchy</Typography>
                  {selectedAgent.supervisor && (
                    <Typography variant="body2">
                      <strong>Reports to:</strong> {agents.find(a => a.id === selectedAgent.supervisor)?.name}
                    </Typography>
                  )}
                  {selectedAgent.subordinates?.length && (
                    <Typography variant="body2">
                      <strong>Manages:</strong> {selectedAgent.subordinates.map(id => 
                        agents.find(a => a.id === id)?.name
                      ).join(', ')}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Performance */}
              <Box>
                <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                <Stack direction="row" spacing={4}>
                  <Typography variant="body2">
                    <strong>Completed Tasks:</strong> {selectedAgent.completedTasks}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Success Rate:</strong> {selectedAgent.successRate.toFixed(1)}%
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAgentDialog(false)}>
            Close
          </Button>
          {selectedAgent && (
            <Button variant="contained" startIcon={<MessageIcon />}>
              View Communications
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};