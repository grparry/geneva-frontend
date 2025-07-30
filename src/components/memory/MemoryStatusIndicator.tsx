import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Psychology as BrainIcon,
  Timeline as PatternIcon,
  Share as ShareIcon,
  Lightbulb as InsightIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Speed as PerformanceIcon
} from '@mui/icons-material';

interface MemoryContext {
  agent_id: string;
  memory_items: number;
  last_accessed: string;
  relevance_score: number;
  context_type: 'conversation' | 'domain' | 'learning';
}

interface CrossAgentLearning {
  source_agent: string;
  target_agent: string;
  insights_shared: number;
  learning_confidence: number;
  last_shared: string;
}

interface MemoryStats {
  total_cache_keys: number;
  total_items: number;
  memory_contexts: MemoryContext[];
  cross_agent_learning: CrossAgentLearning[];
  performance_metrics: {
    avg_query_time: number;
    cache_hit_rate: number;
    learning_accuracy: number;
  };
}

interface MemoryStatusIndicatorProps {
  agentId: string;
  roomId: string;
  onMemoryStatsUpdate?: (stats: MemoryStats) => void;
}

export const MemoryStatusIndicator: React.FC<MemoryStatusIndicatorProps> = ({
  agentId,
  roomId,
  onMemoryStatsUpdate
}) => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate fetching memory stats from backend
    const mockStats: MemoryStats = {
      total_cache_keys: 15,
      total_items: 47,
      memory_contexts: [
        {
          agent_id: agentId,
          memory_items: 8,
          last_accessed: new Date().toISOString(),
          relevance_score: 0.92,
          context_type: 'conversation'
        },
        {
          agent_id: agentId,
          memory_items: 5,
          last_accessed: new Date().toISOString(),
          relevance_score: 0.87,
          context_type: 'domain'
        }
      ],
      cross_agent_learning: [
        {
          source_agent: 'bradley_sentinel',
          target_agent: agentId,
          insights_shared: 3,
          learning_confidence: 0.89,
          last_shared: new Date().toISOString()
        },
        {
          source_agent: 'thedra_codex',
          target_agent: agentId,
          insights_shared: 2,
          learning_confidence: 0.94,
          last_shared: new Date().toISOString()
        }
      ],
      performance_metrics: {
        avg_query_time: 95,
        cache_hit_rate: 0.83,
        learning_accuracy: 0.91
      }
    };

    setMemoryStats(mockStats);
    onMemoryStatsUpdate?.(mockStats);
  }, [agentId, roomId, onMemoryStatsUpdate]);

  const getMemoryColor = () => {
    if (!memoryStats) return 'default';
    const totalItems = memoryStats.total_items;
    if (totalItems > 30) return 'success';
    if (totalItems > 15) return 'warning';
    return 'error';
  };

  const getMemoryIcon = () => {
    const color = getMemoryColor();
    return (
      <Badge
        badgeContent={memoryStats?.total_items || 0}
        color={color === 'success' ? 'success' : color === 'warning' ? 'warning' : 'error'}
        max={99}
      >
        <MemoryIcon />
      </Badge>
    );
  };

  const renderMemoryDetails = () => (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MemoryIcon color="primary" />
            <Typography variant="h6">Memory Status - {agentId}</Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {memoryStats && (
          <Box>
            {/* Memory Overview */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 Memory Overview
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip
                  icon={<MemoryIcon />}
                  label={`${memoryStats.total_items} Items`}
                  color="primary"
                />
                <Chip
                  icon={<BrainIcon />}
                  label={`${memoryStats.total_cache_keys} Cache Keys`}
                  color="secondary"
                />
                <Chip
                  icon={<PerformanceIcon />}
                  label={`${memoryStats.performance_metrics.avg_query_time}ms Avg`}
                  color={memoryStats.performance_metrics.avg_query_time < 100 ? 'success' : 'warning'}
                />
              </Box>
              
              {/* Performance Metrics */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Cache Hit Rate: {Math.round(memoryStats.performance_metrics.cache_hit_rate * 100)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={memoryStats.performance_metrics.cache_hit_rate * 100}
                  color={memoryStats.performance_metrics.cache_hit_rate > 0.8 ? 'success' : 'warning'}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Learning Accuracy: {Math.round(memoryStats.performance_metrics.learning_accuracy * 100)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={memoryStats.performance_metrics.learning_accuracy * 100}
                  color={memoryStats.performance_metrics.learning_accuracy > 0.9 ? 'success' : 'warning'}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Memory Contexts */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                🧠 Memory Contexts
              </Typography>
              <List>
                {memoryStats.memory_contexts.map((context, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {context.context_type === 'conversation' ? <BrainIcon /> :
                       context.context_type === 'domain' ? <PatternIcon /> : <InsightIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${context.context_type.charAt(0).toUpperCase()}${context.context_type.slice(1)} Context`}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {context.memory_items} items • Relevance: {Math.round(context.relevance_score * 100)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last accessed: {new Date(context.last_accessed).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        size="small"
                        label={`${Math.round(context.relevance_score * 100)}%`}
                        color={context.relevance_score > 0.9 ? 'success' : 'primary'}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Cross-Agent Learning */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                🤝 Cross-Agent Learning
              </Typography>
              <List>
                {memoryStats.cross_agent_learning.map((learning, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ShareIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`From ${learning.source_agent}`}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {learning.insights_shared} insights shared • Confidence: {Math.round(learning.learning_confidence * 100)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last shared: {new Date(learning.last_shared).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        size="small"
                        label={`${learning.insights_shared} insights`}
                        color="secondary"
                        icon={<TrendingUpIcon />}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  if (!memoryStats) {
    return (
      <Tooltip title="Memory Loading...">
        <Chip
          icon={<MemoryIcon />}
          label="Loading..."
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Memory Enhanced Agent
            </Typography>
            <Typography variant="caption">
              {memoryStats.total_items} memory items • {Math.round(memoryStats.performance_metrics.cache_hit_rate * 100)}% cache hit rate
            </Typography>
          </Box>
        }
      >
        <Chip
          icon={getMemoryIcon()}
          label={`Memory: ${memoryStats.total_items}`}
          size="small"
          color={getMemoryColor() as any}
          clickable
          onClick={() => setDialogOpen(true)}
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>
      
      {renderMemoryDetails()}
    </>
  );
};

export default MemoryStatusIndicator;