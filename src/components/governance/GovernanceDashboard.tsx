/**
 * Governance Dashboard (Placeholder)
 * 
 * Complex governance dashboard no longer needed with simplified architecture.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

export const GovernanceDashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Governance Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Governance has been simplified to request-scoped processing. 
        Complex dashboards are no longer needed.
      </Typography>
    </Box>
  );
};