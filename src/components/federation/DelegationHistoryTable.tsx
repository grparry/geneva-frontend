import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  Menu,
  Checkbox,
  ListItemText,
  Dialog
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { PaginatedResponse, Delegation, DelegationStatus, SubstratePeer } from '../../types/federation';
import { useFederation } from '../../hooks/useFederation';
import { DelegationStatusCard } from './DelegationStatusCard';
import { formatDistanceToNow } from 'date-fns';

interface DelegationHistoryTableProps {
  peers: SubstratePeer[];
  onRefresh?: () => void;
}

export const DelegationHistoryTable: React.FC<DelegationHistoryTableProps> = ({
  peers,
  onRefresh
}) => {
  const { delegations: history, delegationsLoading: isLoading } = useFederation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DelegationStatus[]>([]);
  const [peerFilter, setPeerFilter] = useState<string[]>([]);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const getPeerName = (peerId: string) => {
    const peer = peers.find(p => p.id === peerId);
    return peer?.name || 'Unknown Peer';
  };

  const getStatusIcon = (status: DelegationStatus) => {
    switch (status) {
      case DelegationStatus.COMPLETED:
        return <SuccessIcon fontSize="small" color="success" />;
      case DelegationStatus.FAILED:
        return <ErrorIcon fontSize="small" color="error" />;
      case DelegationStatus.REJECTED:
        return <CancelIcon fontSize="small" color="disabled" />;
      default:
        return <PendingIcon fontSize="small" color="warning" />;
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
      case DelegationStatus.EXECUTING:
        return 'warning';
      case DelegationStatus.REJECTED:
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter((delegation: Delegation) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!delegation.id.toLowerCase().includes(searchLower) &&
            !getPeerName(delegation.id).toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(delegation.status)) {
        return false;
      }

      // Peer filter
      if (peerFilter.length > 0 && !peerFilter.includes(delegation.id)) {
        return false;
      }

      return true;
    });
  }, [history, searchTerm, statusFilter, peerFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Status', 'Target Peer', 'Created', 'Completed', 'Duration (ms)', 'Error'];
    const rows = filteredHistory.map((d: Delegation) => [
      d.id,
      d.status,
      getPeerName(d.id),
      new Date(d.created_at).toISOString(),
      d.completed_at ? new Date(d.completed_at).toISOString() : '',
      d.completed_at && d.accepted_at 
        ? new Date(d.completed_at).getTime() - new Date(d.accepted_at).getTime()
        : '',
      d.error || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delegation-history-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <TextField
          size="small"
          placeholder="Search by ID or peer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />

        <Button
          startIcon={<FilterIcon />}
          onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          variant={statusFilter.length > 0 || peerFilter.length > 0 ? "contained" : "outlined"}
          size="small"
        >
          Filters {(statusFilter.length + peerFilter.length) > 0 && `(${statusFilter.length + peerFilter.length})`}
        </Button>

        <Box flex={1} />

        <Tooltip title="Export CSV">
          <IconButton onClick={handleExportCSV} size="small">
            <DownloadIcon />
          </IconButton>
        </Tooltip>

        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{ sx: { width: 300 } }}
      >
        <Box p={2}>
          <Typography variant="subtitle2" gutterBottom>
            Status
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              multiple
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DelegationStatus[])}
              renderValue={(selected) => `${selected.length} selected`}
            >
              {Object.values(DelegationStatus).map(status => (
                <MenuItem key={status} value={status}>
                  <Checkbox checked={statusFilter.includes(status)} />
                  <ListItemText primary={status} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>
            Target Peer
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              multiple
              value={peerFilter}
              onChange={(e) => setPeerFilter(e.target.value as string[])}
              renderValue={(selected) => `${selected.length} selected`}
            >
              {peers.map(peer => (
                <MenuItem key={peer.id} value={peer.id}>
                  <Checkbox checked={peerFilter.includes(peer.id)} />
                  <ListItemText primary={peer.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" justifyContent="space-between">
            <Button
              size="small"
              onClick={() => {
                setStatusFilter([]);
                setPeerFilter([]);
              }}
            >
              Clear All
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => setFilterAnchorEl(null)}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Menu>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Target Peer</TableCell>
              <TableCell>Task Type</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHistory
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((delegation: Delegation) => {
                const duration = delegation.completed_at && delegation.accepted_at
                  ? new Date(delegation.completed_at).getTime() - new Date(delegation.accepted_at).getTime()
                  : null;

                return (
                  <TableRow key={delegation.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {delegation.id.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(delegation.status)}
                        label={delegation.status}
                        color={getStatusColor(delegation.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{getPeerName(delegation.id)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {/* Would need task type from delegation request */}
                        Task
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(delegation.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {duration ? `${duration}ms` : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedDelegation(delegation)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredHistory.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedDelegation}
        onClose={() => setSelectedDelegation(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedDelegation && (
          <Box p={2}>
            <DelegationStatusCard
              delegation={selectedDelegation}
              expanded={true}
            />
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button onClick={() => setSelectedDelegation(null)}>
                Close
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};