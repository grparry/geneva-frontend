/**
 * WebSocket connection manager component
 * Provides visual feedback and control over WebSocket connections
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Collapse,
  Paper,
  Button,
} from '@mui/material';
import {
  WifiRounded,
  WifiOffRounded,
  RefreshRounded,
  CheckCircleRounded,
  ErrorRounded,
  InfoRounded,
} from '@mui/icons-material';
import { useAnalyticsWebSocket } from '../../hooks/useAnalyticsWebSocket';
import { WebSocketState } from '../../services/analyticsWebSocket';

interface ConnectionManagerProps {
  showDetails?: boolean;
  position?: 'top' | 'bottom';
  autoHide?: boolean;
  onConnectionChange?: (isConnected: boolean) => void;
}

export const WebSocketConnectionManager: React.FC<ConnectionManagerProps> = ({
  showDetails = false,
  position = 'bottom',
  autoHide = true,
  onConnectionChange,
}) => {
  const { connectionStatus, connect, disconnect } = useAnalyticsWebSocket({
    autoConnect: true,
    onConnect: () => onConnectionChange?.(true),
    onDisconnect: () => onConnectionChange?.(false),
  });

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<'success' | 'error' | 'info'>('info');
  const [expanded, setExpanded] = useState(false);

  // Handle connection state changes
  useEffect(() => {
    switch (connectionStatus.state) {
      case WebSocketState.CONNECTED:
        setNotificationMessage('Connected to real-time analytics');
        setNotificationSeverity('success');
        setShowNotification(true);
        break;
      case WebSocketState.DISCONNECTED:
        if (connectionStatus.error) {
          setNotificationMessage('Connection lost. Retrying...');
          setNotificationSeverity('error');
          setShowNotification(true);
        }
        break;
      case WebSocketState.RECONNECTING:
        setNotificationMessage(`Reconnecting... (Attempt ${connectionStatus.reconnectAttempt})`);
        setNotificationSeverity('info');
        setShowNotification(true);
        break;
      case WebSocketState.ERROR:
        setNotificationMessage('Failed to connect to real-time analytics');
        setNotificationSeverity('error');
        setShowNotification(true);
        break;
    }
  }, [connectionStatus.state, connectionStatus.reconnectAttempt, connectionStatus.error]);

  // Connection status chip
  const renderConnectionChip = () => {
    const { state, isConnected } = connectionStatus;

    let icon: React.ReactNode;
    let label: string;
    let color: 'success' | 'error' | 'warning' | 'default' = 'default';

    switch (state) {
      case WebSocketState.CONNECTED:
        icon = <CheckCircleRounded sx={{ fontSize: 16 }} />;
        label = 'Connected';
        color = 'success';
        break;
      case WebSocketState.CONNECTING:
        icon = <CircularProgress size={16} sx={{ color: 'inherit' }} />;
        label = 'Connecting...';
        color = 'default';
        break;
      case WebSocketState.RECONNECTING:
        icon = <CircularProgress size={16} sx={{ color: 'inherit' }} />;
        label = `Reconnecting (${connectionStatus.reconnectAttempt})`;
        color = 'warning';
        break;
      case WebSocketState.DISCONNECTED:
        icon = <WifiOffRounded sx={{ fontSize: 16 }} />;
        label = 'Disconnected';
        color = 'error';
        break;
      case WebSocketState.ERROR:
        icon = <ErrorRounded sx={{ fontSize: 16 }} />;
        label = 'Error';
        color = 'error';
        break;
      default:
        icon = <InfoRounded sx={{ fontSize: 16 }} />;
        label = 'Unknown';
        color = 'default';
    }

    return (
      <Chip
        icon={icon}
        label={label}
        color={color}
        size="small"
        onClick={() => setExpanded(!expanded)}
        sx={{ cursor: 'pointer' }}
      />
    );
  };

  // Hide notification in connected state if autoHide is enabled
  const shouldHideChip = autoHide && connectionStatus.isConnected && !expanded;

  return (
    <>
      {/* Connection Status Indicator */}
      {!shouldHideChip && (
        <Box
          sx={{
            position: 'fixed',
            [position]: 16,
            right: 16,
            zIndex: 1300,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderRadius: 2,
            }}
          >
            {renderConnectionChip()}
            
            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {connectionStatus.isConnected ? (
                <Tooltip title="Disconnect">
                  <IconButton size="small" onClick={disconnect}>
                    <WifiOffRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Connect">
                  <IconButton size="small" onClick={connect}>
                    <WifiRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {connectionStatus.state === WebSocketState.ERROR && (
                <Tooltip title="Retry">
                  <IconButton size="small" onClick={connect}>
                    <RefreshRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Paper>

          {/* Expanded details */}
          {showDetails && (
            <Collapse in={expanded}>
              <Paper
                elevation={3}
                sx={{
                  mt: 1,
                  p: 2,
                  maxWidth: 300,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Connection Details
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status: {connectionStatus.state}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connected: {connectionStatus.isConnected ? 'Yes' : 'No'}
                  </Typography>
                  {connectionStatus.reconnectAttempt > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Reconnect Attempts: {connectionStatus.reconnectAttempt}
                    </Typography>
                  )}
                  {connectionStatus.error && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      Error: {connectionStatus.error.message}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  {connectionStatus.isConnected ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={disconnect}
                      fullWidth
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={connect}
                      fullWidth
                    >
                      Connect
                    </Button>
                  )}
                </Box>
              </Paper>
            </Collapse>
          )}
        </Box>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: position === 'top' ? 'bottom' : 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowNotification(false)}
          severity={notificationSeverity}
          sx={{ width: '100%' }}
          icon={
            notificationSeverity === 'info' && connectionStatus.state === WebSocketState.RECONNECTING ? (
              <CircularProgress size={20} />
            ) : undefined
          }
        >
          {notificationMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

// Minimal connection indicator
export const ConnectionIndicator: React.FC<{
  size?: 'small' | 'medium';
  showLabel?: boolean;
}> = ({ size = 'small', showLabel = true }) => {
  const { connectionStatus } = useAnalyticsWebSocket();
  
  const iconSize = size === 'small' ? 16 : 20;
  const dotSize = size === 'small' ? 8 : 10;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          bgcolor: connectionStatus.isConnected ? 'success.main' : 'error.main',
          animation: connectionStatus.state === WebSocketState.RECONNECTING 
            ? 'pulse 1.5s ease-in-out infinite' 
            : 'none',
          '@keyframes pulse': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.3 },
            '100%': { opacity: 1 },
          },
        }}
      />
      {showLabel && (
        <Typography variant="caption" color="text.secondary">
          {connectionStatus.isConnected ? 'Live' : 'Offline'}
        </Typography>
      )}
    </Box>
  );
};

// Connection status hook for other components
export const useConnectionStatus = () => {
  const { connectionStatus } = useAnalyticsWebSocket();
  return {
    isConnected: connectionStatus.isConnected,
    isReconnecting: connectionStatus.state === WebSocketState.RECONNECTING,
    hasError: connectionStatus.state === WebSocketState.ERROR,
    state: connectionStatus.state,
  };
};

export default WebSocketConnectionManager;