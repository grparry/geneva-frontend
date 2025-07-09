import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, Button, TextField, Chip, Alert } from '@mui/material';

interface WebSocketMessage {
  id: number;
  timestamp: string;
  type: string;
  data: any;
  endpoint: string;
}

interface ConnectionStatus {
  endpoint: string;
  connected: boolean;
  error?: string;
  messageCount: number;
}

const WebSocketTester: React.FC = () => {
  const [connections, setConnections] = useState<Map<string, WebSocket>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<Map<string, ConnectionStatus>>(new Map());
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const messageIdRef = useRef(0);

  const endpoints = [
    'ws://localhost:8080/api/workers/progress',
    'ws://localhost:8080/api/workers/progress/test-task-123',
    'ws://localhost:8080/api/chat/ws/test-room-123',
  ];

  const connectToEndpoint = (endpoint: string) => {
    // Close existing connection if any
    const existingWs = connections.get(endpoint);
    if (existingWs) {
      existingWs.close();
    }

    const ws = new WebSocket(endpoint);
    
    ws.onopen = () => {
      console.log(`✅ Connected to ${endpoint}`);
      setConnectionStatus(prev => new Map(prev.set(endpoint, {
        endpoint,
        connected: true,
        messageCount: 0
      })));
    };

    ws.onmessage = (event) => {
      const messageId = ++messageIdRef.current;
      let parsedData;
      
      try {
        parsedData = JSON.parse(event.data);
      } catch {
        parsedData = event.data;
      }

      const message: WebSocketMessage = {
        id: messageId,
        timestamp: new Date().toLocaleTimeString(),
        type: parsedData.type || 'unknown',
        data: parsedData,
        endpoint
      };

      setMessages(prev => [message, ...prev.slice(0, 49)]); // Keep last 50 messages
      
      setConnectionStatus(prev => {
        const status = prev.get(endpoint);
        if (status) {
          return new Map(prev.set(endpoint, {
            ...status,
            messageCount: status.messageCount + 1
          }));
        }
        return prev;
      });
    };

    ws.onerror = (error) => {
      console.error(`❌ WebSocket error on ${endpoint}:`, error);
      setConnectionStatus(prev => new Map(prev.set(endpoint, {
        endpoint,
        connected: false,
        error: 'Connection failed',
        messageCount: 0
      })));
    };

    ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed on ${endpoint} (code: ${event.code})`);
      setConnectionStatus(prev => {
        const status = prev.get(endpoint);
        if (status) {
          return new Map(prev.set(endpoint, {
            ...status,
            connected: false
          }));
        }
        return prev;
      });
      connections.delete(endpoint);
    };

    setConnections(prev => new Map(prev.set(endpoint, ws)));
  };

  const disconnectFromEndpoint = (endpoint: string) => {
    const ws = connections.get(endpoint);
    if (ws) {
      ws.close();
      connections.delete(endpoint);
      setConnectionStatus(prev => {
        const newStatus = new Map(prev);
        newStatus.delete(endpoint);
        return newStatus;
      });
    }
  };

  const sendTestMessage = (endpoint: string) => {
    const ws = connections.get(endpoint);
    if (ws && ws.readyState === WebSocket.OPEN) {
      const testMessage = {
        action: 'subscribe',
        scope: 'global',
        scope_id: '*',
        event_types: ['coordination_event', 'tool_progress', 'agent_communication']
      };
      ws.send(JSON.stringify(testMessage));
    }
  };

  const clearMessages = () => {
    setMessages([]);
    messageIdRef.current = 0;
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      connections.forEach(ws => ws.close());
    };
  }, []);

  const getStatusColor = (status?: ConnectionStatus) => {
    if (!status) return 'default';
    if (status.connected) return 'success';
    if (status.error) return 'error';
    return 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🚀 Geneva Phase 6 WebSocket Tester
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Predefined Endpoints
        </Typography>
        
        {endpoints.map(endpoint => {
          const status = connectionStatus.get(endpoint);
          return (
            <Box key={endpoint} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace' }}>
                {endpoint}
              </Typography>
              
              <Chip 
                label={status?.connected ? `Connected (${status.messageCount} msgs)` : 'Disconnected'} 
                color={getStatusColor(status)}
                size="small"
              />
              
              {status?.connected ? (
                <>
                  <Button 
                    size="small" 
                    onClick={() => sendTestMessage(endpoint)}
                    variant="outlined"
                  >
                    Send Test
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => disconnectFromEndpoint(endpoint)}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={() => connectToEndpoint(endpoint)}
                >
                  Connect
                </Button>
              )}
            </Box>
          );
        })}
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Custom Endpoint
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            placeholder="ws://localhost:8080/custom/endpoint"
            size="small"
            sx={{ flex: 1 }}
          />
          <Button 
            variant="contained" 
            onClick={() => customEndpoint && connectToEndpoint(customEndpoint)}
            disabled={!customEndpoint}
          >
            Connect
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Real-time Messages ({messages.length})
          </Typography>
          <Button size="small" onClick={clearMessages}>
            Clear Messages
          </Button>
        </Box>
        
        {messages.length === 0 ? (
          <Alert severity="info">
            No messages received yet. Connect to an endpoint to see real-time updates.
          </Alert>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {messages.map(message => (
              <Paper key={message.id} elevation={1} sx={{ p: 2, mb: 1, fontSize: '0.875rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="primary">
                    {message.endpoint}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {message.timestamp}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Type: {message.type}
                </Typography>
                
                <Box 
                  component="pre" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    overflow: 'auto', 
                    backgroundColor: '#f5f5f5', 
                    p: 1, 
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {JSON.stringify(message.data, null, 2)}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WebSocketTester;