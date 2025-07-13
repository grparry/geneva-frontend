import React from 'react';
import { Box, Typography } from '@mui/material';
import { AgentSchemaBrowser } from '../../components/ontology/AgentSchemaBrowser';

export const AgentSchemaPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Agent Schema Browser
      </Typography>
      <Box sx={{ height: 'calc(100% - 50px)' }}>
        <AgentSchemaBrowser />
      </Box>
    </Box>
  );
};