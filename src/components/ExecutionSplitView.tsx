import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  Chip,
} from '@mui/material';
import {
  FullscreenExit as CollapseIcon,
  Fullscreen as ExpandIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { ExecutionTimeline } from './ExecutionTimeline';
import { StreamViewer } from './StreamViewer';

interface ExecutionSplitViewProps {
  agentId?: string;
}

export const ExecutionSplitView: React.FC<ExecutionSplitViewProps> = ({ agentId }) => {
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string>('');
  const [splitRatio, setSplitRatio] = useState(0.35); // 35% timeline, 65% stream
  const [isDragging, setIsDragging] = useState(false);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);

  const handleExecutionSelect = useCallback((executionId: string) => {
    setSelectedExecution(executionId);
    
    // Mock mapping of execution to conversation - in real app this would come from API
    const executionToConversation: Record<string, string> = {
      'exec-001': 'conv-001',
      'exec-002': 'conv-002', 
      'exec-003': 'conv-003',
      'exec-004': 'conv-004'
    };
    
    const conversationId = executionToConversation[executionId];
    if (conversationId) {
      setSelectedConversation(conversationId);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.getElementById('split-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newRatio = Math.max(0.2, Math.min(0.6, (e.clientX - rect.left) / rect.width));
    setSplitRatio(newRatio);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const toggleTimeline = () => {
    setTimelineCollapsed(!timelineCollapsed);
  };

  const timelineWidth = timelineCollapsed ? 0 : splitRatio * 100;
  const streamWidth = timelineCollapsed ? 100 : (1 - splitRatio) * 100;

  return (
    <Box 
      id="split-container"
      sx={{ 
        height: '100%', 
        display: 'flex',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Left Panel - Execution Timeline */}
      {!timelineCollapsed && (
        <Box sx={{ width: `${timelineWidth}%`, minWidth: '250px' }}>
          <ExecutionTimeline
            agentId={agentId}
            onExecutionSelect={handleExecutionSelect}
            selectedExecution={selectedExecution || undefined}
          />
        </Box>
      )}

      {/* Resize Handle */}
      {!timelineCollapsed && (
        <Box
          sx={{
            width: '8px',
            backgroundColor: 'divider',
            cursor: 'col-resize',
            position: 'relative',
            '&:hover': {
              backgroundColor: 'primary.light',
            },
            '&:hover .resize-indicator': {
              opacity: 1,
            }
          }}
          onMouseDown={handleMouseDown}
        >
          <Box
            className="resize-indicator"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '2px',
              height: '40px',
              backgroundColor: 'primary.main',
              opacity: 0,
              transition: 'opacity 0.2s',
              borderRadius: '1px'
            }}
          />
        </Box>
      )}

      {/* Right Panel - Stream Viewer */}
      <Box sx={{ width: `${streamWidth}%`, display: 'flex', flexDirection: 'column' }}>
        {/* Stream Header with Controls */}
        <Paper 
          elevation={1} 
          sx={{ 
            px: 2, 
            py: 1, 
            borderRadius: 0,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6" fontWeight="bold">
                Communication Stream
              </Typography>
              
              {selectedExecution && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip 
                    label={`Execution: ${selectedExecution.slice(-3)}`}
                    size="small"
                    variant="outlined"
                  />
                  {selectedConversation && (
                    <Chip 
                      label={`Conversation: ${selectedConversation.slice(-3)}`}
                      size="small"
                      color="primary"
                      variant="filled"
                    />
                  )}
                </Stack>
              )}
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title={timelineCollapsed ? "Show timeline" : "Hide timeline"}>
                <IconButton size="small" onClick={toggleTimeline}>
                  {timelineCollapsed ? <ExpandIcon /> : <CollapseIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Stream Content */}
        <Box sx={{ flex: 1 }}>
          {selectedConversation ? (
            <StreamViewer conversationId={selectedConversation} />
          ) : (
            <Box 
              sx={{ 
                height: '100%',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'grey.50'
              }}
            >
              <Stack alignItems="center" spacing={2}>
                <Typography variant="h6" color="text.secondary">
                  Select an Execution
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Choose an execution from the timeline to view its communication stream
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};