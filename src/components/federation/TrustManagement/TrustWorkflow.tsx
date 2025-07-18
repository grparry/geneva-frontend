/**
 * Trust Workflow Component
 * 
 * Interface for trust upgrade/downgrade workflows and approvals.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  SecurityOutlined,
  AssignmentOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  InfoOutlined,
  WarningOutlined,
} from '@mui/icons-material';

// Federation types and components
import { SubstratePeer, TrustLevel } from '../../../types/federation';
import { TrustLevelBadge, PeerStatusIcon } from '../shared';

interface TrustWorkflowProps {
  peers: SubstratePeer[];
  isLoading: boolean;
  onUpdateTrust: (params: { peer_id: string; trust_level: TrustLevel }) => Promise<any>;
}

interface TrustWorkflowStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
}

interface TrustUpgradeRequest {
  peer: SubstratePeer;
  currentLevel: TrustLevel;
  targetLevel: TrustLevel;
  reason: string;
  steps: TrustWorkflowStep[];
}

const trustLevelProgression: TrustLevel[] = [
  TrustLevel.NONE,
  TrustLevel.BASIC,
  TrustLevel.VERIFIED,
  TrustLevel.TRUSTED,
  TrustLevel.FULL,
];

const workflowSteps: Record<string, TrustWorkflowStep[]> = {
  [`${TrustLevel.NONE}-${TrustLevel.BASIC}`]: [
    {
      id: 'connectivity',
      label: 'Verify Connectivity',
      description: 'Ensure peer is reachable and responsive',
      required: true,
      completed: false,
    },
    {
      id: 'identity',
      label: 'Verify Identity',
      description: 'Confirm peer identity and basic information',
      required: true,
      completed: false,
    },
  ],
  [`${TrustLevel.BASIC}-${TrustLevel.VERIFIED}`]: [
    {
      id: 'capabilities',
      label: 'Verify Capabilities',
      description: 'Test and validate peer capabilities',
      required: true,
      completed: false,
    },
    {
      id: 'performance',
      label: 'Performance Assessment',
      description: 'Evaluate peer performance metrics',
      required: true,
      completed: false,
    },
    {
      id: 'compliance',
      label: 'Security Compliance',
      description: 'Verify security standards compliance',
      required: true,
      completed: false,
    },
  ],
  [`${TrustLevel.VERIFIED}-${TrustLevel.TRUSTED}`]: [
    {
      id: 'history',
      label: 'Historical Analysis',
      description: 'Review interaction history and reliability',
      required: true,
      completed: false,
    },
    {
      id: 'delegation_success',
      label: 'Delegation Success Rate',
      description: 'Verify high success rate in task delegations',
      required: true,
      completed: false,
    },
    {
      id: 'peer_reputation',
      label: 'Peer Reputation',
      description: 'Check reputation from other trusted peers',
      required: false,
      completed: false,
    },
  ],
  [`${TrustLevel.TRUSTED}-${TrustLevel.FULL}`]: [
    {
      id: 'admin_approval',
      label: 'Administrator Approval',
      description: 'Requires explicit administrator approval',
      required: true,
      completed: false,
    },
    {
      id: 'certificate_exchange',
      label: 'Certificate Exchange',
      description: 'Exchange and validate security certificates',
      required: true,
      completed: false,
    },
    {
      id: 'audit_trail',
      label: 'Complete Audit Trail',
      description: 'Comprehensive security audit and documentation',
      required: true,
      completed: false,
    },
  ],
};

const TrustWorkflow: React.FC<TrustWorkflowProps> = ({
  peers,
  isLoading,
  onUpdateTrust,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<SubstratePeer | null>(null);
  const [targetLevel, setTargetLevel] = useState<TrustLevel>(TrustLevel.BASIC);
  const [reason, setReason] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Filter peers that can be upgraded/downgraded
  const upgradablePeers = useMemo(() => {
    return peers.filter(peer => {
      const currentIndex = trustLevelProgression.indexOf(peer.trust_level);
      return currentIndex < trustLevelProgression.length - 1;
    });
  }, [peers]);

  const downgradablePeers = useMemo(() => {
    return peers.filter(peer => {
      const currentIndex = trustLevelProgression.indexOf(peer.trust_level);
      return currentIndex > 0;
    });
  }, [peers]);

  // Get available target levels for a peer
  const getAvailableTargetLevels = (peer: SubstratePeer, isUpgrade: boolean) => {
    const currentIndex = trustLevelProgression.indexOf(peer.trust_level);
    
    if (isUpgrade) {
      return trustLevelProgression.slice(currentIndex + 1);
    } else {
      return trustLevelProgression.slice(0, currentIndex).reverse();
    }
  };

  const getWorkflowSteps = (currentLevel: TrustLevel, targetLevel: TrustLevel): TrustWorkflowStep[] => {
    const key = `${currentLevel}-${targetLevel}`;
    return workflowSteps[key] || [];
  };

  const handleStartWorkflow = (peer: SubstratePeer, isUpgrade: boolean) => {
    setSelectedPeer(peer);
    const availableLevels = getAvailableTargetLevels(peer, isUpgrade);
    setTargetLevel(availableLevels[0] || peer.trust_level);
    setReason('');
    setActiveStep(0);
    setDialogOpen(true);
  };

  const handleCompleteStep = (stepIndex: number) => {
    // In a real implementation, this would trigger actual verification processes
    console.log(`Completing step ${stepIndex} for peer ${selectedPeer?.name}`);
    setActiveStep(stepIndex + 1);
  };

  const handleCompleteWorkflow = async () => {
    if (!selectedPeer) return;

    setProcessing(true);
    try {
      await onUpdateTrust({
        peer_id: selectedPeer.id,
        trust_level: targetLevel,
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to complete trust workflow:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getTrustLevelColor = (level: TrustLevel) => {
    switch (level) {
      case TrustLevel.NONE: return 'default';
      case TrustLevel.BASIC: return 'info';
      case TrustLevel.VERIFIED: return 'warning';
      case TrustLevel.TRUSTED: return 'success';
      case TrustLevel.FULL: return 'primary';
      default: return 'default';
    }
  };

  const renderPeerCard = (peer: SubstratePeer, actionType: 'upgrade' | 'downgrade') => {
    const availableLevels = getAvailableTargetLevels(peer, actionType === 'upgrade');
    const nextLevel = availableLevels[0];
    
    return (
      <Card key={peer.id} variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PeerStatusIcon status={peer.status} size="small" withTooltip={false} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {peer.name}
            </Typography>
            <TrustLevelBadge level={peer.trust_level} size="small" />
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {peer.url}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <Typography variant="body2">
              Current Trust Level:
            </Typography>
            <Chip
              label={peer.trust_level}
              size="small"
              color={getTrustLevelColor(peer.trust_level)}
            />
          </Box>
          
          {nextLevel && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="body2">
                Next Level:
              </Typography>
              <Chip
                label={nextLevel}
                size="small"
                color={getTrustLevelColor(nextLevel)}
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
        
        <CardActions>
          <Button
            size="small"
            startIcon={actionType === 'upgrade' ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
            onClick={() => handleStartWorkflow(peer, actionType === 'upgrade')}
            disabled={!nextLevel}
          >
            {actionType === 'upgrade' ? 'Upgrade Trust' : 'Downgrade Trust'}
          </Button>
        </CardActions>
      </Card>
    );
  };

  const currentSteps = selectedPeer ? getWorkflowSteps(selectedPeer.trust_level, targetLevel) : [];

  return (
    <Box>
      {/* Trust Upgrade Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpOutlined />
          Trust Upgrades
        </Typography>
        
        {upgradablePeers.length > 0 ? (
          <Grid container spacing={2}>
            {upgradablePeers.map((peer) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={peer.id}>
                {renderPeerCard(peer, 'upgrade')}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No peers are available for trust level upgrades.
          </Alert>
        )}
      </Box>

      {/* Trust Downgrade Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingDownOutlined />
          Trust Downgrades
        </Typography>
        
        {downgradablePeers.length > 0 ? (
          <Grid container spacing={2}>
            {downgradablePeers.map((peer) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={peer.id}>
                {renderPeerCard(peer, 'downgrade')}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No peers are available for trust level downgrades.
          </Alert>
        )}
      </Box>

      {/* Workflow Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Trust Level Workflow
        </DialogTitle>
        
        <DialogContent>
          {selectedPeer && (
            <Box>
              {/* Peer Information */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PeerStatusIcon status={selectedPeer.status} size="small" withTooltip={false} />
                  <Typography variant="h6">{selectedPeer.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {selectedPeer.url}
                </Typography>
              </Box>

              {/* Target Level Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Target Trust Level</InputLabel>
                <Select
                  value={targetLevel}
                  label="Target Trust Level"
                  onChange={(e) => setTargetLevel(e.target.value as TrustLevel)}
                >
                  {getAvailableTargetLevels(selectedPeer, true).map((level) => (
                    <MenuItem key={level} value={level}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrustLevelBadge level={level} size="small" showLabel={false} />
                        {level}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Reason */}
              <TextField
                fullWidth
                label="Reason for Trust Level Change"
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                sx={{ mb: 3 }}
                placeholder="Provide a reason for this trust level change..."
              />

              {/* Workflow Steps */}
              {currentSteps.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Workflow Steps
                  </Typography>
                  
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {currentSteps.map((step, index) => (
                      <Step key={step.id}>
                        <StepLabel
                          optional={
                            !step.required && (
                              <Typography variant="caption">Optional</Typography>
                            )
                          }
                        >
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {step.description}
                          </Typography>
                          
                          <Box sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              onClick={() => handleCompleteStep(index)}
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              {step.required ? 'Complete Step' : 'Skip Step'}
                            </Button>
                            {step.required && (
                              <Button
                                size="small"
                                onClick={() => setActiveStep(index + 1)}
                              >
                                Skip for Now
                              </Button>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>

                  {activeStep === currentSteps.length && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      All required steps completed. You can now apply the trust level change.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCompleteWorkflow}
            variant="contained"
            disabled={processing || (currentSteps.length > 0 && activeStep < currentSteps.length)}
          >
            {processing ? 'Processing...' : 'Apply Trust Level'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrustWorkflow;