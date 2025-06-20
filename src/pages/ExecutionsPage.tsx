import React from 'react';
import { Box } from '@mui/material';
import { ExecutionSplitView } from '../components/ExecutionSplitView';

export const ExecutionsPage: React.FC = () => {
  return (
    <Box sx={{ height: '100%' }}>
      <ExecutionSplitView />
    </Box>
  );
};