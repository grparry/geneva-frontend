import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Chip
} from '@mui/material';
import {
  Business as BusinessIcon,
  Folder as ProjectIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useTenantContext } from '../contexts/TenantContext';
import type { Customer, Project } from '../store/projectStore';

export const ContextSelectionPage: React.FC = () => {
  const {
    availableCustomers,
    availableProjects,
    selectedCustomerId,
    selectedProjectId,
    setSelectedCustomerId,
    setSelectedProjectId,
    commitContext,
    loadCustomers,
    isLoading,
    error
  } = useTenantContext();

  console.log('🔍 ContextSelectionPage render:', {
    customersLength: availableCustomers.length,
    projectsLength: availableProjects.length,
    selectedCustomerId,
    selectedProjectId,
    isLoading,
    availableCustomersRef: availableCustomers,
    availableProjectsRef: availableProjects,
    timestamp: Date.now()
  });

  const selectedCustomer = availableCustomers.find(c => c.id === selectedCustomerId);
  const selectedProject = availableProjects.find(p => p.id === selectedProjectId);
  const canContinue = selectedCustomer && selectedProject && !isLoading;

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
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }} elevation={3}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
              <BusinessIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h4" component="h1" textAlign="center" fontWeight="bold">
              Welcome to Geneva Platform
            </Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary">
              Please select your customer and project to continue
            </Typography>
          </Stack>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Manual Load Button for Testing */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Button variant="outlined" onClick={loadCustomers}>
              Load Customers (Manual)
            </Button>
          </Box>

          {/* Selection Form */}
          <Stack spacing={3}>
            {/* Customer Selection */}
            <FormControl fullWidth>
              <InputLabel>Customer / Organization</InputLabel>
              <Select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                startAdornment={<BusinessIcon sx={{ mr: 1, color: 'action.active' }} />}
              >
                {availableCustomers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {renderCustomerOption(customer)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Project Selection */}
            <FormControl fullWidth disabled={!selectedCustomerId}>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={!selectedCustomerId}
                startAdornment={<ProjectIcon sx={{ mr: 1, color: 'action.active' }} />}
              >
                {availableProjects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {renderProjectOption(project)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Selection Summary */}
            {selectedCustomer && selectedProject && (
              <>
                <Divider />
                <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    <CheckIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Selected Context:
                  </Typography>
                  <Typography variant="body2">
                    <strong>{selectedCustomer.name}</strong> / <strong>{selectedProject.name}</strong>
                  </Typography>
                  {selectedProject.description && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedProject.description}
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {/* Continue Button */}
            <Button
              variant="contained"
              size="large"
              onClick={() => commitContext()}
              disabled={!canContinue}
              startIcon={isLoading ? <CircularProgress size={20} /> : <CheckIcon />}
              fullWidth
            >
              {isLoading ? 'Loading Platform...' : 'Continue to Geneva Platform'}
            </Button>

            {/* Help Text */}
            <Typography variant="caption" textAlign="center" color="text.secondary">
              Your selection will be saved and applied across all browser tabs
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};