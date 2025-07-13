import React from 'react';
import { Box, Typography } from '@mui/material';
import { DelegationFlowMap } from '../../components/topology/DelegationFlowMap';

export const DelegationFlowPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Delegation Flow Analysis
      </Typography>
      <Box sx={{ height: 'calc(100% - 50px)' }}>
        <DelegationFlowMap />
      </Box>
    </Box>
  );
};