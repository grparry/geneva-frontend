/**
 * Agent Performance Analytics Page
 * Monitor and optimize agent utilization and efficiency
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  AvatarGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Rating,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
  Divider,
  Alert,
} from '@mui/material';
import {
  PersonRounded,
  GroupsRounded,
  SpeedRounded,
  TrendingUpRounded,
  TrendingDownRounded,
  AccessTimeRounded,
  CheckCircleRounded,
  ErrorRounded,
  InfoRounded,
  CompareArrowsRounded,
  GridViewRounded,
  ViewListRounded,
  MoreVertRounded,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Sankey,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

import { useAgentPerformance } from '../../hooks/useAnalytics';
import { useMetricSubscription } from '../../hooks/useAnalyticsWebSocket';
import AnalyticsErrorBoundary from '../../components/analytics/AnalyticsErrorBoundary';
import { AgentPerformanceSkeleton } from '../../components/analytics/AnalyticsLoadingSkeleton';

// Agent type icons and colors
const agentTypeConfig: Record<string, { icon: string; color: string }> = {
  'Iris': { icon: '🎯', color: '#4caf50' },
  'Bradley': { icon: '📊', color: '#ff9800' },
  'Greta': { icon: '📝', color: '#9c27b0' },
  'default': { icon: '🤖', color: '#757575' },
};

// Agent card component
const AgentCard: React.FC<{
  agent: any;
  viewMode: 'grid' | 'list';
  onViewDetails?: (agentId: string) => void;
}> = ({ agent, viewMode, onViewDetails }) => {
  const theme = useTheme();
  const config = agentTypeConfig[agent.agent_type] || agentTypeConfig.default;
  
  if (viewMode === 'list') {
    return (
      <TableRow hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: config.color }}>
              {config.icon}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {agent.agent_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {agent.agent_type}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell align="center">{agent.total_calls.toLocaleString()}</TableCell>
        <TableCell align="center">
          <Chip
            label={agent.successRateFormatted}
            size="small"
            color={agent.successRate >= 90 ? 'success' : agent.successRate >= 70 ? 'warning' : 'error'}
          />
        </TableCell>
        <TableCell align="center">{agent.avgResponseTimeFormatted}</TableCell>
        <TableCell align="center">{agent.totalCostFormatted}</TableCell>
        <TableCell align="center">
          <Rating
            value={agent.efficiency_score / 20}
            readOnly
            size="small"
          />
        </TableCell>
        <TableCell align="center">
          <IconButton size="small" onClick={() => onViewDetails?.(agent.agent_id)}>
            <MoreVertRounded />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
      onClick={() => onViewDetails?.(agent.agent_id)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: config.color, width: 56, height: 56, mr: 2 }}>
            <Typography variant="h6">{config.icon}</Typography>
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="medium">
              {agent.agent_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {agent.agent_type}
            </Typography>
          </Box>
          <Chip
            label={agent.successRate >= 90 ? 'High' : agent.successRate >= 70 ? 'Good' : 'Low'}
            size="small"
            color={agent.successRate >= 90 ? 'success' : agent.successRate >= 70 ? 'warning' : 'error'}
          />
        </Box>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Total Calls
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {agent.total_calls.toLocaleString()}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Success Rate
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {agent.successRateFormatted}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Avg Response
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {agent.avgResponseTimeFormatted}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Total Cost
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {agent.totalCostFormatted}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Efficiency Score
            </Typography>
            <Typography variant="caption" fontWeight="medium">
              {agent.efficiency_score}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={agent.efficiency_score}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(config.color, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: config.color,
              },
            }}
          />
        </Box>
        
        {agent.specialization.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {agent.specialization.map((spec: string) => (
                <Chip
                  key={spec}
                  label={spec}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Agent utilization chart
const UtilizationChart: React.FC<{ data: any[] }> = ({ data }) => {
  const theme = useTheme();
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Agent Utilization Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
            <RechartsTooltip />
            <Legend />
            {Object.keys(data[0] || {})
              .filter(key => key !== 'timestamp')
              .map((agentKey, index) => (
                <Line
                  key={agentKey}
                  type="monotone"
                  dataKey={agentKey}
                  stroke={Object.values(agentTypeConfig)[index % Object.values(agentTypeConfig).length].color}
                  strokeWidth={2}
                  name={agentKey}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Handoff patterns visualization
const HandoffPatterns: React.FC<{ patterns: any[] }> = ({ patterns }) => {
  const theme = useTheme();
  
  // Convert handoff patterns to Sankey diagram format
  const sankeyData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeMap = new Map();
    
    patterns.forEach(pattern => {
      // Add nodes
      if (!nodeMap.has(pattern.from_agent)) {
        nodeMap.set(pattern.from_agent, nodes.length);
        nodes.push({ name: pattern.from_agent });
      }
      if (!nodeMap.has(pattern.to_agent)) {
        nodeMap.set(pattern.to_agent, nodes.length);
        nodes.push({ name: pattern.to_agent });
      }
      
      // Add link
      links.push({
        source: nodeMap.get(pattern.from_agent),
        target: nodeMap.get(pattern.to_agent),
        value: pattern.count,
      });
    });
    
    return { nodes, links };
  }, [patterns]);
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Agent Handoff Patterns
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Shows workflow handoffs between agents
        </Typography>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>From Agent</TableCell>
                <TableCell>To Agent</TableCell>
                <TableCell align="center">Count</TableCell>
                <TableCell align="center">Avg Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patterns.slice(0, 10).map((pattern, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CompareArrowsRounded sx={{ fontSize: 16, color: 'text.secondary' }} />
                      {pattern.from_agent}
                    </Box>
                  </TableCell>
                  <TableCell>{pattern.to_agent}</TableCell>
                  <TableCell align="center">
                    <Chip label={pattern.count} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {pattern.avgHandoffTimeFormatted}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Performance radar chart
const PerformanceRadar: React.FC<{ agents: any[] }> = ({ agents }) => {
  const radarData = agents.slice(0, 6).map(agent => ({
    agent: agent.agent_name,
    efficiency: agent.efficiency_score,
    reliability: agent.successRate,
    speed: Math.max(0, 100 - (agent.avg_response_time / 1000)),
    volume: Math.min(100, (agent.total_calls / 1000) * 10),
    cost: Math.max(0, 100 - (agent.total_cost / 100)),
  }));
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Multi-dimensional Performance
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="agent" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Efficiency" dataKey="efficiency" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Radar name="Reliability" dataKey="reliability" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
            <Radar name="Speed" dataKey="speed" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Main Agent Performance Component
export const AgentPerformance: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState('all');
  const { data: agentData, isLoading, error } = useAgentPerformance(timeRange);
  const { value: activeAgents } = useMetricSubscription('active_agents');
  
  const filteredAgents = useMemo(() => {
    if (!agentData?.agents) return [];
    
    if (filterType === 'all') return agentData.agents;
    
    return agentData.agents.filter(agent => 
      filterType === 'high_performing' ? agent.efficiency_score >= 80 :
      filterType === 'low_performing' ? agent.efficiency_score < 60 :
      agent.agent_type === filterType
    );
  }, [agentData?.agents, filterType]);

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <AgentPerformanceSkeleton />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Agent Performance
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor agent efficiency and collaboration patterns
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2} alignItems="center">
              {activeAgents !== null && (
                <Chip
                  icon={<GroupsRounded />}
                  label={`${activeAgents} Active Agents`}
                  color="primary"
                />
              )}
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filterType}
                  label="Filter"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">All Agents</MenuItem>
                  <MenuItem value="high_performing">High Performing</MenuItem>
                  <MenuItem value="low_performing">Needs Improvement</MenuItem>
                  <Divider />
                  <MenuItem value="Iris">Iris Agents</MenuItem>
                  <MenuItem value="Bradley">Bradley Agents</MenuItem>
                  <MenuItem value="Greta">Greta Agents</MenuItem>
                </Select>
              </FormControl>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="grid">
                  <GridViewRounded />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewListRounded />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>
        </Box>

        {/* Agent Cards/List */}
        <AnalyticsErrorBoundary componentName="Agent List">
          {viewMode === 'grid' ? (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {filteredAgents.map(agent => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={agent.agent_id}>
                  <AgentCard
                    agent={agent}
                    viewMode={viewMode}
                    onViewDetails={(id) => console.log('View agent:', id)}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card sx={{ mb: 4 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent</TableCell>
                      <TableCell align="center">Total Calls</TableCell>
                      <TableCell align="center">Success Rate</TableCell>
                      <TableCell align="center">Avg Response</TableCell>
                      <TableCell align="center">Total Cost</TableCell>
                      <TableCell align="center">Efficiency</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAgents.map(agent => (
                      <AgentCard
                        key={agent.agent_id}
                        agent={agent}
                        viewMode={viewMode}
                        onViewDetails={(id) => console.log('View agent:', id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </AnalyticsErrorBoundary>

        {/* Analytics Charts */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <AnalyticsErrorBoundary componentName="Utilization Chart">
              <UtilizationChart data={agentData?.utilizationChartData || []} />
            </AnalyticsErrorBoundary>
          </Grid>
          
          <Grid size={{ xs: 12, lg: 6 }}>
            <AnalyticsErrorBoundary componentName="Performance Radar">
              <PerformanceRadar agents={filteredAgents} />
            </AnalyticsErrorBoundary>
          </Grid>
          
          <Grid size={{ xs: 12, lg: 6 }}>
            <AnalyticsErrorBoundary componentName="Handoff Patterns">
              <HandoffPatterns patterns={agentData?.handoffAnalysis.patterns || []} />
            </AnalyticsErrorBoundary>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AgentPerformance;