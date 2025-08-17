/**
 * Enhanced ACORN Chat Room (Placeholder)
 * 
 * Simplified version for backward compatibility.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

export const ACORNChatRoomEnhanced: React.FC<any> = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Enhanced ACORN Chat Room
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This enhanced version has been simplified. Use the standard ACORNChatRoom component instead.
      </Typography>
    </Box>
  );
};