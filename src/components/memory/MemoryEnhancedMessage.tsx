import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Avatar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Psychology as BrainIcon,
  Lightbulb as InsightIcon,
  Timeline as PatternIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

interface MemoryContext {
  id: string;
  content: string;
  relevance_score: number;
  memory_type: 'conversation' | 'learning' | 'insight' | 'pattern';
  source: string;
  timestamp: string;
}

interface AgentLearning {
  pattern_applied: string;
  confidence: number;
  source_agent?: string;
  learning_type: 'user_preference' | 'cross_agent' | 'pattern_recognition';
}

interface Message {
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  user_id?: string;
  agent_id?: string;
  media_items?: any[];
  // Memory enhancement fields
  memory_enhanced?: boolean;
  memory_context?: MemoryContext[];
  learning_applied?: AgentLearning[];
  cross_agent_insights?: string[];
}

interface AgentProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  status: 'idle' | 'thinking' | 'responding';
}

interface MemoryEnhancedMessageProps {
  message: Message;
  agent?: AgentProfile;
  index: number;
  onMemoryContextClick?: (context: MemoryContext) => void;
}

export const MemoryEnhancedMessage: React.FC<MemoryEnhancedMessageProps> = ({
  message,
  agent,
  index,
  onMemoryContextClick
}) => {
  const [showMemoryDetails, setShowMemoryDetails] = useState(false);
  const isUser = message.type === 'user';

  const getMemoryTypeIcon = (type: MemoryContext['memory_type']) => {
    switch (type) {
      case 'conversation': return <HistoryIcon />;
      case 'learning': return <BrainIcon />;
      case 'insight': return <InsightIcon />;
      case 'pattern': return <PatternIcon />;
      default: return <MemoryIcon />;
    }
  };

  const getMemoryTypeColor = (type: MemoryContext['memory_type']) => {
    switch (type) {
      case 'conversation': return 'primary';
      case 'learning': return 'success';
      case 'insight': return 'warning';
      case 'pattern': return 'info';
      default: return 'default';
    }
  };

  const getLearningTypeIcon = (type: AgentLearning['learning_type']) => {
    switch (type) {
      case 'user_preference': return <BrainIcon />;
      case 'cross_agent': return <ShareIcon />;
      case 'pattern_recognition': return <PatternIcon />;
      default: return <TrendingUpIcon />;
    }
  };

  const renderMemoryIndicator = () => {
    if (!message.memory_enhanced) return null;

    const memoryCount = (message.memory_context?.length || 0);
    const learningCount = (message.learning_applied?.length || 0);
    const insightCount = (message.cross_agent_insights?.length || 0);

    return (
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, alignItems: 'center' }}>
        {memoryCount > 0 && (
          <Tooltip title={`${memoryCount} memory contexts used`}>
            <Chip
              size="small"
              icon={<MemoryIcon />}
              label={memoryCount}
              color="primary"
              variant="outlined"
              clickable
              onClick={() => setShowMemoryDetails(!showMemoryDetails)}
            />
          </Tooltip>
        )}
        
        {learningCount > 0 && (
          <Tooltip title={`${learningCount} learning patterns applied`}>
            <Chip
              size="small"
              icon={<BrainIcon />}
              label={learningCount}
              color="success"
              variant="outlined"
            />
          </Tooltip>
        )}
        
        {insightCount > 0 && (
          <Tooltip title={`${insightCount} cross-agent insights used`}>
            <Chip
              size="small"
              icon={<ShareIcon />}
              label={insightCount}
              color="secondary"
              variant="outlined"
            />
          </Tooltip>
        )}

        {(memoryCount > 0 || learningCount > 0 || insightCount > 0) && (
          <IconButton
            size="small"
            onClick={() => setShowMemoryDetails(!showMemoryDetails)}
            sx={{ ml: 0.5 }}
          >
            {showMemoryDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
    );
  };

  const renderMemoryDetails = () => {
    if (!showMemoryDetails || !message.memory_enhanced) return null;

    return (
      <Collapse in={showMemoryDetails}>
        <Card sx={{ mt: 2, bgcolor: 'background.default' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🧠 Memory Enhancement Details
            </Typography>

            {/* Memory Context */}
            {message.memory_context && message.memory_context.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Memory Context Used:
                </Typography>
                <List dense>
                  {message.memory_context.map((context) => (
                    <ListItem
                      key={context.id}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => onMemoryContextClick?.(context)}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {getMemoryTypeIcon(context.memory_type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {context.content}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={context.memory_type}
                              color={getMemoryTypeColor(context.memory_type) as any}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            <Chip
                              size="small"
                              label={`${Math.round(context.relevance_score * 100)}%`}
                              color={context.relevance_score > 0.9 ? 'success' : 'primary'}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Learning Applied */}
            {message.learning_applied && message.learning_applied.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Learning Patterns Applied:
                </Typography>
                <List dense>
                  {message.learning_applied.map((learning, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {getLearningTypeIcon(learning.learning_type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {learning.pattern_applied.replace(/_/g, ' ')}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={learning.learning_type.replace(/_/g, ' ')}
                              color="success"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            <Chip
                              size="small"
                              label={`${Math.round(learning.confidence * 100)}% confidence`}
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            {learning.source_agent && (
                              <Chip
                                size="small"
                                label={`From ${learning.source_agent}`}
                                color="secondary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Cross-Agent Insights */}
            {message.cross_agent_insights && message.cross_agent_insights.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Cross-Agent Insights:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {message.cross_agent_insights.map((insight, index) => (
                    <Chip
                      key={index}
                      size="small"
                      label={insight}
                      color="secondary"
                      icon={<ShareIcon />}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Collapse>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 2,
        maxWidth: '100%'
      }}
    >
      {!isUser && agent && (
        <Avatar
          sx={{
            bgcolor: agent.color,
            mr: 1,
            position: 'relative'
          }}
        >
          {agent.avatar}
          {message.memory_enhanced && (
            <Box
              sx={{
                position: 'absolute',
                top: -4,
                right: -4,
                bgcolor: 'primary.main',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 2,
                borderColor: 'background.paper'
              }}
            >
              <MemoryIcon sx={{ fontSize: 10, color: 'white' }} />
            </Box>
          )}
        </Avatar>
      )}
      
      <Box
        sx={{
          maxWidth: message.media_items && message.media_items.length > 0 ? '90%' : '70%',
          bgcolor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'white' : 'text.primary',
          borderRadius: 2,
          p: 2,
          ml: isUser ? 2 : 0,
          mr: isUser ? 0 : 2,
          position: 'relative'
        }}
      >
        {agent && !isUser && (
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
            {agent.name}
            {message.memory_enhanced && (
              <Chip
                size="small"
                label="Memory Enhanced"
                color="primary"
                variant="outlined"
                sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
              />
            )}
          </Typography>
        )}
        
        {message.content && (
          <Typography variant="body1" sx={{ mb: message.media_items ? 1 : 0 }}>
            {message.content}
          </Typography>
        )}
        
        {/* Multi-modal content would go here */}
        {message.media_items && message.media_items.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {/* MultiModalViewer component would be rendered here */}
            <Typography variant="caption" color="text.secondary">
              Media content ({message.media_items.length} items)
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>

        {/* Memory Enhancement Indicator */}
        {renderMemoryIndicator()}
        
        {/* Memory Details */}
        {renderMemoryDetails()}
      </Box>
    </Box>
  );
};

export default MemoryEnhancedMessage;