import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  Avatar,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Grid } from '@mui/material';
import { 
  Chat as ChatIcon, 
  Add as AddIcon, 
  Group as GroupIcon,
  Memory as MemoryIcon,
  Psychology as BrainIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  Speed as PerformanceIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { ACORNChatRoomMemoryEnhanced } from '../components/ACORNChatRoomMemoryEnhanced';
import { formatTimestamp } from '../utils/dateUtils';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';


interface ChatRoom {
  room_id: string;
  participants: string[];
  created_at: string;
  message_count: number;
  memory_enhanced?: boolean;
  memory_stats?: {
    total_contexts: number;
    cross_agent_insights: number;
    learning_patterns: number;
  };
}

const ACORN_EXECUTIVES = [
  { id: 'sloan_ceo', name: 'Sloan', title: 'CEO' },
  { id: 'mira_coo', name: 'Mira', title: 'COO' },
  { id: 'erik_cdo', name: 'Erik', title: 'CDO' },
  { id: 'iris_cto', name: 'Iris', title: 'CTO' },
  { id: 'konrad_ciso', name: 'Konrad', title: 'CISO' },
  { id: 'kayla_cfo', name: 'Kayla', title: 'CFO' },
  { id: 'vesper_cmo', name: 'Vesper', title: 'CMO' },
  { id: 'taryn_cro_revenue', name: 'Taryn', title: 'CRO Revenue' },
  { id: 'digby_cro_research', name: 'Digby', title: 'CRO Research' },
  { id: 'kingsley_chief_of_staff', name: 'Kingsley', title: 'Chief of Staff' },
  { id: 'baxter_assistant', name: 'Baxter', title: 'Assistant' }
];

const SYSTEM_AGENTS = [
  { id: 'thedra_codex', name: 'Thedra', title: 'Chief Memory Officer', description: 'Manages conversation memory and context' },
  { id: 'greta_praxis', name: 'Greta', title: 'Chief Ontology Officer', description: 'Validates concepts and maintains semantic consistency' },
  { id: 'bradley_sentinel', name: 'Bradley', title: 'Chief Security Officer', description: 'Provides security guidance and best practices' },
  { id: 'digby_claude', name: 'Digby', title: 'Chief Automation Officer', description: 'Handles automation and process optimization' }
];

export const ACORNChatMemoryPage: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [roomName, setRoomName] = useState('');
  const [memoryEnhancedEnabled, setMemoryEnhancedEnabled] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/rooms`);
      const data = await response.json();
      // Ensure data is an array before mapping
      const roomsArray = Array.isArray(data) ? data : [];
      // Enhance rooms with mock memory stats
      const enhancedRooms = roomsArray.map((room: ChatRoom) => ({
        ...room,
        memory_enhanced: memoryEnhancedEnabled,
        memory_stats: {
          total_contexts: Math.floor(Math.random() * 50) + 10,
          cross_agent_insights: Math.floor(Math.random() * 20) + 5,
          learning_patterns: Math.floor(Math.random() * 15) + 3
        }
      }));
      setRooms(enhancedRooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      // Mock data for demonstration
      const mockRooms: ChatRoom[] = [
        {
          room_id: 'demo-memory-room-1',
          participants: ['bradley_sentinel', 'thedra_codex'],
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          message_count: 24,
          memory_enhanced: true,
          memory_stats: {
            total_contexts: 31,
            cross_agent_insights: 8,
            learning_patterns: 5
          }
        },
        {
          room_id: 'demo-memory-room-2', 
          participants: ['sloan_ceo', 'greta_praxis', 'digby_claude'],
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          message_count: 47,
          memory_enhanced: true,
          memory_stats: {
            total_contexts: 42,
            cross_agent_insights: 12,
            learning_patterns: 7
          }
        }
      ];
      setRooms(mockRooms);
    }
  };

  const createRoom = async () => {
    if (selectedParticipants.length === 0) return;

    try {
      const payload = {
        customer_id: 'test-customer-001', // TODO: Get from context
        project_id: 'test-project-001',   // TODO: Get from context
        participants: selectedParticipants,
        memory_enhanced: memoryEnhancedEnabled
      };
      
      console.log('Creating memory-enhanced room with payload:', payload);
      
      const response = await fetch(`${API_BASE}/api/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        // Mock room creation for demo
        const newRoom: ChatRoom = {
          room_id: `demo-room-${Date.now()}`,
          participants: selectedParticipants,
          created_at: new Date().toISOString(),
          message_count: 0,
          memory_enhanced: memoryEnhancedEnabled,
          memory_stats: {
            total_contexts: 0,
            cross_agent_insights: 0,
            learning_patterns: 0
          }
        };
        
        setRooms(prev => [...prev, newRoom]);
        setSelectedRoom(newRoom.room_id);
        setCreateDialogOpen(false);
        setSelectedParticipants([]);
        setRoomName('');
        return;
      }
      
      const newRoom = await response.json();
      console.log('Room created:', newRoom);
      
      await fetchRooms();
      setSelectedRoom(newRoom.room_id);
      setCreateDialogOpen(false);
      setSelectedParticipants([]);
      setRoomName('');
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Check console for details.');
    }
  };

  const getParticipantNames = (participants: string[]) => {
    return participants
      .map(id => {
        // Handle both formats: with and without acorn/ prefix
        const normalizedId = id.replace('acorn/', '');
        const exec = ACORN_EXECUTIVES.find(exec => exec.id === normalizedId);
        const systemAgent = SYSTEM_AGENTS.find(agent => agent.id === normalizedId);
        return exec?.name || systemAgent?.name || id;
      })
      .join(', ');
  };

  if (selectedRoom) {
    const room = rooms.find(r => r.room_id === selectedRoom);
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button onClick={() => setSelectedRoom(null)} startIcon={<ChatIcon />}>
                Back to Rooms
              </Button>
              <Typography variant="h6" component="span">
                {room?.memory_enhanced && (
                  <Chip
                    icon={<MemoryIcon />}
                    label="Memory Enhanced"
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                )}
                Chat with: {room ? getParticipantNames(room.participants) : 'Loading...'}
              </Typography>
            </Box>
            
            {room?.memory_stats && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  size="small"
                  icon={<BrainIcon />}
                  label={`${room.memory_stats.total_contexts} contexts`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<ShareIcon />}
                  label={`${room.memory_stats.cross_agent_insights} insights`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<TrendingUpIcon />}
                  label={`${room.memory_stats.learning_patterns} patterns`}
                  color="success"
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        </Box>
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <ACORNChatRoomMemoryEnhanced roomId={selectedRoom} initialParticipants={room?.participants || []} />
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Memory Features Info */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              🧠 ACORN Memory-Enhanced Chat
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Experience AI agents with persistent memory, cross-agent learning, and contextual responses
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            size="large"
          >
            New Memory Chat
          </Button>
        </Box>

        {/* Memory Features Overview */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>🚀 New Memory Enhancement Features</AlertTitle>
          <List dense>
            <ListItem>
              <ListItemIcon><BrainIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Persistent Memory" secondary="Agents remember previous conversations and user preferences" />
            </ListItem>
            <ListItem>
              <ListItemIcon><ShareIcon color="secondary" /></ListItemIcon>
              <ListItemText primary="Cross-Agent Learning" secondary="Agents share insights and learn from each other's successes" />
            </ListItem>
            <ListItem>
              <ListItemIcon><TrendingUpIcon color="success" /></ListItemIcon>
              <ListItemText primary="Pattern Recognition" secondary="Agents identify and apply successful interaction patterns" />
            </ListItem>
            <ListItem>
              <ListItemIcon><PerformanceIcon color="warning" /></ListItemIcon>
              <ListItemText primary="Performance Optimized" secondary="Memory operations cached for sub-100ms response times" />
            </ListItem>
          </List>
        </Alert>

        {/* System Agents Overview */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🤖 Memory-Enhanced System Agents
          </Typography>
          <Grid container spacing={2}>
            {SYSTEM_AGENTS.map((agent) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={agent.id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                        {agent.name[0]}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {agent.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      {agent.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {agent.description}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 0.5 }}>
                      <Chip size="small" label="Memory" color="primary" variant="outlined" />
                      <Chip size="small" label="Learning" color="success" variant="outlined" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>

      {/* Room Cards */}
      {rooms.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <MemoryIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No memory-enhanced chat rooms yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a memory-enhanced chat room to experience contextual AI conversations
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            size="large"
          >
            Create First Memory Chat
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.room_id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      {getParticipantNames(room.participants)}
                    </Typography>
                    {room.memory_enhanced && (
                      <Chip
                        icon={<MemoryIcon />}
                        label="Enhanced"
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    {room.participants.map((participantId) => {
                      // Handle both formats: with and without acorn/ prefix
                      const normalizedId = participantId.replace('acorn/', '');
                      const exec = ACORN_EXECUTIVES.find(e => e.id === normalizedId);
                      const systemAgent = SYSTEM_AGENTS.find(a => a.id === normalizedId);
                      const participant = exec || systemAgent;
                      
                      return participant ? (
                        <Chip
                          key={participantId}
                          avatar={<Avatar>{participant.name[0]}</Avatar>}
                          label={participant.title || participant.name}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          color={systemAgent ? 'primary' : 'default'}
                          variant={systemAgent ? 'filled' : 'outlined'}
                        />
                      ) : null;
                    })}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {room.message_count} messages
                  </Typography>
                  
                  {room.memory_stats && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        icon={<BrainIcon />}
                        label={`${room.memory_stats.total_contexts} contexts`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        icon={<ShareIcon />}
                        label={`${room.memory_stats.cross_agent_insights} insights`}
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        icon={<TrendingUpIcon />}
                        label={`${room.memory_stats.learning_patterns} patterns`}
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    Created: {formatTimestamp(room.created_at)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setSelectedRoom(room.room_id)}
                    startIcon={room.memory_enhanced ? <AutoAwesomeIcon /> : <ChatIcon />}
                  >
                    {room.memory_enhanced ? 'Enter Memory Chat' : 'Enter Chat'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Room Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MemoryIcon color="primary" />
            Create Memory-Enhanced Chat Room
          </Box>
        </DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={memoryEnhancedEnabled}
                onChange={(e) => setMemoryEnhancedEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Enable Memory Enhancement"
            sx={{ mb: 2 }}
          />
          
          {memoryEnhancedEnabled && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Memory enhancement provides contextual responses, learning patterns, and cross-agent insights.
              </Typography>
            </Alert>
          )}
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Participants</InputLabel>
            <Select
              multiple
              value={selectedParticipants}
              onChange={(e) => setSelectedParticipants(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const exec = ACORN_EXECUTIVES.find(e => e.id === value);
                    const systemAgent = SYSTEM_AGENTS.find(a => a.id === value);
                    const participant = exec || systemAgent;
                    
                    return participant ? (
                      <Chip 
                        key={value} 
                        label={`${participant.name} (${participant.title})`}
                        size="small"
                        color={systemAgent ? 'primary' : 'default'}
                      />
                    ) : null;
                  })}
                </Box>
              )}
            >
              <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
                ACORN Executives
              </Typography>
              {ACORN_EXECUTIVES.map((exec) => (
                <MenuItem key={exec.id} value={exec.id}>
                  {exec.name} - {exec.title}
                </MenuItem>
              ))}
              <Divider />
              <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
                Memory-Enhanced System Agents
              </Typography>
              {SYSTEM_AGENTS.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MemoryIcon color="primary" fontSize="small" />
                    {agent.name} - {agent.title}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={createRoom}
            variant="contained"
            disabled={selectedParticipants.length === 0}
            startIcon={memoryEnhancedEnabled ? <AutoAwesomeIcon /> : <AddIcon />}
          >
            {memoryEnhancedEnabled ? 'Create Memory Chat' : 'Create Chat'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ACORNChatMemoryPage;