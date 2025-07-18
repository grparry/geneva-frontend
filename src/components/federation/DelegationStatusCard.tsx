import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Tooltip,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as ExecutingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { Delegation, DelegationStatus } from '../../types/federation';
import { useFederationWebSocket } from '../../hooks/useFederationWebSocket';
import { formatDistanceToNow } from 'date-fns';

interface DelegationStatusCardProps {
  delegation: Delegation;
  onRefresh?: () => void;
  onCancel?: (delegationId: string) => void;
  expanded?: boolean;
}

export const DelegationStatusCard: React.FC<DelegationStatusCardProps> = ({
  delegation,
  onRefresh,
  onCancel,
  expanded: initialExpanded = false
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [liveStatus, setLiveStatus] = useState(delegation.status);
  const [progress, setProgress] = useState(0);
  const [statusHistory, setStatusHistory] = useState<Array<{
    status: DelegationStatus;
    timestamp: string;
    message?: string;
  }>>([]);

  // Subscribe to delegation events
  const { isConnected } = useFederationWebSocket({
    subscriptions: ['delegations'],
    onDelegationUpdate: (updatedDelegation) => {
      if (updatedDelegation.id === delegation.id) {
        setLiveStatus(updatedDelegation.status);
        setStatusHistory(prev => [...prev, {
          status: updatedDelegation.status,
          timestamp: new Date().toISOString(),
          message: `Status changed to ${updatedDelegation.status}`
        }]);
      }
    }
  });

  const getStatusIcon = (status: DelegationStatus) => {
    switch (status) {
      case DelegationStatus.COMPLETED:
        return <SuccessIcon color="success" />;
      case DelegationStatus.FAILED:
        return <ErrorIcon color="error" />;
      case DelegationStatus.PENDING:
        return <PendingIcon color="warning" />;
      case DelegationStatus.EXECUTING:
        return <ExecutingIcon color="primary" />;
      case DelegationStatus.REJECTED:
        return <CancelIcon color="disabled" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: DelegationStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case DelegationStatus.COMPLETED:
        return 'success';
      case DelegationStatus.FAILED:
        return 'error';
      case DelegationStatus.PENDING:
      case DelegationStatus.ACCEPTED:
        return 'warning';
      case DelegationStatus.EXECUTING:
        return 'primary';
      case DelegationStatus.REJECTED:
        return 'default';
      default:
        return 'default';
    }
  };

  const calculateProgress = () => {
    switch (liveStatus) {
      case DelegationStatus.PENDING:
        return 10;
      case DelegationStatus.ACCEPTED:
        return 25;
      case DelegationStatus.EXECUTING:
        return progress || 50;
      case DelegationStatus.COMPLETED:
        return 100;
      case DelegationStatus.FAILED:
      case DelegationStatus.REJECTED:
        return 0;
      default:
        return 0;
    }
  };

  const isActive = [
    DelegationStatus.PENDING,
    DelegationStatus.ACCEPTED,
    DelegationStatus.EXECUTING
  ].includes(liveStatus);

  const executionTime = delegation.completed_at && delegation.accepted_at
    ? new Date(delegation.completed_at).getTime() - new Date(delegation.accepted_at).getTime()
    : null;

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(liveStatus)}
            <Typography variant="h6">
              Delegation #{delegation.id.slice(0, 8)}
            </Typography>
            <Chip
              label={liveStatus}
              color={getStatusColor(liveStatus)}
              size="small"
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {onRefresh && (
              <Tooltip title="Refresh status">
                <IconButton size="small" onClick={onRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            {onCancel && isActive && (
              <Tooltip title="Cancel delegation">
                <IconButton size="small" onClick={() => onCancel(delegation.id)}>
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Progress Bar */}
        {isActive && (
          <Box mb={2}>
            <LinearProgress
              variant={liveStatus === DelegationStatus.EXECUTING ? "indeterminate" : "determinate"}
              value={calculateProgress()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Summary Info */}
        <Box display="flex" gap={3} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body2">
              {formatDistanceToNow(new Date(delegation.created_at), { addSuffix: true })}
            </Typography>
          </Box>
          
          {delegation.accepted_at && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Started
              </Typography>
              <Typography variant="body2">
                {formatDistanceToNow(new Date(delegation.accepted_at), { addSuffix: true })}
              </Typography>
            </Box>
          )}
          
          {executionTime && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Execution Time
              </Typography>
              <Typography variant="body2">
                {executionTime}ms
              </Typography>
            </Box>
          )}
        </Box>

        {/* Error Message */}
        {delegation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {delegation.error}
          </Alert>
        )}

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          {/* Status History */}
          {statusHistory.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Status History
              </Typography>
              <List dense>
                {statusHistory.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getStatusIcon(item.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.status}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </Typography>
                          {item.message && (
                            <Typography variant="caption" color="text.secondary">
                              {item.message}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Result Details */}
          {delegation.result && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Result
              </Typography>
              <Box
                sx={{
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                <pre>{JSON.stringify(delegation.result, null, 2)}</pre>
              </Box>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};