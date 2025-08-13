import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  Button
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Group as GroupIcon,
  SwapHoriz as HandoffIcon,
  Message as MessageIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  HourglassEmpty as WaitingIcon,
  PlayArrow as ActiveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  color: string;
  title: string;
  status: 'active' | 'waiting' | 'idle' | 'error';
  currentTask?: string;
  progress?: number;
  capabilities: string[];
}

interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent?: string;
  type: 'task_delegation' | 'progress_update' | 'handoff_request' | 'completion' | 'error';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface HandoffExecution {
  id: string;
  fromAgent: string;
  toAgent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  strategy: 'sequential' | 'parallel' | 'conditional' | 'approval';
  startTime: Date;
  endTime?: Date;
  artifacts?: string[];
}

interface CoordinationSession {
  sessionId: string;
  workflowId: string;
  roomId: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  startTime: Date;
  agents: Agent[];
  messages: AgentMessage[];
  handoffs: HandoffExecution[];
  sharedContext: Record<string, any>;
}

interface AgentCollaborationHubProps {
  sessionId?: string;
  roomId?: string;
  onSessionCreate?: (session: CoordinationSession) => void;
}

const AgentCollaborationHub: React.FC<AgentCollaborationHubProps> = ({ 
  sessionId: propSessionId, 
  roomId: propRoomId,
  onSessionCreate 
}) => {
  const [session, setSession] = useState<CoordinationSession | null>(null);
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'bradley_sentinel',
      name: 'Bradley',
      avatar: '🛡️',
      color: '#f44336',
      title: 'Chief Security Officer',
      status: 'idle',
      capabilities: ['security_audit', 'compliance_checking', 'risk_assessment']
    },
    {
      id: 'iris_cto',
      name: 'Iris',
      avatar: '🏗️',
      color: '#2196f3',
      title: 'Chief Technology Officer',
      status: 'idle',
      capabilities: ['architecture_design', 'performance_analysis', 'technical_review']
    },
    {
      id: 'greta_praxis',
      name: 'Greta',
      avatar: '🔮',
      color: '#3f51b5',
      title: 'Chief Ontology Officer',
      status: 'idle',
      capabilities: ['research', 'content_analysis', 'knowledge_synthesis']
    }
  ]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffExecution[]>([]);
  const [activeHandoff, setActiveHandoff] = useState<HandoffExecution | null>(null);

  // Simulate agent activity for demo
  useEffect(() => {
    if (!session) return;

    const simulateActivity = () => {
      // Simulate Bradley starting work
      setAgents(prev => prev.map(agent => 
        agent.id === 'bradley_sentinel' 
          ? { ...agent, status: 'active', currentTask: 'Security audit', progress: 45 }
          : agent
      ));

      // Add a message
      const newMessage: AgentMessage = {
        id: Date.now().toString(),
        fromAgent: 'bradley_sentinel',
        type: 'progress_update',
        content: 'Security audit in progress. Core functionality 45% complete.',
        timestamp: new Date()
      };
      setMessages(prev => [newMessage, ...prev]);
    };

    const timer = setTimeout(simulateActivity, 2000);
    return () => clearTimeout(timer);
  }, [session]);

  const createNewSession = async () => {
    try {
      // Create a new room if needed
      let roomId = propRoomId;
      if (!roomId) {
        const response = await fetch('http://localhost:8080/api/chat/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Multi-Agent Collaboration Session',
            customer_id: '00000000-0000-0000-0000-000000000000',
            project_id: '00000000-0000-0000-0000-000000000000',
            participants: ['developer']
          })
        });
        
        if (response.ok) {
          const roomData = await response.json();
          roomId = roomData.room_id;
        }
      }

      const newSession: CoordinationSession = {
        sessionId: `session-${Date.now()}`,
        workflowId: 'feature-development',
        roomId: roomId || '',
        status: 'active',
        startTime: new Date(),
        agents: agents,
        messages: [],
        handoffs: [],
        sharedContext: {}
      };

      setSession(newSession);
      onSessionCreate?.(newSession);
      
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const initiateHandoff = (fromAgentId: string, toAgentId: string) => {
    const handoff: HandoffExecution = {
      id: `handoff-${Date.now()}`,
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      status: 'in_progress',
      strategy: 'sequential',
      startTime: new Date()
    };

    setHandoffs(prev => [handoff, ...prev]);
    setActiveHandoff(handoff);

    // Update agent statuses
    setAgents(prev => prev.map(agent => {
      if (agent.id === fromAgentId) {
        return { ...agent, status: 'waiting', currentTask: 'Handing off...' };
      } else if (agent.id === toAgentId) {
        return { ...agent, status: 'active', currentTask: 'Receiving handoff...', progress: 0 };
      }
      return agent;
    }));

    // Add handoff message
    const handoffMessage: AgentMessage = {
      id: Date.now().toString(),
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      type: 'handoff_request',
      content: `Initiating handoff from ${agents.find(a => a.id === fromAgentId)?.name} to ${agents.find(a => a.id === toAgentId)?.name}`,
      timestamp: new Date(),
      metadata: { handoffId: handoff.id }
    };
    setMessages(prev => [handoffMessage, ...prev]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ActiveIcon color="success" />;
      case 'waiting': return <WaitingIcon color="warning" />;
      case 'completed': return <CompleteIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return null;
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'handoff_request': return <HandoffIcon />;
      case 'task_delegation': return <GroupIcon />;
      case 'completion': return <CompleteIcon />;
      case 'error': return <ErrorIcon />;
      default: return <MessageIcon />;
    }
  };

  if (!session) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Agent Collaboration Hub
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create a new coordination session to enable multi-agent collaboration
        </Typography>
        <Button
          variant="contained"
          startIcon={<GroupIcon />}
          onClick={createNewSession}
          size="large"
        >
          Start Collaboration Session
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Coordination Session: {session.workflowId}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={session.status} 
              color={session.status === 'active' ? 'success' : 'default'}
              size="small"
            />
            <IconButton size="small" onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        {/* Agent Status Cards */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Active Agents
            </Typography>
            
            <Grid container spacing={2}>
              {agents.map(agent => (
                <Grid size={{ xs: 12, sm: 6 }} key={agent.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderColor: agent.status === 'active' ? agent.color : 'divider',
                      borderWidth: agent.status === 'active' ? 2 : 1
                    }}
                  >
                    <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: agent.color, mr: 1, width: 32, height: 32 }}>
                          <span style={{ fontSize: '1.2rem' }}>{agent.avatar}</span>
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {agent.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {agent.title}
                          </Typography>
                        </Box>
                        <Badge 
                          badgeContent={getStatusIcon(agent.status)} 
                          overlap="circular"
                        />
                      </Box>
                      
                      {agent.currentTask && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {agent.currentTask}
                        </Typography>
                      )}
                      
                      {agent.progress !== undefined && agent.status === 'active' && (
                        <LinearProgress 
                          variant="determinate" 
                          value={agent.progress} 
                          sx={{ mb: 1 }}
                        />
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {agent.capabilities.slice(0, 2).map(cap => (
                          <Chip 
                            key={cap} 
                            label={cap} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Communication Log */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Agent Communication
            </Typography>
            
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {messages.length === 0 ? (
                <Alert severity="info">
                  Agent communication will appear here as they collaborate
                </Alert>
              ) : (
                messages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {getMessageIcon(message.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">
                              {agents.find(a => a.id === message.fromAgent)?.name}
                              {message.toAgent && ` → ${agents.find(a => a.id === message.toAgent)?.name}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {message.timestamp.toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {message.content}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < messages.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Handoff Visualization */}
        <Grid size={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Workflow Handoffs
            </Typography>
            
            {agents.length > 1 && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<HandoffIcon />}
                  onClick={() => initiateHandoff('bradley_sentinel', 'greta_praxis')}
                  disabled={agents.find(a => a.id === 'bradley_sentinel')?.status !== 'active'}
                >
                  Bradley → Greta
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<HandoffIcon />}
                  onClick={() => initiateHandoff('bradley_sentinel', 'iris_cto')}
                  disabled={agents.find(a => a.id === 'bradley_sentinel')?.status !== 'active'}
                >
                  Bradley → Iris
                </Button>
              </Box>
            )}
            
            {handoffs.length === 0 ? (
              <Alert severity="info">
                No handoffs yet. Agents will pass work between each other as needed.
              </Alert>
            ) : (
              <List>
                {handoffs.map(handoff => (
                  <ListItem key={handoff.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <HandoffIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${agents.find(a => a.id === handoff.fromAgent)?.name} → ${agents.find(a => a.id === handoff.toAgent)?.name}`}
                      secondary={
                        <Box>
                          <Chip 
                            label={handoff.strategy} 
                            size="small" 
                            sx={{ mr: 1 }}
                          />
                          <Chip 
                            label={handoff.status} 
                            size="small" 
                            color={handoff.status === 'completed' ? 'success' : 'default'}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgentCollaborationHub;