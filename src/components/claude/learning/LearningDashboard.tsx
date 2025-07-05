import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  DatePicker,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Group as GroupIcon,
  Insights as InsightsIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { InsightCard } from './InsightCard';
import { CollaborationTrends } from './CollaborationTrends';
import { TeamLearningHeatmap } from './TeamLearningHeatmap';
import { useLearningInsights } from '../../../hooks/useLearningInsights';
import {
  LearningFilter,
  InsightType,
  InsightSeverity,
  LearningInsight
} from '../../../types/learning';

interface LearningDashboardProps {
  userId?: string;
  teamId?: string;
}

export const LearningDashboard: React.FC<LearningDashboardProps> = ({
  userId,
  teamId
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterForm, setFilterForm] = useState<LearningFilter>({});
  
  const {
    dashboardData,
    loading,
    error,
    refreshData,
    dismissInsight,
    takeAction,
    applyFilter,
    currentFilter
  } = useLearningInsights({
    enabled: true,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  });

  const handleFilterSubmit = () => {
    applyFilter(filterForm);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilterForm({});
    applyFilter({});
    setShowFilters(false);
  };

  const exportData = () => {
    if (!dashboardData) return;
    
    const exportData = {
      exportDate: new Date().toISOString(),
      insights: dashboardData.insights,
      metrics: dashboardData.metrics,
      trends: dashboardData.trends
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-insights-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTabIcon = (index: number) => {
    switch (index) {
      case 0: return <InsightsIcon />;
      case 1: return <TrendingUpIcon />;
      case 2: return <GroupIcon />;
      case 3: return <PsychologyIcon />;
      default: return null;
    }
  };

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const getInsightStats = () => {
    if (!dashboardData) return { total: 0, high: 0, pending: 0 };
    
    const insights = dashboardData.insights;
    return {
      total: insights.length,
      high: insights.filter(i => i.severity === InsightSeverity.HIGH).length,
      pending: insights.reduce((sum, i) => sum + i.actionItems.filter(a => a.status === 'PENDING').length, 0)
    };
  };

  const stats = getInsightStats();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Learning Insights Dashboard
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => setShowFilters(!showFilters)} color="primary">
              <FilterIcon />
            </IconButton>
            <Button
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={exportData}
              disabled={!dashboardData}
              variant="outlined"
            >
              Export
            </Button>
          </Stack>
        </Box>

        {dashboardData && (
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatLastUpdated(dashboardData.lastUpdated)} • 
            {stats.total} insights • {stats.high} high priority • {stats.pending} pending actions
          </Typography>
        )}
      </Box>

      {/* Filters */}
      {showFilters && (
        <Accordion expanded sx={{ mb: 3 }}>
          <AccordionSummary>
            <Typography variant="h6">Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Insight Type</InputLabel>
                  <Select
                    multiple
                    value={filterForm.insightTypes || []}
                    onChange={(e) => setFilterForm(prev => ({ 
                      ...prev, 
                      insightTypes: e.target.value as InsightType[] 
                    }))}
                    label="Insight Type"
                  >
                    {Object.values(InsightType).map(type => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severity</InputLabel>
                  <Select
                    multiple
                    value={filterForm.severity || []}
                    onChange={(e) => setFilterForm(prev => ({ 
                      ...prev, 
                      severity: e.target.value as InsightSeverity[] 
                    }))}
                    label="Severity"
                  >
                    {Object.values(InsightSeverity).map(severity => (
                      <MenuItem key={severity} value={severity}>
                        {severity}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Users (comma-separated)"
                  value={filterForm.users?.join(', ') || ''}
                  onChange={(e) => setFilterForm(prev => ({ 
                    ...prev, 
                    users: e.target.value.split(',').map(u => u.trim()).filter(Boolean)
                  }))}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={handleFilterSubmit} size="small">
                    Apply
                  </Button>
                  <Button variant="outlined" onClick={clearFilters} size="small">
                    Clear
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && !dashboardData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Dashboard Content */}
      {dashboardData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {dashboardData.insights.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Insights
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error">
                    {stats.high}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Priority
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Actions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {dashboardData.metrics.collaborationScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Collaboration Score
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={selectedTab} 
              onChange={(_, newValue) => setSelectedTab(newValue)}
              variant="fullWidth"
            >
              <Tab icon={getTabIcon(0)} label="Insights" />
              <Tab icon={getTabIcon(1)} label="Trends" />
              <Tab icon={getTabIcon(2)} label="Team Heatmap" />
              <Tab icon={getTabIcon(3)} label="Recommendations" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Learning Insights
              </Typography>
              {Object.keys(currentFilter).length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Showing filtered results. 
                  <Button size="small" onClick={clearFilters} sx={{ ml: 1 }}>
                    Clear filters
                  </Button>
                </Alert>
              )}
              <Stack spacing={2}>
                {dashboardData.insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onActionTaken={takeAction}
                    onDismiss={dismissInsight}
                  />
                ))}
                {dashboardData.insights.length === 0 && (
                  <Alert severity="info">
                    No insights match the current filters.
                  </Alert>
                )}
              </Stack>
            </Box>
          )}

          {selectedTab === 1 && (
            <CollaborationTrends
              metrics={dashboardData.metrics}
              trends={dashboardData.trends}
              teamData={dashboardData.teamData}
              period={dashboardData.metrics.period}
            />
          )}

          {selectedTab === 2 && (
            <TeamLearningHeatmap
              teamData={dashboardData.teamData}
              timeRange={dashboardData.metrics.period}
            />
          )}

          {selectedTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Actionable Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                High-impact insights with defined action items that can improve team performance.
              </Typography>
              <Stack spacing={2}>
                {dashboardData.recommendations.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onActionTaken={takeAction}
                    onDismiss={dismissInsight}
                  />
                ))}
                {dashboardData.recommendations.length === 0 && (
                  <Alert severity="success">
                    Great! No actionable recommendations at this time. 
                    Your team is performing well across all areas.
                  </Alert>
                )}
              </Stack>
            </Box>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !dashboardData && !error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No learning data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Start using Claude Code to generate learning insights
          </Typography>
          <Button variant="contained" onClick={refreshData} sx={{ mt: 2 }}>
            Load Data
          </Button>
        </Box>
      )}
    </Container>
  );
};