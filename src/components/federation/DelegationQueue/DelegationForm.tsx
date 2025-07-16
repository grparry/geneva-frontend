/**
 * Delegation Form Component
 * 
 * Dialog for creating new task delegations.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Autocomplete,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  CloseOutlined,
  AddOutlined,
  RemoveOutlined,
  CodeOutlined,
} from '@mui/icons-material';

// Federation hooks and services
import { 
  useGetPeersQuery,
  useDelegateTaskMutation,
} from '../../../api/federation';

// Federation types and components
import { SubstratePeer, PeerStatus, DelegateTaskRequest } from '../../../types/federation';
import { PeerStatusIcon, TrustLevelBadge } from '../shared';

interface DelegationFormProps {
  open: boolean;
  onClose: () => void;
  onDelegationCreated?: (delegation: any) => void;
}

interface TaskDataField {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
}

const taskTypes = [
  {
    value: 'pattern_extraction',
    label: 'Pattern Extraction',
    description: 'Extract patterns from text or data',
    defaultFields: [
      { key: 'content', value: '', type: 'string' as const },
      { key: 'pattern_type', value: 'default', type: 'string' as const },
    ],
  },
  {
    value: 'semantic_search',
    label: 'Semantic Search',
    description: 'Perform semantic search operations',
    defaultFields: [
      { key: 'query', value: '', type: 'string' as const },
      { key: 'limit', value: '10', type: 'number' as const },
      { key: 'threshold', value: '0.7', type: 'number' as const },
    ],
  },
  {
    value: 'data_analysis',
    label: 'Data Analysis',
    description: 'Analyze data and generate insights',
    defaultFields: [
      { key: 'data_source', value: '', type: 'string' as const },
      { key: 'analysis_type', value: 'summary', type: 'string' as const },
    ],
  },
  {
    value: 'content_generation',
    label: 'Content Generation',
    description: 'Generate content based on prompts',
    defaultFields: [
      { key: 'prompt', value: '', type: 'string' as const },
      { key: 'max_length', value: '1000', type: 'number' as const },
    ],
  },
];

const DelegationForm: React.FC<DelegationFormProps> = ({
  open,
  onClose,
  onDelegationCreated,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [taskType, setTaskType] = useState('');
  const [targetPeer, setTargetPeer] = useState<SubstratePeer | null>(null);
  const [priority, setPriority] = useState(5);
  const [taskDataFields, setTaskDataFields] = useState<TaskDataField[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API queries
  const { data: peers = [] } = useGetPeersQuery({});
  const [delegateTask, { isLoading, error }] = useDelegateTaskMutation();

  // Filter available peers
  const availablePeers = peers.filter(peer => 
    peer.status === PeerStatus.CONNECTED || 
    peer.status === PeerStatus.HEALTHY
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setTaskType('');
      setTargetPeer(null);
      setPriority(5);
      setTaskDataFields([]);
      setErrors({});
    }
  }, [open]);

  // Update task data fields when task type changes
  useEffect(() => {
    if (taskType) {
      const selectedTaskType = taskTypes.find(t => t.value === taskType);
      if (selectedTaskType) {
        setTaskDataFields(selectedTaskType.defaultFields);
      }
    }
  }, [taskType]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Task type and target
        if (!taskType) {
          newErrors.taskType = 'Please select a task type';
        }
        if (!targetPeer) {
          newErrors.targetPeer = 'Please select a target peer';
        }
        break;
      
      case 1: // Task data
        taskDataFields.forEach((field, index) => {
          if (!field.key.trim()) {
            newErrors[`field_${index}_key`] = 'Field name is required';
          }
          if (!field.value.trim()) {
            newErrors[`field_${index}_value`] = 'Field value is required';
          }
          if (field.type === 'json') {
            try {
              JSON.parse(field.value);
            } catch {
              newErrors[`field_${index}_value`] = 'Invalid JSON format';
            }
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !targetPeer) return;

    try {
      // Convert task data fields to object
      const taskData: Record<string, any> = {};
      taskDataFields.forEach(field => {
        let value: any = field.value;
        
        switch (field.type) {
          case 'number':
            value = parseFloat(field.value);
            break;
          case 'boolean':
            value = field.value === 'true';
            break;
          case 'json':
            value = JSON.parse(field.value);
            break;
        }
        
        taskData[field.key] = value;
      });

      const request: DelegateTaskRequest = {
        target_substrate: targetPeer.substrate_id,
        task_type: taskType,
        task_data: taskData,
        priority,
      };

      const newDelegation = await delegateTask(request).unwrap();
      
      // Notify parent
      onDelegationCreated?.(newDelegation);
      
      // Close dialog
      onClose();
      
    } catch (error) {
      console.error('Failed to create delegation:', error);
    }
  };

  const addTaskDataField = () => {
    setTaskDataFields(prev => [
      ...prev,
      { key: '', value: '', type: 'string' },
    ]);
  };

  const removeTaskDataField = (index: number) => {
    setTaskDataFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateTaskDataField = (index: number, field: Partial<TaskDataField>) => {
    setTaskDataFields(prev => prev.map((item, i) => 
      i === index ? { ...item, ...field } : item
    ));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {/* Task Type Selection */}
            <FormControl fullWidth margin="normal" error={!!errors.taskType}>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={taskType}
                label="Task Type"
                onChange={(e) => setTaskType(e.target.value)}
              >
                {taskTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box>
                      <Typography variant="body1">{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.taskType && (
                <Typography variant="caption" color="error">
                  {errors.taskType}
                </Typography>
              )}
            </FormControl>

            {/* Target Peer Selection */}
            <Autocomplete
              options={availablePeers}
              value={targetPeer}
              onChange={(_, newValue) => setTargetPeer(newValue)}
              getOptionLabel={(peer) => peer.name}
              renderOption={(props, peer) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <PeerStatusIcon status={peer.status} size="small" withTooltip={false} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">{peer.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {peer.url}
                      </Typography>
                    </Box>
                    <TrustLevelBadge level={peer.trust_level} size="small" showLabel={false} />
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Target Peer"
                  margin="normal"
                  error={!!errors.targetPeer}
                  helperText={errors.targetPeer}
                />
              )}
              fullWidth
            />

            {availablePeers.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No peers are currently available for delegation. Ensure peers are connected and healthy.
              </Alert>
            )}

            {/* Priority Selection */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Priority: {priority}
              </Typography>
              <Slider
                value={priority}
                onChange={(_, newValue) => setPriority(newValue as number)}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Low Priority
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  High Priority
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Task Data Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure the data that will be sent to the peer for processing.
            </Typography>

            {taskDataFields.map((field, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    label="Field Name"
                    value={field.key}
                    onChange={(e) => updateTaskDataField(index, { key: e.target.value })}
                    size="small"
                    sx={{ flex: 1 }}
                    error={!!errors[`field_${index}_key`]}
                    helperText={errors[`field_${index}_key`]}
                  />
                  
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={field.type}
                      label="Type"
                      onChange={(e) => updateTaskDataField(index, { type: e.target.value as any })}
                    >
                      <MenuItem value="string">String</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="boolean">Boolean</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <IconButton
                    onClick={() => removeTaskDataField(index)}
                    size="small"
                    color="error"
                  >
                    <RemoveOutlined />
                  </IconButton>
                </Box>
                
                <TextField
                  label="Field Value"
                  value={field.value}
                  onChange={(e) => updateTaskDataField(index, { value: e.target.value })}
                  fullWidth
                  multiline={field.type === 'json'}
                  rows={field.type === 'json' ? 3 : 1}
                  sx={{ mt: 2 }}
                  error={!!errors[`field_${index}_value`]}
                  helperText={errors[`field_${index}_value`]}
                  InputProps={{
                    startAdornment: field.type === 'json' ? <CodeOutlined sx={{ mr: 1, color: 'action.active' }} /> : undefined,
                  }}
                />
              </Box>
            ))}

            <Button
              startIcon={<AddOutlined />}
              onClick={addTaskDataField}
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
            >
              Add Field
            </Button>

            {taskDataFields.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Add at least one field to configure the task data.
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Review Delegation
            </Typography>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Task Type:</Typography>
                  <Chip 
                    label={taskTypes.find(t => t.value === taskType)?.label || taskType}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Target Peer:</Typography>
                  <Typography variant="body2">{targetPeer?.name}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Priority:</Typography>
                  <Chip 
                    label={priority}
                    size="small"
                    color={priority >= 8 ? 'error' : priority >= 6 ? 'warning' : 'default'}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Task Fields:</Typography>
                  <Typography variant="body2">{taskDataFields.length} fields</Typography>
                </Box>
              </Box>
            </Box>

            {taskDataFields.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Task Data Preview:
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <pre>
                    {JSON.stringify(
                      Object.fromEntries(
                        taskDataFields.map(field => [field.key, field.value])
                      ),
                      null,
                      2
                    )}
                  </pre>
                </Box>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Failed to create delegation: {error.toString()}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const steps = [
    'Configure Task',
    'Task Data',
    'Review & Submit',
  ];

  const canProceed = () => {
    return validateStep(activeStep);
  };

  const getActionLabel = () => {
    switch (activeStep) {
      case 0:
        return 'Next: Configure Data';
      case 1:
        return 'Next: Review';
      case 2:
        return 'Create Delegation';
      default:
        return 'Next';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Create Task Delegation</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseOutlined />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={index}>
              <StepLabel>
                <Typography variant="subtitle1">{label}</Typography>
              </StepLabel>
              <StepContent>
                {renderStepContent(index)}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {getActionLabel()}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canProceed() || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Delegation'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DelegationForm;