import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Stack,
  LinearProgress,
  Tooltip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Group as GroupIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  LearningInsight,
  InsightType,
  InsightSeverity,
  ActionItem
} from '../../../types/learning';

interface InsightCardProps {
  insight: LearningInsight;
  onActionTaken?: (actionId: string) => void;
  onDismiss?: (insightId: string) => void;
  compact?: boolean;
}

const INSIGHT_ICONS = {
  [InsightType.PATTERN_RECOGNITION]: <PsychologyIcon />,
  [InsightType.COLLABORATION_IMPROVEMENT]: <GroupIcon />,
  [InsightType.SKILL_DEVELOPMENT]: <TrendingUpIcon />,
  [InsightType.EFFICIENCY_GAIN]: <SpeedIcon />,
  [InsightType.QUALITY_IMPROVEMENT]: <StarIcon />,
  [InsightType.KNOWLEDGE_GAP]: <WarningIcon />,
  [InsightType.TOOL_ADOPTION]: <AssignmentIcon />,
  [InsightType.PROCESS_OPTIMIZATION]: <LightbulbIcon />
};

const SEVERITY_COLORS = {
  [InsightSeverity.HIGH]: 'error',
  [InsightSeverity.MEDIUM]: 'warning',
  [InsightSeverity.LOW]: 'info'
} as const;

const SEVERITY_ICONS = {
  [InsightSeverity.HIGH]: <WarningIcon />,
  [InsightSeverity.MEDIUM]: <InfoIcon />,
  [InsightSeverity.LOW]: <InfoIcon />
};

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onActionTaken,
  onDismiss,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [actionExpanded, setActionExpanded] = useState(false);

  const handleActionClick = (actionId: string) => {
    onActionTaken?.(actionId);
  };

  const getActionStatusColor = (status: ActionItem['status']) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'primary';
      case 'PENDING': return 'default';
      case 'DISMISSED': return 'default';
      default: return 'default';
    }
  };

  const getActionStatusIcon = (status: ActionItem['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircleIcon fontSize="small" />;
      case 'IN_PROGRESS': return <ScheduleIcon fontSize="small" />;
      default: return null;
    }
  };

  const completedActions = insight.actionItems.filter(a => a.status === 'COMPLETED').length;
  const totalActions = insight.actionItems.length;

  if (compact) {
    return (
      <Card sx={{ mb: 1 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: `${SEVERITY_COLORS[insight.severity]}.light` 
            }}>
              {INSIGHT_ICONS[insight.type]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {insight.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {insight.description}
              </Typography>
            </Box>
            <Chip 
              size="small" 
              label={insight.severity} 
              color={SEVERITY_COLORS[insight.severity]}
              icon={SEVERITY_ICONS[insight.severity]}
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: `${SEVERITY_COLORS[insight.severity]}.light`,
              width: 48,
              height: 48
            }}>
              {INSIGHT_ICONS[insight.type]}
            </Avatar>
            <Box>
              <Typography variant="h6" gutterBottom>
                {insight.title}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip 
                  size="small" 
                  label={insight.severity} 
                  color={SEVERITY_COLORS[insight.severity]}
                  icon={SEVERITY_ICONS[insight.severity]}
                />
                <Chip 
                  size="small" 
                  label={insight.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  variant="outlined"
                />
                <Chip 
                  size="small" 
                  label={`${Math.round(insight.confidence * 100)}% confidence`}
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              {insight.timeframe}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              {insight.affectedUsers.length} user{insight.affectedUsers.length !== 1 ? 's' : ''} affected
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" paragraph>
          {insight.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Identified Pattern:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {insight.pattern}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Impact:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {insight.impact}
          </Typography>
        </Box>

        {insight.actionItems.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Action Items ({completedActions}/{totalActions} completed)
              </Typography>
              {totalActions > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(completedActions / totalActions) * 100}
                    sx={{ flex: 1 }}
                  />
                  <Typography variant="caption">
                    {Math.round((completedActions / totalActions) * 100)}%
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Accordion expanded={actionExpanded} onChange={(_, isExpanded) => setActionExpanded(isExpanded)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2">
                  View {insight.actionItems.length} action item{insight.actionItems.length !== 1 ? 's' : ''}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {insight.actionItems.map((action) => (
                    <ListItem 
                      key={action.id}
                      sx={{ 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        mb: 1,
                        bgcolor: action.status === 'COMPLETED' ? 'success.light' : 'background.paper'
                      }}
                    >
                      <ListItemIcon>
                        {getActionStatusIcon(action.status) || <AssignmentIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {action.title}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={action.priority} 
                              color={
                                action.priority === 'HIGH' ? 'error' : 
                                action.priority === 'MEDIUM' ? 'warning' : 'default'
                              }
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {action.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Typography variant="caption">
                                Effort: {action.estimatedEffort}
                              </Typography>
                              <Typography variant="caption">
                                Impact: {action.potentialImpact}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      {action.status === 'PENDING' && (
                        <Button 
                          size="small" 
                          onClick={() => handleActionClick(action.id)}
                          color="primary"
                        >
                          Start
                        </Button>
                      )}
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        <Accordion expanded={expanded} onChange={(_, isExpanded) => setExpanded(isExpanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">
              View detailed analysis
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {insight.recommendations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations:
                  </Typography>
                  <List dense>
                    {insight.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <LightbulbIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {insight.evidence.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Supporting Evidence:
                  </Typography>
                  <List dense>
                    {insight.evidence.map((evidence, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={evidence}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {insight.relatedCapabilities.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Related Capabilities:
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {insight.relatedCapabilities.map((capability) => (
                      <Chip 
                        key={capability} 
                        label={capability} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {insight.affectedUsers.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Affected Users:
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {insight.affectedUsers.map((user) => (
                      <Chip 
                        key={user} 
                        label={user} 
                        size="small"
                        avatar={<Avatar sx={{ width: 20, height: 20 }}>{user.charAt(0).toUpperCase()}</Avatar>}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Updated {new Date(insight.updatedAt).toLocaleDateString()}
        </Typography>
        {onDismiss && (
          <Button size="small" onClick={() => onDismiss(insight.id)}>
            Dismiss
          </Button>
        )}
      </CardActions>
    </Card>
  );
};