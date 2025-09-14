/**
 * TrinityAgentPanel Component
 * Management interface for Trinity agents (Bradley, Greta, Thedra)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondary,
  Divider,
  Tooltip,
  Badge,
  CircularProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
} from '@mui/material';
import {
  Security as SecurityIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

import type {
  TrinityProcessingStatus,
  TrinityAgentAction,
  TrinityAgentPanelProps,
} from '../../types/memory5d';

import {
  useGetTrinityStatusQuery,
  useTriggerTrinityActionMutation,
  useGetTrinityProcessingHistoryQuery,
  useForceTrinityReprocessingMutation,
} from '../../services/memory5d/api';

const TrinityAgentPanel: React.FC<TrinityAgentPanelProps> = ({
  onAgentAction,
  refreshInterval = 30000,
  showDetailedMetrics = true,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<'bradley' | 'greta' | 'thedra' | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<TrinityAgentAction['action']>('reprocess');
  const [targetMemoryIds, setTargetMemoryIds] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' | 'warning' } | null>(null);

  // API queries and mutations
  const {
    data: trinityStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useGetTrinityStatusQuery(undefined, {
    pollingInterval: autoRefresh ? refreshInterval : 0,
  });

  const {
    data: processingHistory,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetTrinityProcessingHistoryQuery({
    limit: 50,
  });

  const [triggerAction, { isLoading: actionLoading }] = useTriggerTrinityActionMutation();
  const [forceReprocessing, { isLoading: reprocessLoading }] = useForceTrinityReprocessingMutation();

  // Agent configurations
  const agentConfigs = {
    bradley: {
      name: 'Bradley',
      fullName: 'Bradley Security Agent',
      description: 'Security classification and risk assessment specialist',
      icon: <SecurityIcon />,
      color: '#2196f3',
      capabilities: [
        'Security risk assessment',
        'Classification validation',
        'Threat detection',
        'Access control evaluation'
      ]
    },
    greta: {
      name: 'Greta',
      fullName: 'Greta Ontology Agent',
      description: 'Knowledge domain classification and relationship mapping',
      icon: <SchoolIcon />,
      color: '#4caf50',
      capabilities: [
        'Ontological classification',
        'Knowledge relationship mapping',
        'Concept extraction',
        'Domain expertise validation'
      ]
    },
    thedra: {
      name: 'Thedra',
      fullName: 'Thedra Consolidation Agent',
      description: 'Temporal consolidation and memory hierarchy optimization',
      icon: <RefreshIcon />,
      color: '#ff9800',
      capabilities: [
        'Memory consolidation',
        'Temporal tier optimization',
        'Hierarchy restructuring',
        'Pattern synthesis'
      ]
    }
  };

  // Handle agent action
  const handleTriggerAction = (agent: 'bradley' | 'greta' | 'thedra') => {
    setSelectedAgent(agent);
    setActionDialogOpen(true);
    setTargetMemoryIds('');
    setActionReason('');
    setSelectedAction('reprocess');
    setPriority('medium');
  };

  const executeAction = async () => {
    if (!selectedAgent) return;

    const memoryIds = targetMemoryIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (memoryIds.length === 0 && selectedAction !== 'validate') {
      setSnackbar({ message: 'Please provide at least one memory ID', severity: 'warning' });
      return;
    }

    if (!actionReason.trim()) {
      setSnackbar({ message: 'Please provide a reason for this action', severity: 'warning' });
      return;
    }

    try {
      const action: TrinityAgentAction = {
        agent: selectedAgent,
        action: selectedAction,
        memory_ids: memoryIds,
        priority,
        reason: actionReason,
      };

      await triggerAction(action).unwrap();

      setSnackbar({
        message: `${agentConfigs[selectedAgent].name} action "${selectedAction}" queued successfully`,
        severity: 'success'
      });

      setActionDialogOpen(false);
      onAgentAction?.(action);
      refetchStatus();
      refetchHistory();
    } catch (error: any) {
      setSnackbar({
        message: `Failed to trigger action: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleForceReprocess = async (agents: ('bradley' | 'greta' | 'thedra')[]) => {
    try {
      await forceReprocessing({
        agents,
        priority: 'high',
      }).unwrap();

      setSnackbar({
        message: `Forced reprocessing queued for ${agents.join(', ')}`,
        severity: 'success'
      });

      refetchStatus();
    } catch (error: any) {
      setSnackbar({
        message: `Failed to force reprocessing: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return <CheckCircleIcon color="success" />;
      case 'processing': return <CircularProgress size={20} />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'success';
      case 'processing': return 'info';
      case 'error': return 'error';
      default: return 'warning';
    }
  };

  if (statusLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Trinity Agent Status...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          🤖 Trinity Agent Management
        </Typography>

        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label="Auto Refresh"
          />

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetchStatus}
            disabled={statusLoading}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            color="warning"
            onClick={() => handleForceReprocess(['bradley', 'greta', 'thedra'])}
            disabled={reprocessLoading}
          >
            Force Reprocess All
          </Button>
        </Box>
      </Box>

      {/* System Health Overview */}
      {trinityStatus && (
        <Alert
          severity={
            trinityStatus.overall_health === 'healthy' ? 'success' :
            trinityStatus.overall_health === 'degraded' ? 'warning' : 'error'
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="body1">
            Trinity System Health: <strong>{trinityStatus.overall_health.toUpperCase()}</strong>
          </Typography>
        </Alert>
      )}

      {/* Agent Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {trinityStatus && Object.entries(trinityStatus).map(([agentKey, agentStatus]) => {
          if (agentKey === 'overall_health') return null;

          const agent = agentKey as 'bradley' | 'greta' | 'thedra';
          const config = agentConfigs[agent];

          return (
            <Grid size={{ xs: 12, md: 4 }} key={agent}>
              <Card
                sx={{
                  height: '100%',
                  border: `2px solid ${config.color}`,
                  '&:hover': {
                    boxShadow: 4,
                  }
                }}
              >
                <CardContent>
                  {/* Agent Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ color: config.color, mr: 1 }}>
                        {config.icon}
                      </Box>
                      <Typography variant="h6">
                        {config.name}
                      </Typography>
                    </Box>

                    <Badge
                      badgeContent={agentStatus.memories_in_queue}
                      color="primary"
                      showZero
                    >
                      {getStatusIcon(agentStatus.status)}
                    </Badge>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {config.description}
                  </Typography>

                  {/* Status Chip */}
                  <Chip
                    label={agentStatus.status.toUpperCase()}
                    color={getStatusColor(agentStatus.status) as any}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  {/* Metrics */}
                  {showDetailedMetrics && (
                    <Box>
                      <Typography variant="caption" display="block" gutterBottom>
                        Queue: {agentStatus.memories_in_queue} memories
                      </Typography>
                      <Typography variant="caption" display="block" gutterBottom>
                        Avg Processing: {agentStatus.avg_processing_time_seconds.toFixed(1)}s
                      </Typography>
                      {agentStatus.last_processed_at && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Last Active: {formatDistanceToNow(new Date(agentStatus.last_processed_at), { addSuffix: true })}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Capabilities */}
                  <Accordion sx={{ mt: 2, boxShadow: 'none' }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ px: 0, minHeight: 32 }}
                    >
                      <Typography variant="body2">Capabilities</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0 }}>
                      <List dense>
                        {config.capabilities.map((capability, index) => (
                          <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <CheckCircleIcon fontSize="small" color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary={capability}
                              sx={{ '& .MuiListItemText-primary': { fontSize: '0.8rem' } }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={() => handleTriggerAction(agent)}
                    disabled={actionLoading}
                    sx={{ backgroundColor: config.color }}
                  >
                    Execute Action
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleForceReprocess([agent])}
                    disabled={reprocessLoading}
                  >
                    Reprocess
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Processing History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Processing History
          </Typography>

          {historyLoading ? (
            <LinearProgress />
          ) : processingHistory && processingHistory.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Memory ID</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Result</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processingHistory.slice(0, 10).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Box sx={{ color: agentConfigs[record.agent as keyof typeof agentConfigs]?.color, mr: 1 }}>
                            {agentConfigs[record.agent as keyof typeof agentConfigs]?.icon}
                          </Box>
                          {record.agent}
                        </Box>
                      </TableCell>
                      <TableCell>{record.action_type}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {record.memory_id.slice(-8)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {format(new Date(record.started_at), 'MMM dd, HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          size="small"
                          color={record.status === 'completed' ? 'success' : record.status === 'failed' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {record.result_summary ? (
                          <Tooltip title={record.result_summary}>
                            <Typography variant="body2" sx={{
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {record.result_summary}
                            </Typography>
                          </Tooltip>
                        ) : record.error_message ? (
                          <Tooltip title={record.error_message}>
                            <Typography variant="body2" color="error" sx={{
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {record.error_message}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            In progress...
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">
              No processing history available
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Execute {selectedAgent && agentConfigs[selectedAgent].name} Action
        </DialogTitle>
        <DialogContent>
          <Box py={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Action Type</InputLabel>
              <Select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as TrinityAgentAction['action'])}
              >
                <MenuItem value="reprocess">Reprocess</MenuItem>
                <MenuItem value="validate">Validate</MenuItem>
                <MenuItem value="consolidate">Consolidate</MenuItem>
                <MenuItem value="archive">Archive</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Memory IDs"
              value={targetMemoryIds}
              onChange={(e) => setTargetMemoryIds(e.target.value)}
              placeholder="memory-id-1, memory-id-2, ..."
              helperText="Comma-separated list of memory IDs (leave empty for all)"
              multiline
              rows={2}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Reason"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Explain why you're performing this action..."
              required
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={executeAction}
            variant="contained"
            disabled={actionLoading || !actionReason.trim()}
            color="primary"
          >
            {actionLoading ? 'Executing...' : 'Execute Action'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={6000}
        onClose={() => setSnackbar(null)}
      >
        {snackbar && (
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>
            {snackbar.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default TrinityAgentPanel;