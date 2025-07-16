/**
 * Peer Status Icon Component
 * 
 * Visual indicator for peer connection status with real-time updates.
 */

import React from 'react';
import { 
  Tooltip, 
  Box, 
  CircularProgress,
  keyframes,
} from '@mui/material';
import { 
  CheckCircleOutlined,
  RadioButtonUncheckedOutlined,
  HandshakeOutlined,
  WifiOutlined,
  WarningAmberOutlined,
  CancelOutlined,
  NoEncryptionOutlined,
  ErrorOutlined,
} from '@mui/icons-material';
import { PeerStatus } from '../../../types/federation';

interface PeerStatusIconProps {
  status: PeerStatus;
  size?: 'small' | 'medium' | 'large';
  showPulse?: boolean;
  withTooltip?: boolean;
  lastHeartbeat?: string;
}

// Pulse animation for active states
const pulseKeyframes = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

export const PeerStatusIcon: React.FC<PeerStatusIconProps> = ({
  status,
  size = 'medium',
  showPulse = false,
  withTooltip = true,
  lastHeartbeat,
}) => {
  const getStatusConfig = (peerStatus: PeerStatus) => {
    const baseConfig = {
      icon: <RadioButtonUncheckedOutlined />,
      color: '#9e9e9e',
      label: 'Unknown',
      description: 'Unknown peer status',
      shouldPulse: false,
    };

    switch (peerStatus) {
      case PeerStatus.DISCOVERED:
        return {
          ...baseConfig,
          icon: <RadioButtonUncheckedOutlined />,
          color: '#2196f3',
          label: 'Discovered',
          description: 'Peer discovered but not yet connected',
        };
      
      case PeerStatus.HANDSHAKING:
        return {
          ...baseConfig,
          icon: <HandshakeOutlined />,
          color: '#ff9800',
          label: 'Handshaking',
          description: 'Establishing connection with peer',
          shouldPulse: true,
        };
      
      case PeerStatus.CONNECTED:
        return {
          ...baseConfig,
          icon: <WifiOutlined />,
          color: '#4caf50',
          label: 'Connected',
          description: 'Connected to peer',
          shouldPulse: showPulse,
        };
      
      case PeerStatus.HEALTHY:
        return {
          ...baseConfig,
          icon: <CheckCircleOutlined />,
          color: '#4caf50',
          label: 'Healthy',
          description: 'Peer is healthy and responsive',
          shouldPulse: showPulse,
        };
      
      case PeerStatus.DEGRADED:
        return {
          ...baseConfig,
          icon: <WarningAmberOutlined />,
          color: '#ff9800',
          label: 'Degraded',
          description: 'Peer is responding but performance is degraded',
        };
      
      case PeerStatus.OFFLINE:
        return {
          ...baseConfig,
          icon: <CancelOutlined />,
          color: '#f44336',
          label: 'Offline',
          description: 'Peer is offline or unreachable',
        };
      
      case PeerStatus.UNTRUSTED:
        return {
          ...baseConfig,
          icon: <NoEncryptionOutlined />,
          color: '#f44336',
          label: 'Untrusted',
          description: 'Peer trust has been revoked',
        };
      
      case PeerStatus.ERROR:
        return {
          ...baseConfig,
          icon: <ErrorOutlined />,
          color: '#f44336',
          label: 'Error',
          description: 'Peer connection error',
        };
      
      default:
        return baseConfig;
    }
  };

  const getSizeValue = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 24;
      case 'large': return 32;
      default: return 24;
    }
  };

  const config = getStatusConfig(status);
  const sizeValue = getSizeValue();
  
  // Format last heartbeat for tooltip
  const formatLastHeartbeat = (timestamp?: string) => {
    if (!timestamp) return '';
    
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

  const getTooltipContent = () => {
    let content = config.description;
    if (lastHeartbeat && status !== PeerStatus.OFFLINE) {
      content += `\nLast heartbeat: ${formatLastHeartbeat(lastHeartbeat)}`;
    }
    return content;
  };

  // Special handling for handshaking - show spinner
  if (status === PeerStatus.HANDSHAKING) {
    const element = (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress 
          size={sizeValue} 
          sx={{ color: config.color }}
          thickness={4}
        />
      </Box>
    );

    if (withTooltip) {
      return (
        <Tooltip title={getTooltipContent()} arrow>
          {element}
        </Tooltip>
      );
    }
    return element;
  }

  const iconElement = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        color: config.color,
        ...(config.shouldPulse && {
          animation: `${pulseKeyframes} 2s ease-in-out infinite`,
        }),
      }}
    >
      {React.cloneElement(config.icon, { 
        sx: { fontSize: sizeValue } 
      })}
    </Box>
  );

  if (withTooltip) {
    return (
      <Tooltip title={getTooltipContent()} arrow>
        {iconElement}
      </Tooltip>
    );
  }

  return iconElement;
};

export default PeerStatusIcon;