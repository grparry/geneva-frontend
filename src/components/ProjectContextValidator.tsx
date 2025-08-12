/**
 * Project Context Validator Component
 * Helps users understand and fix project context issues for API security
 */

import React from 'react';
import { Alert, Button, Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { 
  Warning as WarningIcon, 
  CheckCircle as CheckIcon, 
  Error as ErrorIcon,
  Settings as SettingsIcon 
} from '@mui/icons-material';
import { useProjectContext } from '../store/projectStore';

interface ProjectContextValidatorProps {
  onShowProjectSelector?: () => void;
  showDetails?: boolean;
}

export const ProjectContextValidator: React.FC<ProjectContextValidatorProps> = ({ 
  onShowProjectSelector,
  showDetails = true 
}) => {
  const projectContext = useProjectContext();

  // Check for various context issues
  const hasCustomer = !!projectContext.customer;
  const hasProject = !!projectContext.project;
  const hasValidCustomerId = projectContext.customer?.id && projectContext.customer.id !== 'default';
  const hasValidProjectId = projectContext.project?.id && projectContext.project.id.match(/^[0-9a-f-]{36}$/i);
  
  const isFullyValid = hasCustomer && hasProject && hasValidCustomerId && hasValidProjectId;

  // Determine alert severity
  let severity: 'error' | 'warning' | 'info' | 'success' = 'success';
  let title = 'Project Context Valid';
  let description = 'All security requirements are met for API access.';

  if (!hasCustomer || !hasProject) {
    severity = 'error';
    title = 'Project Context Required';
    description = 'You must select both a customer and project to access secure API endpoints.';
  } else if (!hasValidCustomerId) {
    severity = 'error';
    title = 'Invalid Customer Context';
    description = 'The selected customer context is invalid. Please select a valid customer.';
  } else if (!hasValidProjectId) {
    severity = 'warning';
    title = 'Invalid Project ID Format';
    description = 'The selected project has an invalid ID format. This may cause API errors.';
  }

  // Don't show anything if everything is valid - no need to clutter the UI
  if (isFullyValid) {
    return null;
  }

  const validationItems = [
    {
      label: 'Customer Selected',
      valid: hasCustomer,
      description: hasCustomer ? `Selected: ${projectContext.customer?.name}` : 'No customer selected'
    },
    {
      label: 'Valid Customer ID',
      valid: hasValidCustomerId,
      description: hasValidCustomerId ? 
        `Customer ID: ${projectContext.customer?.id}` : 
        projectContext.customer?.id === 'default' ? 'Using default customer (not allowed)' : 'Invalid customer ID'
    },
    {
      label: 'Project Selected',
      valid: hasProject,
      description: hasProject ? `Selected: ${projectContext.project?.name}` : 'No project selected'
    },
    {
      label: 'Valid Project ID Format',
      valid: hasValidProjectId,
      description: hasValidProjectId ? 
        `Project ID: ${projectContext.project?.id}` : 
        'Project ID must be a valid UUID format'
    }
  ];

  return (
    <Alert 
      severity={severity} 
      sx={{ mb: 2 }}
      action={
        !isFullyValid && onShowProjectSelector && (
          <Button
            color="inherit"
            size="small"
            startIcon={<SettingsIcon />}
            onClick={onShowProjectSelector}
          >
            Fix Context
          </Button>
        )
      }
    >
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {description}
        </Typography>
        
        {showDetails && (
          <List dense sx={{ mt: 1 }}>
            {validationItems.map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {item.valid ? (
                    <CheckIcon color="success" sx={{ fontSize: 20 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ fontSize: 20 }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {severity === 'error' && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            💡 Tip: Use the "Select Project" button to configure your customer and project context.
          </Typography>
        )}
      </Box>
    </Alert>
  );
};

export default ProjectContextValidator;