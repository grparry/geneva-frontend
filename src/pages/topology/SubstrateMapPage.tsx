import React from 'react';
import { Box, Typography } from '@mui/material';
import { SubstrateTopologyGraph } from '../../components/topology/SubstrateTopologyGraph';

export const SubstrateMapPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Substrate Topology Map
      </Typography>
      <Box sx={{ height: 'calc(100% - 50px)' }}>
        <SubstrateTopologyGraph />
      </Box>
    </Box>
  );
};