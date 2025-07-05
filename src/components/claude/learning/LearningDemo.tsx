import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Tabs,
  Tab,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Insights as InsightsIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { LearningDashboard } from './LearningDashboard';
import { InsightCard } from './InsightCard';
import { CollaborationTrends } from './CollaborationTrends';
import { TeamLearningHeatmap } from './TeamLearningHeatmap';
import { useLearningInsights } from '../../../hooks/useLearningInsights';

export const LearningDemo: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showFullDashboard, setShowFullDashboard] = useState(false);

  const { dashboardData, loading } = useLearningInsights({ enabled: true });

  const demoScenarios = [
    {
      title: 'React Team Performance Boost',
      description: 'Frontend team shows 40% improvement in React development',
      impact: 'High',
      color: 'success'
    },
    {
      title: 'API Integration Knowledge Gap',
      description: 'Multiple developers struggling with complex API patterns',
      impact: 'Medium',
      color: 'warning'
    },
    {
      title: 'Testing Automation Success',
      description: 'Team adoption of automated testing reducing bugs by 65%',
      impact: 'High',
      color: 'success'
    }
  ];

  if (showFullDashboard) {
    return (
      <Box>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowFullDashboard(false)}
          >
            ← Back to Demo
          </Button>
        </Box>
        <LearningDashboard />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto', my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Learning Insights Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases Claude's learning analytics system that identifies patterns,
        tracks team collaboration trends, and provides actionable recommendations for improvement.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab icon={<InsightsIcon />} label="Sample Insights" />
          <Tab icon={<TrendingUpIcon />} label="Trends" />
          <Tab icon={<GroupIcon />} label="Team Heatmap" />
          <Tab icon={<PsychologyIcon />} label="Full Dashboard" />
        </Tabs>
      </Box>

      {selectedTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Sample Learning Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            These insights are automatically generated from team collaboration patterns,
            task completion data, and capability usage analytics.
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {demoScenarios.map((scenario, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {scenario.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {scenario.description}
                    </Typography>
                    <Chip 
                      label={`${scenario.impact} Impact`}
                      color={scenario.color as any}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {dashboardData && dashboardData.insights.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Live Insight Example:
              </Typography>
              <InsightCard
                insight={dashboardData.insights[0]}
                compact={false}
              />
            </Box>
          )}
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Collaboration Trends
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Track team performance metrics, success rates, and capability adoption over time.
          </Typography>

          {dashboardData && !loading ? (
            <CollaborationTrends
              metrics={dashboardData.metrics}
              trends={dashboardData.trends}
              teamData={dashboardData.teamData}
              period={dashboardData.metrics.period}
            />
          ) : (
            <Alert severity="info">
              Loading collaboration trends data...
            </Alert>
          )}
        </Box>
      )}

      {selectedTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Team Learning Heatmap
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Visualize skill levels and learning progress across team members.
          </Typography>

          {dashboardData && !loading ? (
            <TeamLearningHeatmap
              teamData={dashboardData.teamData}
              timeRange={dashboardData.metrics.period}
            />
          ) : (
            <Alert severity="info">
              Loading team learning data...
            </Alert>
          )}
        </Box>
      )}

      {selectedTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Full Learning Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Experience the complete learning insights dashboard with all features.
          </Typography>

          <Stack spacing={2}>
            <Alert severity="info">
              The full dashboard provides comprehensive analytics including:
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Pattern recognition and insights</li>
                <li>Collaboration trend analysis</li>
                <li>Team skill development heatmap</li>
                <li>Actionable recommendations</li>
                <li>Export and filtering capabilities</li>
              </ul>
            </Alert>

            <Button
              variant="contained"
              size="large"
              startIcon={<PlayIcon />}
              onClick={() => setShowFullDashboard(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              Launch Full Dashboard
            </Button>
          </Stack>
        </Box>
      )}

      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          How Learning Insights Work:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • **Pattern Recognition**: Analyzes collaboration patterns and task completion data<br/>
          • **Trend Analysis**: Tracks performance metrics over time<br/>
          • **Skill Mapping**: Monitors individual and team skill development<br/>
          • **Actionable Recommendations**: Provides specific steps to improve performance<br/>
          • **Automated Insights**: Updates continuously as teams work with Claude
        </Typography>
      </Box>
    </Paper>
  );
};