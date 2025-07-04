import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, Typography, TextField, Button, Avatar, Chip, List, ListItem, ListItemAvatar, ListItemText, Divider, IconButton, CircularProgress, Tabs, Tab } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Send as SendIcon, Add as AddIcon, Close as CloseIcon, Psychology as PsychologyIcon, Memory as MemoryIcon, Code as CodeIcon } from '@mui/icons-material';
import { useWebSocketSimple } from '../hooks/useWebSocketSimple';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

interface Message {
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  user_id?: string;
  agent_id?: string;
}

interface InfrastructureEvent {
  type: string;
  agent_id?: string;
  room_id?: string;
  timestamp: string;
  [key: string]: any;
}

interface AgentProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  status: 'idle' | 'thinking' | 'responding';
}

// ACORN Executive profiles
const ACORN_EXECUTIVES: Record<string, AgentProfile> = {
  sloan_ceo: {
    id: 'sloan_ceo',
    name: 'Sloan',
    title: 'Chief Executive Officer',
    avatar: 'S',
    color: '#1976d2',
    status: 'idle'
  },
  mira_coo: {
    id: 'mira_coo',
    name: 'Mira',
    title: 'Chief Operating Officer',
    avatar: 'M',
    color: '#388e3c',
    status: 'idle'
  },
  erik_cdo: {
    id: 'erik_cdo',
    name: 'Erik',
    title: 'Chief Development Officer',
    avatar: 'E',
    color: '#7b1fa2',
    status: 'idle'
  },
  iris_cto: {
    id: 'iris_cto',
    name: 'Iris',
    title: 'Chief Technology Officer',
    avatar: 'I',
    color: '#c2185b',
    status: 'idle'
  },
  konrad_ciso: {
    id: 'konrad_ciso',
    name: 'Konrad',
    title: 'Chief Information Security Officer',
    avatar: 'K',
    color: '#d32f2f',
    status: 'idle'
  },
  kayla_cfo: {
    id: 'kayla_cfo',
    name: 'Kayla',
    title: 'Chief Financial Officer',
    avatar: 'K',
    color: '#f57c00',
    status: 'idle'
  },
  vesper_cmo: {
    id: 'vesper_cmo',
    name: 'Vesper',
    title: 'Chief Marketing Officer',
    avatar: 'V',
    color: '#689f38',
    status: 'idle'
  },
  taryn_cro_revenue: {
    id: 'taryn_cro_revenue',
    name: 'Taryn',
    title: 'Chief Revenue Officer',
    avatar: 'T',
    color: '#0288d1',
    status: 'idle'
  },
  digby_cro_research: {
    id: 'digby_cro_research',
    name: 'Digby',
    title: 'Chief Research Officer',
    avatar: 'D',
    color: '#5e35b1',
    status: 'idle'
  },
  kingsley_chief_of_staff: {
    id: 'kingsley_chief_of_staff',
    name: 'Kingsley',
    title: 'Chief of Staff',
    avatar: 'K',
    color: '#616161',
    status: 'idle'
  },
  baxter_assistant: {
    id: 'baxter_assistant',
    name: 'Baxter',
    title: 'Executive Assistant',
    avatar: 'B',
    color: '#795548',
    status: 'idle'
  }
};

interface ACORNChatRoomProps {
  roomId?: string;
  initialParticipants?: string[];
}

