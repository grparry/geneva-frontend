import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { api } from '../api/client';

interface Conversation {
  conversation_id: string;
  started_at: string;
  last_activity: string;
  message_count: number;
  participants: string[];
}

interface Props {
  onSelectConversation: (id: string) => void;
}

export const ConversationList: React.FC<Props> = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await api.getRecentConversations(24);
        setConversations(data.conversations || []);
      } catch (error) {
        console.error('Failed to load conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getParticipantInitials = (participants: string[]) => {
    if (participants.length === 0) return '?';
    return participants[0].charAt(0).toUpperCase();
  };

  return (
    <Paper sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ChatIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Recent Conversations
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Last 24 hours
        </Typography>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No recent conversations found
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {conversations.map((conv, index) => (
              <React.Fragment key={conv.conversation_id}>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => onSelectConversation(conv.conversation_id)}
                    sx={{ px: 2, py: 1.5 }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        mr: 2, 
                        bgcolor: 'primary.light',
                        fontSize: '0.875rem'
                      }}
                    >
                      {getParticipantInitials(conv.participants)}
                    </Avatar>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Chip 
                          icon={<MessageIcon />}
                          label={conv.message_count}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          <ScheduleIcon sx={{ fontSize: 12, mr: 0.5 }} />
                          {getTimeAgo(conv.last_activity)}
                        </Typography>
                      </Stack>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ID: {conv.conversation_id.slice(0, 8)}...
                      </Typography>
                      
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        {conv.participants.length > 2 
                          ? `${conv.participants.slice(0, 2).join(', ')} +${conv.participants.length - 2}`
                          : conv.participants.join(', ')
                        }
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
                {index < conversations.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};