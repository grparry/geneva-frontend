import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  PlayArrow as ConnectIcon,
  Stop as DisconnectIcon,
  Send as SendIcon
} from '@mui/icons-material';

interface ChatMessage {
  id: number;
  timestamp: string;
  type: string;
  data: any;
}

const ChatWebSocketTester: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageToSend, setMessageToSend] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageIdRef = useRef(0);

  const connectToRoom = async () => {
    if (!roomId.trim()) {
      setConnectionError('Please enter a room ID');
      return;
    }

    setConnectionError(null);
    const wsUrl = `ws://localhost:8080/api/chat/ws/${roomId.trim()}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        console.log('Connected to chat room:', roomId);
      };

      ws.onmessage = (event) => {
        const messageId = ++messageIdRef.current;
        let parsedData;
        
        try {
          parsedData = JSON.parse(event.data);
        } catch {
          parsedData = event.data;
        }

        const message: ChatMessage = {
          id: messageId,
          timestamp: new Date().toLocaleTimeString(),
          type: parsedData.type || 'unknown',
          data: parsedData
        };

        setMessages(prev => [message, ...prev.slice(0, 29)]); // Keep last 30 messages
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection failed');
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (event.code !== 1000) {
          setConnectionError(`Connection closed unexpectedly (code: ${event.code})`);
        }
        console.log('WebSocket closed');
      };

    } catch (error) {
      setConnectionError('Failed to create WebSocket connection');
      console.error('WebSocket creation error:', error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  };

  const sendMessage = () => {
    if (!wsRef.current || !isConnected || !messageToSend.trim()) {
      return;
    }

    const message = {
      type: 'message',
      content: messageToSend.trim(),
      user_id: 'phase6-tester'
    };

    wsRef.current.send(JSON.stringify(message));
    setMessageToSend('');
  };

  const createNewRoom = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Phase 6 Chat Test',
          customer_id: '00000000-0000-0000-0000-000000000000',
          project_id: '00000000-0000-0000-0000-000000000000',
          participants: ['phase6-tester']
        })
      });
      
      if (response.ok) {
        const roomData = await response.json();
        setRoomId(roomData.room_id);
        console.log('Created new room:', roomData.room_id);
      } else {
        setConnectionError('Failed to create room');
      }
    } catch (error) {
      setConnectionError('Error creating room');
      console.error('Room creation error:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        💬 Chat WebSocket Tester
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter room ID or create new room"
          size="small"
          sx={{ flex: 1, minWidth: 300 }}
        />
        
        <Button
          variant="outlined"
          onClick={createNewRoom}
          size="small"
        >
          Create New Room
        </Button>

        {!isConnected ? (
          <Button
            startIcon={<ConnectIcon />}
            variant="contained"
            onClick={connectToRoom}
            disabled={!roomId.trim()}
            size="small"
          >
            Connect
          </Button>
        ) : (
          <Button
            startIcon={<DisconnectIcon />}
            variant="contained"
            color="error"
            onClick={disconnect}
            size="small"
          >
            Disconnect
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Chip 
          label={isConnected ? 'Connected' : 'Disconnected'}
          color={isConnected ? 'success' : 'default'}
          size="small"
        />
        {isConnected && (
          <Typography variant="body2" color="text.secondary">
            Room: {roomId}
          </Typography>
        )}
      </Box>

      {connectionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {connectionError}
        </Alert>
      )}

      {isConnected && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={messageToSend}
            onChange={(e) => setMessageToSend(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button
            startIcon={<SendIcon />}
            variant="contained"
            onClick={sendMessage}
            disabled={!messageToSend.trim()}
            size="small"
          >
            Send
          </Button>
        </Box>
      )}

      <Typography variant="subtitle2" gutterBottom>
        Messages ({messages.length})
      </Typography>
      
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {messages.length === 0 ? (
          <Alert severity="info">
            No messages yet. Connect to a room to see real-time communication.
          </Alert>
        ) : (
          <List dense>
            {messages.map((message) => (
              <ListItem key={message.id} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <Card variant="outlined" sx={{ width: '100%' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip size="small" label={message.type} />
                      <Typography variant="caption" color="text.secondary">
                        {message.timestamp}
                      </Typography>
                    </Box>
                    <Box 
                      component="pre" 
                      sx={{ 
                        fontSize: '0.75rem', 
                        overflow: 'auto',
                        backgroundColor: '#f8f9fa',
                        p: 1,
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        margin: 0
                      }}
                    >
                      {JSON.stringify(message.data, null, 2)}
                    </Box>
                  </CardContent>
                </Card>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default ChatWebSocketTester;