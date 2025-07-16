/**
 * Peer Card Component
 * 
 * Individual peer card showing status, capabilities, and actions.
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  LinearProgress,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  MoreVertOutlined,
  RefreshOutlined,
  VisibilityOutlined,
  SecurityOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  WarningAmberOutlined,
  ErrorOutlined,
} from '@mui/icons-material';

// Federation types and components
import { SubstratePeer, PeerStatus, TrustLevel } from '../../../types/federation';
import { PeerStatusIcon, TrustLevelBadge } from '../shared';

interface PeerCardProps {
  peer: SubstratePeer;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  variant?: 'card' | 'list';
}

const PeerCard: React.FC<PeerCardProps> = ({
  peer,
  onRefresh,
  isRefreshing = false,
  variant = 'card',
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    setShowDetails(!showDetails);
    handleMenuClose();
  };

  const handleManageTrust = () => {
    // TODO: Open trust management dialog
    console.log('Manage trust for peer:', peer.id);
    handleMenuClose();
  };

  const handleTestConnection = () => {
    // TODO: Test connection to peer
    console.log('Test connection to peer:', peer.id);
    handleMenuClose();
  };

  const formatLastHeartbeat = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    
    const heartbeatTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - heartbeatTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getHealthIndicator = () => {
    if (peer.error_count === 0) {
      return <CheckCircleOutlined color="success" fontSize="small" />;
    }
    if (peer.error_count < 5) {
      return <WarningAmberOutlined color="warning" fontSize="small" />;
    }
    return <ErrorOutlined color="error" fontSize="small" />;
  };

  const getCapabilityChips = () => {
    const capabilities = peer.capabilities || {};
    const capabilityKeys = Object.keys(capabilities).slice(0, 3); // Show first 3
    
    return capabilityKeys.map((key) => (
      <Chip
        key={key}
        label={key}
        size="small"
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />
    ));
  };

  // List variant (horizontal layout)
  if (variant === 'list') {
    return (
      <Card variant="outlined">
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Status Icon */}
            <PeerStatusIcon 
              status={peer.status} 
              size="medium" 
              showPulse={peer.status === PeerStatus.HEALTHY}
              lastHeartbeat={peer.last_heartbeat}
            />

            {/* Peer Info */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" noWrap>
                  {peer.name}
                </Typography>
                <TrustLevelBadge level={peer.trust_level} size="small" />
                {getHealthIndicator()}
              </Box>
              
              <Typography variant="body2" color="text.secondary" noWrap>
                {peer.url}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {getCapabilityChips()}
                {Object.keys(peer.capabilities || {}).length > 3 && (
                  <Chip
                    label={`+${Object.keys(peer.capabilities || {}).length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            </Box>

            {/* Metrics */}
            <Box sx={{ textAlign: 'right', minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                MCP {peer.mcp_version}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Last seen: {formatLastHeartbeat(peer.last_heartbeat)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Errors: {peer.error_count}
              </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Refresh peer">
                <IconButton
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  size="small"
                >
                  {isRefreshing ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RefreshOutlined />
                  )}
                </IconButton>
              </Tooltip>
              
              <IconButton
                onClick={handleMenuOpen}
                size="small"
              >
                <MoreVertOutlined />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Card variant (vertical layout)
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Loading indicator */}
      {isRefreshing && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1 
          }} 
        />
      )}

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, minWidth: 0 }}>
            <PeerStatusIcon 
              status={peer.status} 
              size="medium" 
              showPulse={peer.status === PeerStatus.HEALTHY}
              lastHeartbeat={peer.last_heartbeat}
            />
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {peer.name}
            </Typography>
          </Box>
          
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <MoreVertOutlined />
          </IconButton>
        </Box>

        {/* Trust Level */}
        <Box sx={{ mb: 2 }}>
          <TrustLevelBadge level={peer.trust_level} size="medium" />
        </Box>

        {/* URL */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 2, wordBreak: 'break-all' }}
        >
          <LinkOutlined fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
          {peer.url}
        </Typography>

        {/* Capabilities */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Capabilities ({Object.keys(peer.capabilities || {}).length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {getCapabilityChips()}
            {Object.keys(peer.capabilities || {}).length > 3 && (
              <Chip
                label={`+${Object.keys(peer.capabilities || {}).length - 3}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>

        {/* Expanded Details */}
        {showDetails && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.secondary" display="block">
              Substrate ID: {peer.substrate_id}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Discovered: {new Date(peer.discovered_at).toLocaleDateString()}
            </Typography>
            {peer.connected_at && (
              <Typography variant="caption" color="text.secondary" display="block">
                Connected: {new Date(peer.connected_at).toLocaleDateString()}
              </Typography>
            )}
            {peer.last_error && (
              <Typography variant="caption" color="error.main" display="block">
                Last Error: {peer.last_error}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      {/* Footer */}
      <CardContent sx={{ pt: 0, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getHealthIndicator()}
            <Typography variant="caption" color="text.secondary">
              {peer.error_count} errors
            </Typography>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            MCP {peer.mcp_version}
          </Typography>
        </Box>
        
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Last heartbeat: {formatLastHeartbeat(peer.last_heartbeat)}
        </Typography>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
        <Button
          size="small"
          startIcon={<VisibilityOutlined />}
          onClick={handleViewDetails}
        >
          {showDetails ? 'Less' : 'Details'}
        </Button>
        
        <Box>
          <Tooltip title="Refresh peer">
            <IconButton
              onClick={onRefresh}
              disabled={isRefreshing}
              size="small"
            >
              {isRefreshing ? (
                <CircularProgress size={20} />
              ) : (
                <RefreshOutlined />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <VisibilityOutlined sx={{ mr: 1 }} />
          {showDetails ? 'Hide Details' : 'View Details'}
        </MenuItem>
        <MenuItem onClick={handleManageTrust}>
          <SecurityOutlined sx={{ mr: 1 }} />
          Manage Trust
        </MenuItem>
        <MenuItem onClick={handleTestConnection}>
          <LinkOutlined sx={{ mr: 1 }} />
          Test Connection
        </MenuItem>
        <Divider />
        <MenuItem onClick={onRefresh} disabled={isRefreshing}>
          <RefreshOutlined sx={{ mr: 1 }} />
          Refresh Status
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default PeerCard;