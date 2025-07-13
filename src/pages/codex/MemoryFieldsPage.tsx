import React from 'react';
import { Box, Typography } from '@mui/material';
import { MemoryFieldsViewer } from '../../components/ontology/MemoryFieldsViewer';

export const MemoryFieldsPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Memory Field Mappings
      </Typography>
      <Box sx={{ height: 'calc(100% - 50px)' }}>
        <MemoryFieldsViewer agent={{ id: 'demo-agent', name: 'Demo Agent', type: 'demo', status: 'active' }} />
      </Box>
    </Box>
  );
};