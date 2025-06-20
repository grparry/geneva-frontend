import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Collapse,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
  Memory as MemoryIcon,
  Api as ApiIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  message_id: string;
  source_agent_id: string;
  target_agent_id: string;
  communication_type: string;
  direction: string;
  message_type: string;
  content: string;
  timestamp: string;
  metadata: any;
  tokens_used?: number;
  processing_duration_ms?: number;
}

interface StreamMessageProps {
  message: Message;
  isLast?: boolean;
  highlight?: boolean;
}

export const StreamMessage: React.FC<StreamMessageProps> = ({ 
  message, 
  isLast = false,
  highlight = false 
}) => {
  const [expanded, setExpanded] = useState(isLast);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [message.content]);

  const getMessageIcon = () => {
    switch (message.communication_type) {
      case 'claude':
        return message.direction === 'request' ? <PersonIcon /> : <SmartToyIcon />;
      case 'inter_agent':
        return <PersonIcon />;
      case 'memory_service':
        return <MemoryIcon />;
      case 'external_api':
        return <ApiIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  const getMessageColor = () => {
    switch (message.communication_type) {
      case 'claude':
        return message.direction === 'request' ? 'primary.light' : 'secondary.light';
      case 'inter_agent':
        return 'info.light';
      case 'memory_service':
        return 'warning.light';
      case 'external_api':
        return 'error.light';
      default:
        return 'grey.100';
    }
  };

  const getAgentName = (agentId: string) => {
    // Format agent names nicely
    if (agentId === 'claude') return 'Claude';
    if (agentId === 'memory_service') return 'Memory Service';
    if (agentId.includes('_')) {
      return agentId.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return agentId;
  };

  const renderToolUse = (toolData: any) => {
    if (!toolData) return null;

    return (
      <Card variant="outlined" sx={{ mt: 1, bgcolor: 'action.hover' }}>
        <CardContent sx={{ py: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <BuildIcon fontSize="small" />
            <Typography variant="subtitle2">
              Tool: {toolData.tool_name || 'Unknown'}
            </Typography>
          </Stack>
          
          {toolData.input && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Input:</Typography>
              <SyntaxHighlighter
                language="json"
                style={tomorrow}
                customStyle={{ 
                  margin: 0, 
                  fontSize: '0.75rem',
                  background: 'transparent'
                }}
              >
                {JSON.stringify(toolData.input, null, 2)}
              </SyntaxHighlighter>
            </Box>
          )}

          {toolData.output && (
            <Box>
              <Typography variant="caption" color="text.secondary">Output:</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {typeof toolData.output === 'string' ? toolData.output : JSON.stringify(toolData.output, null, 2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    if (message.message_type === 'tool_use' && message.metadata?.tool) {
      return renderToolUse(message.metadata.tool);
    }

    if (showRaw) {
      return (
        <SyntaxHighlighter
          language="text"
          style={tomorrow}
          customStyle={{ margin: 0, borderRadius: 4 }}
        >
          {message.content}
        </SyntaxHighlighter>
      );
    }

    // Check if content looks like code or JSON
    const isCodeLike = message.content.includes('```') || 
                      message.content.startsWith('{') || 
                      message.content.startsWith('[');

    if (isCodeLike || message.communication_type === 'claude') {
      return (
        <Box sx={{ 
          '& pre': { 
            backgroundColor: 'grey.100',
            borderRadius: 1,
            overflow: 'auto',
            margin: 0
          },
          '& code': {
            backgroundColor: 'grey.100',
            px: 0.5,
            borderRadius: 0.5,
            fontSize: '0.875rem'
          },
          '& p': {
            margin: '0.5rem 0',
            '&:first-of-type': { marginTop: 0 },
            '&:last-of-type': { marginBottom: 0 }
          }
        }}>
          <ReactMarkdown
            components={{
              code: ({ className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : 'text';
                const isInline = !className;
                
                return !isInline ? (
                  <SyntaxHighlighter
                    language={language}
                    style={tomorrow}
                    customStyle={{ margin: 0, borderRadius: 4 }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </Box>
      );
    }

    // For simple text content
    return (
      <Typography 
        variant="body2" 
        sx={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: message.communication_type === 'inter_agent' ? 'inherit' : 'monospace'
        }}
      >
        {message.content}
      </Typography>
    );
  };

  const shouldCollapse = message.content.length > 300;

  return (
    <Paper 
      elevation={highlight ? 3 : 1} 
      sx={{ 
        mb: 2, 
        backgroundColor: highlight ? 'action.selected' : getMessageColor(),
        transition: 'all 0.3s ease-in-out',
        border: highlight ? 2 : 0,
        borderColor: highlight ? 'primary.main' : 'transparent'
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Message Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
          <Avatar sx={{ 
            width: 36, 
            height: 36,
            bgcolor: message.communication_type === 'claude' && message.direction === 'response' 
              ? 'secondary.main' : 'primary.main'
          }}>
            {getMessageIcon()}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {getAgentName(message.source_agent_id)}
              {message.target_agent_id && (
                <>
                  {' → '}
                  {getAgentName(message.target_agent_id)}
                </>
              )}
            </Typography>
            
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Chip 
                label={message.communication_type} 
                size="small" 
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              <Chip 
                label={message.message_type} 
                size="small" 
                variant="filled"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              <Typography variant="caption" color="text.secondary">
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
              {message.tokens_used && (
                <Typography variant="caption" color="text.secondary">
                  {message.tokens_used} tokens
                </Typography>
              )}
              {message.processing_duration_ms && (
                <Typography variant="caption" color="text.secondary">
                  {message.processing_duration_ms}ms
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={0}>
            <Tooltip title={copied ? 'Copied!' : 'Copy content'}>
              <IconButton size="small" onClick={handleCopy}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={showRaw ? 'Formatted view' : 'Raw view'}>
              <IconButton size="small" onClick={() => setShowRaw(!showRaw)}>
                {showRaw ? <VisibilityIcon fontSize="small" /> : <CodeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {shouldCollapse && (
              <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {/* Message Content */}
        <Collapse in={expanded || !shouldCollapse} timeout={300}>
          {renderContent()}
        </Collapse>

        {!expanded && shouldCollapse && (
          <Box sx={{ mt: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {message.content}
            </Typography>
          </Box>
        )}

        {/* Metadata Display */}
        {expanded && message.metadata && Object.keys(message.metadata).length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Metadata:
              </Typography>
              {message.metadata.protocol && (
                <Chip 
                  label={`Protocol: ${message.metadata.protocol}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              )}
              {message.metadata.project_id && (
                <Chip 
                  label={`Project: ${message.metadata.project_id.slice(0, 8)}...`} 
                  size="small" 
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              )}
              {message.metadata.trace_id && (
                <Chip 
                  label={`Trace: ${message.metadata.trace_id.slice(0, 8)}...`} 
                  size="small" 
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              )}
            </Box>
          </>
        )}

        {/* Copy Success Alert */}
        {copied && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Content copied to clipboard!
          </Alert>
        )}
      </Box>
    </Paper>
  );
};