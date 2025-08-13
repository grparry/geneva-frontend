/**
 * Governance Notifications Component
 * 
 * Handles display and management of governance-related notifications.
 * Integrates with existing MUI Snackbar patterns and notification systems.
 */

import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  Slide,
  SlideProps,
  Stack,
  IconButton,
  Typography,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowForward as ArrowIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { GovernanceNotification } from '../../types/governance';

interface GovernanceNotificationsProps {
  notifications: GovernanceNotification[];
  onNotificationRemove: (id: string) => void;
  onNotificationAction?: (notification: GovernanceNotification, actionIndex: number) => void;
  maxVisible?: number;
  autoHideDuration?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

const SEVERITY_ICONS = {
  info: InfoIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  success: SuccessIcon
};

export const GovernanceNotifications: React.FC<GovernanceNotificationsProps> = ({
  notifications,
  onNotificationRemove,
  onNotificationAction,
  maxVisible = 3,
  autoHideDuration = 6000,
  position = { vertical: 'top', horizontal: 'center' }
}) => {
  const [activeNotifications, setActiveNotifications] = useState<GovernanceNotification[]>([]);

  // Manage which notifications are currently visible
  useEffect(() => {
    const visibleNotifications = notifications.slice(-maxVisible);
    setActiveNotifications(visibleNotifications);
  }, [notifications, maxVisible]);

  const handleClose = (notificationId: string) => {
    onNotificationRemove(notificationId);
  };

  const handleAction = (notification: GovernanceNotification, actionIndex: number) => {
    if (onNotificationAction) {
      onNotificationAction(notification, actionIndex);
    }
    // Auto-close after action
    setTimeout(() => handleClose(notification.id), 300);
  };

  const getNotificationContent = (notification: GovernanceNotification) => {
    const IconComponent = SEVERITY_ICONS[notification.severity];
    
    return (
      <Alert
        severity={notification.severity}
        icon={<IconComponent />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {notification.actions?.map((action, index) => (
              <Button
                key={index}
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => handleAction(notification, index)}
                sx={{ minWidth: 'auto' }}
              >
                {action.label}
              </Button>
            ))}
            <IconButton
              size="small"
              color="inherit"
              onClick={() => handleClose(notification.id)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{
          mb: 1,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <AlertTitle sx={{ mb: 0.5 }}>
          {notification.title}
          {notification.room_id && (
            <Chip
              label={`Room: ${notification.room_id.slice(-8)}`}
              size="small"
              variant="outlined"
              sx={{ ml: 1, fontSize: '0.7rem' }}
            />
          )}
        </AlertTitle>
        <Typography variant="body2">
          {notification.message}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {new Date(notification.timestamp).toLocaleTimeString()}
        </Typography>
      </Alert>
    );
  };

  if (activeNotifications.length === 0) {
    return null;
  }

  // For multiple notifications, stack them
  if (activeNotifications.length > 1) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: position.vertical === 'top' ? 24 : 'auto',
          bottom: position.vertical === 'bottom' ? 24 : 'auto',
          left: position.horizontal === 'left' ? 24 : position.horizontal === 'center' ? '50%' : 'auto',
          right: position.horizontal === 'right' ? 24 : 'auto',
          transform: position.horizontal === 'center' ? 'translateX(-50%)' : 'none',
          zIndex: 1400,
          minWidth: 400,
          maxWidth: 600
        }}
      >
        <Stack spacing={1}>
          {activeNotifications.map((notification) => (
            <Box key={notification.id}>
              {getNotificationContent(notification)}
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }

  // Single notification using Snackbar
  const notification = activeNotifications[0];
  
  return (
    <Snackbar
      open={true}
      autoHideDuration={autoHideDuration}
      onClose={() => handleClose(notification.id)}
      anchorOrigin={position}
      TransitionComponent={SlideTransition}
      sx={{ maxWidth: 600 }}
    >
      <div>
        {getNotificationContent(notification)}
      </div>
    </Snackbar>
  );
};

/**
 * Governance notification badge for displaying unread count
 */
export const GovernanceNotificationBadge: React.FC<{
  count: number;
  severity?: 'info' | 'warning' | 'error' | 'success';
  onClick?: () => void;
}> = ({ count, severity = 'info', onClick }) => {
  if (count === 0) return null;

  const getSeverityColor = () => {
    switch (severity) {
      case 'warning': return 'warning.main';
      case 'error': return 'error.main';
      case 'success': return 'success.main';
      default: return 'info.main';
    }
  };

  return (
    <Chip
      label={count}
      size="small"
      onClick={onClick}
      clickable={!!onClick}
      sx={{
        backgroundColor: getSeverityColor(),
        color: 'white',
        fontWeight: 'bold',
        minWidth: 24,
        height: 20,
        '& .MuiChip-label': {
          px: 0.5
        }
      }}
    />
  );
};

/**
 * Governance notification summary for dashboard views
 */
export const GovernanceNotificationSummary: React.FC<{
  notifications: GovernanceNotification[];
  onClearAll?: () => void;
  onNotificationClick?: (notification: GovernanceNotification) => void;
  maxDisplay?: number;
}> = ({ 
  notifications, 
  onClearAll, 
  onNotificationClick,
  maxDisplay = 5 
}) => {
  const recentNotifications = notifications.slice(-maxDisplay).reverse();
  
  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          No governance notifications
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 1 }}>
        <Typography variant="h6">
          Governance Notifications
        </Typography>
        {onClearAll && notifications.length > 0 && (
          <Button size="small" onClick={onClearAll}>
            Clear All
          </Button>
        )}
      </Box>
      
      <Stack spacing={1} sx={{ p: 2, pt: 0 }}>
        {recentNotifications.map((notification) => (
          <Box
            key={notification.id}
            onClick={() => onNotificationClick?.(notification)}
            sx={{
              p: 1.5,
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 1,
              cursor: onNotificationClick ? 'pointer' : 'default',
              '&:hover': onNotificationClick ? {
                backgroundColor: 'grey.50'
              } : {}
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: `${notification.severity}.main`,
                mt: 0.5,
                flexShrink: 0
              }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight="medium" noWrap>
                  {notification.title}
                  {notification.room_id && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({notification.room_id.slice(-8)})
                    </Typography>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(notification.timestamp).toLocaleString()}
                </Typography>
              </Box>
              {onNotificationClick && (
                <ArrowIcon sx={{ color: 'text.secondary', fontSize: '16px' }} />
              )}
            </Box>
          </Box>
        ))}
        
        {notifications.length > maxDisplay && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            ... and {notifications.length - maxDisplay} more
          </Typography>
        )}
      </Stack>
    </Box>
  );
};