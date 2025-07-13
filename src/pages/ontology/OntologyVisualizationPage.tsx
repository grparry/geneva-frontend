import React from 'react';
import { Box, Typography } from '@mui/material';
import { OntologyGraphViewer } from '../../components/ontology/OntologyGraphViewer';

export const OntologyVisualizationPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Ontology Visualization
      </Typography>
      <Box sx={{ height: 'calc(100% - 50px)' }}>
        <OntologyGraphViewer />
      </Box>
    </Box>
  );
};