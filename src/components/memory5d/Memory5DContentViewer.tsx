/**
 * Memory5DContentViewer Component
 * Advanced content viewer and editor for 5D memories with dimensional validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Psychology as PsychologyIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  RestoreIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import type {
  Memory5D,
  Memory5DContent,
  Memory5DEditRequest,
  validateMemory5D,
  getDimensionColor,
  formatDimensionValue,
  calculateCoherenceScore,
} from '../../types/memory5d';

import {
  useGetMemoryContentQuery,
  useEditMemoryContentMutation,
  useGetMemoryEditHistoryQuery,
  useRestoreMemoryVersionMutation,
  useValidateDimensionalConsistencyMutation,
} from '../../services/memory5d/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

interface Memory5DContentViewerProps {
  memory: Memory5D;
  onMemoryUpdate?: (updatedMemory: Memory5D) => void;
  readOnly?: boolean;
  showEditHistory?: boolean;
  enableDimensionalValidation?: boolean;
  compact?: boolean;
}

const Memory5DContentViewer: React.FC<Memory5DContentViewerProps> = ({
  memory,
  onMemoryUpdate,
  readOnly = false,
  showEditHistory = true,
  enableDimensionalValidation = true,
  compact = false,
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(memory.content);
  const [editReason, setEditReason] = useState('');
  const [maintainConsistency, setMaintainConsistency] = useState(true);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' | 'warning' } | null>(null);

  // API queries and mutations
  const {
    data: memoryContent,
    isLoading: contentLoading,
    refetch: refetchContent,
  } = useGetMemoryContentQuery(memory.id);

  const {
    data: editHistory,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetMemoryEditHistoryQuery({
    memoryId: memory.id,
    limit: 20,
  }, {
    skip: !showEditHistory,
  });

  const [editMemoryContent, {
    isLoading: editLoading,
  }] = useEditMemoryContentMutation();

  const [restoreVersion, {
    isLoading: restoreLoading,
  }] = useRestoreMemoryVersionMutation();

  const [validateConsistency, {
    data: validationResults,
    isLoading: validationLoading,
  }] = useValidateDimensionalConsistencyMutation();

  // Update local content when memory changes
  useEffect(() => {
    setEditedContent(memory.content);
  }, [memory.content]);

  // Validation
  const contentValidation = validateMemory5D({
    ...memory,
    content: editedContent,
  });

  // Handle content editing
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedContent(memory.content);
    setEditReason('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(memory.content);
    setEditReason('');
  };

  const handleSaveEdit = async () => {
    if (!editReason.trim()) {
      setSnackbar({ message: 'Please provide a reason for editing', severity: 'warning' });
      return;
    }

    if (!contentValidation.valid) {
      setSnackbar({ message: 'Content validation failed', severity: 'error' });
      return;
    }

    try {
      const editRequest: Memory5DEditRequest = {
        memory_id: memory.id,
        new_content: editedContent,
        edit_reason: editReason,
        maintain_dimensional_consistency: maintainConsistency,
        auto_revalidate: enableDimensionalValidation,
      };

      const updatedContent = await editMemoryContent(editRequest).unwrap();

      setIsEditing(false);
      setEditReason('');
      setSnackbar({ message: 'Memory content updated successfully', severity: 'success' });

      // Refetch data
      refetchContent();
      refetchHistory();

      // Notify parent of update
      if (onMemoryUpdate) {
        const updatedMemory = { ...memory, content: editedContent, version: memory.version + 1 };
        onMemoryUpdate(updatedMemory);
      }
    } catch (error: any) {
      setSnackbar({
        message: `Failed to update content: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  // Handle version restoration
  const handleRestoreVersion = async (version: number) => {
    if (!window.confirm(`Are you sure you want to restore to version ${version}? This will create a new version.`)) {
      return;
    }

    try {
      await restoreVersion({
        memory_id: memory.id,
        version,
        restore_reason: `Restored to version ${version} from content viewer`,
      }).unwrap();

      setSnackbar({ message: `Successfully restored to version ${version}`, severity: 'success' });
      refetchContent();
      refetchHistory();
    } catch (error: any) {
      setSnackbar({
        message: `Failed to restore version: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  // Handle dimensional validation
  const handleValidateConsistency = async () => {
    try {
      await validateConsistency({
        memory_ids: [memory.id],
        fix_automatically: false,
      });
      setShowValidationDetails(true);
    } catch (error: any) {
      setSnackbar({
        message: `Validation failed: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const coherenceScore = calculateCoherenceScore(memory);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant={compact ? "h6" : "h5"}>
          Memory Content
        </Typography>

        <Box display="flex" gap={1}>
          {enableDimensionalValidation && (
            <Tooltip title="Validate Dimensional Consistency">
              <IconButton
                onClick={handleValidateConsistency}
                disabled={validationLoading}
                color={coherenceScore > 0.8 ? 'success' : coherenceScore > 0.6 ? 'warning' : 'error'}
              >
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Refresh Content">
            <IconButton onClick={refetchContent} disabled={contentLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {!readOnly && !isEditing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleStartEdit}
              size={compact ? "small" : "medium"}
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>

      {/* Validation Status */}
      {enableDimensionalValidation && (
        <Box mb={2}>
          <Alert
            severity={coherenceScore > 0.8 ? 'success' : coherenceScore > 0.6 ? 'warning' : 'error'}
            action={
              <Button size="small" onClick={() => setShowValidationDetails(!showValidationDetails)}>
                {showValidationDetails ? 'Hide' : 'Show'} Details
              </Button>
            }
          >
            Dimensional Coherence: {(coherenceScore * 100).toFixed(1)}%
          </Alert>

          {showValidationDetails && validationResults && (
            <Box mt={1}>
              <Typography variant="body2" gutterBottom>
                Validation Results:
              </Typography>
              {validationResults.inconsistencies.map((issue, index) => (
                <Alert key={index} severity={issue.severity as any} sx={{ mt: 0.5 }}>
                  <Typography variant="body2">
                    <strong>{issue.dimension}:</strong> {issue.issue}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Suggested fix: {issue.suggested_fix}
                  </Typography>
                </Alert>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="Content" icon={<VisibilityIcon />} />
          {showEditHistory && <Tab label="History" icon={<HistoryIcon />} />}
          <Tab label="Dimensions" icon={<PsychologyIcon />} />
        </Tabs>
      </Box>

      {/* Content Tab */}
      <TabPanel value={selectedTab} index={0}>
        <Card>
          <CardContent>
            {isEditing ? (
              <Box>
                {/* Edit Mode */}
                <TextField
                  multiline
                  rows={12}
                  fullWidth
                  variant="outlined"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  label="Memory Content"
                />

                <Box mt={2}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Reason for editing"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Describe the changes you're making..."
                    required
                  />
                </Box>

                <Box mt={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={maintainConsistency}
                        onChange={(e) => setMaintainConsistency(e.target.checked)}
                      />
                    }
                    label="Maintain dimensional consistency"
                  />
                </Box>

                {/* Validation Preview */}
                {!contentValidation.valid && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Content validation failed:
                    </Typography>
                    <ul>
                      {contentValidation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
              </Box>
            ) : (
              <Box>
                {/* View Mode */}
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {memory.content}
                </Typography>

                {/* Content Metadata */}
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Word Count: {memory.content.split(/\s+/).length}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Version: {memory.version}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated: {format(new Date(memory.updated_at), 'PPpp')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Processing Status: {memory.processing_status}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>

          {isEditing && (
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
                disabled={editLoading || !contentValidation.valid || !editReason.trim()}
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </CardActions>
          )}
        </Card>
      </TabPanel>

      {/* History Tab */}
      {showEditHistory && (
        <TabPanel value={selectedTab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Edit History
              </Typography>

              {historyLoading ? (
                <LinearProgress />
              ) : editHistory && editHistory.length > 0 ? (
                <List>
                  {editHistory.map((edit, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <HistoryIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1">
                              Version {edit.version}
                            </Typography>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Restore this version">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRestoreVersion(edit.version)}
                                  disabled={restoreLoading}
                                >
                                  <RestoreIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {edit.changes_summary}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(edit.edited_at), 'PPpp')} by {edit.edited_by}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No edit history available
                </Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      )}

      {/* Dimensions Tab */}
      <TabPanel value={selectedTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dimensional Classification
            </Typography>

            <Grid container spacing={2}>
              {/* Cognitive Type */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <PsychologyIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Cognitive Type</Typography>
                </Box>
                <Chip
                  label={formatDimensionValue('cognitive_type', memory.cognitive_type)}
                  sx={{ backgroundColor: getDimensionColor('cognitive_type', memory.cognitive_type) }}
                />
              </Grid>

              {/* Temporal Tier */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <ScheduleIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Temporal Tier</Typography>
                </Box>
                <Chip
                  label={formatDimensionValue('temporal_tier', memory.temporal_tier)}
                  sx={{ backgroundColor: getDimensionColor('temporal_tier', memory.temporal_tier) }}
                />
              </Grid>

              {/* Organizational Scope */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <BusinessIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Organizational Scope</Typography>
                </Box>
                <Chip
                  label={formatDimensionValue('organizational_scope', memory.organizational_scope)}
                  sx={{ backgroundColor: getDimensionColor('organizational_scope', memory.organizational_scope) }}
                />
              </Grid>

              {/* Security Classification */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <SecurityIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Security Classification</Typography>
                </Box>
                <Chip
                  label={formatDimensionValue('security_classification', memory.security_classification)}
                  sx={{ backgroundColor: getDimensionColor('security_classification', memory.security_classification) }}
                />
              </Grid>

              {/* Ontological Schema */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <SchoolIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Ontological Schema</Typography>
                </Box>
                <Chip
                  label={formatDimensionValue('ontological_schema', memory.ontological_schema)}
                  sx={{ backgroundColor: getDimensionColor('ontological_schema', memory.ontological_schema) }}
                />
              </Grid>
            </Grid>

            {/* Scores */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Memory Scores
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom>
                  Importance Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={memory.importance_score * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption">
                  {(memory.importance_score * 100).toFixed(1)}%
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom>
                  Confidence Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={memory.confidence_score * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption">
                  {(memory.confidence_score * 100).toFixed(1)}%
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom>
                  Coherence Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={coherenceScore * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption">
                  {(coherenceScore * 100).toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

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

export default Memory5DContentViewer;