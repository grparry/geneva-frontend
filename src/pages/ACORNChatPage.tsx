import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Avatar } from '@mui/material';
import { Grid } from '@mui/material';
import { Chat as ChatIcon, Add as AddIcon, Group as GroupIcon } from '@mui/icons-material';
import { ACORNChatRoom } from '../components/ACORNChatRoom';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';

interface ChatRoom {
  room_id: string;
  participants: string[];
  created_at: string;
  message_count: number;
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

export const ACORNChatPage: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/rooms`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const createRoom = async () => {
    if (selectedParticipants.length === 0) return;

    try {
      const payload = {
        customer_id: 'test-customer-001', // TODO: Get from context
        project_id: 'test-project-001',   // TODO: Get from context
        participants: selectedParticipants
      };
      
      console.log('Creating room with payload:', payload);
      
      const response = await fetch(`${API_BASE}/api/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Room creation failed:', response.status, errorText);
        alert(`Failed to create room: ${response.status} ${errorText}`);
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
        return ACORN_EXECUTIVES.find(exec => exec.id === normalizedId)?.name || id;
      })
      .join(', ');
  };

  if (selectedRoom) {
    const room = rooms.find(r => r.room_id === selectedRoom);
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button onClick={() => setSelectedRoom(null)} startIcon={<ChatIcon />}>
            Back to Rooms
          </Button>
          <Typography variant="h6" component="span" sx={{ ml: 2 }}>
            Chat with: {room ? getParticipantNames(room.participants) : 'Loading...'}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <ACORNChatRoom roomId={selectedRoom} initialParticipants={room?.participants || []} />
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">ACORN Executive Chat</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Chat Room
        </Button>
      </Box>

      {rooms.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No chat rooms yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a chat room to start conversing with ACORN executives
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create First Room
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.room_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      {getParticipantNames(room.participants)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    {room.participants.map((participantId) => {
                      // Handle both formats: with and without acorn/ prefix
                      const normalizedId = participantId.replace('acorn/', '');
                      const exec = ACORN_EXECUTIVES.find(e => e.id === normalizedId);
                      return exec ? (
                        <Chip
                          key={participantId}
                          avatar={<Avatar>{exec.name[0]}</Avatar>}
                          label={exec.title}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ) : null;
                    })}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {room.message_count} messages
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(room.created_at).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setSelectedRoom(room.room_id)}
                  >
                    Enter Chat
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
        <DialogTitle>Create New Chat Room</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Executives</InputLabel>
            <Select
              multiple
              value={selectedParticipants}
              onChange={(e) => setSelectedParticipants(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const exec = ACORN_EXECUTIVES.find(e => e.id === value);
                    return exec ? (
                      <Chip key={value} label={`${exec.name} (${exec.title})`} />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {ACORN_EXECUTIVES.map((exec) => (
                <MenuItem key={exec.id} value={exec.id}>
                  {exec.name} - {exec.title}
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
          >
            Create Room
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};