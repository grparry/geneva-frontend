/**
 * Alerts list component for analytics dashboard
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  AlertTitle,
  Divider,
} from '@mui/material';
import {
  WarningRounded,
  ErrorRounded,
  InfoRounded,
  CheckCircleRounded,
  CloseRounded,
} from '@mui/icons-material';

interface AlertItem {
  id: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface AlertsListProps {
  className?: string;
}

const AlertsList: React.FC<AlertsListProps> = ({ className }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      severity: 'error',
      title: 'High Response Time',
      message: 'Average response time exceeded 500ms threshold',
      timestamp: new Date(),
      acknowledged: false,
    },
    {
      id: '2',
      severity: 'warning',
      title: 'Memory Usage High',
      message: 'Memory usage is at 85% capacity',
      timestamp: new Date(Date.now() - 300000),
      acknowledged: false,
    },
    {
      id: '3',
      severity: 'info',
      title: 'Scheduled Maintenance',
      message: 'System maintenance window starts in 2 hours',
      timestamp: new Date(Date.now() - 600000),
      acknowledged: true,
    },
  ]);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorRounded color="error" />;
      case 'warning':
        return <WarningRounded color="warning" />;
      case 'info':
        return <InfoRounded color="info" />;
      case 'success':
        return <CheckCircleRounded color="success" />;
      default:
        return <InfoRounded />;
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Box className={className}>
      <Typography variant="h6" gutterBottom>
        Recent Alerts
      </Typography>
      <Paper variant="outlined">
        {alerts.length === 0 ? (
          <Box p={3} textAlign="center">
            <CheckCircleRounded color="success" fontSize="large" />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              No active alerts
            </Typography>
          </Box>
        ) : (
          <List>
            {alerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem>
                  <ListItemIcon>
                    {getAlertIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {alert.title}
                        </Typography>
                        {alert.acknowledged && (
                          <Chip 
                            label="Acknowledged" 
                            size="small" 
                            color="success" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatTimestamp(alert.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {!alert.acknowledged && (
                      <IconButton
                        size="small"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        title="Acknowledge"
                      >
                        <CheckCircleRounded />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDismissAlert(alert.id)}
                      title="Dismiss"
                    >
                      <CloseRounded />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < alerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default AlertsList;