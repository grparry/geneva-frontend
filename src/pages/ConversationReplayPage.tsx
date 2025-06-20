import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { ConversationReplay } from '../components/ConversationReplay';
import { useObservabilityStore } from '../store/observabilityStore';

export const ConversationReplayPage: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [isReplayActive, setIsReplayActive] = useState(false);
  
  // Store hooks
  const { conversations, loadConversations } = useObservabilityStore();
  
  // Load recent conversations
  useEffect(() => {
    loadConversations(50); // Load more conversations for replay selection
  }, [loadConversations]);
  
  const conversationsList = Array.from(conversations.values())
    .sort((a, b) => new Date(b.last_activity || b.started_at || '').getTime() - 
                    new Date(a.last_activity || a.started_at || '').getTime());
  
  const handleStartReplay = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsReplayActive(true);
  };
  
  const handleCloseReplay = () => {
    setIsReplayActive(false);
    setSelectedConversationId('');
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  const getConversationDuration = (conversation: any) => {
    if (!conversation.started_at || !conversation.last_activity) return 'Unknown';
    
    const start = new Date(conversation.started_at);
    const end = new Date(conversation.last_activity);
    const diffMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      {!isReplayActive ? (
        <Box>
          {/* Header */}
          <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <HistoryIcon color="primary" />
              <Typography variant="h4" fontWeight="bold">
                Conversation Replay
              </Typography>
            </Stack>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Select a conversation to replay its messages step-by-step with playback controls.
              Perfect for debugging, analysis, or understanding communication flows.
            </Typography>
            
            {/* Quick Start */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 300 }}>
                <InputLabel>Select Conversation</InputLabel>
                <Select
                  value={selectedConversationId}
                  label="Select Conversation"
                  onChange={(e) => setSelectedConversationId(e.target.value)}
                >
                  {conversationsList.slice(0, 20).map((conv) => (
                    <MenuItem key={conv.conversation_id} value={conv.conversation_id}>
                      {conv.conversation_id.slice(0, 12)}... ({conv.message_count} msgs)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => handleStartReplay(selectedConversationId)}
                disabled={!selectedConversationId}
              >
                Start Replay
              </Button>
            </Box>
          </Paper>
          
          {/* Conversation List */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Conversations
            </Typography>
            
            {conversationsList.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No conversations found. Start some agent communications to see them here.
              </Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
                {conversationsList.map((conversation) => (
                  <Card key={conversation.conversation_id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                          {conversation.conversation_id.slice(0, 16)}...
                        </Typography>
                        
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PlayIcon />}
                          onClick={() => handleStartReplay(conversation.conversation_id)}
                        >
                          Replay
                        </Button>
                      </Stack>
                      
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                        <Chip 
                          label={`${conversation.message_count} messages`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={getConversationDuration(conversation)}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        {conversation.participants && conversation.participants.length > 0 && (
                          <Chip 
                            label={`${conversation.participants.length} agents`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                      </Stack>
                      
                      <Typography variant="body2" color="text.secondary">
                        <strong>Created:</strong> {formatDate(conversation.started_at || '')}
                      </Typography>
                      
                      {conversation.last_activity && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Last Activity:</strong> {formatDate(conversation.last_activity)}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      ) : (
        <Box>
          {/* Replay Header */}
          <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Replaying Conversation: {selectedConversationId.slice(0, 12)}...
              </Typography>
              
              <Button
                variant="outlined"
                onClick={handleCloseReplay}
              >
                Back to List
              </Button>
            </Stack>
          </Paper>
          
          {/* Replay Component */}
          <ConversationReplay 
            conversationId={selectedConversationId}
            onClose={handleCloseReplay}
          />
        </Box>
      )}
    </Box>
  );
};