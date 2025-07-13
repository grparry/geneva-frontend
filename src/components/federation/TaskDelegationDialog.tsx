import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Chip,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Memory as MemoryIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { SubstratePeer, DelegationRequest, TrustLevel } from '../../types/federation';
import { useFederation } from '../../hooks/useFederation';

interface TaskDelegationDialogProps {
  open: boolean;
  onClose: () => void;
  preselectedPeer?: SubstratePeer;
}

interface TaskFormData {
  task_type: string;
  task_data: Record<string, any>;
  priority: number;
  timeout_ms: number;
}

const TASK_TYPES = [
  { 
    value: 'memory_query', 
    label: 'Memory Query', 
    icon: <MemoryIcon />,
    description: 'Query remote substrate memory',
    requiredCapabilities: ['memory', 'query']
  },
  { 
    value: 'code_execution', 
    label: 'Code Execution', 
    icon: <CodeIcon />,
    description: 'Execute code on remote substrate',
    requiredCapabilities: ['execution', 'sandbox']
  },
  { 
    value: 'data_sync', 
    label: 'Data Synchronization', 
    icon: <SpeedIcon />,
    description: 'Synchronize data between substrates',
    requiredCapabilities: ['sync', 'data']
  },
  { 
    value: 'security_scan', 
    label: 'Security Scan', 
    icon: <SecurityIcon />,
    description: 'Run security analysis on remote substrate',
    requiredCapabilities: ['security', 'analysis']
  }
];

