/**
 * Security Dashboard Component
 * Risk-focused views and security monitoring for cognitive memories
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Chip,
  LinearProgress,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Security,
  Warning,
  Error,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  Notifications,
  NotificationsActive,
  Shield,
  Timeline,
  Analytics,
  Report,
  FilterList,
  Visibility,
  Block,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetMemoriesByRiskQuery,
  useGetAnalyticsQuery,
} from '../../services/cognitive/api';
import {
  selectCognitiveSecurity,
  selectCognitiveUI,
  setSecurityMemories,
} from '../../store/cognitive/slice';
import { MemoryCard } from './MemoryCard';
import type {
  SecurityDashboardProps,
  CognitiveMemory,
  SecurityRiskLevel,
  CognitiveAnalytics,
} from '../../types/cognitive';
import {
  SECURITY_RISK_DEFINITIONS,
  getRiskLevel,
  getRiskColor,
  formatRiskScore,
} from '../../types/cognitive';

interface SecurityAlert {
  id: string;
  level: SecurityRiskLevel;
  message: string;
  memory_id: string;
  created_at: string;
  acknowledged: boolean;
}

interface RiskMetric {
  level: SecurityRiskLevel;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  projectId,
  timeRange = '24h',
  showAlerts = true,
  onRiskLevelSelect,
  compact = false,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Redux state
  const securityState = useSelector(selectCognitiveSecurity);
  const uiState = useSelector(selectCognitiveUI);
  
  // Local state
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<SecurityRiskLevel | null>(null);
  const [showOnlyUnacknowledged, setShowOnlyUnacknowledged] = useState(true);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // API queries for each risk level
  const { data: criticalMemories, isLoading: criticalLoading, refetch: refetchCritical } = 
    useGetMemoriesByRiskQuery({ level: 'critical', time_range: selectedTimeRange });
  
  const { data: highMemories, isLoading: highLoading, refetch: refetchHigh } = 
    useGetMemoriesByRiskQuery({ level: 'high', time_range: selectedTimeRange });
  
  const { data: mediumMemories, isLoading: mediumLoading, refetch: refetchMedium } = 
    useGetMemoriesByRiskQuery({ level: 'medium', time_range: selectedTimeRange });
  
  const { data: lowMemories, isLoading: lowLoading, refetch: refetchLow } = 
    useGetMemoriesByRiskQuery({ level: 'low', time_range: selectedTimeRange });

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = 
    useGetAnalyticsQuery({ time_range: selectedTimeRange, include_trends: true });

  // Combine loading states
  const isLoading = criticalLoading || highLoading || mediumLoading || lowLoading || analyticsLoading;

  // Calculate risk metrics
  const riskMetrics: RiskMetric[] = [
    {
      level: 'critical',
      count: criticalMemories?.total || 0,
      percentage: 0,
      trend: 'stable',
      change: 0,
    },
    {
      level: 'high',
      count: highMemories?.total || 0,
      percentage: 0,
      trend: 'stable',
      change: 0,
    },
    {
      level: 'medium',
      count: mediumMemories?.total || 0,
      percentage: 0,
      trend: 'stable',
      change: 0,
    },
    {
      level: 'low',
      count: lowMemories?.total || 0,
      percentage: 0,
      trend: 'stable',
      change: 0,
    },
  ];

  // Calculate percentages
  const totalMemories = riskMetrics.reduce((sum, metric) => sum + metric.count, 0);
  riskMetrics.forEach(metric => {
    metric.percentage = totalMemories > 0 ? (metric.count / totalMemories) * 100 : 0;
  });

  // Mock alerts data (would come from API in real implementation)
  useEffect(() => {
    const mockAlerts: SecurityAlert[] = [
      {
        id: '1',
        level: 'critical',
        message: 'Potential data exposure detected in memory content',
        memory_id: 'mem_001',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: false,
      },
      {
        id: '2',
        level: 'high',
        message: 'Elevated risk score due to sensitive patterns',
        memory_id: 'mem_002',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        acknowledged: false,
      },
      {
        id: '3',
        level: 'medium',
        message: 'Authentication-related content flagged for review',
        memory_id: 'mem_003',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        acknowledged: true,
      },
    ];
    setAlerts(mockAlerts);
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    refetchCritical();
    refetchHigh();
    refetchMedium();
    refetchLow();
    refetchAnalytics();
  };

  // Handle risk level selection
  const handleRiskLevelClick = (level: SecurityRiskLevel) => {
    setSelectedRiskLevel(level);
    if (onRiskLevelSelect) {
      onRiskLevelSelect(level);
    }
  };

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // Get risk level icon
  const getRiskIcon = (level: SecurityRiskLevel) => {
    switch (level) {
      case 'critical': return <Error />;
      case 'high': return <Warning />;
      case 'medium': return <Security />;
      case 'low': return <CheckCircle />;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp color="error" />;
      case 'down': return <TrendingDown color="success" />;
      case 'stable': return <Timeline color="action" />;
    }
  };

  // Pie chart data
  const pieChartData = riskMetrics.map(metric => ({
    name: SECURITY_RISK_DEFINITIONS[metric.level].name,
    value: metric.count,
    color: SECURITY_RISK_DEFINITIONS[metric.level].color,
  }));

  // Time series data (mock)
  const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    critical: Math.floor(Math.random() * 10),
    high: Math.floor(Math.random() * 20),
    medium: Math.floor(Math.random() * 50),
    low: Math.floor(Math.random() * 100),
  }));

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const displayedAlerts = showOnlyUnacknowledged ? unacknowledgedAlerts : alerts;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h5">
            Security Dashboard
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={selectedTimeRange}
                label="Time Range"
                onChange={(e) => setSelectedTimeRange(e.target.value)}
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto Refresh"
            />
            
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Button startIcon={<Download />} variant="outlined">
              Export Report
            </Button>
          </Stack>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Monitor security risks and threats across your cognitive memory system
        </Typography>
      </Box>

      {/* Security Alerts */}
      {showAlerts && unacknowledgedAlerts.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              View All
            </Button>
          }
        >
          {unacknowledgedAlerts.length} unacknowledged security alert(s) require attention
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Risk Level Cards */}
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {riskMetrics.map((metric) => {
              const definition = SECURITY_RISK_DEFINITIONS[metric.level];
              return (
                <Box key={metric.level}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      borderLeft: `4px solid ${definition.color}`,
                      ...(selectedRiskLevel === metric.level && {
                        bgcolor: alpha(definition.color, 0.05),
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      }),
                      '&:hover': {
                        bgcolor: alpha(definition.color, 0.02),
                        transform: 'translateY(-1px)',
                        boxShadow: theme.shadows[2],
                      },
                    }}
                    onClick={() => handleRiskLevelClick(metric.level)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box
                          sx={{
                            bgcolor: alpha(definition.color, 0.1),
                            borderRadius: 1,
                            p: 0.75,
                            mr: 1.5,
                            color: definition.color,
                          }}
                        >
                          {getRiskIcon(metric.level)}
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" fontWeight="bold">
                            {metric.count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {definition.name}
                          </Typography>
                        </Box>
                        
                        {getTrendIcon(metric.trend)}
                      </Box>
                      
                      <LinearProgress
                        variant="determinate"
                        value={metric.percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(definition.color, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: definition.color,
                            borderRadius: 3,
                          },
                        }}
                      />
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {metric.percentage.toFixed(1)}% of total memories
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Charts */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Risk Distribution
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>

          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Risk Trends (24h)
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="critical" 
                    stackId="1" 
                    stroke={SECURITY_RISK_DEFINITIONS.critical.color}
                    fill={SECURITY_RISK_DEFINITIONS.critical.color}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="high" 
                    stackId="1" 
                    stroke={SECURITY_RISK_DEFINITIONS.high.color}
                    fill={SECURITY_RISK_DEFINITIONS.high.color}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="medium" 
                    stackId="1" 
                    stroke={SECURITY_RISK_DEFINITIONS.medium.color}
                    fill={SECURITY_RISK_DEFINITIONS.medium.color}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="low" 
                    stackId="1" 
                    stroke={SECURITY_RISK_DEFINITIONS.low.color}
                    fill={SECURITY_RISK_DEFINITIONS.low.color}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Box>

        {/* Security Alerts */}
        {showAlerts && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Security Alerts
                  <Badge badgeContent={unacknowledgedAlerts.length} color="error" sx={{ ml: 1 }} />
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={showOnlyUnacknowledged}
                      onChange={(e) => setShowOnlyUnacknowledged(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Unacknowledged only"
                />
              </Box>
              
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {displayedAlerts.map((alert) => {
                  const definition = SECURITY_RISK_DEFINITIONS[alert.level];
                  return (
                    <ListItem
                      key={alert.id}
                      sx={{
                        borderLeft: `3px solid ${definition.color}`,
                        mb: 1,
                        borderRadius: 1,
                        bgcolor: alert.acknowledged ? 'transparent' : alpha(definition.color, 0.05),
                      }}
                    >
                      <ListItemIcon>
                        {getRiskIcon(alert.level)}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={alert.message}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={definition.name}
                              size="small"
                              sx={{
                                bgcolor: alpha(definition.color, 0.1),
                                color: definition.color,
                                fontSize: '0.7rem',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(alert.created_at).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        {!alert.acknowledged && (
                          <Button
                            size="small"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
                
                {displayedAlerts.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Shield sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      {showOnlyUnacknowledged ? 'No unacknowledged alerts' : 'No security alerts'}
                    </Typography>
                  </Box>
                )}
              </List>
            </Paper>

            {/* High-Risk Memories */}
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Recent High-Risk Memories
              </Typography>
            
            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
              {[
                ...(criticalMemories?.memories || []),
                ...(highMemories?.memories || [])
              ].slice(0, 3).map((memory) => (
                <Box key={memory.id} sx={{ mb: 2 }}>
                  <MemoryCard
                    memory={memory}
                    compact={true}
                    showMetadata={false}
                  />
                </Box>
              ))}
              
              {criticalMemories?.memories.length === 0 && highMemories?.memories.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography color="text.secondary">
                    No high-risk memories detected
                  </Typography>
                </Box>
              )}
            </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default SecurityDashboard;