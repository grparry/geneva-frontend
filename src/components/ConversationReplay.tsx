import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipPrevious as PreviousIcon,
  SkipNext as NextIcon,
  FastRewind as RewindIcon,
  FastForward as FastForwardIcon,
  Replay as ReplayIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { StreamMessage } from './StreamMessage';
import { useObservabilityStore } from '../store/observabilityStore';
import { useUIStore } from '../store/uiStore';

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

interface ConversationReplayProps {
  conversationId: string;
  onClose?: () => void;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8];

export const ConversationReplay: React.FC<ConversationReplayProps> = ({
  conversationId,
  onClose
}) => {
  // Store hooks
  const { streamCache, loadStreamMessages, loading } = useObservabilityStore();
  const { addNotification } = useUIStore();
  
  // Local state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showMetadata, setShowMetadata] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get messages from store cache
  const allMessages = streamCache.get(conversationId) || [];
  const sortedMessages = [...allMessages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Messages to display (up to current index)
  const visibleMessages = sortedMessages.slice(0, currentIndex + 1);
  
  // Load messages when component mounts
  useEffect(() => {
    if (conversationId) {
      loadStreamMessages(conversationId);
    }
  }, [conversationId, loadStreamMessages]);
  
  // Auto-scroll to bottom when new messages are revealed
  const scrollToBottom = useCallback(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);
  
  useEffect(() => {
    if (visibleMessages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [visibleMessages.length, scrollToBottom]);
  
  // Playback interval
  useEffect(() => {
    if (isPlaying && currentIndex < sortedMessages.length - 1) {
      const baseDelay = 1000; // 1 second base delay
      const delay = baseDelay / playbackSpeed;
      
      intervalRef.current = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, delay);
    } else if (isPlaying && currentIndex >= sortedMessages.length - 1) {
      // Reached the end
      if (loopEnabled) {
        setCurrentIndex(0);
      } else {
        setIsPlaying(false);
        addNotification({
          type: 'info',
          title: 'Replay Complete',
          message: 'Conversation replay finished'
        });
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, playbackSpeed, sortedMessages.length, loopEnabled, addNotification]);
  
  const handlePlay = () => {
    if (currentIndex >= sortedMessages.length - 1 && !loopEnabled) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    setIsPlaying(false);
  };
  
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };
  
  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex(prev => Math.min(sortedMessages.length - 1, prev + 1));
  };
  
  const handleRewind = () => {
    setCurrentIndex(prev => Math.max(0, prev - 5));
  };
  
  const handleFastForward = () => {
    setCurrentIndex(prev => Math.min(sortedMessages.length - 1, prev + 5));
  };
  
  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };
  
  const handleSliderChange = (_: Event, value: number | number[]) => {
    setCurrentIndex(value as number);
  };
  
  const getProgressPercentage = () => {
    if (sortedMessages.length === 0) return 0;
    return Math.round((currentIndex / (sortedMessages.length - 1)) * 100);
  };
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  const getCurrentMessage = () => {
    return sortedMessages[currentIndex];
  };

  if (loading.conversations) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  if (sortedMessages.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary" align="center">
          No messages found for this conversation
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Conversation Replay
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              label={`${currentIndex + 1} / ${sortedMessages.length}`}
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`${getProgressPercentage()}%`}
              variant="outlined"
              size="small"
              color="primary"
            />
          </Stack>
        </Stack>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Conversation ID: {conversationId}
        </Typography>
        
        {/* Playback Controls */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Tooltip title="Restart">
            <IconButton size="small" onClick={handleRestart}>
              <ReplayIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Rewind 5">
            <IconButton size="small" onClick={handleRewind}>
              <RewindIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Previous">
            <IconButton size="small" onClick={handlePrevious}>
              <PreviousIcon />
            </IconButton>
          </Tooltip>
          
          {isPlaying ? (
            <Tooltip title="Pause">
              <IconButton onClick={handlePause} color="primary">
                <PauseIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Play">
              <IconButton onClick={handlePlay} color="primary">
                <PlayIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Stop">
            <IconButton size="small" onClick={handleStop}>
              <StopIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Next">
            <IconButton size="small" onClick={handleNext}>
              <NextIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fast Forward 5">
            <IconButton size="small" onClick={handleFastForward}>
              <FastForwardIcon />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          {/* Speed Control */}
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel>Speed</InputLabel>
            <Select
              value={playbackSpeed}
              label="Speed"
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              startAdornment={<SpeedIcon fontSize="small" sx={{ mr: 1 }} />}
            >
              {PLAYBACK_SPEEDS.map((speed) => (
                <MenuItem key={speed} value={speed}>
                  {speed}x
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={loopEnabled}
                onChange={(e) => setLoopEnabled(e.target.checked)}
                size="small"
              />
            }
            label="Loop"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                size="small"
              />
            }
            label="Auto Scroll"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showMetadata}
                onChange={(e) => setShowMetadata(e.target.checked)}
                size="small"
              />
            }
            label="Metadata"
          />
        </Stack>
        
        {/* Progress Slider */}
        <Box sx={{ px: 2 }}>
          <Slider
            value={currentIndex}
            min={0}
            max={sortedMessages.length - 1}
            step={1}
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `Message ${value + 1}`}
            disabled={isPlaying}
          />
        </Box>
        
        {/* Current Message Info */}
        {getCurrentMessage() && (
          <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current: {formatTimestamp(getCurrentMessage().timestamp)} - 
              {getCurrentMessage().source_agent_id} → {getCurrentMessage().target_agent_id} 
              ({getCurrentMessage().communication_type})
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Messages Display */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1 }}>
        {visibleMessages.map((message, index) => (
          <StreamMessage
            key={message.message_id}
            message={message}
            isLast={index === visibleMessages.length - 1}
            highlight={index === currentIndex}
            showMetadata={showMetadata}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>
    </Paper>
  );
};