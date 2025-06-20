import React from 'react';
import { Box } from '@mui/material';
import { AlertingSystem } from '../components/AlertingSystem';

export const AlertingSystemPage: React.FC = () => {
  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <AlertingSystem autoEvaluate={true} evaluationInterval={30} />
    </Box>
  );
};