export const ACORNChatRoom: React.FC<ACORNChatRoomProps> = ({ roomId, initialParticipants = [] }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  // Store participants with their full IDs (including acorn/ prefix if present)
  const [participants, setParticipants] = useState<Set<string>>(new Set(initialParticipants));
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentProfile>>(ACORN_EXECUTIVES);
  const [infrastructureEvents, setInfrastructureEvents] = useState<InfrastructureEvent[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('ACORNChatRoom mounted with:', {
      roomId,
      initialParticipants,
      participantsSet: Array.from(participants)
    });
  }, [roomId, initialParticipants, participants]);

  // WebSocket for chat - only connect if we have a roomId
  const chatWs = useWebSocketSimple({
    url: roomId ? `${WS_BASE}/api/chat/ws/${roomId}` : '',
    enabled: !!roomId,
    onConnect: () => {
      setIsConnected(true);
      console.log('Connected to chat room');
    },
    onDisconnect: () => {
      setIsConnected(false);
      console.log('Disconnected from chat room');
    },
    onMessage: (message) => {
      setMessages(prev => [...prev, message]);
      
      // Update agent status based on message
      if (message.type === 'agent' && message.agent_id) {
        const normalizedId = message.agent_id.replace('acorn/', '');
        setAgentStatuses(prev => ({
          ...prev,
          [normalizedId]: { ...prev[normalizedId], status: 'idle' }
        }));
      }
    }
  });

  // Chat WebSocket is now handled in the hook itself

  // WebSocket for infrastructure events
  const infraWs = useWebSocketSimple({
    url: `${WS_BASE}/api/chat/infrastructure`,
    enabled: !!roomId,
    onMessage: (infraEvent) => {
      setInfrastructureEvents(prev => [...prev.slice(-50), infraEvent]); // Keep last 50 events
      
      // Update agent status based on infrastructure events
      if (infraEvent.agent_id) {
        const normalizedId = infraEvent.agent_id.replace('acorn/', '');
        if (infraEvent.type === 'agent_processing_started') {
          setAgentStatuses(prev => ({
            ...prev,
            [normalizedId]: { ...prev[normalizedId], status: 'thinking' }
          }));
        } else if (infraEvent.type === 'agent_processing_completed' || infraEvent.type === 'agent_processing_failed') {
          setAgentStatuses(prev => ({
            ...prev,
            [normalizedId]: { ...prev[normalizedId], status: 'idle' }
          }));
        }
      }
    }
  });

  // Infrastructure WebSocket is now handled in the hook itself

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (inputMessage.trim() && chatWs.isConnected) {
      console.log('Sending message:', inputMessage);
      console.log('Participants:', Array.from(participants));
      chatWs.send({
        type: 'user',
        content: inputMessage,
        user_id: 'user',
        target_agents: participants.size > 0 ? Array.from(participants) : undefined
      });
      setInputMessage('');
    } else {
      console.log('Cannot send - trim:', inputMessage.trim(), 'connected:', chatWs.isConnected);
    }
  }, [inputMessage, chatWs, participants]);

  const addParticipant = useCallback((agentId: string) => {
    setParticipants(prev => new Set(prev).add(agentId));
    if (chatWs.isConnected) {
      chatWs.send({
        type: 'add_participant',
        agent_id: agentId
      });
    }
  }, [chatWs]);

  const removeParticipant = useCallback((agentId: string) => {
    setParticipants(prev => {
      const newSet = new Set(prev);
      newSet.delete(agentId);
      return newSet;
    });
    if (chatWs.isConnected) {
      chatWs.send({
        type: 'remove_participant',
        agent_id: agentId
      });
    }
  }, [chatWs]);

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.type === 'user';
    // Handle both formats: with and without acorn/ prefix
    const normalizedAgentId = message.agent_id ? message.agent_id.replace('acorn/', '') : null;
    const agent = normalizedAgentId ? (agentStatuses[normalizedAgentId] || agentStatuses[message.agent_id!]) : null;

    return (
      <ListItem key={index} sx={{ flexDirection: isUser ? 'row-reverse' : 'row' }}>
        {!isUser && agent && (
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: agent.color }}>{agent.avatar}</Avatar>
          </ListItemAvatar>
        )}
        <Box
          sx={{
            maxWidth: '70%',
            bgcolor: isUser ? 'primary.main' : 'grey.100',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: 2,
            p: 2,
            ml: isUser ? 2 : 0,
            mr: isUser ? 0 : 2
          }}
        >
          {agent && (
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {agent.name}
            </Typography>
          )}
          <Typography variant="body1">{message.content}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </ListItem>
    );
  };

  const renderInfrastructureEvent = (event: InfrastructureEvent, index: number) => {
    // Handle both formats: with and without acorn/ prefix
    const normalizedAgentId = event.agent_id ? event.agent_id.replace('acorn/', '') : null;
    const agent = normalizedAgentId ? (agentStatuses[normalizedAgentId] || agentStatuses[event.agent_id!]) : null;
    let icon = <PsychologyIcon />;
    let color = 'default';

    if (event.type.includes('memory')) {
      icon = <MemoryIcon />;
      color = 'primary';
    } else if (event.type.includes('code') || event.type.includes('claude')) {
      icon = <CodeIcon />;
      color = 'secondary';
    }

    return (
      <ListItem key={index} dense>
        <ListItemAvatar>
          <Avatar sx={{ width: 30, height: 30, bgcolor: `${color}.light` }}>
            {icon}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="caption">
              {agent ? `${agent.name}: ` : ''}{event.type}
            </Typography>
          }
          secondary={
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              {new Date(event.timestamp).toLocaleTimeString()}
            </Typography>
          }
        />
      </ListItem>
    );
  };

  return (
    <Grid container spacing={2} sx={{ height: '100vh', p: 2 }}>
      {/* Agent Selection Panel */}
      <Grid item xs={3} {...{} as any}>
        <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            ACORN Executives
          </Typography>
          <List>
            {Object.values(agentStatuses).map((agent) => (
              <ListItem key={agent.id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: agent.color }}>{agent.avatar}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={agent.name}
                  secondary={
                    <Box>
                      <Typography variant="caption">{agent.title}</Typography>
                      {agent.status !== 'idle' && (
                        <Chip
                          label={agent.status}
                          size="small"
                          color={agent.status === 'thinking' ? 'warning' : 'success'}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                <IconButton
                  size="small"
                  onClick={() =>
                    participants.has(agent.id)
                      ? removeParticipant(agent.id)
                      : addParticipant(agent.id)
                  }
                  color={participants.has(agent.id) ? 'primary' : 'default'}
                >
                  {participants.has(agent.id) ? <CloseIcon /> : <AddIcon />}
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Chat and Infrastructure Panel */}
      <Grid item xs={9} {...{} as any}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
              <Tab label="Chat" />
              <Tab label="Infrastructure Events" />
            </Tabs>
          </Box>

          {/* Chat Messages */}
          {selectedTab === 0 && (
            <>
              <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message, index) => renderMessage(message, index))}
                <div ref={messagesEndRef} />
              </List>

              {/* Input Area */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  {Array.from(participants).map((agentId) => {
                    // Handle both formats: with and without acorn/ prefix
                    const normalizedId = agentId.replace('acorn/', '');
                    const agent = agentStatuses[normalizedId] || agentStatuses[agentId];
                    if (!agent) {
                      console.warn(`Agent not found for ID: ${agentId}`);
                      return null;
                    }
                    return (
                      <Chip
                        key={agentId}
                        avatar={<Avatar sx={{ bgcolor: agent.color }}>{agent.avatar}</Avatar>}
                        label={agent.name}
                        onDelete={() => removeParticipant(agentId)}
                        size="small"
                      />
                    );
                  })}
                  {participants.size === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Select executives to chat with
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!isConnected || participants.size === 0}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={sendMessage}
                    disabled={!isConnected || participants.size === 0 || !inputMessage.trim()}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            </>
          )}

          {/* Infrastructure Events */}
          {selectedTab === 1 && (
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {infrastructureEvents.map((event, index) => renderInfrastructureEvent(event, index))}
            </List>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};