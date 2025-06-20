import React from 'react';
import { Box } from '@mui/material';
import { PatternAnalyzer } from '../components/PatternAnalyzer';

export const PatternAnalysisPage: React.FC = () => {
  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <PatternAnalyzer autoRefresh={true} timeRange="24h" />
    </Box>
  );
};