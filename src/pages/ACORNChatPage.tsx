import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Chip, Avatar, Alert, Snackbar, IconButton, Tooltip, Menu } from '@mui/material';
import { Grid } from '@mui/material';
import { Chat as ChatIcon, Add as AddIcon, Group as GroupIcon, Edit as EditIcon, AdminPanelSettings as AdminIcon, Delete as DeleteIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { ACORNChatRoom } from '../components/ACORNChatRoom';
import { ProjectContextValidator } from '../components/ProjectContextValidator';
import { useProjectContext } from '../store/projectStore';
import { chatApi, type ChatRoom, type CreateChatRoomRequest } from '../api/chatApi';
import { formatTimestamp } from '../utils/dateUtils';
import { useRoomStates } from '../hooks/useRoomStates';
import { RoomStateCard } from '../components/governance/RoomStateCard';
import { RoomGovernanceModal } from '../components/governance/RoomGovernanceModal';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Governance modal state
  const [governanceModalOpen, setGovernanceModalOpen] = useState(false);
  const [selectedGovernanceRoom, setSelectedGovernanceRoom] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  
  // Menu state for room actions
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuRoomId, setMenuRoomId] = useState<string | null>(null);
  
  // Project context
  const projectContext = useProjectContext();
  
  // Room states management
  const { 
    roomsWithStates, 
    isLoading: statesLoading, 
    error: statesError,
    refreshStates
  } = useRoomStates(rooms);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      console.log('🔍 ACORN Chat: Fetching rooms using chatApi');
      const roomsData = await chatApi.listRooms();
      console.log('🔍 ACORN Chat: Response data:', roomsData);
      console.log('🔍 ACORN Chat: Data type:', typeof roomsData, 'Is array:', Array.isArray(roomsData));
      
      // Ensure data is an array
      const rooms = Array.isArray(roomsData) ? roomsData : [];
      console.log('🔍 ACORN Chat: Setting rooms:', rooms);
      console.log('🔍 ACORN Chat: Rooms length:', rooms.length);
      setRooms(rooms);
      console.log('🔍 ACORN Chat: State after setRooms called');
    } catch (error: any) {
      console.error('❌ ACORN Chat: Failed to fetch rooms:', error);
      // Set empty array on error to prevent map errors
      setRooms([]);
      
      // Enhanced error handling for authentication
      if (error.response?.status === 403) {
        setErrorMessage('Authentication required. Please select a valid project context to view chat rooms.');
      } else if (error.response?.status === 404) {
        setErrorMessage('No chat rooms found. Please check your project context or create a new room.');
      } else if (error.response?.status === 500) {
        setErrorMessage('Server error. Please try again later or contact support.');
      } else {
        setErrorMessage(`Failed to fetch rooms: ${error.response?.data?.detail || error.message}`);
      }
    }
  };

  const createRoom = async () => {
    if (selectedParticipants.length === 0) {
      setErrorMessage('Please select at least one participant');
      return;
    }

    const contextIds = projectContext.getContextIds();
    if (!contextIds) {
      setErrorMessage('Please select a project context before creating a chat room');
      return;
    }

    try {
      const createRoomRequest: CreateChatRoomRequest = {
        customer_id: contextIds.customerId,
        project_id: contextIds.projectId,
        participants: selectedParticipants,
        include_system_agents: true
      };
      
      console.log('Creating room with request:', createRoomRequest);
      
      const newRoom = await chatApi.createRoom(createRoomRequest);
      console.log('Room created:', newRoom);
      
      await fetchRooms();
      // Refresh room states after creating new room
      setTimeout(() => refreshStates(), 500);
      setSelectedRoom(newRoom.room_id);
      setCreateDialogOpen(false);
      setSelectedParticipants([]);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Failed to create room:', error);
      
      // Enhanced error handling for new security requirements
      if (error.response?.status === 403) {
        setErrorMessage('Authentication required. Please ensure you have selected a valid project context.');
      } else if (error.response?.status === 404 && error.response?.data?.detail?.includes('Customer')) {
        setErrorMessage('Customer not found. Please check your project context.');
      } else if (error.response?.status === 400 && error.response?.data?.detail?.includes('project_id')) {
        setErrorMessage('Invalid project ID format. Please select a valid project.');
      } else if (error.response?.status === 400 && error.response?.data?.detail?.includes('does not exist')) {
        setErrorMessage(`Project validation failed: ${error.response.data.detail}`);
      } else {
        setErrorMessage(`Failed to create room: ${error.response?.data?.detail || error.message}`);
      }
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

  const handleGovernanceEdit = (roomId: string) => {
    setSelectedGovernanceRoom(roomId);
    setGovernanceModalOpen(true);
  };

  const handleGovernanceModalClose = () => {
    setGovernanceModalOpen(false);
    setSelectedGovernanceRoom(null);
  };

  const handleStateChanged = () => {
    // Refresh room states when a state transition occurs
    refreshStates();
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const result = await chatApi.deleteRoom(roomId);
      if (result.success) {
        // Refresh rooms list
        await fetchRooms();
        // Refresh room states
        setTimeout(() => refreshStates(), 500);
        setErrorMessage(null);
        // Show success notification
        console.log('✅ Room deleted successfully:', result.message);
      }
    } catch (error: any) {
      console.error('❌ Failed to delete room:', error);
      if (error.response?.status === 403) {
        setErrorMessage('Permission denied. You may not have access to delete this room.');
      } else if (error.response?.status === 404) {
        setErrorMessage('Room not found. It may have already been deleted.');
        // Still refresh the list in case it was deleted by another user
        await fetchRooms();
      } else {
        setErrorMessage(`Failed to delete room: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  const handleDeleteClick = (roomId: string) => {
    setRoomToDelete(roomId);
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
    setMenuRoomId(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, roomId: string) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuRoomId(roomId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRoomId(null);
  };

  const getRoomToDeleteName = () => {
    if (!roomToDelete) return '';
    const room = roomsWithStates.find(r => r.room_id === roomToDelete);
    return room ? getParticipantNames(room.participants) : roomToDelete.slice(0, 8) + '...';
  };

  if (selectedRoom) {
    const room = roomsWithStates.find(r => r.room_id === selectedRoom);
    return (
      <Box sx={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 0.5, borderBottom: 1, borderColor: 'divider' }}>
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
          disabled={!projectContext.hasContext || !projectContext.customer || !projectContext.project}
        >
          New Chat Room
        </Button>
      </Box>

      {/* Enhanced Project Context Validation */}
      <ProjectContextValidator 
        showDetails={false}
      />

      {/* Error Messages */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
      
      {/* Room States Error */}
      {statesError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Failed to load room states: {statesError}
          <Button size="small" onClick={refreshStates} sx={{ ml: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      {(() => {
        console.log('🔍 ACORN Chat: Rendering with rooms.length:', rooms.length);
        console.log('🔍 ACORN Chat: rooms.length === 0?', rooms.length === 0);
        console.log('🔍 ACORN Chat: rooms array:', rooms);
        return null;
      })()}
      {/* Loading indicator for room states */}
      {statesLoading && rooms.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loading room states...
        </Alert>
      )}
      
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
            disabled={!projectContext.hasContext || !projectContext.customer || !projectContext.project}
          >
            Create First Room
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {roomsWithStates.map((room) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.room_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {getParticipantNames(room.participants)}
                      </Typography>
                    </Box>
                    
                    {/* Room Actions Menu */}
                    <Tooltip title="Room Actions">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, room.room_id)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
                  
                  {/* Room State Indicator */}
                  <Box sx={{ mb: 2 }}>
                    <RoomStateCard
                      governanceState={room.governanceState}
                      isLoading={room.governanceLoading}
                      error={room.governanceError}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {room.message_count} messages • {room.room_type}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created: {formatTimestamp(room.created_at)}
                  </Typography>
                  {room.last_activity_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Last active: {formatTimestamp(room.last_activity_at)}
                    </Typography>
                  )}
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
      
      {/* Room Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => {
          if (menuRoomId) {
            handleGovernanceEdit(menuRoomId);
            handleMenuClose();
          }
        }}>
          <AdminIcon fontSize="small" sx={{ mr: 1 }} />
          Manage State
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuRoomId) {
            handleDeleteClick(menuRoomId);
          }
        }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Room
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Chat Room</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the chat room with <strong>{getRoomToDeleteName()}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All messages and conversation history will be permanently deleted.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Active WebSocket connections will be closed and the room will be removed from the database.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => roomToDelete && handleDeleteRoom(roomToDelete)}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete Room
          </Button>
        </DialogActions>
      </Dialog>

      {/* Governance Management Modal */}
      {selectedGovernanceRoom && (
        <RoomGovernanceModal
          open={governanceModalOpen}
          onClose={handleGovernanceModalClose}
          roomId={selectedGovernanceRoom}
          roomName={roomsWithStates.find(r => r.room_id === selectedGovernanceRoom)
            ? getParticipantNames(roomsWithStates.find(r => r.room_id === selectedGovernanceRoom)!.participants)
            : undefined
          }
          initialGovernanceState={roomsWithStates.find(r => r.room_id === selectedGovernanceRoom)?.governanceState}
          onStateChanged={handleStateChanged}
        />
      )}
    </Container>
  );
};