/**
 * Delegation Table Component
 * 
 * Table view for delegation queue with sorting and actions.
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  MoreVertOutlined,
  VisibilityOutlined,
  ReplayOutlined,
  CancelOutlined,
  GetAppOutlined,
} from '@mui/icons-material';

// Federation types and components
import { Delegation, DelegationStatus } from '../../../types/federation';
import { DelegationStatusChip } from '../shared';

interface DelegationTableProps {
  delegations: Delegation[];
  isLoading: boolean;
  onRetry: (delegationId: string) => Promise<void>;
  onCancel: (delegationId: string) => Promise<void>;
}

type SortField = 'created_at' | 'priority' | 'status' | 'execution_time_ms' | 'task_type';
type SortOrder = 'asc' | 'desc';

const DelegationTable: React.FC<DelegationTableProps> = ({
  delegations,
  isLoading,
  onRetry,
  onCancel,
}) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

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

  const sortedDelegations = React.useMemo(() => {
    return [...delegations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'execution_time_ms':
          aValue = a.execution_time_ms || 0;
          bValue = b.execution_time_ms || 0;
          break;
        case 'task_type':
          aValue = a.task_type;
          bValue = b.task_type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [delegations, sortField, sortOrder]);

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
      <Paper>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading delegations...
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  // Empty state
  if (delegations.length === 0) {
    return (
      <Paper>
        <Alert severity="info" sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No delegations found
          </Typography>
          <Typography variant="body2">
            No delegations match the current filters. Try adjusting your search or creating a new delegation.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortField === 'created_at'}
                direction={sortField === 'created_at' ? sortOrder : 'desc'}
                onClick={() => handleSort('created_at')}
              >
                Created
              </TableSortLabel>
            </TableCell>
            <TableCell>Task ID</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'task_type'}
                direction={sortField === 'task_type' ? sortOrder : 'desc'}
                onClick={() => handleSort('task_type')}
              >
                Type
              </TableSortLabel>
            </TableCell>
            <TableCell>Target</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'priority'}
                direction={sortField === 'priority' ? sortOrder : 'desc'}
                onClick={() => handleSort('priority')}
              >
                Priority
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'status'}
                direction={sortField === 'status' ? sortOrder : 'desc'}
                onClick={() => handleSort('status')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'execution_time_ms'}
                direction={sortField === 'execution_time_ms' ? sortOrder : 'desc'}
                onClick={() => handleSort('execution_time_ms')}
              >
                Duration
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedDelegations.map((delegation) => (
            <TableRow key={delegation.id} hover>
              <TableCell>
                <Typography variant="body2">
                  {formatDateTime(delegation.created_at)}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  {delegation.task_id.slice(0, 8)}...
                </Typography>
              </TableCell>
              
              <TableCell>
                <Chip
                  label={delegation.task_type}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  {delegation.target_substrate.slice(0, 8)}...
                </Typography>
              </TableCell>
              
              <TableCell>
                <Chip
                  label={delegation.priority}
                  size="small"
                  color={delegation.priority >= 8 ? 'error' : delegation.priority >= 6 ? 'warning' : 'default'}
                />
              </TableCell>
              
              <TableCell>
                <DelegationStatusChip
                  status={delegation.status}
                  size="small"
                  error={delegation.error}
                />
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={getProgress(delegation)}
                    sx={{ width: 80, height: 6, borderRadius: 3 }}
                    color={
                      delegation.status === DelegationStatus.COMPLETED ? 'success' :
                      delegation.status === DelegationStatus.FAILED ? 'error' :
                      delegation.status === DelegationStatus.EXECUTING ? 'info' : 'primary'
                    }
                  />
                  <Typography variant="caption">
                    {getProgress(delegation)}%
                  </Typography>
                </Box>
              </TableCell>
              
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {formatDuration(delegation.execution_time_ms)}
                  </Typography>
                  {delegation.total_time_ms && (
                    <Typography variant="caption" color="text.secondary">
                      Total: {formatDuration(delegation.total_time_ms)}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, delegation)}
                  disabled={actionLoading.has(delegation.id)}
                >
                  {actionLoading.has(delegation.id) ? (
                    <CircularProgress size={20} />
                  ) : (
                    <MoreVertOutlined />
                  )}
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </TableContainer>
  );
};

export default DelegationTable;