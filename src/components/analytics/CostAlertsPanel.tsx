/**
 * Real-time cost alerts panel component
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Alert,
  Stack,
  Divider,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  NotificationsRounded,
  NotificationsActiveRounded,
  WarningAmberRounded,
  ErrorRounded,
  InfoRounded,
  CheckCircleRounded,
  ExpandMoreRounded,
  ExpandLessRounded,
  CloseRounded,
  AttachMoneyRounded,
  TrendingUpRounded,
  AccessTimeRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useCostAlerts } from '../../hooks/useAnalyticsWebSocket';
import { useAcknowledgeAlertMutation } from '../../api/analytics';
import { formatCurrency } from '../../utils/analyticsTransformers';
import type { CostAlertMessage } from '../../types/analytics';

// Alert severity configuration
const severityConfig = {
  low: {
    icon: InfoRounded,
    color: 'info' as const,
    bgcolor: '#e3f2fd',
  },
  medium: {
    icon: WarningAmberRounded,
    color: 'warning' as const,
    bgcolor: '#fff3e0',
  },
  high: {
    icon: ErrorRounded,
    color: 'error' as const,
    bgcolor: '#ffebee',
  },
  critical: {
    icon: ErrorRounded,
    color: 'error' as const,
    bgcolor: '#ffcdd2',
  },
};

// Alert item component
const AlertItem: React.FC<{
  alert: CostAlertMessage;
  onAcknowledge: (alertId: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}> = ({ alert, onAcknowledge, expanded, onToggleExpand }) => {
  const theme = useTheme();
  const config = severityConfig[alert.severity as keyof typeof severityConfig];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      layout
    >
      <Card
        sx={{
          mb: 2,
          bgcolor: alpha(config.bgcolor, 0.3),
          borderLeft: 4,
          borderColor: `${config.color}.main`,
        }}
      >
        <ListItem
          component="div"
          onClick={onToggleExpand}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha(config.bgcolor, 0.5),
            },
          }}
        >
          <ListItemIcon>
            <Icon color={config.color} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2">
                  {alert.message}
                </Typography>
                <Chip
                  label={alert.severity.toUpperCase()}
                  size="small"
                  color={config.color}
                  sx={{ height: 20 }}
                />
              </Box>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
              </Typography>
            }
          />
          <ListItemSecondaryAction>
            <IconButton edge="end" size="small" onClick={onToggleExpand}>
              {expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        
        <Collapse in={expanded}>
          <Divider />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Alert Details
                </Typography>
                <Typography variant="body2">
                  Type: {alert.alert_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Current Value
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color={config.color}>
                    {formatCurrency(alert.current_value)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Threshold
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(alert.threshold_value)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Exceeded By
                  </Typography>
                  <Typography variant="body1" color={config.color}>
                    {((alert.current_value - alert.threshold_value) / alert.threshold_value * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color={config.color}
                  startIcon={<CheckCircleRounded />}
                  onClick={() => onAcknowledge(alert.alert_id)}
                >
                  Acknowledge
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Collapse>
      </Card>
    </motion.div>
  );
};

// Main cost alerts panel
export const CostAlertsPanel: React.FC<{
  maxHeight?: number;
  showBadge?: boolean;
  autoExpand?: boolean;
}> = ({ maxHeight = 400, showBadge = true, autoExpand = false }) => {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const { alerts, unreadCount, markAllAsRead, clearAlerts, connectionStatus } = useCostAlerts(
    ['high', 'critical'],
    true,
    (alert) => {
      // Auto-expand new critical alerts
      if (autoExpand && alert.severity === 'critical') {
        setExpandedAlerts(prev => new Set(prev).add(alert.alert_id));
      }
    }
  );
  
  const [acknowledgeAlert] = useAcknowledgeAlertMutation();

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert({ alert_id: alertId }).unwrap();
      // Remove from local alerts
      clearAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const toggleExpand = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              Cost Alerts
            </Typography>
            {showBadge && unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsActiveRounded color="action" />
              </Badge>
            )}
          </Box>
          
          {alerts.length > 0 && (
            <Button
              size="small"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {!connectionStatus.isConnected ? (
          <Alert severity="warning" icon={<NotificationsRounded />}>
            Not connected to real-time alerts
          </Alert>
        ) : alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <NotificationsRounded sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No active cost alerts
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ maxHeight, overflowY: 'auto', pr: 1 }}>
              <AnimatePresence>
                {displayedAlerts.map(alert => (
                  <AlertItem
                    key={alert.alert_id}
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                    expanded={expandedAlerts.has(alert.alert_id)}
                    onToggleExpand={() => toggleExpand(alert.alert_id)}
                  />
                ))}
              </AnimatePresence>
            </Box>
            
            {alerts.length > 5 && !showAll && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button size="small" onClick={() => setShowAll(true)}>
                  Show {alerts.length - 5} more alerts
                </Button>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Floating alert notification
export const CostAlertNotification: React.FC = () => {
  const [recentAlert, setRecentAlert] = useState<CostAlertMessage | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  
  useCostAlerts(['critical'], true, (alert) => {
    setRecentAlert(alert);
    setShowNotification(true);
  });

  if (!recentAlert || !showNotification) return null;

  const config = severityConfig[recentAlert.severity as keyof typeof severityConfig];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, y: -100, x: '-50%' }}
        style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          zIndex: 2000,
          maxWidth: 400,
          width: '90%',
        }}
      >
        <Alert
          severity={config.color}
          icon={<Icon />}
          action={
            <IconButton
              size="small"
              onClick={() => setShowNotification(false)}
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          }
          sx={{
            boxShadow: 3,
            '& .MuiAlert-icon': {
              fontSize: 28,
            },
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Cost Alert: {recentAlert.message}
          </Typography>
          <Typography variant="body2">
            Current: {formatCurrency(recentAlert.current_value)} | 
            Threshold: {formatCurrency(recentAlert.threshold_value)}
          </Typography>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

// Alert summary widget
export const AlertSummaryWidget: React.FC = () => {
  const { alerts, unreadCount } = useCostAlerts();
  
  const alertCounts = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AttachMoneyRounded color="action" />
          <Typography variant="subtitle2">
            Cost Alert Summary
          </Typography>
        </Box>
        
        <Stack spacing={1}>
          {Object.entries(alertCounts).map(([severity, count]) => {
            const config = severityConfig[severity as keyof typeof severityConfig];
            const Icon = config.icon;
            
            return (
              <Box
                key={severity}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon sx={{ fontSize: 16, color: `${config.color}.main` }} />
                  <Typography variant="body2">
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Typography>
                </Box>
                <Chip
                  label={count}
                  size="small"
                  color={config.color}
                  sx={{ height: 20, minWidth: 32 }}
                />
              </Box>
            );
          })}
          
          {alerts.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center">
              No active alerts
            </Typography>
          )}
        </Stack>
        
        {unreadCount > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default {
  CostAlertsPanel,
  CostAlertNotification,
  AlertSummaryWidget,
};