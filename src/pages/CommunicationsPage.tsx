import React from 'react';
import { Grid } from '@mui/material';
import { StreamViewer } from '../components/StreamViewer';
import { ConversationList } from '../components/ConversationList';

export const CommunicationsPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = React.useState<string>('');

  return (
    <Grid container spacing={2} sx={{ height: '100%', p: 2 }}>
      <Grid size={{ xs: 12, md: 3 }}>
        <ConversationList onSelectConversation={setSelectedConversation} />
      </Grid>
      <Grid size={{ xs: 12, md: 9 }}>
        <StreamViewer conversationId={selectedConversation} />
      </Grid>
    </Grid>
  );
};