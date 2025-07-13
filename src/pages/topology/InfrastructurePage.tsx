import React from 'react';
import { Box, Typography } from '@mui/material';
import { InfrastructureMap } from '../../components/topology/InfrastructureMap';

export const InfrastructurePage: React.FC = () => {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Infrastructure Map
      </Typography>
      <Box sx={{ height: 'calc(100% - 50px)' }}>
        <InfrastructureMap />
      </Box>
    </Box>
  );
};