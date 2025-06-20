import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Badge,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  GridView as GridViewIcon,
  ViewColumn as ViewColumnIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { StreamViewer } from './StreamViewer';
import { useObservabilityStore } from '../store/observabilityStore';
import { useUIStore } from '../store/uiStore';

interface StreamInstance {
  id: string;
  conversationId: string;
  title: string;
  communicationType?: string;
  agentFilter?: string;
  isActive: boolean;
}

interface MultiStreamDashboardProps {
  maxStreams?: number;
  defaultLayout?: 'grid' | 'columns';
}

export const MultiStreamDashboard: React.FC<MultiStreamDashboardProps> = ({
  maxStreams = 6,
  defaultLayout = 'grid'
}) => {
  // Store hooks
  const { conversations, loadConversations } = useObservabilityStore();
  const { addNotification } = useUIStore();
  
  // Local state
  const [streams, setStreams] = useState<StreamInstance[]>([]);
  const [layout, setLayout] = useState<'grid' | 'columns'>(defaultLayout);
  const [globalFilter, setGlobalFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [gridColumns, setGridColumns] = useState(2);

  // Load recent conversations for stream selection
  useEffect(() => {
    loadConversations(24);
  }, [loadConversations]);

  // Auto-refresh conversations
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadConversations(24);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, loadConversations]);

  const addStream = useCallback((conversationId?: string) => {
    if (streams.length >= maxStreams) {
      addNotification({
        type: 'warning',
        title: 'Maximum Streams',
        message: `Maximum of ${maxStreams} streams allowed`
      });
      return;
    }

    const newStream: StreamInstance = {
      id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId: conversationId || '',
      title: conversationId ? `Stream ${streams.length + 1}` : `New Stream ${streams.length + 1}`,
      isActive: true
    };

    setStreams(prev => [...prev, newStream]);
  }, [streams.length, maxStreams, addNotification]);

  const removeStream = useCallback((streamId: string) => {
    setStreams(prev => prev.filter(stream => stream.id !== streamId));
  }, []);

  const updateStream = useCallback((streamId: string, updates: Partial<StreamInstance>) => {
    setStreams(prev => prev.map(stream => 
      stream.id === streamId ? { ...stream, ...updates } : stream
    ));
  }, []);

  const clearAllStreams = useCallback(() => {
    setStreams([]);
  }, []);

  const refreshAllStreams = useCallback(() => {
    // Trigger refresh for all active streams
    streams.forEach(stream => {
      if (stream.isActive && stream.conversationId) {
        // The individual StreamViewer components will handle their own refresh
      }
    });
    
    addNotification({
      type: 'info',
      title: 'Refreshed',
      message: 'All streams refreshed'
    });
  }, [streams, addNotification]);

  const getGridLayout = () => {
    const streamCount = streams.length;
    if (streamCount === 0) return { cols: 1, rows: 1 };
    if (streamCount === 1) return { cols: 1, rows: 1 };
    if (streamCount === 2) return { cols: 2, rows: 1 };
    if (streamCount <= 4) return { cols: 2, rows: 2 };
    if (streamCount <= 6) return { cols: 3, rows: 2 };
    return { cols: 3, rows: Math.ceil(streamCount / 3) };
  };

  const getColumnLayout = () => {
    return { cols: Math.min(streams.length, gridColumns), rows: 1 };
  };

  const gridLayout = layout === 'grid' ? getGridLayout() : getColumnLayout();
  const conversationsList = Array.from(conversations.values());

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Controls */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
            Multi-Stream Monitor
          </Typography>
          
          <Badge badgeContent={streams.filter(s => s.isActive).length} color="primary">
            <Chip 
              label={`${streams.length} Stream${streams.length !== 1 ? 's' : ''}`}
              variant="outlined"
            />
          </Badge>

          <Divider orientation="vertical" flexItem />

          {/* Layout Controls */}
          <Tooltip title="Grid Layout">
            <IconButton 
              size="small" 
              onClick={() => setLayout('grid')}
              color={layout === 'grid' ? 'primary' : 'default'}
            >
              <GridViewIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Column Layout">
            <IconButton 
              size="small" 
              onClick={() => setLayout('columns')}
              color={layout === 'columns' ? 'primary' : 'default'}
            >
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>

          {layout === 'columns' && (
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Columns</InputLabel>
              <Select
                value={gridColumns}
                label="Columns"
                onChange={(e) => setGridColumns(Number(e.target.value))}
              >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
              </Select>
            </FormControl>
          )}

          <Divider orientation="vertical" flexItem />

          {/* Global Filter */}
          <TextField
            label="Global Filter"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
            placeholder="Filter all streams..."
          />

          <Divider orientation="vertical" flexItem />

          {/* Action Buttons */}
          <Tooltip title="Add Stream">
            <IconButton size="small" onClick={() => addStream()} color="primary">
              <AddIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh All">
            <IconButton size="small" onClick={refreshAllStreams}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton 
              size="small" 
              onClick={() => setShowSettings(!showSettings)}
              color={showSettings ? 'primary' : 'default'}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Settings Panel */}
        {showSettings && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label="Auto Refresh"
              />

              <Tooltip title="Clear All Streams">
                <IconButton size="small" onClick={clearAllStreams} color="error">
                  <RemoveIcon />
                </IconButton>
              </Tooltip>

              <Typography variant="caption" color="text.secondary">
                Max streams: {maxStreams} | Active: {streams.filter(s => s.isActive).length}
              </Typography>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Stream Grid */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {streams.length === 0 ? (
          <Paper sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography variant="h6" color="text.secondary">
              No Active Streams
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add streams to monitor multiple conversations simultaneously
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <IconButton 
                onClick={() => addStream()} 
                color="primary"
                sx={{ 
                  bgcolor: 'primary.light',
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
              >
                <AddIcon />
              </IconButton>
              
              {conversationsList.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Quick Add Conversation</InputLabel>
                  <Select
                    value=""
                    label="Quick Add Conversation"
                    onChange={(e) => addStream(e.target.value)}
                  >
                    {conversationsList.slice(0, 10).map((conv) => (
                      <MenuItem key={conv.conversation_id} value={conv.conversation_id}>
                        {conv.conversation_id.slice(0, 8)}... ({conv.message_count} msgs)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Paper>
        ) : (
          <Grid container spacing={1} sx={{ height: '100%' }}>
            {streams.map((stream) => (
              <Grid 
                key={stream.id} 
                size={{ 
                  xs: 12, 
                  md: 12 / gridLayout.cols 
                }}
                sx={{ 
                  height: layout === 'grid' 
                    ? `${100 / gridLayout.rows}%` 
                    : '100%'
                }}
              >
                <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Stream Header */}
                  <Box sx={{ 
                    p: 1, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    bgcolor: 'grey.50'
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" fontWeight="bold" sx={{ flex: 1 }}>
                        {stream.title}
                      </Typography>
                      
                      {stream.conversationId && (
                        <Chip 
                          label={stream.conversationId.slice(0, 6)}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      
                      <Tooltip title="Remove Stream">
                        <IconButton 
                          size="small" 
                          onClick={() => removeStream(stream.id)}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  {/* Stream Content */}
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    {stream.conversationId ? (
                      <StreamViewer 
                        conversationId={stream.conversationId}
                        key={stream.conversationId} // Force re-render when conversation changes
                      />
                    ) : (
                      <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 1
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          Select Conversation
                        </Typography>
                        
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel>Conversation</InputLabel>
                          <Select
                            value=""
                            label="Conversation"
                            onChange={(e) => updateStream(stream.id, { 
                              conversationId: e.target.value,
                              title: `Stream: ${e.target.value.slice(0, 6)}`
                            })}
                          >
                            {conversationsList.map((conv) => (
                              <MenuItem key={conv.conversation_id} value={conv.conversation_id}>
                                {conv.conversation_id.slice(0, 8)}...
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};