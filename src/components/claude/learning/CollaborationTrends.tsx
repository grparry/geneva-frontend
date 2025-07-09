import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tooltip,
  Grid
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Psychology as PsychologyIcon,
  Star as StarIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import {
  CollaborationMetrics,
  LearningTrend,
  TrendDirection,
  AgentPerformance,
  TeamLearningData
} from '../../../types/learning';

interface CollaborationTrendsProps {
  metrics: CollaborationMetrics;
  trends: LearningTrend[];
  teamData: TeamLearningData[];
  period: string;
}

export const CollaborationTrends: React.FC<CollaborationTrendsProps> = ({
  metrics,
  trends,
  teamData,
  period
}) => {
  const getTrendIcon = (direction: TrendDirection) => {
    switch (direction) {
      case TrendDirection.IMPROVING: return <TrendingUpIcon color="success" />;
      case TrendDirection.DECLINING: return <TrendingDownIcon color="error" />;
      case TrendDirection.STABLE: return <TrendingFlatIcon color="info" />;
      case TrendDirection.VOLATILE: return <TrendingFlatIcon color="warning" />;
      default: return <TrendingFlatIcon />;
    }
  };

  const getTrendColor = (direction: TrendDirection) => {
    switch (direction) {
      case TrendDirection.IMPROVING: return 'success';
      case TrendDirection.DECLINING: return 'error';
      case TrendDirection.STABLE: return 'info';
      case TrendDirection.VOLATILE: return 'warning';
      default: return 'default';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const successRate = metrics.tasksCompleted > 0 ? (metrics.tasksSuccessful / metrics.tasksCompleted) * 100 : 0;
  const clarificationRate = metrics.clarificationsRequested > 0 ? (metrics.clarificationsResolved / metrics.clarificationsRequested) * 100 : 0;

  const topSkillAreas = useMemo(() => {
    const skillMap = new Map<string, { total: number, improving: number }>();
    
    teamData.forEach(member => {
      member.skillAreas.forEach(skill => {
        const existing = skillMap.get(skill.name) || { total: 0, improving: 0 };
        existing.total += skill.currentLevel;
        if (skill.progressRate > 0) {
          existing.improving += 1;
        }
        skillMap.set(skill.name, existing);
      });
    });

    return Array.from(skillMap.entries())
      .map(([name, data]) => ({
        name,
        averageLevel: data.total / teamData.length,
        improvingCount: data.improving
      }))
      .sort((a, b) => b.averageLevel - a.averageLevel)
      .slice(0, 5);
  }, [teamData]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Collaboration Trends - {period}
      </Typography>

      {/* Key Metrics Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <GroupIcon color="primary" />
                <Typography variant="subtitle2">Sessions</Typography>
              </Box>
              <Typography variant="h4">{metrics.totalSessions}</Typography>
              <Typography variant="caption" color="text.secondary">
                Avg: {formatDuration(metrics.averageSessionDuration)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="subtitle2">Success Rate</Typography>
              </Box>
              <Typography variant="h4">{Math.round(successRate)}%</Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.tasksSuccessful}/{metrics.tasksCompleted} tasks
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={successRate} 
                color={getScoreColor(successRate)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PsychologyIcon color="info" />
                <Typography variant="subtitle2">Clarifications</Typography>
              </Box>
              <Typography variant="h4">{Math.round(clarificationRate)}%</Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.clarificationsResolved}/{metrics.clarificationsRequested} resolved
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={clarificationRate} 
                color={getScoreColor(clarificationRate)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StarIcon color="warning" />
                <Typography variant="subtitle2">Satisfaction</Typography>
              </Box>
              <Typography variant="h4">{metrics.userSatisfactionScore.toFixed(1)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Out of 5.0
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(metrics.userSatisfactionScore / 5) * 100} 
                color={getScoreColor((metrics.userSatisfactionScore / 5) * 100)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Trend Analysis */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Trend Analysis
            </Typography>
            <Stack spacing={2}>
              {trends.slice(0, 4).map((trend) => (
                <Box key={trend.metric} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTrendIcon(trend.direction)}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {trend.metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip 
                      size="small"
                      label={`${trend.changePercentage > 0 ? '+' : ''}${trend.changePercentage.toFixed(1)}%`}
                      color={getTrendColor(trend.direction)}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {trend.period}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Top Performing Agents */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Agents
            </Typography>
            <List>
              {metrics.topPerformingAgents.slice(0, 5).map((agent, index) => (
                <ListItem key={agent.agentId} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#CD7F32' : 'primary.light',
                      color: index < 3 ? 'white' : 'primary.contrastText',
                      width: 32,
                      height: 32
                    }}>
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {agent.agentName}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={`${Math.round(agent.successRate * 100)}%`}
                          color={getScoreColor(agent.successRate * 100)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {agent.sessionsInvolved} sessions • {agent.userRating.toFixed(1)}/5 rating
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                          {agent.specializations.slice(0, 2).map(spec => (
                            <Chip 
                              key={spec} 
                              label={spec} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 18 }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Team Skill Development */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Team Skill Development
            </Typography>
            <Stack spacing={2}>
              {topSkillAreas.map((skill) => (
                <Box key={skill.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {skill.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {skill.improvingCount} improving
                      </Typography>
                      <TrendingUpIcon fontSize="small" color="success" />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={skill.averageLevel} 
                      sx={{ flex: 1 }}
                      color={getScoreColor(skill.averageLevel)}
                    />
                    <Typography variant="caption">
                      {Math.round(skill.averageLevel)}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Capability Usage */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Most Used Capabilities
            </Typography>
            <Stack spacing={1}>
              {metrics.capabilitiesUsed.slice(0, 6).map((capability, index) => (
                <Box key={capability} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  bgcolor: index < 3 ? 'primary.light' : 'grey.50',
                  borderRadius: 1
                }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                    {index + 1}
                  </Avatar>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {capability}
                  </Typography>
                  <SpeedIcon fontSize="small" color="action" />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Collaboration Score */}
      <Paper sx={{ p: 2, mt: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Overall Collaboration Score
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography variant="h2" color={`${getScoreColor(metrics.collaborationScore)}.main`}>
            {metrics.collaborationScore}
          </Typography>
          <Box>
            <Typography variant="body1" color="text.secondary">
              out of 100
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Based on success rate, efficiency, and satisfaction
            </Typography>
          </Box>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={metrics.collaborationScore} 
          color={getScoreColor(metrics.collaborationScore)}
          sx={{ mt: 2, height: 8, borderRadius: 4 }}
        />
      </Paper>
    </Box>
  );
};