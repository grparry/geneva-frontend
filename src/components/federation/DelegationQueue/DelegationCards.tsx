/**
 * Delegation Cards Component
 * 
 * Card view for delegation queue with detailed information.
 */

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  LinearProgress,
  Tooltip,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  MoreVertOutlined,
  VisibilityOutlined,
  ReplayOutlined,
  CancelOutlined,
  GetAppOutlined,
  ScheduleOutlined,
  TimerOutlined,
  PriorityHighOutlined,
} from '@mui/icons-material';

// Federation types and components
import { Delegation, DelegationStatus } from '../../../types/federation';
import { DelegationStatusChip } from '../shared';

interface DelegationCardsProps {
  delegations: Delegation[];
  isLoading: boolean;
  onRetry: (delegationId: string) => Promise<void>;
  onCancel: (delegationId: string) => Promise<void>;
}

const DelegationCards: React.FC<DelegationCardsProps> = ({
  delegations,
  isLoading,
  onRetry,
  onCancel,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, delegation: Delegation) => {
    setAnchorEl(event.currentTarget);
    setSelectedDelegation(delegation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDelegation(null);
  };

  const handleAction = async (action: 'retry' | 'cancel' | 'view' | 'download') => {
    if (!selectedDelegation) return;
    
    const delegationId = selectedDelegation.id;
    setActionLoading(prev => new Set(prev).add(delegationId));
    
    try {
      switch (action) {
        case 'retry':
          await onRetry(delegationId);
          break;
        case 'cancel':
          await onCancel(delegationId);
          break;
        case 'view':
          // TODO: Open delegation details dialog
          console.log('View delegation:', delegationId);
          break;
        case 'download':
          // TODO: Download delegation results
          console.log('Download delegation results:', delegationId);
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(delegationId);
        return newSet;
      });
      handleMenuClose();
    }
  };

  const toggleExpanded = (delegationId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(delegationId)) {
        newSet.delete(delegationId);
      } else {
        newSet.add(delegationId);
      }
      return newSet;
    });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getProgress = (delegation: Delegation) => {
    switch (delegation.status) {
      case DelegationStatus.PENDING: return 0;
      case DelegationStatus.ACCEPTED: return 25;
      case DelegationStatus.EXECUTING: return 75;
      case DelegationStatus.COMPLETED: return 100;
      case DelegationStatus.FAILED: return 100;
      case DelegationStatus.REJECTED: return 100;
      default: return 0;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'error';
    if (priority >= 6) return 'warning';
    if (priority >= 4) return 'info';
    return 'default';
  };

  const canRetry = (delegation: Delegation) => {
    return delegation.status === DelegationStatus.FAILED || 
           delegation.status === DelegationStatus.REJECTED;
  };

  const canCancel = (delegation: Delegation) => {
    return delegation.status === DelegationStatus.PENDING || 
           delegation.status === DelegationStatus.ACCEPTED || 
           delegation.status === DelegationStatus.EXECUTING;
  };

  const hasResults = (delegation: Delegation) => {
    return delegation.status === DelegationStatus.COMPLETED && delegation.result;
  };

  // Loading state
  if (isLoading && delegations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading delegations...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Empty state
  if (delegations.length === 0) {
    return (
      <Alert severity="info" sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No delegations found
        </Typography>
        <Typography variant="body2">
          No delegations match the current filters. Try adjusting your search or creating a new delegation.
        </Typography>
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      {delegations.map((delegation) => {
        const isExpanded = expandedCards.has(delegation.id);
        const isActionLoading = actionLoading.has(delegation.id);
        
        return (
          <Grid xs={12} sm={6} lg={4} key={delegation.id}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Loading indicator */}
              {isActionLoading && (
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
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="h6" noWrap>
                      {delegation.task_type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                      {delegation.task_id.slice(0, 16)}...
                    </Typography>
                  </Box>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, delegation)}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <MoreVertOutlined />
                    )}
                  </IconButton>
                </Box>

                {/* Status and Priority */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <DelegationStatusChip
                    status={delegation.status}
                    size="medium"
                    error={delegation.error}
                  />
                  
                  <Chip
                    icon={<PriorityHighOutlined />}
                    label={delegation.priority}
                    size="small"
                    color={getPriorityColor(delegation.priority)}
                    variant="outlined"
                  />
                </Box>

                {/* Progress */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getProgress(delegation)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getProgress(delegation)}
                    sx={{ height: 6, borderRadius: 3 }}
                    color={
                      delegation.status === DelegationStatus.COMPLETED ? 'success' :
                      delegation.status === DelegationStatus.FAILED ? 'error' :
                      delegation.status === DelegationStatus.EXECUTING ? 'info' : 'primary'
                    }
                  />
                </Box>

                {/* Target */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Target Substrate
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {delegation.target_substrate.slice(0, 16)}...
                  </Typography>
                </Box>

                {/* Timing */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScheduleOutlined fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(delegation.created_at)}
                    </Typography>
                  </Box>
                  
                  {delegation.execution_time_ms && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimerOutlined fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {formatDuration(delegation.execution_time_ms)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Expanded Details */}
                {isExpanded && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Timeline
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                      <Typography variant="caption">
                        Created: {formatDateTime(delegation.created_at)}
                      </Typography>
                      
                      {delegation.accepted_at && (
                        <Typography variant="caption">
                          Accepted: {formatDateTime(delegation.accepted_at)}
                        </Typography>
                      )}
                      
                      {delegation.started_at && (
                        <Typography variant="caption">
                          Started: {formatDateTime(delegation.started_at)}
                        </Typography>
                      )}
                      
                      {delegation.completed_at && (
                        <Typography variant="caption">
                          Completed: {formatDateTime(delegation.completed_at)}
                        </Typography>
                      )}
                    </Box>

                    {delegation.error && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Error Details
                        </Typography>
                        <Typography variant="caption" color="error.main">
                          {delegation.error}
                        </Typography>
                      </Box>
                    )}

                    {delegation.result && Object.keys(delegation.result).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Result Summary
                        </Typography>
                        <Typography variant="caption">
                          {Object.keys(delegation.result).length} result fields
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>

              {/* Actions */}
              <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<VisibilityOutlined />}
                  onClick={() => toggleExpanded(delegation.id)}
                >
                  {isExpanded ? 'Less' : 'Details'}
                </Button>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {canRetry(delegation) && (
                    <Tooltip title="Retry delegation">
                      <IconButton
                        size="small"
                        onClick={() => handleAction('retry')}
                        disabled={isActionLoading}
                      >
                        <ReplayOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {canCancel(delegation) && (
                    <Tooltip title="Cancel delegation">
                      <IconButton
                        size="small"
                        onClick={() => handleAction('cancel')}
                        disabled={isActionLoading}
                      >
                        <CancelOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {hasResults(delegation) && (
                    <Tooltip title="Download results">
                      <IconButton
                        size="small"
                        onClick={() => handleAction('download')}
                        disabled={isActionLoading}
                      >
                        <GetAppOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardActions>
            </Card>
          </Grid>
        );
      })}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <VisibilityOutlined sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        
        {selectedDelegation && hasResults(selectedDelegation) && (
          <MenuItem onClick={() => handleAction('download')}>
            <GetAppOutlined sx={{ mr: 1 }} />
            Download Results
          </MenuItem>
        )}
        
        {selectedDelegation && canRetry(selectedDelegation) && (
          <MenuItem onClick={() => handleAction('retry')}>
            <ReplayOutlined sx={{ mr: 1 }} />
            Retry Delegation
          </MenuItem>
        )}
        
        {selectedDelegation && canCancel(selectedDelegation) && (
          <MenuItem onClick={() => handleAction('cancel')}>
            <CancelOutlined sx={{ mr: 1 }} />
            Cancel Delegation
          </MenuItem>
        )}
      </Menu>
    </Grid>
  );
};

export default DelegationCards;