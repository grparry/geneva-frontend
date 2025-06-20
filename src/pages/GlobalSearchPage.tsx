import React from 'react';
import { Box } from '@mui/material';
import { GlobalSearch } from '../components/GlobalSearch';

export const GlobalSearchPage: React.FC = () => {
  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <GlobalSearch />
    </Box>
  );
};