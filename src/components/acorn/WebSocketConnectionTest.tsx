import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useACORNWebSocket } from '../../hooks/useACORNWebSocket';
import { chatApi } from '../../api/chatApi';

interface WebSocketConnectionTestProps {
  roomId?: string;
}

export const WebSocketConnectionTest: React.FC<WebSocketConnectionTestProps> = ({ 
  roomId = 'test-room' 
}) => {
  const [connectionEvents, setConnectionEvents] = useState<string[]>([]);
  const [testMessages, setTestMessages] = useState<any[]>([]);

  const addEvent = (event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionEvents(prev => [`${timestamp}: ${event}`, ...prev.slice(0, 19)]); // Keep last 20 events
  };

  const addTestMessage = (message: any) => {
    setTestMessages(prev => [{ ...message, timestamp: new Date().toISOString() }, ...prev.slice(0, 9)]); // Keep last 10 messages
  };

  // Test chat WebSocket
  const chatWs = useACORNWebSocket({
    url: chatApi.getWebSocketUrl(roomId),
    enabled: true,
    reconnectInterval: 2000, // 2 seconds for testing
    maxReconnectAttempts: 5,
    onConnect: () => {
      addEvent('✅ Chat WebSocket Connected');
    },
    onDisconnect: () => {
      addEvent('❌ Chat WebSocket Disconnected');
    },
    onError: (error) => {
      addEvent(`🚫 Chat WebSocket Error: ${error?.message || 'Unknown error'}`);
    },
    onReconnectFailed: () => {
      addEvent('💥 Chat WebSocket Failed to Reconnect');
    },
    onMessage: (message) => {
      addEvent(`📨 Received message: ${message.type || 'unknown'}`);
      addTestMessage(message);
    }
  });

  // Test infrastructure WebSocket
  const infraWs = useACORNWebSocket({
    url: chatApi.getInfrastructureWebSocketUrl(),
    enabled: true,
    reconnectInterval: 2000, // 2 seconds for testing
    maxReconnectAttempts: 5,
    onConnect: () => {
      addEvent('✅ Infrastructure WebSocket Connected');
    },
    onDisconnect: () => {
      addEvent('❌ Infrastructure WebSocket Disconnected');
    },
    onError: (error) => {
      addEvent(`🚫 Infrastructure WebSocket Error: ${error?.message || 'Unknown error'}`);
    },
    onReconnectFailed: () => {
      addEvent('💥 Infrastructure WebSocket Failed to Reconnect');
    },
    onMessage: (message) => {
      addEvent(`📡 Infrastructure event: ${message.type || 'unknown'}`);
    }
  });

  const sendTestMessage = () => {
    const testMessage = {
      type: 'user',
      content: `Test message at ${new Date().toLocaleTimeString()}`,
      user_id: 'test-user',
      timestamp: new Date().toISOString()
    };

    const success = chatWs.send(testMessage);
    if (success) {
      addEvent('📤 Sent test message');
    } else {
      addEvent('🚫 Failed to send test message (not connected)');
    }
  };

  const forceReconnect = () => {
    addEvent('🔄 Manually triggering reconnection');
    chatWs.disconnect();
    infraWs.disconnect();
    setTimeout(() => {
      chatWs.connect();
      infraWs.connect();
    }, 1000);
  };

  const clearLogs = () => {
    setConnectionEvents([]);
    setTestMessages([]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        WebSocket Connection Test
      </Typography>
      
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Chat WebSocket
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {chatWs.isConnected ? <WifiIcon color="success" /> : <WifiOffIcon color="error" />}
            <Chip
              label={chatWs.isConnected ? 'Connected' : chatWs.isConnecting ? 'Connecting...' : 'Disconnected'}
              color={chatWs.isConnected ? 'success' : chatWs.isConnecting ? 'warning' : 'error'}
              size="small"
            />
          </Box>
          <Typography variant="caption" display="block">
            Reconnect attempts: {chatWs.reconnectAttempts}/5
          </Typography>
          {chatWs.lastError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {chatWs.lastError}
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Infrastructure WebSocket
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {infraWs.isConnected ? <WifiIcon color="success" /> : <WifiOffIcon color="error" />}
            <Chip
              label={infraWs.isConnected ? 'Connected' : infraWs.isConnecting ? 'Connecting...' : 'Disconnected'}
              color={infraWs.isConnected ? 'success' : infraWs.isConnecting ? 'warning' : 'error'}
              size="small"
            />
          </Box>
          <Typography variant="caption" display="block">
            Reconnect attempts: {infraWs.reconnectAttempts}/5
          </Typography>
          {infraWs.lastError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {infraWs.lastError}
            </Alert>
          )}
        </Paper>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={sendTestMessage}
          disabled={!chatWs.isConnected}
        >
          Send Test Message
        </Button>
        <Button
          variant="outlined"
          onClick={forceReconnect}
          startIcon={<RefreshIcon />}
        >
          Force Reconnect
        </Button>
        <Button
          variant="outlined"
          onClick={clearLogs}
        >
          Clear Logs
        </Button>
      </Stack>

      <Stack direction="row" spacing={2}>
        <Paper sx={{ p: 2, flex: 1, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Connection Events ({connectionEvents.length})
          </Typography>
          <List dense>
            {connectionEvents.map((event, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={event}
                  primaryTypographyProps={{ 
                    variant: 'caption',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem'
                  }}
                />
              </ListItem>
            ))}
            {connectionEvents.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No events yet"
                  primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              </ListItem>
            )}
          </List>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Test Messages ({testMessages.length})
          </Typography>
          <List dense>
            {testMessages.map((message, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={`${message.type}: ${message.content || 'No content'}`}
                  secondary={new Date(message.timestamp).toLocaleTimeString()}
                  primaryTypographyProps={{ 
                    variant: 'caption',
                    fontSize: '0.75rem'
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    fontSize: '0.65rem'
                  }}
                />
              </ListItem>
            ))}
            {testMessages.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No messages yet"
                  primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Stack>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Testing Instructions:</strong>
          <br />
          1. Verify both WebSockets connect successfully
          <br />
          2. Send test messages when connected
          <br />
          3. Test reconnection by clicking "Force Reconnect"
          <br />
          4. Observe automatic reconnection attempts in the events log
          <br />
          5. Check that connections recover after network issues
        </Typography>
      </Alert>
    </Box>
  );
};