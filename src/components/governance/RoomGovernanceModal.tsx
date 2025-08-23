import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Security as GovernanceIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { RoomGovernanceState, RoomState } from '../../types/governance';
import { RoomStateCard } from './RoomStateCard';
import { governanceService } from '../../services/governanceService';

interface StateTransitionRequest {
  new_state: RoomState;
  transitioned_by: string;
  authority_type: 'system_agent' | 'human_review' | 'auto_timeout' | 'governance_decision';
  reason: string;
  context?: Record<string, any>;
}

interface RoomGovernanceModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName?: string;
  initialGovernanceState?: RoomGovernanceState;
  onStateChanged?: (newState: RoomGovernanceState) => void;
}

const AVAILABLE_STATES: { value: RoomState; label: string; description: string; severity: 'success' | 'warning' | 'error' | 'info' }[] = [
  { value: 'READY', label: 'Ready', description: 'Normal conversation mode', severity: 'success' },
  { value: 'IDLE', label: 'Idle', description: 'Conversation completed', severity: 'info' },
  { value: 'CONTEXT_INJECTION', label: 'Context Injection', description: 'Loading memory context', severity: 'info' },
  { value: 'TRINITY_REVIEW', label: 'Trinity Review', description: 'Under governance review', severity: 'warning' },
  { value: 'HUMAN_REVIEW', label: 'Human Review', description: 'Escalated to human review', severity: 'warning' },
  { value: 'BLOCKED', label: 'Blocked', description: 'Conversation blocked', severity: 'error' },
  { value: 'SAVING_STATE', label: 'Saving State', description: 'Saving conversation state', severity: 'info' },
  { value: 'INITIALIZING', label: 'Initializing', description: 'Room being initialized', severity: 'info' }
];

const AUTHORITY_TYPES = [
  { value: 'human_review', label: 'Human Review', description: 'Manual administrative action' },
  { value: 'system_agent', label: 'System Agent', description: 'Automated system decision' },
  { value: 'governance_decision', label: 'Governance Decision', description: 'Governance council decision' },
  { value: 'auto_timeout', label: 'Auto Timeout', description: 'Automatic timeout-based transition' }
];

const COMMON_REASONS = [
  'Emergency reset due to system error',
  'Manual intervention requested by user',
  'Resolving stuck governance state',
  'Administrative override for testing',
  'Trinity review completed manually',
  'Human review decision implemented',
  'Room blocked for policy violation',
  'Conversation concluded by admin'
];

