/**
 * Trust Audit Log Component
 * 
 * Displays audit trail of trust relationship changes.
 */

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  SecurityOutlined,
  PersonOutlined,
} from '@mui/icons-material';

// Federation types and components
import { TrustAuditEntry, TrustLevel } from '../../../types/federation';
import { TrustLevelBadge } from '../shared';

interface TrustAuditLogProps {
  auditLog: TrustAuditEntry[];
  isLoading: boolean;
  filters: {
    timeRange: string;
    searchTerm: string;
    trustLevel: TrustLevel | 'all';
  };
}

type SortField = 'timestamp' | 'action_type' | 'peer_name' | 'old_trust_level' | 'new_trust_level';
type SortOrder = 'asc' | 'desc';

const TrustAuditLog: React.FC<TrustAuditLogProps> = ({
  auditLog,
  isLoading,
  filters,
}) => {
  const [sortField, setSortField] = React.useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter and sort audit log
  const filteredAndSortedLog = useMemo(() => {
    let filtered = auditLog;

    // Apply filters
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.peer_name?.toLowerCase().includes(searchLower) ||
        entry.action_type.toLowerCase().includes(searchLower) ||
        entry.reason?.toLowerCase().includes(searchLower) ||
        entry.performed_by?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.trustLevel !== 'all') {
      filtered = filtered.filter(entry =>
        entry.old_trust_level === filters.trustLevel ||
        entry.new_trust_level === filters.trustLevel
      );
    }

    if (filters.timeRange !== 'all') {
      const now = new Date();
      const filterTime = new Date();
      
      switch (filters.timeRange) {
        case 'hour':
          filterTime.setHours(now.getHours() - 1);
          break;
        case 'day':
          filterTime.setDate(now.getDate() - 1);
          break;
        case 'week':
          filterTime.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterTime.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(entry =>
        new Date(entry.timestamp) >= filterTime
      );
    }

    // Sort
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'action_type':
          aValue = a.action_type;
          bValue = b.action_type;
          break;
        case 'peer_name':
          aValue = a.peer_name || '';
          bValue = b.peer_name || '';
          break;
        case 'old_trust_level':
          aValue = a.old_trust_level || '';
          bValue = b.old_trust_level || '';
          break;
        case 'new_trust_level':
          aValue = a.new_trust_level || '';
          bValue = b.new_trust_level || '';
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
  }, [auditLog, filters, sortField, sortOrder]);

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

  const getActionIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'trust_upgrade':
        return <TrendingUpOutlined fontSize="small" color="success" />;
      case 'trust_downgrade':
        return <TrendingDownOutlined fontSize="small" color="error" />;
      case 'trust_verification':
        return <SecurityOutlined fontSize="small" color="info" />;
      default:
        return <PersonOutlined fontSize="small" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'trust_upgrade':
        return 'Trust Upgrade';
      case 'trust_downgrade':
        return 'Trust Downgrade';
      case 'trust_verification':
        return 'Trust Verification';
      case 'peer_added':
        return 'Peer Added';
      case 'peer_removed':
        return 'Peer Removed';
      default:
        return actionType;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'trust_upgrade':
        return 'success';
      case 'trust_downgrade':
        return 'error';
      case 'trust_verification':
        return 'info';
      default:
        return 'default';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading audit log...
        </Typography>
      </Paper>
    );
  }

  // Empty state
  if (auditLog.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="h6" gutterBottom>
          No audit entries found
        </Typography>
        <Typography variant="body2">
          Trust relationship changes will appear here once they occur.
        </Typography>
      </Alert>
    );
  }

  // Filtered empty state
  if (filteredAndSortedLog.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="h6" gutterBottom>
          No matching audit entries
        </Typography>
        <Typography variant="body2">
          No audit entries match the current filters. Try adjusting your search criteria.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Trust Audit Trail</Typography>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredAndSortedLog.length} of {auditLog.length} entries
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'timestamp'}
                  direction={sortField === 'timestamp' ? sortOrder : 'desc'}
                  onClick={() => handleSort('timestamp')}
                >
                  Timestamp
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'action_type'}
                  direction={sortField === 'action_type' ? sortOrder : 'desc'}
                  onClick={() => handleSort('action_type')}
                >
                  Action
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'peer_name'}
                  direction={sortField === 'peer_name' ? sortOrder : 'desc'}
                  onClick={() => handleSort('peer_name')}
                >
                  Peer
                </TableSortLabel>
              </TableCell>
              <TableCell>Trust Change</TableCell>
              <TableCell>Performed By</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedLog.map((entry) => (
              <TableRow key={entry.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {formatDateTime(entry.timestamp)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(entry.timestamp)}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    icon={getActionIcon(entry.action_type)}
                    label={getActionLabel(entry.action_type)}
                    size="small"
                    color={getActionColor(entry.action_type)}
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {entry.peer_name?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {entry.peer_name || 'Unknown Peer'}
                      </Typography>
                      {entry.peer_id && (
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {entry.peer_id.slice(0, 8)}...
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {entry.old_trust_level && (
                      <>
                        <TrustLevelBadge level={entry.old_trust_level} size="small" />
                        <Typography variant="body2">→</Typography>
                      </>
                    )}
                    {entry.new_trust_level && (
                      <TrustLevelBadge level={entry.new_trust_level} size="small" />
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {entry.performed_by?.charAt(0) || 'S'}
                    </Avatar>
                    <Typography variant="body2">
                      {entry.performed_by || 'System'}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={entry.reason}
                  >
                    {entry.reason || '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TrustAuditLog;