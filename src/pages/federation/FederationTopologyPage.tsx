import React from 'react';
import { Box } from '@mui/material';
import { FederationTopologyGraph } from '../../components/federation/FederationTopologyGraph';
import { useFederationStore } from '../../store/federationStore';

export const FederationTopologyPage: React.FC = () => {
  const { currentSubstrate, peers } = useFederationStore();
  
  if (!currentSubstrate) {
    return (
      <Box sx={{ p: 3 }}>
        Loading federation data...
      </Box>
    );
  }
  
  return <FederationTopologyGraph currentSubstrate={currentSubstrate} peers={peers} />;
};