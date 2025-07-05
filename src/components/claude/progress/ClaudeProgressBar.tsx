import React from 'react';
import { Box, LinearProgress, Typography, Collapse, IconButton, Chip, Stack } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, CheckCircle as CheckCircleIcon, Circle as CircleIcon } from '@mui/icons-material';

export enum ProgressStage {
  INITIALIZING = 'INITIALIZING',
  ANALYZING_CODEBASE = 'ANALYZING_CODEBASE',
  BUILDING_CONTEXT = 'BUILDING_CONTEXT',
  GENERATING_SOLUTION = 'GENERATING_SOLUTION',
  EXECUTING_CODE = 'EXECUTING_CODE',
  RUNNING_TESTS = 'RUNNING_TESTS',
  VALIDATING_RESULTS = 'VALIDATING_RESULTS',
  COMMITTING_CHANGES = 'COMMITTING_CHANGES'
}

export interface ProgressStageInfo {
  stage: ProgressStage;
  label: string;
  description: string;
  color: string;
}

const STAGE_INFO: Record<ProgressStage, ProgressStageInfo> = {
  [ProgressStage.INITIALIZING]: {
    stage: ProgressStage.INITIALIZING,
    label: 'Initializing',
    description: 'Setting up execution environment',
    color: '#9e9e9e'
  },
  [ProgressStage.ANALYZING_CODEBASE]: {
    stage: ProgressStage.ANALYZING_CODEBASE,
    label: 'Analyzing',
    description: 'Understanding project structure and dependencies',
    color: '#2196f3'
  },
  [ProgressStage.BUILDING_CONTEXT]: {
    stage: ProgressStage.BUILDING_CONTEXT,
    label: 'Building Context',
    description: 'Assembling relevant files and documentation',
    color: '#00bcd4'
  },
  [ProgressStage.GENERATING_SOLUTION]: {
    stage: ProgressStage.GENERATING_SOLUTION,
    label: 'Generating',
    description: 'Creating solution with Claude',
    color: '#4caf50'
  },
  [ProgressStage.EXECUTING_CODE]: {
    stage: ProgressStage.EXECUTING_CODE,
    label: 'Executing',
    description: 'Running generated code',
    color: '#ff9800'
  },
  [ProgressStage.RUNNING_TESTS]: {
    stage: ProgressStage.RUNNING_TESTS,
    label: 'Testing',
    description: 'Validating with test suite',
    color: '#9c27b0'
  },
  [ProgressStage.VALIDATING_RESULTS]: {
    stage: ProgressStage.VALIDATING_RESULTS,
    label: 'Validating',
    description: 'Final verification and checks',
    color: '#f44336'
  },
  [ProgressStage.COMMITTING_CHANGES]: {
    stage: ProgressStage.COMMITTING_CHANGES,
    label: 'Committing',
    description: 'Persisting changes to repository',
    color: '#795548'
  }
};

const STAGE_ORDER = [
  ProgressStage.INITIALIZING,
  ProgressStage.ANALYZING_CODEBASE,
  ProgressStage.BUILDING_CONTEXT,
  ProgressStage.GENERATING_SOLUTION,
  ProgressStage.EXECUTING_CODE,
  ProgressStage.RUNNING_TESTS,
  ProgressStage.VALIDATING_RESULTS,
  ProgressStage.COMMITTING_CHANGES
];

export interface ClaudeProgressBarProps {
  taskId: string;
  currentStage: ProgressStage;
  progress: number; // 0-1
  message?: string;
  estimatedTimeRemaining?: number; // seconds
  isComplete?: boolean;
  error?: string;
  onClose?: () => void;
}

export const ClaudeProgressBar: React.FC<ClaudeProgressBarProps> = ({
  taskId,
  currentStage,
  progress,
  message,
  estimatedTimeRemaining,
  isComplete,
  error,
  onClose
}) => {
  const [expanded, setExpanded] = React.useState(true);
  
  const currentStageIndex = STAGE_ORDER.indexOf(currentStage);
  const overallProgress = ((currentStageIndex + progress) / STAGE_ORDER.length) * 100;
  
  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const getCurrentStageInfo = () => STAGE_INFO[currentStage];
  
  return (
    <Box sx={{ 
      position: 'relative',
      backgroundColor: 'background.paper',
      borderRadius: 1,
      border: 1,
      borderColor: error ? 'error.main' : 'divider',
      p: 2,
      mb: 2
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          Claude Code Execution
        </Typography>
        {estimatedTimeRemaining && !isComplete && (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            ETA: {formatTime(estimatedTimeRemaining)}
          </Typography>
        )}
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      {/* Main Progress Bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {isComplete ? 'Complete' : getCurrentStageInfo().label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round(overallProgress)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={overallProgress}
          sx={{ 
            height: 8,
            borderRadius: 1,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              backgroundColor: error ? 'error.main' : (isComplete ? 'success.main' : getCurrentStageInfo().color),
              borderRadius: 1
            }
          }}
        />
        {message && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {message}
          </Typography>
        )}
      </Box>
      
      {/* Expanded Stage Details */}
      <Collapse in={expanded}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {STAGE_ORDER.map((stage, index) => {
            const stageInfo = STAGE_INFO[stage];
            const isCompleted = index < currentStageIndex || (index === currentStageIndex && isComplete);
            const isCurrent = index === currentStageIndex && !isComplete;
            const isPending = index > currentStageIndex;
            
            return (
              <Chip
                key={stage}
                icon={isCompleted ? <CheckCircleIcon /> : <CircleIcon />}
                label={stageInfo.label}
                size="small"
                sx={{
                  backgroundColor: isCurrent ? stageInfo.color : 'transparent',
                  color: isCurrent ? 'white' : (isCompleted ? 'success.main' : 'text.secondary'),
                  borderColor: isCompleted ? 'success.main' : (isCurrent ? stageInfo.color : 'divider'),
                  borderWidth: 1,
                  borderStyle: 'solid',
                  '& .MuiChip-icon': {
                    color: 'inherit'
                  }
                }}
              />
            );
          })}
        </Stack>
        
        {/* Current Stage Description */}
        {!isComplete && (
          <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {getCurrentStageInfo().label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getCurrentStageInfo().description}
            </Typography>
          </Box>
        )}
        
        {/* Error Message */}
        {error && (
          <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.dark">
              Error: {error}
            </Typography>
          </Box>
        )}
      </Collapse>
    </Box>
  );
};