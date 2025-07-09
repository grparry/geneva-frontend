import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Button,
  Alert,
  AlertTitle,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Grid
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as ValidateIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  ProjectConstraint,
  ConstraintViolation
} from '../../../types/geneva-tools';

interface ConstraintValidatorProps {
  projectId: string;
  constraints?: ProjectConstraint[];
  onConstraintUpdate?: (constraint: ProjectConstraint) => void;
  onViolationResolve?: (violationId: string, note: string) => void;
  onValidationRun?: (constraintIds: string[]) => void;
  realTimeValidation?: boolean;
}

const SEVERITY_COLORS = {
  low: '#4caf50',
  medium: '#ff9800', 
  high: '#f44336',
  critical: '#d32f2f'
};

const SEVERITY_ICONS = {
  low: CheckIcon,
  medium: WarningIcon,
  high: ErrorIcon,
  critical: ErrorIcon
};

const CONSTRAINT_TYPE_LABELS = {
  permission: 'Permission',
  resource: 'Resource',
  business_rule: 'Business Rule',
  security: 'Security'
};

export const ConstraintValidator: React.FC<ConstraintValidatorProps> = ({
  projectId,
  constraints = [],
  onConstraintUpdate,
  onViolationResolve,
  onValidationRun,
  realTimeValidation = true
}) => {
  const [selectedConstraint, setSelectedConstraint] = useState<ProjectConstraint | null>(null);
  const [violations, setViolations] = useState<ConstraintViolation[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<ConstraintViolation | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [newConstraint, setNewConstraint] = useState({
    type: 'security' as const,
    name: '',
    description: '',
    rule: ''
  });

  // Mock data for demonstration
  const mockConstraints: ProjectConstraint[] = constraints.length > 0 ? constraints : [
    {
      id: 'const-1',
      type: 'security',
      name: 'API Key Protection',
      description: 'Ensure API keys are not exposed in code or logs',
      rule: 'NOT CONTAINS(code, "api_key") AND NOT CONTAINS(logs, "secret")',
      isActive: true,
      projectId,
      createdAt: new Date().toISOString(),
      lastChecked: new Date(Date.now() - 5000).toISOString(),
      violations: [
        {
          id: 'viol-1',
          constraintId: 'const-1',
          description: 'API key found in configuration file: config.js:line 23',
          severity: 'critical',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userId: 'user-1',
          resolved: false
        },
        {
          id: 'viol-2', 
          constraintId: 'const-1',
          description: 'Potential secret logged in console output',
          severity: 'high',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          userId: 'user-1',
          resolved: false
        }
      ]
    },
    {
      id: 'const-2',
      type: 'resource',
      name: 'Memory Limit',
      description: 'Prevent excessive memory usage in operations',
      rule: 'memory_usage < 500MB AND concurrent_operations < 10',
      isActive: true,
      projectId,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastChecked: new Date(Date.now() - 10000).toISOString(),
      violations: []
    },
    {
      id: 'const-3',
      type: 'business_rule',
      name: 'Data Retention Policy',
      description: 'Ensure data is not retained beyond policy limits',
      rule: 'data_age < 90_days OR data_type IN (permanent_records)',
      isActive: true,
      projectId,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      lastChecked: new Date(Date.now() - 15000).toISOString(),
      violations: [
        {
          id: 'viol-3',
          constraintId: 'const-3',
          description: 'User session data older than 90 days detected',
          severity: 'medium',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          userId: 'user-2',
          resolved: false
        }
      ]
    },
    {
      id: 'const-4',
      type: 'permission',
      name: 'Write Access Control',
      description: 'Validate write permissions for sensitive operations',
      rule: 'user_role IN (admin, editor) AND operation_type = write',
      isActive: true,
      projectId,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      lastChecked: new Date(Date.now() - 2000).toISOString(),
      violations: []
    }
  ];

  const effectiveConstraints = constraints.length > 0 ? constraints : mockConstraints;

  useEffect(() => {
    // Collect all violations from constraints
    const allViolations = effectiveConstraints.flatMap(c => c.violations);
    setViolations(allViolations);
  }, [effectiveConstraints]);

  const handleValidateAll = async () => {
    setIsValidating(true);
    setValidationProgress(0);
    
    // Simulate validation process
    for (let i = 0; i <= 100; i += 10) {
      setValidationProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsValidating(false);
    onValidationRun?.(effectiveConstraints.map(c => c.id));
  };

  const handleValidateConstraint = async (constraintId: string) => {
    setIsValidating(true);
    
    // Simulate single constraint validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsValidating(false);
    onValidationRun?.([constraintId]);
  };

  const handleResolveViolation = (violation: ConstraintViolation) => {
    setSelectedViolation(violation);
    setShowViolationDialog(true);
  };

  const handleSubmitResolution = () => {
    if (selectedViolation && resolutionNote.trim()) {
      onViolationResolve?.(selectedViolation.id, resolutionNote);
      setViolations(prev => prev.map(v => 
        v.id === selectedViolation.id 
          ? { ...v, resolved: true, resolutionNote }
          : v
      ));
      setShowViolationDialog(false);
      setSelectedViolation(null);
      setResolutionNote('');
    }
  };

  const handleAddConstraint = () => {
    if (newConstraint.name && newConstraint.rule) {
      const constraint: ProjectConstraint = {
        id: `const-${Date.now()}`,
        type: newConstraint.type,
        name: newConstraint.name,
        description: newConstraint.description,
        rule: newConstraint.rule,
        isActive: true,
        projectId,
        createdAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        violations: []
      };
      
      onConstraintUpdate?.(constraint);
      setShowAddDialog(false);
      setNewConstraint({ type: 'security', name: '', description: '', rule: '' });
    }
  };

  const unresolvedViolations = violations.filter(v => !v.resolved);
  const criticalViolations = unresolvedViolations.filter(v => v.severity === 'critical');
  const highViolations = unresolvedViolations.filter(v => v.severity === 'high');

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5">
              Constraint Validator
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project constraints and compliance monitoring
            </Typography>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Badge badgeContent={unresolvedViolations.length} color="error">
            <Tooltip title="Unresolved Violations">
              <IconButton>
                <WarningIcon />
              </IconButton>
            </Tooltip>
          </Badge>
          
          <Tooltip title="Add Constraint">
            <IconButton onClick={() => setShowAddDialog(true)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Validate All">
            <IconButton 
              onClick={handleValidateAll}
              disabled={isValidating}
              color="primary"
            >
              <ValidateIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Validation Progress */}
      {isValidating && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Validating constraints...
          </Typography>
          <LinearProgress variant="determinate" value={validationProgress} />
        </Box>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4">{effectiveConstraints.length}</Typography>
              <Typography variant="body2">Total Constraints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ bgcolor: unresolvedViolations.length > 0 ? 'error.light' : 'success.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4">{unresolvedViolations.length}</Typography>
              <Typography variant="body2">Active Violations</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ bgcolor: criticalViolations.length > 0 ? 'error.dark' : 'success.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4">{criticalViolations.length}</Typography>
              <Typography variant="body2">Critical Issues</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4">
                {Math.round((effectiveConstraints.filter(c => c.violations.length === 0).length / effectiveConstraints.length) * 100)}%
              </Typography>
              <Typography variant="body2">Compliance Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Violations Alert */}
      {criticalViolations.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Critical Violations Detected</AlertTitle>
          {criticalViolations.length} critical security or compliance issues require immediate attention.
        </Alert>
      )}

      {/* Constraints List */}
      <Typography variant="h6" gutterBottom>
        Active Constraints
      </Typography>
      
      <Stack spacing={2}>
        {effectiveConstraints.map(constraint => {
          const violationCount = constraint.violations.filter(v => !v.resolved).length;
          const SeverityIcon = violationCount > 0 
            ? SEVERITY_ICONS[Math.max(...constraint.violations.map(v => v.severity === 'critical' ? 4 : v.severity === 'high' ? 3 : v.severity === 'medium' ? 2 : 1)) === 4 ? 'critical' : Math.max(...constraint.violations.map(v => v.severity === 'critical' ? 4 : v.severity === 'high' ? 3 : v.severity === 'medium' ? 2 : 1)) === 3 ? 'high' : 'medium']
            : CheckIcon;
          
          return (
            <Card 
              key={constraint.id}
              sx={{ 
                cursor: 'pointer',
                border: selectedConstraint?.id === constraint.id ? 2 : 1,
                borderColor: selectedConstraint?.id === constraint.id ? 'primary.main' : 'divider'
              }}
              onClick={() => setSelectedConstraint(constraint)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SeverityIcon 
                      sx={{ 
                        color: violationCount > 0 
                          ? SEVERITY_COLORS[constraint.violations.find(v => !v.resolved)?.severity || 'low']
                          : 'success.main' 
                      }} 
                    />
                    <Typography variant="h6">
                      {constraint.name}
                    </Typography>
                    <Chip 
                      label={CONSTRAINT_TYPE_LABELS[constraint.type]}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {violationCount > 0 && (
                      <Badge badgeContent={violationCount} color="error">
                        <WarningIcon />
                      </Badge>
                    )}
                    <Tooltip title="Validate Constraint">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleValidateConstraint(constraint.id);
                        }}
                        disabled={isValidating}
                      >
                        <ValidateIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {constraint.description}
                </Typography>
                
                <Box sx={{ bgcolor: 'grey.50', p: 1, borderRadius: 1, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Rule:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {constraint.rule}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Last checked: {new Date(constraint.lastChecked).toLocaleString()}
                  </Typography>
                  <Chip 
                    label={constraint.isActive ? 'Active' : 'Inactive'}
                    color={constraint.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
              
              {constraint.violations.length > 0 && (
                <CardActions sx={{ pt: 0 }}>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConstraint(constraint);
                    }}
                  >
                    View {constraint.violations.filter(v => !v.resolved).length} Violations
                  </Button>
                </CardActions>
              )}
            </Card>
          );
        })}
      </Stack>

      {/* Constraint Details Panel */}
      {selectedConstraint && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Violations for "{selectedConstraint.name}"
          </Typography>
          
          {selectedConstraint.violations.length === 0 ? (
            <Alert severity="success">
              <Typography>No violations detected for this constraint.</Typography>
            </Alert>
          ) : (
            <List>
              {selectedConstraint.violations.map((violation, index) => {
                const SeverityIcon = SEVERITY_ICONS[violation.severity];
                return (
                  <React.Fragment key={violation.id}>
                    <ListItem>
                      <ListItemIcon>
                        <SeverityIcon sx={{ color: SEVERITY_COLORS[violation.severity] }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={violation.description}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {new Date(violation.timestamp).toLocaleString()}
                            </Typography>
                            {violation.resolved && (
                              <Typography variant="caption" color="success.main">
                                ✓ Resolved: {violation.resolutionNote}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <Chip 
                            label={violation.severity.toUpperCase()}
                            size="small"
                            sx={{ bgcolor: SEVERITY_COLORS[violation.severity], color: 'white' }}
                          />
                          {!violation.resolved && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleResolveViolation(violation)}
                            >
                              Resolve
                            </Button>
                          )}
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < selectedConstraint.violations.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      )}

      {/* Add Constraint Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Constraint</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Constraint Type</InputLabel>
              <Select
                value={newConstraint.type}
                label="Constraint Type"
                onChange={(e) => setNewConstraint(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="resource">Resource</MenuItem>
                <MenuItem value="business_rule">Business Rule</MenuItem>
                <MenuItem value="permission">Permission</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Constraint Name"
              value={newConstraint.name}
              onChange={(e) => setNewConstraint(prev => ({ ...prev, name: e.target.value }))}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={newConstraint.description}
              onChange={(e) => setNewConstraint(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <TextField
              fullWidth
              label="Rule Expression"
              multiline
              rows={3}
              value={newConstraint.rule}
              onChange={(e) => setNewConstraint(prev => ({ ...prev, rule: e.target.value }))}
              helperText="Enter a logical expression that defines this constraint"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddConstraint}
            variant="contained"
            disabled={!newConstraint.name || !newConstraint.rule}
          >
            Add Constraint
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Violation Dialog */}
      <Dialog open={showViolationDialog} onClose={() => setShowViolationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Violation</DialogTitle>
        <DialogContent>
          {selectedViolation && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" paragraph>
                <strong>Violation:</strong> {selectedViolation.description}
              </Typography>
              <TextField
                fullWidth
                label="Resolution Note"
                multiline
                rows={4}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe how this violation was resolved..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViolationDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitResolution}
            variant="contained"
            disabled={!resolutionNote.trim()}
          >
            Mark as Resolved
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};