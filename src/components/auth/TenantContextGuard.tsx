import React, { ReactNode } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTenantContext } from '../../contexts/TenantContext';
import { ContextSelectionPage } from '../../pages/ContextSelectionPage';

interface TenantContextGuardProps {
  children: ReactNode;
}

export const TenantContextGuard: React.FC<TenantContextGuardProps> = ({ children }) => {
  const { hasFullContext, isLoading } = useTenantContext();

  console.log('🔍 TenantContextGuard render:', {
    hasFullContext,
    isLoading,
    timestamp: Date.now()
  });

  // Show loading state while context is being committed
  if (isLoading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Setting up your workspace...
        </Typography>
      </Box>
    );
  }

  // Show context selection if no context is set
  if (!hasFullContext) {
    return <ContextSelectionPage />;
  }

  // Render children if context is available
  return <>{children}</>;
};