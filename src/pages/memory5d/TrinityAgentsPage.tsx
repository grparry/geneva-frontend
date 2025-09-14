/**
 * TrinityAgentsPage
 * Dedicated page for managing Trinity agents
 */

import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';

import { TrinityAgentPanel } from '../../components/memory5d';

export const TrinityAgentsPage: React.FC = () => {
  return (
    <Box>
      <TrinityAgentPanel
        showDetailedMetrics={true}
        refreshInterval={15000} // Refresh every 15 seconds for dedicated page
      />
    </Box>
  );
};