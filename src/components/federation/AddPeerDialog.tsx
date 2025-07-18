import React, { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Chip,
  FormHelperText
} from '@mui/material';
import { TrustLevel } from '../../types/federation';
import { useFederation } from '../../hooks/useFederation';

interface AddPeerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PeerFormData {
  url: string;
  name: string;
  trust_level: TrustLevel;
  substrate_id: string;
  capabilities?: Record<string, any>;
  mcp_version: string;
}

const TRUST_LEVEL_DESCRIPTIONS = {
  [TrustLevel.NONE]: 'No trust - Discovery only, no task delegation allowed',
  [TrustLevel.BASIC]: 'Basic trust - Simple read-only queries allowed',
  [TrustLevel.VERIFIED]: 'Verified - Standard task delegation with monitoring',
  [TrustLevel.TRUSTED]: 'Trusted - Most operations allowed with audit trail',
  [TrustLevel.FULL]: 'Full trust - Unrestricted access and delegation'
};

export const AddPeerDialog: React.FC<AddPeerDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { addPeer, discoverPeer } = useFederation();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<any>(null);
  
  const [formData, setFormData] = useState<PeerFormData>({
    url: '',
    name: '',
    trust_level: TrustLevel.BASIC,
    substrate_id: '',
    capabilities: {},
    mcp_version: '1.0.0'
  });

  const steps = ['Enter URL', 'Discover & Verify', 'Configure Trust'];

  const handleFieldChange = (field: keyof PeerFormData) => (
    event: React.ChangeEvent<HTMLInputElement> | { target: { value: unknown } }
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: 'target' in event ? event.target.value : (event as any).value
    }));
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleDiscover = async () => {
    if (!validateUrl(formData.url)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await discoverPeer(formData.url);
      setDiscoveryResult(result);
      
      // Auto-fill name if discovered
      if (result.substrate?.name && !formData.name) {
        setFormData(prev => ({
          ...prev,
          name: result.substrate.name
        }));
      }
      
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover peer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Please provide a name for this peer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addPeer({
        url: formData.url,
        name: formData.name,
        trust_level: formData.trust_level,
        substrate_id: formData.substrate_id,
        capabilities: formData.capabilities || {},
        mcp_version: formData.mcp_version,
        status: 'discovered' as any,
        error_count: 0,
        discovered_at: new Date().toISOString()
      });
      
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add peer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      url: '',
      name: '',
      trust_level: TrustLevel.BASIC,
      substrate_id: '',
      capabilities: {},
      mcp_version: '1.0.0'
    });
    setError(null);
    setDiscoveryResult(null);
    onClose();
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(0, prev - 1));
    setError(null);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Substrate URL"
              value={formData.url}
              onChange={handleFieldChange('url')}
              placeholder="https://substrate.example.com"
              error={!!error && activeStep === 0}
              helperText={error && activeStep === 0 ? error : 'Enter the URL of the Geneva substrate you want to federate with'}
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              label="Substrate ID"
              value={formData.substrate_id}
              onChange={handleFieldChange('substrate_id')}
              margin="normal"
              helperText="Unique identifier for the substrate"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            {loading ? (
              <>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1">
                  Discovering peer substrate...
                </Typography>
              </>
            ) : (
              <Typography variant="body1">
                Click "Discover" to verify and connect to the peer substrate
              </Typography>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            {discoveryResult && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Successfully discovered substrate: {discoveryResult.substrate?.name || 'Unknown'}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Peer Name"
              value={formData.name}
              onChange={handleFieldChange('name')}
              margin="normal"
              helperText="A friendly name to identify this peer"
              required
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Trust Level</InputLabel>
              <Select
                value={formData.trust_level}
                onChange={handleFieldChange('trust_level')}
                label="Trust Level"
              >
                {Object.values(TrustLevel).map(level => (
                  <MenuItem key={level} value={level}>
                    <Box>
                      <Typography variant="body1">{level.toUpperCase()}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {TRUST_LEVEL_DESCRIPTIONS[level]}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Set the initial trust level for this peer. You can change this later.
              </FormHelperText>
            </FormControl>

            {discoveryResult?.substrate?.capabilities && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Discovered Capabilities:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {discoveryResult.substrate.capabilities.map((cap: string) => (
                    <Chip key={cap} label={cap} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Add Federated Peer</DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mt: 1, mb: 3 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && activeStep !== 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {activeStep === 0 && (
          <Button 
            onClick={() => setActiveStep(1)} 
            variant="contained"
            disabled={!formData.url}
          >
            Next
          </Button>
        )}
        {activeStep === 1 && (
          <Button 
            onClick={handleDiscover} 
            variant="contained"
            disabled={loading}
          >
            Discover
          </Button>
        )}
        {activeStep === 2 && (
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading || !formData.name}
          >
            Add Peer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};