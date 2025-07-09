/**
 * OCL Message Inbox Component
 * Main interface for viewing and managing OCL messages
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Button,
  Checkbox,
  Menu,
  MenuItem,
  Divider,
  Toolbar,
  TextField,
  InputAdornment,
  Pagination,
  Skeleton,
  Alert,
  Badge,
  Stack,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Inbox,
  Search,
  Star,
  StarBorder,
  Archive,
  Delete,
  MoreVert,
  Refresh,
  FilterList,
  Sort,
  Email,
  CheckCircle,
  Schedule,
  Flag,
  Attachment,
  Reply,
  Forward,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetMessagesQuery,
  useMarkMessageReadMutation,
  useStarMessageMutation,
  useArchiveMessageMutation,
  useDeleteMessageMutation,
} from '../../services/ocl/api';
import {
  selectOCLMessages,
  selectOCLUI,
  setSelectedMessage,
  setSearchParams,
  markMessageAsRead,
  toggleMessageStar,
  markMultipleAsRead,
  archiveMultipleMessages,
} from '../../store/ocl/slice';
import { useOCLMessageEvents } from '../../hooks/ocl/useOCLWebSocket';
import type { OCLMessage, OCLMessageInboxProps, OCLSearchParams } from '../../types/ocl';

// Message source icons
const getSourceIcon = (sourceType: string) => {
  switch (sourceType) {
    case 'email': return '📧';
    case 'webhook': return '🔗';
    case 'github': return '🐙';
    case 'chat': return '💬';
    case 'redis': return '🔄';
    default: return '📄';
  }
};

// Priority colors
const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'urgent': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'default';
    default: return 'default';
  }
};

// Message list item component
interface MessageListItemProps {
  message: OCLMessage;
  selected: boolean;
  onSelect: (message: OCLMessage) => void;
  onToggleRead: (messageId: string, isRead: boolean) => void;
  onToggleStar: (messageId: string) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (messageId: string, selected: boolean) => void;
}

const MessageListItem: React.FC<MessageListItemProps> = ({
  message,
  selected,
  onSelect,
  onToggleRead,
  onToggleStar,
  isSelectable = false,
  isSelected = false,
  onSelectionChange,
}) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const formattedTime = useMemo(() => {
    const messageDate = new Date(message.timestamp);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(messageDate, 'HH:mm');
    } else {
      return format(messageDate, 'MMM dd');
    }
  }, [message.timestamp]);

  return (
    <ListItem
      sx={{
        bgcolor: message.is_read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
        borderLeft: message.is_read ? 'none' : `3px solid ${theme.palette.primary.main}`,
        mb: 1,
        borderRadius: 1,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: alpha(theme.palette.action.hover, 0.1),
        },
        ...(selected && {
          bgcolor: alpha(theme.palette.primary.main, 0.1),
        }),
      }}
      onClick={() => onSelect(message)}
    >
      {isSelectable && (
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelectionChange?.(message.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          sx={{ mr: 1 }}
        />
      )}

      <ListItemAvatar>
        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
          {getSourceIcon(message.source_type)}
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              fontWeight={message.is_read ? 'normal' : 'bold'}
              sx={{ flex: 1, minWidth: 0 }}
              noWrap
            >
              {message.subject || 'No Subject'}
            </Typography>
            
            {message.priority && (
              <Chip
                label={message.priority}
                size="small"
                color={getPriorityColor(message.priority) as any}
                variant="outlined"
              />
            )}
            
            {message.attachments && message.attachments.length > 0 && (
              <Attachment fontSize="small" color="action" />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 0.5,
              }}
            >
              {message.body}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {message.from_address || message.source_identifier}
              </Typography>
              
              <Chip
                label={message.source_type}
                size="small"
                variant="outlined"
                sx={{ height: 20 }}
              />
              
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {formattedTime}
              </Typography>
            </Box>
          </Box>
        }
      />

      <ListItemSecondaryAction>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(message.id);
            }}
          >
            {message.is_starred ? (
              <Star fontSize="small" color="warning" />
            ) : (
              <StarBorder fontSize="small" />
            )}
          </IconButton>

          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              onToggleRead(message.id, !message.is_read);
              handleMenuClose();
            }}
          >
            {message.is_read ? 'Mark as Unread' : 'Mark as Read'}
          </MenuItem>
          <MenuItem
            onClick={() => {
              onToggleStar(message.id);
              handleMenuClose();
            }}
          >
            {message.is_starred ? 'Remove Star' : 'Add Star'}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            <Reply sx={{ mr: 1 }} />
            Reply
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Forward sx={{ mr: 1 }} />
            Forward
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            <Archive sx={{ mr: 1 }} />
            Archive
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

// Main OCL Message Inbox Component
export const OCLMessageInbox: React.FC<OCLMessageInboxProps> = ({
  projectId,
  filters: externalFilters = {},
  onMessageSelect,
  onThreadSelect,
  compact = false,
  showFilters = true,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // State management
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority' | 'subject'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Redux state
  const messagesState = useSelector(selectOCLMessages);
  const uiState = useSelector(selectOCLUI);

  // API mutations
  const [markMessageRead] = useMarkMessageReadMutation();
  const [starMessage] = useStarMessageMutation();
  const [archiveMessage] = useArchiveMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();

  // Build search parameters
  const searchParams: OCLSearchParams = useMemo(() => ({
    ...externalFilters,
    ...uiState.searchParams,
    query: searchQuery || undefined,
    limit,
    offset: (page - 1) * limit,
  }), [externalFilters, uiState.searchParams, searchQuery, page, limit]);

  // API query
  const {
    data: messagesResponse,
    isLoading,
    error,
    refetch,
  } = useGetMessagesQuery({
    projectId,
    page,
    limit,
    filters: searchParams,
  });

  // Listen for real-time message updates
  useOCLMessageEvents((event) => {
    if (event.event === 'new_message' || event.event === 'message_updated') {
      // Refresh if the message matches current filters
      refetch();
    }
  });

  // Handle message selection
  const handleMessageSelect = useCallback((message: OCLMessage) => {
    dispatch(setSelectedMessage(message.id));
    onMessageSelect?.(message);

    // Mark as read if not already
    if (!message.is_read) {
      markMessageRead({ messageId: message.id });
      dispatch(markMessageAsRead({ id: message.id, isRead: true }));
    }
  }, [dispatch, onMessageSelect, markMessageRead]);

  // Handle read/unread toggle
  const handleToggleRead = useCallback(async (messageId: string, isRead: boolean) => {
    try {
      await markMessageRead({ messageId, isRead });
      dispatch(markMessageAsRead({ id: messageId, isRead }));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, [markMessageRead, dispatch]);

  // Handle star toggle
  const handleToggleStar = useCallback(async (messageId: string) => {
    try {
      const message = messagesState.items.find(m => m.id === messageId);
      if (message) {
        await starMessage({ messageId, starred: !message.is_starred });
        dispatch(toggleMessageStar(messageId));
      }
    } catch (error) {
      console.error('Failed to star message:', error);
    }
  }, [starMessage, dispatch, messagesState.items]);

  // Handle bulk selection
  const handleSelectionChange = useCallback((messageId: string, selected: boolean) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(messageId);
      } else {
        newSet.delete(messageId);
      }
      return newSet;
    });
  }, []);

  // Handle bulk actions
  const handleBulkMarkAsRead = useCallback(async (isRead: boolean) => {
    const messageIds = Array.from(selectedMessages);
    try {
      await Promise.all(
        messageIds.map(id => markMessageRead({ messageId: id, isRead }))
      );
      dispatch(markMultipleAsRead({ ids: messageIds, isRead }));
      setSelectedMessages(new Set());
    } catch (error) {
      console.error('Failed to bulk mark messages:', error);
    }
  }, [selectedMessages, markMessageRead, dispatch]);

  const handleBulkArchive = useCallback(async () => {
    const messageIds = Array.from(selectedMessages);
    try {
      await Promise.all(
        messageIds.map(id => archiveMessage({ messageId: id }))
      );
      dispatch(archiveMultipleMessages(messageIds));
      setSelectedMessages(new Set());
    } catch (error) {
      console.error('Failed to bulk archive messages:', error);
    }
  }, [selectedMessages, archiveMessage, dispatch]);

  // Clear search when filters change
  useEffect(() => {
    setSearchQuery('');
    setPage(1);
  }, [externalFilters]);

  const totalPages = messagesResponse ? Math.ceil(messagesResponse.total / limit) : 0;
  const unreadCount = messagesState.items.filter(m => !m.is_read).length;

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Inbox color="primary" />
          <Typography variant="h6" sx={{ flex: 1 }}>
            Messages
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="primary" sx={{ ml: 1 }} />
            )}
          </Typography>

          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}>
              <Refresh />
            </IconButton>
          </Tooltip>

          <Button
            variant={bulkMode ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setBulkMode(!bulkMode)}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Bulk Actions Toolbar */}
      {bulkMode && selectedMessages.size > 0 && (
        <Toolbar sx={{ minHeight: '48px !important', bgcolor: 'action.selected' }}>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {selectedMessages.size} message(s) selected
          </Typography>
          
          <Button size="small" onClick={() => handleBulkMarkAsRead(true)}>
            Mark as Read
          </Button>
          <Button size="small" onClick={() => handleBulkMarkAsRead(false)}>
            Mark as Unread
          </Button>
          <Button size="small" onClick={handleBulkArchive}>
            Archive
          </Button>
        </Toolbar>
      )}

      {/* Messages List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            Failed to load messages: {error.toString()}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Skeleton variant="rectangular" height={80} />
              </Box>
            ))}
          </Box>
        ) : messagesState.items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Inbox sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No messages found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'Try adjusting your search terms' : 'Your inbox is empty'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 1 }}>
            {messagesState.items.map((message) => (
              <MessageListItem
                key={message.id}
                message={message}
                selected={uiState.selectedMessage === message.id}
                onSelect={handleMessageSelect}
                onToggleRead={handleToggleRead}
                onToggleStar={handleToggleStar}
                isSelectable={bulkMode}
                isSelected={selectedMessages.has(message.id)}
                onSelectionChange={handleSelectionChange}
              />
            ))}
          </List>
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            size="small"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Paper>
  );
};

export default OCLMessageInbox;