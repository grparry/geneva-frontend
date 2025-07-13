import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Divider
} from '@mui/material';
import { 
  CheckCircle as ConnectedIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CloudOff as DisconnectedIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { SubstratePeer, PeerStatus, TrustLevel } from '../../types/federation';

interface PeerSubstrateCardProps {
  peer: SubstratePeer;
  selected?: boolean;
  onClick?: () => void;
  onActionClick?: (action: string) => void;
}

export const PeerSubstrateCard: React.FC<PeerSubstrateCardProps> = ({
  peer,
  selected = false,
  onClick,
  onActionClick
}) => {
  const getStatusIcon = (status: PeerStatus) => {
    switch (status) {
      case PeerStatus.CONNECTED:
        return <ConnectedIcon color="success" />;
      case PeerStatus.ERROR:
        return <ErrorIcon color="error" />;
      case PeerStatus.DISCONNECTED:
        return <DisconnectedIcon color="disabled" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = (status: PeerStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case PeerStatus.CONNECTED:
        return 'success';
      case PeerStatus.ERROR:
        return 'error';
      case PeerStatus.DISCONNECTED:
        return 'default';
      default:
        return 'warning';
    }
  };

  const getTrustLevelColor = (level: TrustLevel): string => {
    switch (level) {
      case TrustLevel.FULL:
        return '#4caf50';
      case TrustLevel.TRUSTED:
        return '#8bc34a';
      case TrustLevel.VERIFIED:
        return '#ffc107';
      case TrustLevel.BASIC:
        return '#ff9800';
      default:
        return '#f44336';
    }
  };

  const getTrustLevelValue = (level: TrustLevel): number => {
    switch (level) {
      case TrustLevel.FULL:
        return 100;
      case TrustLevel.TRUSTED:
        return 80;
      case TrustLevel.VERIFIED:
        return 60;
      case TrustLevel.BASIC:
        return 40;
      default:
        return 20;
    }
  };

  const formatRelativeTime = (timestamp?: string): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card
      elevation={selected ? 4 : 1}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        border: selected ? '2px solid' : '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        '&:hover': onClick ? {
          elevation: 3,
          borderColor: 'primary.light'
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(peer.status)}
            <Typography variant="h6" component="div">
              {peer.name}
            </Typography>
          </Box>
          <Chip
            label={peer.status}
            color={getStatusColor(peer.status)}
            size="small"
          />
        </Box>

        {/* Substrate ID */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          ID: {peer.substrate_id}
        </Typography>

        {/* Trust Level */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <SecurityIcon fontSize="small" color="action" />
              <Typography variant="subtitle2">Trust Level</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {peer.trust_level.toUpperCase()}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getTrustLevelValue(peer.trust_level)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getTrustLevelColor(peer.trust_level),
                borderRadius: 4
              }
            }}
          />
        </Box>

        {/* Capabilities */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Capabilities
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {peer.capabilities.length > 0 ? (
              peer.capabilities.map(cap => (
                <Chip
                  key={cap}
                  label={cap}
                  size="small"
                  variant="outlined"
                />
              ))
            ) : (
              <Typography variant="caption" color="text.secondary">
                No capabilities reported
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Footer Info */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={0.5}>
            <SpeedIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Last heartbeat
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatRelativeTime(peer.last_heartbeat)}
          </Typography>
        </Box>
      </CardContent>

      {onActionClick && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          <Button 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onActionClick('delegate');
            }}
          >
            Delegate Task
          </Button>
          <Button 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onActionClick('trust');
            }}
          >
            Manage Trust
          </Button>
          <Tooltip title="More actions">
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick('more');
              }}
            >
              <MoreIcon />
            </IconButton>
          </Tooltip>
        </CardActions>
      )}
    </Card>
  );
};