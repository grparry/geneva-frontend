import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Timer as TimerIcon,
  Psychology as PsychologyIcon,
  BugReport as BugIcon,
  Refresh as RefreshIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import {
  TaskFeasibilityRequest,
  TaskFeasibilityResult,
  ConfidenceLevel,
  TaskComplexity
} from '../../../types/capability';

interface TaskFeasibilityCheckerProps {
  onValidateTask?: (request: TaskFeasibilityRequest) => Promise<TaskFeasibilityResult>;
}

export const TaskFeasibilityChecker: React.FC<TaskFeasibilityCheckerProps> = ({
  onValidateTask
}) => {
  const [request, setRequest] = useState<TaskFeasibilityRequest>({
    description: '',
    context: '',
    requirements: [],
    timeframe: '',
    complexity: TaskComplexity.MODERATE
  });
  const [result, setResult] = useState<TaskFeasibilityResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requirementInput, setRequirementInput] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      setRequest(prev => ({
        ...prev,
        description: prev.description ? `${prev.description}\n\n${text}` : text
      }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setRequest(prev => ({
        ...prev,
        requirements: [...(prev.requirements || []), requirementInput.trim()]
      }));
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setRequest(prev => ({
      ...prev,
      requirements: prev.requirements?.filter((_, i) => i !== index) || []
    }));
  };

  const handleValidate = async () => {
    if (!request.description.trim()) {
      setError('Please provide a task description');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      if (onValidateTask) {
        const result = await onValidateTask(request);
        setResult(result);
      } else {
        // Mock validation for testing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockResult: TaskFeasibilityResult = {
          id: `validation-${Date.now()}`,
          feasible: Math.random() > 0.3, // 70% chance of feasible
          confidence: Math.random() > 0.5 ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM,
          estimatedDuration: '2-4 hours',
          requiredCapabilities: [
            'Code Generation',
            'Testing',
            'Documentation'
          ],
          suggestedApproach: 'Break down into smaller components, implement with TypeScript, add unit tests, and create documentation.',
          potentialChallenges: [
            'Complex state management requirements',
            'Integration with existing codebase',
            'Performance optimization needs'
          ],
          alternatives: [
            'Use existing library instead of custom implementation',
            'Simplify requirements to reduce complexity'
          ],
          reasoning: 'This task involves standard React component development with some complexity around state management. Claude has high confidence in code generation and testing capabilities.',
          timestamp: new Date().toISOString()
        };
        
        setResult(mockResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const reset = () => {
    setRequest({
      description: '',
      context: '',
      requirements: [],
      timeframe: '',
      complexity: TaskComplexity.MODERATE
    });
    setResult(null);
    setError(null);
  };

  const getConfidenceColor = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case ConfidenceLevel.HIGH: return 'success';
      case ConfidenceLevel.MEDIUM: return 'warning';
      case ConfidenceLevel.LOW: return 'error';
      default: return 'default';
    }
  };

  const getFeasibilityIcon = (feasible: boolean, confidence: ConfidenceLevel) => {
    if (!feasible) return <ErrorIcon color="error" />;
    if (confidence === ConfidenceLevel.HIGH) return <CheckIcon color="success" />;
    return <WarningIcon color="warning" />;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Task Feasibility Checker
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Describe your task and get Claude's assessment of feasibility, time estimates, and approach suggestions.
      </Typography>

      <Stack spacing={3}>
        {/* Task Description */}
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <TextField
            label="Task Description"
            multiline
            rows={4}
            fullWidth
            value={request.description}
            onChange={(e) => setRequest(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what you want to accomplish..."
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: dragOver ? 'action.hover' : 'background.paper',
                transition: 'background-color 0.2s'
              }
            }}
            InputProps={{
              startAdornment: dragOver ? (
                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                  <DragIcon color="action" />
                </Box>
              ) : undefined
            }}
          />
          {dragOver && (
            <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
              Drop text here to add to description
            </Typography>
          )}
        </Box>

        {/* Context */}
        <TextField
          label="Context (Optional)"
          multiline
          rows={2}
          fullWidth
          value={request.context}
          onChange={(e) => setRequest(prev => ({ ...prev, context: e.target.value }))}
          placeholder="Additional context about the project, constraints, or environment..."
        />

        {/* Requirements */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Requirements
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={requirementInput}
              onChange={(e) => setRequirementInput(e.target.value)}
              placeholder="Add a requirement..."
              onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
            />
            <Button onClick={addRequirement} disabled={!requirementInput.trim()}>
              Add
            </Button>
          </Stack>
          
          {request.requirements && request.requirements.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {request.requirements.map((req, index) => (
                <Chip
                  key={index}
                  label={req}
                  onDelete={() => removeRequirement(index)}
                  size="small"
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Settings Row */}
        <Stack direction="row" spacing={2}>
          <TextField
            label="Timeframe"
            value={request.timeframe}
            onChange={(e) => setRequest(prev => ({ ...prev, timeframe: e.target.value }))}
            placeholder="e.g., 2 hours, by Friday"
            sx={{ flex: 1 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Complexity</InputLabel>
            <Select
              value={request.complexity}
              onChange={(e) => setRequest(prev => ({ ...prev, complexity: e.target.value as TaskComplexity }))}
              label="Complexity"
            >
              {Object.values(TaskComplexity).map(complexity => (
                <MenuItem key={complexity} value={complexity}>
                  {complexity}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={handleValidate}
            disabled={isValidating || !request.description.trim()}
            startIcon={isValidating ? <CircularProgress size={20} /> : <StartIcon />}
          >
            {isValidating ? 'Validating...' : 'Check Feasibility'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={reset}
            startIcon={<RefreshIcon />}
            disabled={isValidating}
          >
            Reset
          </Button>
        </Stack>

        {/* Error */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && (
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {getFeasibilityIcon(result.feasible, result.confidence)}
              <Typography variant="h6">
                {result.feasible ? 'Feasible' : 'Not Feasible'}
              </Typography>
              <Chip
                label={`${result.confidence} confidence`}
                color={getConfidenceColor(result.confidence)}
                size="small"
              />
            </Box>

            <Stack spacing={2}>
              {/* Summary */}
              <Box>
                <Typography variant="body1" gutterBottom>
                  {result.reasoning}
                </Typography>
                
                {result.estimatedDuration && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <TimerIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Estimated duration: {result.estimatedDuration}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Required Capabilities */}
              {result.requiredCapabilities.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      Required Capabilities ({result.requiredCapabilities.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {result.requiredCapabilities.map((capability, index) => (
                        <Chip key={index} label={capability} size="small" />
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Suggested Approach */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Suggested Approach</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">{result.suggestedApproach}</Typography>
                </AccordionDetails>
              </Accordion>

              {/* Potential Challenges */}
              {result.potentialChallenges.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      Potential Challenges ({result.potentialChallenges.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {result.potentialChallenges.map((challenge, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <WarningIcon color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={challenge} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Alternatives */}
              {result.alternatives && result.alternatives.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      Alternative Approaches ({result.alternatives.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {result.alternatives.map((alternative, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <PsychologyIcon color="info" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={alternative} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
};