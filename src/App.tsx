import React, { useState } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  AppBar, 
  Toolbar, 
  Box,
  Stack,
  Chip
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Chat as ChatIcon 
} from '@mui/icons-material';
import { StreamViewer } from './components/StreamViewer';
import { ConversationList } from './components/ConversationList';

function App() {
  const [selectedConversation, setSelectedConversation] = useState<string>('');

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
            <VisibilityIcon />
            <Typography variant="h6" component="div" fontWeight="bold">
              Geneva Platform
            </Typography>
            <Chip 
              label="Communication Monitor" 
              size="small" 
              variant="outlined" 
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
          </Stack>
          
          {selectedConversation && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <ChatIcon fontSize="small" />
              <Typography variant="body2">
                {selectedConversation.slice(0, 8)}...
              </Typography>
            </Stack>
          )}
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ flex: 1, py: 2, overflow: 'hidden' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <ConversationList onSelectConversation={setSelectedConversation} />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <StreamViewer conversationId={selectedConversation} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
