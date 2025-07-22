import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { StreamMessage } from './StreamMessage';
import { useObservabilityStore } from '../store/observabilityStore';
import { useUIStore } from '../store/uiStore';
import { useWebSocketSimple } from '../hooks/useWebSocketSimple';

interface Message {
  message_id: string;
  source_agent_id: string;
  target_agent_id: string;
  communication_type: string;
  direction: string;
  message_type: string;
  content: string;
  timestamp: string;
  metadata: any;
  tokens_used?: number;
  processing_duration_ms?: number;
}

export const StreamViewer: React.FC<{ conversationId?: string }> = ({ 
  conversationId: propConversationId 
}) => {
  // Local state
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessageCount, setNewMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Store hooks
  const {
    streamCache,
    selectedConversation,
    selectConversation,
    loadStreamMessages,
    loading
  } = useObservabilityStore();
  
  const { addNotification } = useUIStore();
  
  // Get current conversation ID from props or store
  const conversationId = propConversationId || selectedConversation || '';
  
  // Get messages from store cache
  const messages = streamCache.get(conversationId) || [];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadStreamMessages(conversationId, filter || undefined);
      setNewMessageCount(0);
    }
  }, [conversationId, filter, loadStreamMessages]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

  // Initialize WebSocket connection
  useWebSocketSimple({
    url: 'ws://localhost:8400/ws/communication-stream',
    onConnect: () => {
      console.log('StreamViewer: WebSocket connected');
    },
    onDisconnect: () => {
      console.log('StreamViewer: WebSocket disconnected');
    }
  });

  // Filter messages based on search term
  const filteredMessages = messages.filter(message => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        message.content.toLowerCase().includes(searchLower) ||
        message.source_agent_id.toLowerCase().includes(searchLower) ||
        message.target_agent_id?.toLowerCase().includes(searchLower) ||
        message.message_type.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleRefresh = () => {
    if (conversationId) {
      loadStreamMessages(conversationId, filter || undefined);
      setNewMessageCount(0);
    }
  };

  const handleConversationIdChange = (newId: string) => {
    selectConversation(newId);
  };

  return (
    <Paper sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Communication Stream
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Badge badgeContent={newMessageCount} color="primary">
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={handleRefresh} disabled={loading.conversations}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Badge>
          </Stack>
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <TextField
            label="Conversation ID"
            value={conversationId}
            onChange={(e) => handleConversationIdChange(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            placeholder="Enter conversation ID to view stream..."
          />
          
          <TextField
            label="Search messages"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Communication Type</InputLabel>
            <Select
              value={filter}
              label="Communication Type"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="claude">Claude</MenuItem>
              <MenuItem value="inter_agent">Inter-Agent</MenuItem>
              <MenuItem value="memory_service">Memory Service</MenuItem>
              <MenuItem value="external_api">External API</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Message Count */}
        {filteredMessages.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Showing {filteredMessages.length} of {messages.length} messages
            {searchTerm && ` matching "${searchTerm}"`}
          </Typography>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading.conversations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : !conversationId ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Typography variant="body1" color="text.secondary">
              Enter a conversation ID to view the communication stream
            </Typography>
          </Box>
        ) : filteredMessages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Typography variant="body1" color="text.secondary">
              {messages.length === 0 ? 'No messages found for this conversation' : 'No messages match your search criteria'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1 }}>
            {filteredMessages.map((message, index) => (
              <StreamMessage
                key={message.message_id}
                message={message}
                isLast={index === filteredMessages.length - 1}
                highlight={index >= filteredMessages.length - newMessageCount}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>
    </Paper>
  );
};