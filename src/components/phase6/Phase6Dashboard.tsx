import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useWebSocketSimple } from '../../hooks/useWebSocketSimple';
import ChatWebSocketTester from './ChatWebSocketTester';
import AgentCollaborationHub from '../agents/AgentCollaborationHub';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  capabilities: string[];
  currentTask?: string;
  progress?: number;
}

interface CoordinationSession {
  sessionId: string;
  workflowId: string;
  activeAgents: string[];
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  currentStage: string;
}

interface ProgressEvent {
  eventType: 'tool_progress' | 'coordination_event' | 'agent_communication' | 'handoff_status';
  timestamp: string;
  data: any;
}

const Phase6Dashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'iris_cto',
      name: 'Iris',
      type: 'Architecture Agent',
      status: 'idle',
      capabilities: ['architecture_design', 'performance_analysis']
    },
    {
      id: 'bradley_sentinel',
      name: 'Bradley',
      type: 'Security Agent',
      status: 'idle',
      capabilities: ['security_audit', 'compliance_checking']
    },
    {
      id: 'greta_knowledge',
      name: 'Greta',
      type: 'Knowledge Agent',
      status: 'idle',
      capabilities: ['research', 'content_analysis']
    }
  ]);

  const [sessions, setSessions] = useState<CoordinationSession[]>([]);
  const [recentEvents, setRecentEvents] = useState<ProgressEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Initialize WebSocket connection to Phase 6 backend (worker progress)
  const { sendMessage, isConnected } = useWebSocketSimple({
    url: 'ws://localhost:8080/api/workers/progress',
    onConnect: () => {
      setConnectionStatus('connected');
      console.log('Connected to Phase 6 worker progress stream');
    },
    onDisconnect: () => {
      setConnectionStatus('disconnected');
    }
  });

  // Connection status is managed by onConnect/onDisconnect callbacks

  const handleWebSocketMessage = (data: any) => {
    const event: ProgressEvent = {
      eventType: data.event_type || data.type,
      timestamp: new Date().toLocaleTimeString(),
      data
    };

    // Add to recent events
    setRecentEvents(prev => [event, ...prev.slice(0, 19)]); // Keep last 20 events

    // Update agent status based on events
    if (event.eventType === 'agent_communication' && event.data.agent_id) {
      setAgents(prev => prev.map(agent => 
        agent.id === event.data.agent_id 
          ? { ...agent, status: 'active', currentTask: event.data.task }
          : agent
      ));
    }

    // Update coordination sessions
    if (event.eventType === 'coordination_event' && event.data.session_id) {
      const sessionData = event.data;
      setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.sessionId === sessionData.session_id);
        const updatedSession: CoordinationSession = {
          sessionId: sessionData.session_id,
          workflowId: sessionData.workflow_id || 'unknown',
          activeAgents: sessionData.active_agents || [],
          status: sessionData.status || 'running',
          progress: sessionData.progress || 0,
          currentStage: sessionData.current_stage || 'Unknown'
        };

        if (existingIndex >= 0) {
          const newSessions = [...prev];
          newSessions[existingIndex] = updatedSession;
          return newSessions;
        } else {
          return [updatedSession, ...prev];
        }
      });
    }
  };

  // Listen for WebSocket messages through the store
  useEffect(() => {
    const handleMessage = (event: any) => {
      handleWebSocketMessage(event.detail);
    };

    window.addEventListener('websocket-message', handleMessage);
    return () => window.removeEventListener('websocket-message', handleMessage);
  }, []);

  const createTestSession = async () => {
    try {
      // Create a new chat room for multi-agent coordination
      const response = await fetch('http://localhost:8080/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Phase 6 Multi-Agent Session',
          customer_id: '00000000-0000-0000-0000-000000000000',
          project_id: '00000000-0000-0000-0000-000000000000',
          participants: ['developer']
        })
      });
      
      if (response.ok) {
        const roomData = await response.json();
        console.log('Created room:', roomData);
        
        // Add a coordination session based on the room
        const newSession: CoordinationSession = {
          sessionId: roomData.room_id,
          workflowId: 'multi-agent-feature-development',
          activeAgents: roomData.system_participants || [],
          status: 'running',
          progress: 0,
          currentStage: 'Initializing'
        };
        
        setSessions(prev => [newSession, ...prev]);
        
        // Add an event to show activity
        const event: ProgressEvent = {
          eventType: 'coordination_event',
          timestamp: new Date().toLocaleTimeString(),
          data: {
            type: 'session_created',
            session_id: roomData.room_id,
            agents: roomData.system_participants,
            room_id: roomData.room_id
          }
        };
        setRecentEvents(prev => [event, ...prev.slice(0, 19)]);
        
      } else {
        console.error('Failed to create room:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating test session:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'running': case 'connected': return 'success';
      case 'idle': case 'paused': return 'warning';
      case 'error': case 'failed': case 'disconnected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          🚀 Geneva Phase 6 - Multi-Agent Coordination
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip 
            icon={<TimelineIcon />}
            label={`Worker Progress: ${connectionStatus}`}
            color={getStatusColor(connectionStatus)}
            variant={connectionStatus === 'connected' ? 'filled' : 'outlined'}
          />
          <Button 
            startIcon={<PlayIcon />}
            variant="contained" 
            onClick={createTestSession}
          >
            Create Multi-Agent Session
          </Button>
          <Button 
            startIcon={<RefreshIcon />}
            variant="outlined" 
            onClick={() => {
              setRecentEvents([]);
              setSessions([]);
            }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {connectionStatus !== 'connected' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Not connected to Geneva backend. Make sure the backend is running on localhost:8080
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Agent Collaboration Hub */}
        <Grid size={12}>
          <AgentCollaborationHub />
        </Grid>

        {/* Agent Status Dashboard */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon /> Agent Status
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {agents.map(agent => (
                <Card key={agent.id} variant="outlined">
                  <CardContent sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {agent.name}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={agent.status} 
                        color={getStatusColor(agent.status)}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {agent.type}
                    </Typography>
                    
                    {agent.currentTask && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Current: {agent.currentTask}
                      </Typography>
                    )}
                    
                    {agent.progress !== undefined && (
                      <LinearProgress 
                        variant="determinate" 
                        value={agent.progress} 
                        sx={{ mb: 1 }}
                      />
                    )}
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {agent.capabilities.map(cap => (
                        <Chip 
                          key={cap} 
                          label={cap} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Coordination Sessions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Coordination Sessions
            </Typography>
            
            {sessions.length === 0 ? (
              <Alert severity="info">
                No active coordination sessions. Create a test session to see multi-agent coordination in action.
              </Alert>
            ) : (
              <List>
                {sessions.map(session => (
                  <React.Fragment key={session.sessionId}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">
                              {session.workflowId}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={session.status} 
                              color={getStatusColor(session.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Stage: {session.currentStage}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Agents: {session.activeAgents.join(', ')}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={session.progress} 
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Chat WebSocket Tester */}
        <Grid size={12}>
          <ChatWebSocketTester />
        </Grid>

        {/* Real-time Event Stream */}
        <Grid size={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Real-time Event Stream
              </Typography>
              <IconButton onClick={() => setRecentEvents([])}>
                <RefreshIcon />
              </IconButton>
            </Box>
            
            {recentEvents.length === 0 ? (
              <Alert severity="info">
                No events received yet. Events will appear here when agents communicate or coordinate.
              </Alert>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentEvents.map((event, index) => (
                  <Paper key={index} elevation={1} sx={{ p: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip size="small" label={event.eventType} />
                      <Typography variant="caption" color="text.secondary">
                        {event.timestamp}
                      </Typography>
                    </Box>
                    <Typography variant="body2" component="pre" sx={{ 
                      fontSize: '0.75rem', 
                      overflow: 'auto',
                      backgroundColor: '#f5f5f5',
                      p: 1,
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {JSON.stringify(event.data, null, 2)}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Phase6Dashboard;