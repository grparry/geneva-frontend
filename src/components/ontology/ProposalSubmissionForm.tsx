import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PreviewIcon from '@mui/icons-material/Preview';
import { apiClient } from '../../api/client';

interface OntologyElement {
  element_type: 'concept' | 'relationship' | 'property';
  element_id?: string;
  name: string;
  namespace: string;
  description?: string;
  properties?: Record<string, any>;
}

interface ProposalChange {
  change_type: 'add' | 'modify' | 'remove';
  element: OntologyElement;
  rationale: string;
  impact_assessment?: string;
}

interface ProposalDraft {
  title: string;
  description: string;
  motivation: string;
  changes: ProposalChange[];
  affected_namespaces: string[];
  backward_compatible: boolean;
  migration_strategy?: string;
  testing_plan?: string;
  reviewers?: string[];
  priority: 'low' | 'medium' | 'high';
  target_version?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface ProposalSubmissionFormProps {
  initialChanges?: ProposalChange[];
  onSubmit?: (proposalId: string) => void;
  onCancel?: () => void;
}

export const ProposalSubmissionForm: React.FC<ProposalSubmissionFormProps> = ({
  initialChanges = [],
  onSubmit,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [proposal, setProposal] = useState<ProposalDraft>({
    title: '',
    description: '',
    motivation: '',
    changes: initialChanges,
    affected_namespaces: [],
    backward_compatible: true,
    priority: 'medium',
  });
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentChange, setCurrentChange] = useState<ProposalChange>({
    change_type: 'add',
    element: {
      element_type: 'concept',
      name: '',
      namespace: '',
    },
    rationale: '',
  });

  const steps = [
    'Basic Information',
    'Define Changes',
    'Impact Analysis',
    'Review & Submit',
  ];

  const validateProposal = async () => {
    try {
      const response = await apiClient.post('/api/ontology/proposals/validate', proposal);
      setValidation(response.data);
    } catch (error) {
      console.error('Validation failed:', error);
      // Use mock validation for demo
      const mockValidation: ValidationResult = {
        valid: !!(proposal.title && proposal.changes.length > 0),
        errors: [],
        warnings: [],
        suggestions: [],
      };

      if (!proposal.title) {
        mockValidation.errors.push('Proposal title is required');
      }
      if (proposal.changes.length === 0) {
        mockValidation.errors.push('At least one change must be defined');
      }
      if (!proposal.backward_compatible && !proposal.migration_strategy) {
        mockValidation.warnings.push('Breaking changes should include a migration strategy');
      }
      if (proposal.changes.length > 10) {
        mockValidation.suggestions.push('Consider splitting large proposals into smaller ones');
      }

      mockValidation.valid = mockValidation.errors.length === 0;
      setValidation(mockValidation);
    }
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Submit
      await handleSubmit();
    } else {
      // Validate current step before proceeding
      if (activeStep === 0 && (!proposal.title || !proposal.description)) {
        setValidation({
          valid: false,
          errors: ['Please fill in all required fields'],
          warnings: [],
          suggestions: [],
        });
        return;
      }
      
      setActiveStep((prev) => prev + 1);
      setValidation(null);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setValidation(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await apiClient.post('/api/ontology/proposals', proposal);
      const proposalId = response.data.proposal_id;
      
      if (onSubmit) {
        onSubmit(proposalId);
      }
    } catch (error) {
      console.error('Failed to submit proposal:', error);
      setValidation({
        valid: false,
        errors: ['Failed to submit proposal. Please try again.'],
        warnings: [],
        suggestions: [],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addChange = () => {
    if (!currentChange.element.name || !currentChange.element.namespace) {
      return;
    }

    setProposal((prev) => ({
      ...prev,
      changes: [...prev.changes, currentChange],
      affected_namespaces: Array.from(
        new Set([...prev.affected_namespaces, currentChange.element.namespace])
      ),
    }));

    // Reset current change
    setCurrentChange({
      change_type: 'add',
      element: {
        element_type: 'concept',
        name: '',
        namespace: '',
      },
      rationale: '',
    });
  };

  const removeChange = (index: number) => {
    setProposal((prev) => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== index),
    }));
  };

  const renderBasicInfo = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid size={12}>
          <TextField
            fullWidth
            label="Proposal Title"
            value={proposal.title}
            onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
            required
            helperText="A clear, concise title for your proposal"
          />
        </Grid>
        
        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={proposal.description}
            onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
            required
            helperText="Describe what this proposal aims to achieve"
          />
        </Grid>
        
        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivation"
            value={proposal.motivation}
            onChange={(e) => setProposal({ ...proposal, motivation: e.target.value })}
            helperText="Explain why these changes are needed"
          />
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={proposal.priority}
              onChange={(e) => setProposal({ ...proposal, priority: e.target.value as any })}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Target Version"
            value={proposal.target_version || ''}
            onChange={(e) => setProposal({ ...proposal, target_version: e.target.value })}
            helperText="Optional: Target ontology version"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderChanges = () => (
    <Box>
      {/* Current Changes */}
      {proposal.changes.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Defined Changes ({proposal.changes.length})
          </Typography>
          <List>
            {proposal.changes.map((change, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton edge="end" onClick={() => removeChange(index)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  {change.change_type === 'add' && <AddIcon color="success" />}
                  {change.change_type === 'modify' && <InfoIcon color="warning" />}
                  {change.change_type === 'remove' && <DeleteIcon color="error" />}
                </ListItemIcon>
                <ListItemText
                  primary={`${change.change_type}: ${change.element.name}`}
                  secondary={
                    <>
                      {change.element.namespace} • {change.element.element_type}
                      {change.rationale && <br />}
                      {change.rationale}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Add New Change */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Add Change
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Change Type</InputLabel>
              <Select
                value={currentChange.change_type}
                onChange={(e) => setCurrentChange({
                  ...currentChange,
                  change_type: e.target.value as any,
                })}
                label="Change Type"
              >
                <MenuItem value="add">Add</MenuItem>
                <MenuItem value="modify">Modify</MenuItem>
                <MenuItem value="remove">Remove</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Element Type</InputLabel>
              <Select
                value={currentChange.element.element_type}
                onChange={(e) => setCurrentChange({
                  ...currentChange,
                  element: {
                    ...currentChange.element,
                    element_type: e.target.value as any,
                  },
                })}
                label="Element Type"
              >
                <MenuItem value="concept">Concept</MenuItem>
                <MenuItem value="relationship">Relationship</MenuItem>
                <MenuItem value="property">Property</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Namespace"
              value={currentChange.element.namespace}
              onChange={(e) => setCurrentChange({
                ...currentChange,
                element: {
                  ...currentChange.element,
                  namespace: e.target.value,
                },
              })}
              placeholder="e.g., geneva.core"
            />
          </Grid>
          
          <Grid size={12}>
            <TextField
              fullWidth
              label="Element Name"
              value={currentChange.element.name}
              onChange={(e) => setCurrentChange({
                ...currentChange,
                element: {
                  ...currentChange.element,
                  name: e.target.value,
                },
              })}
            />
          </Grid>
          
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Rationale"
              value={currentChange.rationale}
              onChange={(e) => setCurrentChange({
                ...currentChange,
                rationale: e.target.value,
              })}
              helperText="Why is this change needed?"
            />
          </Grid>
          
          <Grid size={12}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addChange}
              disabled={!currentChange.element.name || !currentChange.element.namespace}
            >
              Add Change
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  const renderImpactAnalysis = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backward Compatibility
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Checkbox
                  checked={proposal.backward_compatible}
                  onChange={(e) => setProposal({
                    ...proposal,
                    backward_compatible: e.target.checked,
                  })}
                />
                <Typography>
                  These changes are backward compatible
                </Typography>
              </Box>
              {!proposal.backward_compatible && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Breaking changes require a migration strategy
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {!proposal.backward_compatible && (
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Migration Strategy"
              value={proposal.migration_strategy || ''}
              onChange={(e) => setProposal({
                ...proposal,
                migration_strategy: e.target.value,
              })}
              helperText="Describe how existing systems should migrate"
              required
            />
          </Grid>
        )}
        
        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Testing Plan"
            value={proposal.testing_plan || ''}
            onChange={(e) => setProposal({
              ...proposal,
              testing_plan: e.target.value,
            })}
            helperText="How will these changes be tested?"
          />
        </Grid>
        
        <Grid size={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Affected Namespaces
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {proposal.affected_namespaces.map((ns) => (
                <Chip key={ns} label={ns} size="small" />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderReview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Proposal Summary
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Title
              </Typography>
              <Typography variant="h6" gutterBottom>
                {proposal.title}
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                Description
              </Typography>
              <Typography paragraph>
                {proposal.description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Priority
                  </Typography>
                  <Chip label={proposal.priority} size="small" />
                </Grid>
                <Grid size={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Compatibility
                  </Typography>
                  <Chip
                    label={proposal.backward_compatible ? 'Compatible' : 'Breaking'}
                    color={proposal.backward_compatible ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Changes Summary
              </Typography>
              <List dense>
                {proposal.changes.map((change, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${change.change_type}: ${change.element.name}`}
                      secondary={change.element.namespace}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {validation && (
          <Grid size={12}>
            <Alert
              severity={validation.valid ? 'success' : 'error'}
              action={
                <Button size="small" onClick={validateProposal}>
                  Re-validate
                </Button>
              }
            >
              {validation.valid ? 'Proposal is valid' : 'Validation issues found'}
              {validation.errors.length > 0 && (
                <List dense>
                  {validation.errors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderChanges();
      case 2:
        return renderImpactAnalysis();
      case 3:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Box mb={3}>
        {getStepContent(activeStep)}
      </Box>

      {validation && validation.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Warnings:</Typography>
          <List dense>
            {validation.warnings.map((warning, index) => (
              <ListItem key={index}>
                <ListItemText primary={warning} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between">
        <Box>
          {onCancel && (
            <Button onClick={onCancel}>
              Cancel
            </Button>
          )}
        </Box>
        <Box display="flex" gap={2}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={submitting}
            startIcon={activeStep === steps.length - 1 ? <SendIcon /> : null}
          >
            {activeStep === steps.length - 1 ? 'Submit Proposal' : 'Next'}
          </Button>
          <Tooltip title="Preview proposal">
            <IconButton onClick={() => setPreviewOpen(true)}>
              <PreviewIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {submitting && <LinearProgress sx={{ mt: 2 }} />}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Proposal Preview</DialogTitle>
        <DialogContent>
          <pre style={{ fontSize: '0.875rem' }}>
            {JSON.stringify(proposal, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};