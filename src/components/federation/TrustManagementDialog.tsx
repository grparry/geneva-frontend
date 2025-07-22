import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Slider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  TextField,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
  VerifiedUser as VerifiedIcon,
  Block as BlockIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  TrendingUp as UpgradeIcon,
  TrendingDown as DowngradeIcon
} from '@mui/icons-material';
import { SubstratePeer, TrustLevel } from '../../types/federation';
import { useFederation } from '../../hooks/useFederation';
import { formatDistanceToNow } from 'date-fns';

interface TrustManagementDialogProps {
  open: boolean;
  onClose: () => void;
  peer: SubstratePeer;
  onTrustUpdated?: () => void;
}

const TRUST_LEVEL_INFO = {
  [TrustLevel.NONE]: {
    label: 'No Trust',
    description: 'Discovery only, no task delegation allowed',
    color: '#f44336',
    icon: <BlockIcon />,
    value: 0
  },
  [TrustLevel.BASIC]: {
    label: 'Basic Trust',
    description: 'Simple read-only queries allowed',
    color: '#ff9800',
    icon: <WarningIcon />,
    value: 25
  },
  [TrustLevel.VERIFIED]: {
    label: 'Verified',
    description: 'Standard task delegation with monitoring',
    color: '#ffc107',
    icon: <VerifiedIcon />,
    value: 50
  },
  [TrustLevel.TRUSTED]: {
    label: 'Trusted',
    description: 'Most operations allowed with audit trail',
    color: '#8bc34a',
    icon: <ShieldIcon />,
    value: 75
  },
  [TrustLevel.FULL]: {
    label: 'Full Trust',
    description: 'Unrestricted access and delegation',
    color: '#4caf50',
    icon: <SecurityIcon />,
    value: 100
  }
};

export const TrustManagementDialog: React.FC<TrustManagementDialogProps> = ({
  open,
  onClose,
  peer,
  onTrustUpdated
}) => {
  const { updateTrustLevel } = useFederation();
  const [newTrustLevel, setNewTrustLevel] = useState<TrustLevel>(peer.trust_level);
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const currentTrustInfo = TRUST_LEVEL_INFO[peer.trust_level];
  const newTrustInfo = TRUST_LEVEL_INFO[newTrustLevel];

  const handleSliderChange = (event: Event, value: number | number[]) => {
    const numValue = value as number;
    
    if (numValue === 0) setNewTrustLevel(TrustLevel.NONE);
    else if (numValue <= 25) setNewTrustLevel(TrustLevel.BASIC);
    else if (numValue <= 50) setNewTrustLevel(TrustLevel.VERIFIED);
    else if (numValue <= 75) setNewTrustLevel(TrustLevel.TRUSTED);
    else setNewTrustLevel(TrustLevel.FULL);
  };

  const handleUpdateTrust = async () => {
    if (newTrustLevel === peer.trust_level) {
      setError('Trust level unchanged');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the trust level change');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await updateTrustLevel('current_substrate_id', peer.id, newTrustLevel);
      
      // Log the change (would be sent to backend)
      console.log('Trust level updated', {
        peer: peer.id,
        from: peer.trust_level,
        to: newTrustLevel,
        reason,
        timestamp: new Date().toISOString()
      });

      onTrustUpdated?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trust level');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setNewTrustLevel(peer.trust_level);
    setReason('');
    setError(null);
    setShowHistory(false);
    onClose();
  };

  const isUpgrade = Object.values(TrustLevel).indexOf(newTrustLevel) > 
                   Object.values(TrustLevel).indexOf(peer.trust_level);

  // Mock trust history - would come from API
  const trustHistory = [
    {
      id: '1',
      from: TrustLevel.NONE,
      to: TrustLevel.BASIC,
      reason: 'Initial connection established',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'admin'
    },
    {
      id: '2',
      from: TrustLevel.BASIC,
      to: TrustLevel.VERIFIED,
      reason: 'Successful task delegations completed',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'admin'
    }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <SecurityIcon />
          <Typography variant="h6">Manage Trust Level</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Peer Info */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {peer.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {peer.substrate_id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connected: {formatDistanceToNow(new Date(peer.connected_at || peer.discovered_at), { addSuffix: true })}
          </Typography>
        </Paper>

        {/* Current Trust Level */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Current Trust Level
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Box color={currentTrustInfo.color}>
              {currentTrustInfo.icon}
            </Box>
            <Box flex={1}>
              <Typography variant="body1" fontWeight="bold">
                {currentTrustInfo.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentTrustInfo.description}
              </Typography>
            </Box>
            <Chip
              label={peer.trust_level.toUpperCase()}
              style={{ backgroundColor: currentTrustInfo.color, color: 'white' }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Trust Level Slider */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            New Trust Level
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={newTrustInfo.value}
              onChange={handleSliderChange}
              step={null}
              marks={Object.entries(TRUST_LEVEL_INFO).map(([level, info]) => ({
                value: info.value,
                label: info.label
              }))}
              sx={{
                '& .MuiSlider-mark': {
                  backgroundColor: '#bfbfbf',
                  height: 8,
                  width: 8,
                  '&.MuiSlider-markActive': {
                    opacity: 1,
                    backgroundColor: 'currentColor',
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* New Trust Level Info */}
        {newTrustLevel !== peer.trust_level && (
          <Alert 
            severity={isUpgrade ? "info" : "warning"}
            icon={isUpgrade ? <UpgradeIcon /> : <DowngradeIcon />}
            sx={{ mb: 3 }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box color={newTrustInfo.color}>
                {newTrustInfo.icon}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {isUpgrade ? 'Upgrading' : 'Downgrading'} to: {newTrustInfo.label}
                </Typography>
                <Typography variant="caption">
                  {newTrustInfo.description}
                </Typography>
              </Box>
            </Box>
          </Alert>
        )}

        {/* Reason Input */}
        <TextField
          fullWidth
          label="Reason for Change"
          multiline
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={!!error && error.includes('reason')}
          helperText="Provide a justification for this trust level change"
          sx={{ mb: 3 }}
        />

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Trust History Toggle */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Button
            startIcon={<HistoryIcon />}
            onClick={() => setShowHistory(!showHistory)}
            size="small"
          >
            {showHistory ? 'Hide' : 'Show'} Trust History
          </Button>
        </Box>

        {/* Trust History */}
        {showHistory && (
          <Box mt={2}>
            <List dense>
              {trustHistory.map((item) => (
                <ListItem key={item.id}>
                  <ListItemIcon>
                    {Object.values(TrustLevel).indexOf(item.to) > 
                     Object.values(TrustLevel).indexOf(item.from) ? (
                      <UpgradeIcon color="success" />
                    ) : (
                      <DowngradeIcon color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${item.from} → ${item.to}`}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {item.reason}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })} by {item.user}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleUpdateTrust}
          disabled={newTrustLevel === peer.trust_level || isUpdating || !reason.trim()}
          startIcon={isUpdating ? <CircularProgress size={20} /> : null}
        >
          {isUpdating ? 'Updating...' : 'Update Trust Level'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};