import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { ChronosAPI } from '../../services/chronos/api';
import {
  ScheduleInfo,
  TrinityIntegrationStatus
} from '../../types/chronos';

interface ScheduleForm {
  operation_id: string;
  name: string;
  operation_type: string;
  schedule_pattern: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'paused' | 'disabled';
}

const ChronosScheduleManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleInfo[]>([]);
  const [trinityStatus, setTrinityStatus] = useState<TrinityIntegrationStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleInfo | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    operation_id: '',
    name: '',
    operation_type: 'governance',
    schedule_pattern: '0 9 * * 1-5', // Default: 9 AM weekdays
    priority: 'medium',
    status: 'active'
  });
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [schedulesData, trinityData] = await Promise.all([
        ChronosAPI.getSchedules(),
        ChronosAPI.getTrinityIntegrationStatus()
      ]);

      setSchedules(schedulesData);
      setTrinityStatus(trinityData);
    } catch (err) {
      console.error('Failed to load schedule data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({
      operation_id: '',
      name: '',
      operation_type: 'governance',
      schedule_pattern: '0 9 * * 1-5',
      priority: 'medium',
      status: 'active'
    });
    setDialogOpen(true);
  };

  const handleEditSchedule = (schedule: ScheduleInfo) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      operation_id: schedule.operation_id,
      name: schedule.name,
      operation_type: schedule.operation_type,
      schedule_pattern: schedule.schedule_pattern,
      priority: schedule.priority,
      status: schedule.status
    });
    setDialogOpen(true);
  };

  const handleSaveSchedule = async () => {
    try {
      // In a real implementation, this would call the Chronos API
      // For now, we'll simulate the operation
      console.log('Saving schedule:', scheduleForm);
      
      // Close dialog and reload data
      setDialogOpen(false);
      await loadScheduleData();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      // In a real implementation, this would call the Chronos API
      console.log('Deleting schedule:', scheduleId);
      await loadScheduleData();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    }
  };

  const handleToggleSchedule = async (schedule: ScheduleInfo) => {
    try {
      const newStatus = schedule.status === 'active' ? 'paused' : 'active';
      console.log(`${newStatus === 'active' ? 'Activating' : 'Pausing'} schedule:`, schedule.id);
      await loadScheduleData();
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to update schedule status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'disabled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatNextExecution = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const cronPatterns = [
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily at 9 AM', value: '0 9 * * *' },
    { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5' },
    { label: 'Weekly (Monday 9 AM)', value: '0 9 * * 1' },
    { label: 'Monthly (1st at 9 AM)', value: '0 9 1 * *' },
    { label: 'Custom', value: 'custom' }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Schedule Manager...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          🕐 Schedule Manager
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSchedule}
            sx={{ mr: 1 }}
          >
            New Schedule
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadScheduleData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Trinity Integration Status */}
      {trinityStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Trinity Integration Status
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <Box display="flex" alignItems="center">
                  {trinityStatus.connected ? (
                    <CheckIcon color="success" sx={{ mr: 1 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="body1">
                    {trinityStatus.connected ? 'Connected' : 'Disconnected'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Health Check: {trinityStatus.health_check_passing ? 'Passing' : 'Failing'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Active Schedules: {trinityStatus.active_schedules}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Failed Operations: {trinityStatus.failed_operations}
                </Typography>
              </Grid>
            </Grid>
            {trinityStatus.last_operation && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Last Operation: {trinityStatus.last_operation}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedules Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Scheduled Operations
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Operation Type</TableCell>
                  <TableCell>Schedule Pattern</TableCell>
                  <TableCell>Next Execution</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.length > 0 ? (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {schedule.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {schedule.operation_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.operation_type}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {schedule.schedule_pattern}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatNextExecution(schedule.next_execution)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.priority}
                          color={getPriorityColor(schedule.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.status}
                          color={getStatusColor(schedule.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={schedule.status === 'active' ? 'Pause' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleSchedule(schedule)}
                          >
                            {schedule.status === 'active' ? <PauseIcon /> : <PlayIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No schedules configured. Click "New Schedule" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
        </DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Operation ID"
                  value={scheduleForm.operation_id}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, operation_id: e.target.value }))}
                  placeholder="unique-operation-id"
                  helperText="Unique identifier for this operation"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Daily Health Check"
                  helperText="Human-readable name for this schedule"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Operation Type</InputLabel>
                  <Select
                    value={scheduleForm.operation_type}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, operation_type: e.target.value }))}
                  >
                    <MenuItem value="governance">Governance</MenuItem>
                    <MenuItem value="health_check">Health Check</MenuItem>
                    <MenuItem value="backup">Backup</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="analytics">Analytics</MenuItem>
                    <MenuItem value="cleanup">Cleanup</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={scheduleForm.priority}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Schedule Pattern</InputLabel>
                  <Select
                    value={cronPatterns.find(p => p.value === scheduleForm.schedule_pattern)?.value || 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setScheduleForm(prev => ({ ...prev, schedule_pattern: e.target.value }));
                      }
                    }}
                  >
                    {cronPatterns.map((pattern) => (
                      <MenuItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Cron Pattern"
                  value={scheduleForm.schedule_pattern}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, schedule_pattern: e.target.value }))}
                  placeholder="0 9 * * 1-5"
                  helperText="Custom cron pattern (minute hour day month weekday)"
                  InputProps={{ style: { fontFamily: 'monospace' } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={scheduleForm.status === 'active'}
                      onChange={(e) => setScheduleForm(prev => ({ 
                        ...prev, 
                        status: e.target.checked ? 'active' : 'paused' 
                      }))}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveSchedule} 
            variant="contained"
            disabled={!scheduleForm.operation_id || !scheduleForm.name || !scheduleForm.schedule_pattern}
          >
            {editingSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChronosScheduleManager;