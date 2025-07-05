import React, { useState } from 'react';
import { Box, Button, Paper, Typography, Stack } from '@mui/material';
import { PlayArrow as PlayIcon, Stop as StopIcon } from '@mui/icons-material';
import { ClaudeProgressBar, ProgressStage } from './ClaudeProgressBar';
import { useClaudeProgress } from '../../../hooks/useClaudeProgress';

export const ClaudeProgressDemo: React.FC = () => {
  const [demoTaskId, setDemoTaskId] = useState<string | null>(null);
  
  const { currentProgress, error } = useClaudeProgress({
    taskId: demoTaskId || '',
    enabled: !!demoTaskId,
    onComplete: () => {
      console.log('Demo task completed');
      setTimeout(() => setDemoTaskId(null), 3000);
    },
    onError: (err) => {
      console.error('Demo task error:', err);
    }
  });

  const startDemo = () => {
    const newTaskId = `demo-task-${Date.now()}`;
    setDemoTaskId(newTaskId);
  };

  const stopDemo = () => {
    setDemoTaskId(null);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Claude Progress Bar Demo
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This demo shows the Claude Code progress bar with mock progress events.
        Click "Start Demo" to see the progress bar animate through all 8 stages.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<PlayIcon />}
          onClick={startDemo}
          disabled={!!demoTaskId}
        >
          Start Demo
        </Button>
        <Button
          variant="outlined"
          startIcon={<StopIcon />}
          onClick={stopDemo}
          disabled={!demoTaskId}
        >
          Stop Demo
        </Button>
      </Stack>

      {demoTaskId && currentProgress && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Task ID: {demoTaskId}
          </Typography>
          <ClaudeProgressBar
            taskId={demoTaskId}
            currentStage={currentProgress.summary.current_stage}
            progress={currentProgress.event.progress}
            message={currentProgress.event.message}
            estimatedTimeRemaining={currentProgress.summary.estimated_remaining}
            isComplete={currentProgress.summary.overall_progress >= 1.0}
            error={error || undefined}
            onClose={() => setDemoTaskId(null)}
          />
        </Box>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Progress Stages:
        </Typography>
        <Stack spacing={0.5}>
          {Object.values(ProgressStage).map((stage) => (
            <Typography key={stage} variant="caption" color="text.secondary">
              • {stage.replace(/_/g, ' ').toLowerCase()}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};