export const RoomGovernanceModal: React.FC<RoomGovernanceModalProps> = ({
  open,
  onClose,
  roomId,
  roomName,
  initialGovernanceState,
  onStateChanged
}) => {
  const [governanceState, setGovernanceState] = useState<RoomGovernanceState | null>(initialGovernanceState || null);
  const [selectedState, setSelectedState] = useState<RoomState>('READY');
  const [authorityType, setAuthorityType] = useState<'system_agent' | 'human_review' | 'auto_timeout' | 'governance_decision'>('human_review');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [transitionedBy, setTransitionedBy] = useState('admin-user');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current governance state when modal opens
  useEffect(() => {
    if (open && roomId && !initialGovernanceState) {
      loadGovernanceState();
    }
  }, [open, roomId, initialGovernanceState]);

  // Reset form when opening with initial state
  useEffect(() => {
    if (open && initialGovernanceState) {
      setGovernanceState(initialGovernanceState);
      setSelectedState(initialGovernanceState.current_state as RoomState);
    }
  }, [open, initialGovernanceState]);

  const loadGovernanceState = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const state = await governanceService.getRoomGovernanceState(roomId);
      setGovernanceState(state);
      setSelectedState(state.current_state as RoomState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load governance state');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateTransition = async () => {
    if (!selectedState || !reason.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const finalReason = reason === 'custom' ? customReason : reason;
      
      const request: StateTransitionRequest = {
        new_state: selectedState,
        transitioned_by: transitionedBy,
        authority_type: authorityType,
        reason: finalReason,
        context: {
          previous_state: governanceState?.current_state,
          initiated_via: 'frontend_governance_modal',
          timestamp: new Date().toISOString()
        }
      };

      // Call API to transition state
      const response = await governanceService.transitionRoomState(roomId, request);
      
      if (response.success) {
        setSuccess(`Room state successfully changed to ${selectedState}`);
        
        // Reload governance state to get updated data
        await loadGovernanceState();
        
        // Notify parent component
        if (onStateChanged && governanceState) {
          const updatedState = {
            ...governanceState,
            current_state: selectedState,
            state_updated_at: new Date().toISOString(),
            state_updated_by: transitionedBy
          };
          onStateChanged(updatedState);
        }
        
        // Auto-close modal after 2 seconds on success
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transition room state');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setReason('');
    setCustomReason('');
    onClose();
  };

  const selectedStateConfig = AVAILABLE_STATES.find(s => s.value === selectedState);
  const canSubmit = selectedState && reason.trim() && (reason !== 'custom' || customReason.trim()) && !isSubmitting;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 600 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GovernanceIcon color="primary" />
        <Box>
          <Typography variant="h6">
            Room Governance Management
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {roomName ? `${roomName} (${roomId})` : roomId}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Current State Display */}
            {governanceState && (
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current State
                </Typography>
                <RoomStateCard
                  governanceState={governanceState}
                  size="medium"
                  showDetails
                />
              </Paper>
            )}

            <Divider />

            {/* State Transition Form */}
            <Typography variant="h6">
              State Transition
            </Typography>

            {/* New State Selection */}
            <FormControl fullWidth>
              <InputLabel>New State</InputLabel>
              <Select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value as RoomState)}
                label="New State"
              >
                {AVAILABLE_STATES.map((state) => (
                  <MenuItem key={state.value} value={state.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Chip
                        label={state.label}
                        size="small"
                        color={state.severity}
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {state.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* State Impact Warning */}
            {selectedStateConfig && selectedStateConfig.severity === 'error' && (
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2">
                  <strong>Warning:</strong> Setting state to "{selectedStateConfig.label}" will block user participation.
                  This action should only be taken for policy violations or serious issues.
                </Typography>
              </Alert>
            )}

            {/* Authority Type */}
            <FormControl fullWidth>
              <InputLabel>Authority Type</InputLabel>
              <Select
                value={authorityType}
                onChange={(e) => setAuthorityType(e.target.value as 'system_agent' | 'human_review' | 'auto_timeout' | 'governance_decision')}
                label="Authority Type"
              >
                {AUTHORITY_TYPES.map((type) => (
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
            </FormControl>

            {/* Reason Selection */}
            <FormControl fullWidth>
              <InputLabel>Reason</InputLabel>
              <Select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                label="Reason"
              >
                {COMMON_REASONS.map((commonReason, index) => (
                  <MenuItem key={index} value={commonReason}>
                    {commonReason}
                  </MenuItem>
                ))}
                <MenuItem value="custom">
                  <em>Custom reason...</em>
                </MenuItem>
              </Select>
            </FormControl>

            {/* Custom Reason Input */}
            {reason === 'custom' && (
              <TextField
                fullWidth
                label="Custom Reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom reason for state transition..."
                multiline
                rows={2}
                required
              />
            )}

            {/* Transitioned By */}
            <TextField
              fullWidth
              label="Transitioned By"
              value={transitionedBy}
              onChange={(e) => setTransitionedBy(e.target.value)}
              helperText="User ID or system identifier performing this action"
              required
            />

            {/* Error/Success Messages */}
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" icon={<SuccessIcon />}>
                {success}
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleStateTransition}
          disabled={!canSubmit || isLoading}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <GovernanceIcon />}
        >
          {isSubmitting ? 'Applying...' : 'Apply State Change'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};