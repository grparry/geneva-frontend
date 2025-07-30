import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  Avatar,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Memory as MemoryIcon,
  Psychology as BrainIcon,
  Timeline as TimelineIcon,
  Lightbulb as InsightIcon,
  TrendingUp as TrendingUpIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  Star as StarIcon
} from '@mui/icons-material';

interface MemoryItem {
  id: string;
  content: string;
  relevance_score: number;
  created_at: string;
  memory_type: 'conversation' | 'learning' | 'insight' | 'pattern';
  source_agent?: string;
  metadata?: Record<string, any>;
}

interface AgentMemoryContext {
  agent_id: string;
  agent_name: string;
  memory_items: MemoryItem[];
  learning_patterns: {
    pattern_type: string;
    confidence: number;
    usage_count: number;
  }[];
  cross_agent_insights: {
    source_agent: string;
    insight: string;
    confidence: number;
    applied_count: number;
  }[];
}

interface ConversationMemoryPanelProps {
  roomId: string;
  activeAgents: string[];
  onMemoryItemSelect?: (item: MemoryItem) => void;
}

export const ConversationMemoryPanel: React.FC<ConversationMemoryPanelProps> = ({
  roomId,
  activeAgents,
  onMemoryItemSelect
}) => {
  const [memoryContexts, setMemoryContexts] = useState<AgentMemoryContext[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(true);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockContexts: AgentMemoryContext[] = [
      {
        agent_id: 'bradley_sentinel',
        agent_name: 'Bradley (Security)',
        memory_items: [
          {
            id: 'mem_1',
            content: 'User prefers security checklists to be concise and actionable',
            relevance_score: 0.95,
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            memory_type: 'learning',
            metadata: { category: 'user_preference', interaction_count: 5 }
          },
          {
            id: 'mem_2',
            content: 'Previous discussion about API security controls and access management',
            relevance_score: 0.87,
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            memory_type: 'conversation',
            metadata: { topic: 'api_security', relevance: 'high' }
          },
          {
            id: 'mem_3',
            content: 'Security audit patterns show preference for automated validation',
            relevance_score: 0.82,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            memory_type: 'pattern',
            metadata: { pattern_type: 'automation_preference' }
          }
        ],
        learning_patterns: [
          {
            pattern_type: 'concise_security_responses',
            confidence: 0.93,
            usage_count: 8
          },
          {
            pattern_type: 'automated_validation_preference',
            confidence: 0.87,
            usage_count: 5
          }
        ],
        cross_agent_insights: [
          {
            source_agent: 'thedra_codex',
            insight: 'Memory optimization techniques for security data',
            confidence: 0.91,
            applied_count: 3
          }
        ]
      },
      {
        agent_id: 'thedra_codex',
        agent_name: 'Thedra (Memory)',
        memory_items: [
          {
            id: 'mem_4',
            content: 'System memory optimization discussed - focus on semantic search performance',
            relevance_score: 0.92,
            created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            memory_type: 'conversation',
            metadata: { topic: 'memory_optimization', technical_level: 'high' }
          },
          {
            id: 'mem_5',
            content: 'Cross-agent learning pattern: Agents benefit from shared security insights',
            relevance_score: 0.89,
            created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
            memory_type: 'insight',
            source_agent: 'bradley_sentinel',
            metadata: { insight_type: 'collaboration_pattern' }
          }
        ],
        learning_patterns: [
          {
            pattern_type: 'memory_performance_optimization',
            confidence: 0.96,
            usage_count: 12
          }
        ],
        cross_agent_insights: [
          {
            source_agent: 'digby_claude',
            insight: 'Automation can help with memory cleanup and optimization',
            confidence: 0.88,
            applied_count: 2
          }
        ]
      }
    ];

    setMemoryContexts(mockContexts.filter(ctx => activeAgents.includes(ctx.agent_id)));
  }, [activeAgents, roomId]);

  const getMemoryTypeIcon = (type: MemoryItem['memory_type']) => {
    switch (type) {
      case 'conversation': return <HistoryIcon />;
      case 'learning': return <BrainIcon />;
      case 'insight': return <InsightIcon />;
      case 'pattern': return <TimelineIcon />;
      default: return <MemoryIcon />;
    }
  };

  const getMemoryTypeColor = (type: MemoryItem['memory_type']) => {
    switch (type) {
      case 'conversation': return 'primary';
      case 'learning': return 'success';
      case 'insight': return 'warning';
      case 'pattern': return 'info';
      default: return 'default';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'success';
    if (score >= 0.8) return 'warning';
    return 'error';
  };

  const filteredMemoryItems = (items: MemoryItem[]) => {
    if (!showOnlyRelevant) return items;
    return items.filter(item => item.relevance_score >= 0.8);
  };

  const handleAgentToggle = (agentId: string) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId);
  };

  if (memoryContexts.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <MemoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Memory Context Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Memory contexts will appear as agents build conversation history and learn patterns.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          🧠 Conversation Memory
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyRelevant}
              onChange={(e) => setShowOnlyRelevant(e.target.checked)}
              size="small"
            />
          }
          label="High relevance only"
        />
      </Box>

      {/* Agent Memory Contexts */}
      {memoryContexts.map((context) => (
        <Card key={context.agent_id} sx={{ mb: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            {/* Agent Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => handleAgentToggle(context.agent_id)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {context.agent_name[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {context.agent_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {filteredMemoryItems(context.memory_items).length} relevant memories
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  label={`${context.learning_patterns.length} patterns`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`${context.cross_agent_insights.length} insights`}
                  color="secondary"
                  variant="outlined"
                />
                <IconButton size="small">
                  {expandedAgent === context.agent_id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
            </Box>

            {/* Expanded Content */}
            <Collapse in={expandedAgent === context.agent_id}>
              <Box sx={{ mt: 2 }}>
                {/* Memory Items */}
                <Typography variant="subtitle2" gutterBottom>
                  💭 Memory Items
                </Typography>
                <List dense>
                  {filteredMemoryItems(context.memory_items).map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => onMemoryItemSelect?.(item)}
                    >
                      <ListItemIcon>
                        {getMemoryTypeIcon(item.memory_type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {item.content}
                            </Typography>
                            <Chip
                              size="small"
                              label={`${Math.round(item.relevance_score * 100)}%`}
                              color={getRelevanceColor(item.relevance_score) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={item.memory_type}
                              color={getMemoryTypeColor(item.memory_type) as any}
                              variant="outlined"
                            />
                            {item.source_agent && (
                              <Chip
                                size="small"
                                label={`From ${item.source_agent}`}
                                color="secondary"
                                variant="outlined"
                                icon={<ShareIcon />}
                              />
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {new Date(item.created_at).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Learning Patterns */}
                <Typography variant="subtitle2" gutterBottom>
                  📈 Learning Patterns
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {context.learning_patterns.map((pattern, index) => (
                    <Tooltip
                      key={index}
                      title={`Confidence: ${Math.round(pattern.confidence * 100)}% • Used: ${pattern.usage_count} times`}
                    >
                      <Chip
                        size="small"
                        label={pattern.pattern_type.replace(/_/g, ' ')}
                        color="success"
                        icon={<TrendingUpIcon />}
                      />
                    </Tooltip>
                  ))}
                </Box>

                {/* Cross-Agent Insights */}
                {context.cross_agent_insights.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      🤝 Cross-Agent Insights
                    </Typography>
                    <List dense>
                      {context.cross_agent_insights.map((insight, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon>
                            <ShareIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={insight.insight}
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={`From ${insight.source_agent}`}
                                  color="secondary"
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={`${Math.round(insight.confidence * 100)}% confidence`}
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={`Applied ${insight.applied_count}x`}
                                  color="success"
                                  variant="outlined"
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ConversationMemoryPanel;