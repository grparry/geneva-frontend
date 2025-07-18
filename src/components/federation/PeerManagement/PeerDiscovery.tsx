/**
 * Peer Discovery Component
 * 
 * Dialog for discovering and adding new federation peers.
 */

import React, { useState } from 'react';
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
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  CloseOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  InfoOutlined,
} from '@mui/icons-material';

// Federation hooks and services
import { 
  useDiscoverPeerMutation,
  useTestPeerConnectionMutation,
  useGetWellKnownMcpQuery,
} from '../../../api/federation';

// Federation types and components
import { SubstratePeer } from '../../../types/federation';
import { TrustLevelBadge, PeerStatusIcon } from '../shared';

interface PeerDiscoveryProps {
  open: boolean;
  onClose: () => void;
  onPeerAdded?: (peer: SubstratePeer) => void;
}

interface DiscoveryStep {
  label: string;
  description: string;
}

const discoverySteps: DiscoveryStep[] = [
  {
    label: 'Enter Peer URL',
    description: 'Provide the substrate peer URL to discover',
  },
  {
    label: 'Test Connection',
    description: 'Verify connectivity and fetch peer information',
  },
  {
    label: 'Review & Add',
    description: 'Review peer details and add to federation',
  },
];

const PeerDiscovery: React.FC<PeerDiscoveryProps> = ({
  open,
  onClose,
  onPeerAdded,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [peerUrl, setPeerUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [discoveredPeer, setDiscoveredPeer] = useState<any>(null);

  // API mutations
  const [discoverPeer, { isLoading: isDiscovering, error: discoverError }] = useDiscoverPeerMutation();
  const [testConnection, { isLoading: isTesting, error: testError }] = useTestPeerConnectionMutation();
  
  // Well-known MCP query (for validation)
  const { 
    data: mcpData, 
    error: mcpError,
    refetch: refetchMcp 
  } = useGetWellKnownMcpQuery(peerUrl, {
    skip: !peerUrl || activeStep !== 1,
  });

  const handleClose = () => {
    // Reset state
    setActiveStep(0);
    setPeerUrl('');
    setUrlError('');
    setDiscoveredPeer(null);
    onClose();
  };

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setUrlError('URL must use HTTP or HTTPS protocol');
        return false;
      }
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setPeerUrl(url);
    
    if (url && !validateUrl(url)) {
      return;
    }
    setUrlError('');
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Step 1: Validate URL and move to connection test
      if (!peerUrl || !validateUrl(peerUrl)) {
        return;
      }
      setActiveStep(1);
      
      // Start connection test automatically
      handleTestConnection();
    } else if (activeStep === 1) {
      // Step 2: Move to review step
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Step 3: Complete discovery
      await handleCompleteDiscovery();
    }
  };

  const handleBack = () => {
    setActiveStep(Math.max(0, activeStep - 1));
  };

  const handleTestConnection = async () => {
    try {
      // Test basic connectivity
      const connectionResult = await testConnection(peerUrl).unwrap();
      
      // Fetch MCP well-known information
      await refetchMcp();
      
      console.log('Connection test result:', connectionResult);
      console.log('MCP data:', mcpData);
      
      // If successful, prepare discovered peer data
      setDiscoveredPeer({
        url: peerUrl,
        connectionTest: connectionResult,
        mcpInfo: mcpData,
      });
      
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  const handleCompleteDiscovery = async () => {
    try {
      const newPeer = await discoverPeer({ peer_url: peerUrl }).unwrap();
      
      // Notify parent component
      onPeerAdded?.(newPeer);
      
      // Close dialog
      handleClose();
      
    } catch (error) {
      console.error('Failed to add peer:', error);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              fullWidth
              label="Peer URL"
              placeholder="https://substrate-peer.example.com"
              value={peerUrl}
              onChange={handleUrlChange}
              error={!!urlError}
              helperText={urlError || 'Enter the URL of the substrate peer to discover'}
              margin="normal"
              autoFocus
              InputProps={{
                startAdornment: <SearchOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                The peer URL should point to a substrate instance with federation enabled.
                We'll attempt to fetch the MCP context and test connectivity.
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Testing connection to: {peerUrl}
            </Typography>
            
            {(isTesting || isDiscovering) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
                <CircularProgress size={24} />
                <Typography variant="body2">
                  {isTesting ? 'Testing connection...' : 'Fetching peer information...'}
                </Typography>
              </Box>
            )}
            
            {testError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Connection Test Failed</Typography>
                <Typography variant="body2">
                  {testError.toString()}
                </Typography>
              </Alert>
            )}
            
            {mcpError && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">MCP Information Unavailable</Typography>
                <Typography variant="body2">
                  Could not fetch MCP well-known information. The peer may still be discoverable.
                </Typography>
              </Alert>
            )}
            
            {discoveredPeer && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlined />
                    <Typography variant="subtitle2">
                      Connection successful! Peer is reachable.
                    </Typography>
                  </Box>
                </Alert>
                
                {discoveredPeer.connectionTest && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Connection Details
                    </Typography>
                    <Chip
                      label={`Latency: ${discoveredPeer.connectionTest.latency}ms`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                )}
                
                {mcpData && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      MCP Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      <Chip
                        label={`MCP Version: ${mcpData.mcp_version || 'Unknown'}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Substrate ID: ${mcpData.substrate_id?.slice(0, 8) || 'Unknown'}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    {mcpData.capabilities && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Capabilities ({Object.keys(mcpData.capabilities).length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {Object.keys(mcpData.capabilities).slice(0, 5).map((cap) => (
                            <Chip
                              key={cap}
                              label={cap}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                          {Object.keys(mcpData.capabilities).length > 5 && (
                            <Chip
                              label={`+${Object.keys(mcpData.capabilities).length - 5} more`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ready to add peer to federation
            </Typography>
            
            <Box sx={{ my: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Peer Summary
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">URL:</Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {peerUrl}
                  </Typography>
                </Box>
                
                {mcpData?.substrate_id && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Substrate ID:</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {mcpData.substrate_id.slice(0, 16)}...
                    </Typography>
                  </Box>
                )}
                
                {mcpData?.mcp_version && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">MCP Version:</Typography>
                    <Typography variant="body2">
                      {mcpData.mcp_version}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Initial Trust Level:</Typography>
                  <TrustLevelBadge level={TrustLevel.BASIC} size="small" />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Capabilities:</Typography>
                  <Typography variant="body2">
                    {mcpData?.capabilities ? Object.keys(mcpData.capabilities).length : 0} detected
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {discoverError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Failed to Add Peer</Typography>
                <Typography variant="body2">
                  {discoverError.toString()}
                </Typography>
              </Alert>
            )}
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                The peer will be added with basic trust level. You can upgrade trust
                level later through the trust management interface.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return peerUrl && !urlError;
      case 1:
        return discoveredPeer && !testError && !mcpError;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const getActionLabel = () => {
    switch (activeStep) {
      case 0:
        return 'Test Connection';
      case 1:
        return 'Review Peer';
      case 2:
        return 'Add Peer';
      default:
        return 'Next';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Discover Federation Peer</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseOutlined />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {discoverySteps.map((step, index) => (
            <Step key={index}>
              <StepLabel>
                <Typography variant="subtitle1">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                {renderStepContent(index)}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!canProceed() || isDiscovering || isTesting}
          startIcon={isDiscovering ? <CircularProgress size={16} /> : undefined}
        >
          {getActionLabel()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PeerDiscovery;