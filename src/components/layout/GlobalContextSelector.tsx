import React, { useState } from 'react';
import {
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useCurrentTenant } from '../../store/tenantStore';
import { CustomerProjectSelector } from '../common/CustomerProjectSelector';

export const GlobalContextSelector: React.FC = () => {
  const { customer, project, contextString, hasContext } = useCurrentTenant();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleChipClick = () => {
    setDialogOpen(true);
  };

  const handleContextSelected = async (customerId: string, projectId: string) => {
    setDialogOpen(false);
    // The CustomerProjectSelector will handle the context switching
  };

  const getChipLabel = () => {
    if (!hasContext) {
      return 'Select Context';
    }
    
    // Truncate long context strings for header display
    if (contextString && contextString.length > 25) {
      return contextString.substring(0, 22) + '...';
    }
    return contextString || 'No Context';
  };

  return (
    <>
      <Chip
        icon={<BusinessIcon />}
        label={getChipLabel()}
        onClick={handleChipClick}
        color={hasContext ? 'primary' : 'default'}
        variant={hasContext ? 'filled' : 'outlined'}
        size="small"
        clickable
        sx={{
          maxWidth: 200,
          '& .MuiChip-label': {
            fontWeight: hasContext ? 'medium' : 'normal'
          },
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: 1
          }
        }}
      />

      {/* Context Selection Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" />
            <Typography variant="h6">Switch Context</Typography>
          </Box>
          <IconButton
            onClick={() => setDialogOpen(false)}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={3}>
            {/* Current Context Display */}
            {hasContext && (
              <>
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Current Context:
                  </Typography>
                  <Typography variant="body2">
                    <strong>{customer?.name}</strong> / <strong>{project?.name}</strong>
                  </Typography>
                  {project?.description && (
                    <Typography variant="caption" color="text.secondary">
                      {project.description}
                    </Typography>
                  )}
                </Box>
                <Divider>
                  <Chip label="Change to" size="small" variant="outlined" />
                </Divider>
              </>
            )}

            {/* Context Selection */}
            <CustomerProjectSelector onContextSelected={handleContextSelected} />

            {/* Help Text */}
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Changes will be applied to all open browser tabs
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};