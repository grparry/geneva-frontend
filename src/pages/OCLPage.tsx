/**
 * OCL Page
 * Main page for OCL (Organizational Communication Layer) interface
 */

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { Home, Mail } from '@mui/icons-material';
import { OCLMessageInbox } from '../components/ocl';

export const OCLPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <Mail sx={{ mr: 0.5 }} fontSize="inherit" />
          OCL Messages
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Organizational Communication Layer
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Unified message management across all communication channels
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Message Inbox */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ height: 600 }}>
            <OCLMessageInbox
              showFilters={true}
              onMessageSelect={(message) => {
                console.log('Selected message:', message);
              }}
              onThreadSelect={(threadId) => {
                console.log('Selected thread:', threadId);
              }}
            />
          </Paper>
        </Box>

        {/* Sidebar - Future components */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, height: 600 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Additional OCL components will be added here:
            </Typography>
            <Box component="ul" sx={{ mt: 2, pl: 2 }}>
              <Typography component="li" variant="body2">
                Thread View
              </Typography>
              <Typography component="li" variant="body2">
                Search & Filters
              </Typography>
              <Typography component="li" variant="body2">
                Subscription Manager
              </Typography>
              <Typography component="li" variant="body2">
                Analytics Dashboard
              </Typography>
              <Typography component="li" variant="body2">
                Message Actions
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default OCLPage;