export const TaskDelegationDialog: React.FC<TaskDelegationDialogProps> = ({
  open,
  onClose,
  preselectedPeer
}) => {
  const { peers, delegateTask, isDelegating } = useFederation();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPeerId, setSelectedPeerId] = useState<string>(preselectedPeer?.id || '');
  const [delegationResult, setDelegationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TaskFormData>({
    task_type: '',
    task_data: {},
    priority: 5,
    timeout_ms: 30000
  });

  const [taskDataJson, setTaskDataJson] = useState<string>('{}');

  const selectedPeer = useMemo(
    () => peers.find(p => p.id === selectedPeerId),
    [peers, selectedPeerId]
  );

  const eligiblePeers = useMemo(() => {
    if (!formData.task_type) return peers;
    
    const taskType = TASK_TYPES.find(t => t.value === formData.task_type);
    if (!taskType) return peers;
    
    return peers.filter(peer => {
      // Check if peer has required capabilities
      const hasCapabilities = taskType.requiredCapabilities.every(
        cap => peer.capabilities.includes(cap)
      );
      
      // Check if peer is connected and has sufficient trust
      const isEligible = peer.status === 'connected' && 
                        peer.trust_level !== TrustLevel.NONE &&
                        hasCapabilities;
      
      return isEligible;
    });
  }, [peers, formData.task_type]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleTaskTypeChange = (taskType: string) => {
    setFormData(prev => ({ ...prev, task_type: taskType }));
    // Reset peer selection when task type changes
    if (!eligiblePeers.find(p => p.id === selectedPeerId)) {
      setSelectedPeerId('');
    }
  };

  const handleTaskDataChange = (jsonString: string) => {
    setTaskDataJson(jsonString);
    try {
      const parsed = JSON.parse(jsonString);
      setFormData(prev => ({ ...prev, task_data: parsed }));
      setError(null);
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPeerId || !formData.task_type) {
      setError('Please select a peer and task type');
      return;
    }

    try {
      const request: DelegationRequest = {
        target_peer_id: selectedPeerId,
        task_type: formData.task_type,
        task_data: formData.task_data,
        priority: formData.priority,
        timeout_ms: formData.timeout_ms
      };

      const result = await delegateTask(request);
      setDelegationResult(result);
      setActiveStep(3); // Move to result step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delegate task');
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedPeerId('');
    setFormData({
      task_type: '',
      task_data: {},
      priority: 5,
      timeout_ms: 30000
    });
    setTaskDataJson('{}');
    setDelegationResult(null);
    setError(null);
    onClose();
  };

  const steps = ['Select Task Type', 'Choose Peer', 'Configure Task', 'Result'];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <SendIcon />
          <Typography variant="h6">Delegate Task to Peer Substrate</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Select Task Type */}
          <Step>
            <StepLabel>Select Task Type</StepLabel>
            <StepContent>
              <FormControl fullWidth margin="normal">
                <InputLabel>Task Type</InputLabel>
                <Select
                  value={formData.task_type}
                  onChange={(e) => handleTaskTypeChange(e.target.value)}
                  label="Task Type"
                >
                  {TASK_TYPES.map(taskType => (
                    <MenuItem key={taskType.value} value={taskType.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {taskType.icon}
                        <Box>
                          <Typography variant="body1">{taskType.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {taskType.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Choose the type of task to delegate
                </FormHelperText>
              </FormControl>
              
              {formData.task_type && (
                <Box mt={2}>
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                </Box>
              )}
            </StepContent>
          </Step>

          {/* Step 2: Choose Peer */}
          <Step>
            <StepLabel>Choose Peer Substrate</StepLabel>
            <StepContent>
              {eligiblePeers.length === 0 ? (
                <Alert severity="warning">
                  No peers available with required capabilities for this task type.
                </Alert>
              ) : (
                <List>
                  {eligiblePeers.map(peer => (
                    <ListItemButton
                      key={peer.id}
                      selected={selectedPeerId === peer.id}
                      onClick={() => setSelectedPeerId(peer.id)}
                    >
                      <ListItemIcon>
                        {peer.status === 'connected' ? (
                          <CheckIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={peer.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Trust: {peer.trust_level} | Status: {peer.status}
                            </Typography>
                            <Box display="flex" gap={0.5} mt={0.5}>
                              {peer.capabilities.slice(0, 3).map(cap => (
                                <Chip key={cap} label={cap} size="small" />
                              ))}
                              {peer.capabilities.length > 3 && (
                                <Chip label={`+${peer.capabilities.length - 3}`} size="small" />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Estimated latency">
                          <Chip
                            icon={<SpeedIcon />}
                            label="~50ms"
                            size="small"
                            color="primary"
                          />
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  ))}
                </List>
              )}
              
              <Box mt={2} display="flex" gap={1}>
                <Button onClick={handleBack}>Back</Button>
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  disabled={!selectedPeerId}
                >
                  Next
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Configure Task */}
          <Step>
            <StepLabel>Configure Task</StepLabel>
            <StepContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  fullWidth
                  label="Task Data (JSON)"
                  multiline
                  rows={4}
                  value={taskDataJson}
                  onChange={(e) => handleTaskDataChange(e.target.value)}
                  error={!!error && error.includes('JSON')}
                  helperText={error && error.includes('JSON') ? error : 'Enter task-specific data as JSON'}
                />
                
                <Box display="flex" gap={2}>
                  <TextField
                    label="Priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      priority: parseInt(e.target.value) || 5 
                    }))}
                    InputProps={{ inputProps: { min: 1, max: 10 } }}
                    helperText="1 (lowest) to 10 (highest)"
                  />
                  
                  <TextField
                    label="Timeout (ms)"
                    type="number"
                    value={formData.timeout_ms}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      timeout_ms: parseInt(e.target.value) || 30000 
                    }))}
                    InputProps={{ inputProps: { min: 1000, max: 300000 } }}
                    helperText="Max execution time"
                  />
                </Box>
                
                {selectedPeer && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Delegating to:
                    </Typography>
                    <Typography variant="body1">{selectedPeer.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedPeer.substrate_id}
                    </Typography>
                  </Paper>
                )}
              </Box>
              
              <Box mt={2} display="flex" gap={1}>
                <Button onClick={handleBack}>Back</Button>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  disabled={isDelegating || !!error}
                  startIcon={isDelegating ? <CircularProgress size={20} /> : <SendIcon />}
                >
                  {isDelegating ? 'Delegating...' : 'Delegate Task'}
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 4: Result */}
          <Step>
            <StepLabel>Delegation Result</StepLabel>
            <StepContent>
              {delegationResult ? (
                <Box>
                  <Alert 
                    severity={delegationResult.status === 'completed' ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  >
                    Task delegation {delegationResult.status}
                  </Alert>
                  
                  {delegationResult.result && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Result:
                      </Typography>
                      <pre style={{ overflow: 'auto' }}>
                        {JSON.stringify(delegationResult.result, null, 2)}
                      </pre>
                    </Paper>
                  )}
                  
                  <Box display="flex" gap={2}>
                    <Typography variant="body2">
                      <strong>Delegation ID:</strong> {delegationResult.id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Duration:</strong> {delegationResult.duration_ms}ms
                    </Typography>
                  </Box>
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <CircularProgress />
              )}
              
              <Box mt={2}>
                <Button variant="contained" onClick={handleClose}>
                  Close
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
};