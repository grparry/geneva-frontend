import React from 'react';
import { Box } from '@mui/material';
import { MultiStreamDashboard } from '../components/MultiStreamDashboard';

export const MultiStreamPage: React.FC = () => {
  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <MultiStreamDashboard maxStreams={6} defaultLayout="grid" />
    </Box>
  );
};