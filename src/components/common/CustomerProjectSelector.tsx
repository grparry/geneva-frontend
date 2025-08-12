import React, { useState, useEffect } from 'react';
import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Box,
  Chip
} from '@mui/material';
import {
  Business as BusinessIcon,
  Folder as ProjectIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useTenantContext } from '../../contexts/TenantContext';
import type { Customer, Project } from '../../store/projectStore';

interface CustomerProjectSelectorProps {
  onContextSelected: (customerId: string, projectId: string) => void;
  initialCustomerId?: string;
  initialProjectId?: string;
}

export const CustomerProjectSelector: React.FC<CustomerProjectSelectorProps> = ({
  onContextSelected,
  initialCustomerId,
  initialProjectId
}) => {
  const {
    availableCustomers,
    availableProjects,
    selectedCustomerId: contextSelectedCustomerId,
    selectedProjectId: contextSelectedProjectId,
    setSelectedCustomerId: contextSetSelectedCustomerId,
    setSelectedProjectId: contextSetSelectedProjectId,
    commitContext,
    loadCustomers,
    loadProjects,
    isLoading,
    error
  } = useTenantContext();

  // Use local state for this component, initialized from props or context
  const [localSelectedCustomerId, setLocalSelectedCustomerId] = useState(
    initialCustomerId || contextSelectedCustomerId || ''
  );
  const [localSelectedProjectId, setLocalSelectedProjectId] = useState(
    initialProjectId || contextSelectedProjectId || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load customers on mount if not already loaded
  useEffect(() => {
    if (availableCustomers.length === 0) {
      loadCustomers();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load projects when customer is selected (only if context hasn't already loaded them)
  useEffect(() => {
    if (localSelectedCustomerId && localSelectedCustomerId !== contextSelectedCustomerId) {
      // The context's setSelectedCustomerId will handle loading projects
      // So we don't need to call loadProjects directly here
      console.log('🔄 CustomerProjectSelector: Customer selection will be handled by context');
    }
  }, [localSelectedCustomerId, contextSelectedCustomerId]);

  // Auto-select if only one customer available
  useEffect(() => {
    if (availableCustomers.length === 1 && !localSelectedCustomerId) {
      const customerId = availableCustomers[0].id;
      setLocalSelectedCustomerId(customerId);
      // Also update the main context to keep states in sync
      contextSetSelectedCustomerId(customerId);
    }
  }, [availableCustomers.length, localSelectedCustomerId, contextSetSelectedCustomerId]);

  // Auto-select if only one project available
  useEffect(() => {
    if (availableProjects.length === 1 && localSelectedCustomerId && !localSelectedProjectId) {
      const projectId = availableProjects[0].id;
      setLocalSelectedProjectId(projectId);
      // Also update the main context to keep states in sync
      contextSetSelectedProjectId(projectId);
    }
  }, [availableProjects.length, localSelectedCustomerId, localSelectedProjectId, contextSetSelectedProjectId]);

  const handleCustomerChange = (customerId: string) => {
    setLocalSelectedCustomerId(customerId);
    setLocalSelectedProjectId(''); // Clear project selection
    // Update context - this will trigger loadProjects via the context's setSelectedCustomerId handler
    contextSetSelectedCustomerId(customerId);
  };

  const handleSubmit = async () => {
    if (!localSelectedCustomerId || !localSelectedProjectId) return;
    
    setIsSubmitting(true);
    try {
      // Update context with selections
      contextSetSelectedCustomerId(localSelectedCustomerId);
      contextSetSelectedProjectId(localSelectedProjectId);
      // Commit the context
      await commitContext();
      // Notify parent
      onContextSelected(localSelectedCustomerId, localSelectedProjectId);
    } catch (error) {
      console.error('Failed to switch context:', error);
      setIsSubmitting(false);
    }
  };

  const selectedCustomer = availableCustomers.find(c => c.id === localSelectedCustomerId);
  const selectedProject = availableProjects.find(p => p.id === localSelectedProjectId);
  const canSubmit = selectedCustomer && selectedProject && !isSubmitting && !isLoading;

  const renderCustomerOption = (customer: Customer) => (
    <Box key={customer.id}>
      <Typography variant="body2" fontWeight="medium">
        {customer.name}
      </Typography>
      {customer.organization && (
        <Typography variant="caption" color="text.secondary">
          {customer.organization}
        </Typography>
      )}
    </Box>
  );

  const renderProjectOption = (project: Project) => (
    <Box key={project.id} sx={{ width: '100%' }}>
      <Typography variant="body2" fontWeight="medium">
        {project.name}
      </Typography>
      {project.description && (
        <Typography variant="caption" color="text.secondary" noWrap>
          {project.description}
        </Typography>
      )}
      <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
        <Chip
          label={project.status}
          size="small"
          color={project.status === 'active' ? 'success' : 'default'}
          variant="outlined"
        />
        {project.settings?.acorn_enabled && (
          <Chip label="ACORN" size="small" variant="outlined" color="primary" />
        )}
        {project.settings?.memory_enhanced && (
          <Chip label="Memory" size="small" variant="outlined" color="secondary" />
        )}
      </Box>
    </Box>
  );

  return (
    <Stack spacing={2}>
      {/* Error Display */}
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      {/* Customer Selection */}
      <FormControl fullWidth>
        <InputLabel>Customer / Organization</InputLabel>
        <Select
          value={localSelectedCustomerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          disabled={isLoading}
          startAdornment={<BusinessIcon sx={{ mr: 1, color: 'action.active' }} />}
        >
          {availableCustomers.map((customer) => (
            <MenuItem key={customer.id} value={customer.id}>
              {renderCustomerOption(customer)}
            </MenuItem>
          ))}
        </Select>
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Loading customers...
            </Typography>
          </Box>
        )}
      </FormControl>

      {/* Project Selection */}
      <FormControl fullWidth disabled={!localSelectedCustomerId}>
        <InputLabel>Project</InputLabel>
        <Select
          value={localSelectedProjectId}
          onChange={(e) => setLocalSelectedProjectId(e.target.value)}
          disabled={!localSelectedCustomerId || isLoading}
          startAdornment={<ProjectIcon sx={{ mr: 1, color: 'action.active' }} />}
        >
          {availableProjects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {renderProjectOption(project)}
            </MenuItem>
          ))}
        </Select>
        {isLoading && localSelectedCustomerId && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Loading projects...
            </Typography>
          </Box>
        )}
      </FormControl>

      {/* Submit Button */}
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!canSubmit}
        startIcon={isSubmitting || isLoading ? <CircularProgress size={20} /> : <CheckIcon />}
        fullWidth
      >
        {isSubmitting || isLoading
          ? 'Switching Context...' 
          : 'Apply Selection'
        }
      </Button>

      {/* Selection Summary */}
      {selectedCustomer && selectedProject && (
        <Box sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
            Selected:
          </Typography>
          <Typography variant="body2">
            <strong>{selectedCustomer.name}</strong> / <strong>{selectedProject.name}</strong>
          </Typography>
        </Box>
      )}
    </Stack>
  );
};