import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Visibility as ObservabilityIcon,
  SmartToy as AgentIcon,
  Timeline as TimelineIcon,
  Chat as CommunicationIcon,
  PlayArrow as ReplayIcon,
  Search as SearchIcon,
  Analytics as AnalyticsIcon,
  NotificationsActive as AlertIcon,
  AccountTree as WorkflowIcon,
  Assignment as TaskIcon,
  Group as TeamIcon,
  Forum as ForumIcon,
  Rocket as RocketIcon,
  History as HistoryIcon,
  RestoreFromTrash as RecoveryIcon,
  Assessment as ResultsIcon,
  HealthAndSafety as HealthIcon,
  BarChart as ChartsIcon,
  Mail as MailIcon,
  Psychology as PsychologyIcon,
  Hub as HubIcon,
  Schema as SchemaIcon,
  BubbleChart as BubbleChartIcon,
  DeviceHub as DeviceHubIcon,
  Memory as MemoryIcon,
  Insights as InsightsIcon,
  AccountTreeOutlined as OntologyIcon,
  Compare as CompareIcon,
  Layers as LayersIcon,
  Route as RouteIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const navigationItems = [
  {
    section: 'Federation',
    items: [
      { path: '/federation', label: 'Overview', icon: <DashboardIcon /> },
      { path: '/federation/topology', label: 'Topology Graph', icon: <BubbleChartIcon /> },
    ]
  },
  {
    section: 'Ontology',
    items: [
      { path: '/ontology/visualization', label: 'Ontology Graph', icon: <OntologyIcon /> },
      { path: '/ontology/schemas', label: 'Agent Schemas', icon: <SchemaIcon /> },
      { path: '/ontology/proposals', label: 'Proposals', icon: <CompareIcon /> },
    ]
  },
  {
    section: 'Codex Memory',
    items: [
      { path: '/codex/fields', label: 'Field Mappings', icon: <MemoryIcon /> },
      { path: '/codex/processing', label: 'Processing Pipeline', icon: <InsightsIcon /> },
    ]
  },
  {
    section: 'Topology',
    items: [
      { path: '/topology/overview', label: 'Dashboard', icon: <LayersIcon /> },
      { path: '/topology/substrate-map', label: 'Substrate Map', icon: <DeviceHubIcon /> },
      { path: '/topology/delegation', label: 'Delegation Flow', icon: <RouteIcon /> },
      { path: '/topology/infrastructure', label: 'Infrastructure', icon: <StorageIcon /> },
    ]
  },
  {
    section: 'Phase 6 - Multi-Agent',
    items: [
      { path: '/phase6/dashboard', label: 'Coordination Dashboard', icon: <RocketIcon /> },
      { path: '/phase6/checkpoints', label: 'Checkpoint Manager', icon: <HistoryIcon /> },
      { path: '/phase6/recovery', label: 'Recovery Console', icon: <RecoveryIcon /> },
      { path: '/phase6/results', label: 'Result Aggregation', icon: <ResultsIcon /> },
    ]
  },
  {
    section: 'Administration',
    items: [
      { path: '/admin/health', label: 'System Health', icon: <HealthIcon /> },
      { path: '/admin/analytics', label: 'Analytics & Reports', icon: <ChartsIcon /> },
    ]
  },
  {
    section: 'Communication',
    items: [
      { path: '/ocl', label: 'OCL Messages', icon: <MailIcon /> },
    ]
  },
  {
    section: 'Memory',
    items: [
      { path: '/cognitive', label: 'Cognitive Memory', icon: <PsychologyIcon /> },
    ]
  },
  {
    section: 'Observability',
    items: [
      { path: '/observability/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { path: '/observability/communications', label: 'Communications', icon: <CommunicationIcon /> },
      { path: '/observability/multi-stream', label: 'Multi-Stream', icon: <ObservabilityIcon /> },
      { path: '/observability/replay', label: 'Conversation Replay', icon: <ReplayIcon /> },
      { path: '/observability/search', label: 'Global Search', icon: <SearchIcon /> },
      { path: '/observability/patterns', label: 'Pattern Analysis', icon: <AnalyticsIcon /> },
      { path: '/observability/alerts', label: 'Alerting System', icon: <AlertIcon /> },
      { path: '/observability/executions', label: 'Executions', icon: <TimelineIcon /> },
      { path: '/observability/agents', label: 'Agents', icon: <AgentIcon /> },
    ]
  },
  {
    section: 'ACORN Platform',
    items: [
      { path: '/acorn/team', label: 'Team Overview', icon: <TeamIcon /> },
      { path: '/acorn/workflows', label: 'Workflows', icon: <WorkflowIcon /> },
      { path: '/acorn/tasks', label: 'Tasks', icon: <TaskIcon /> },
      { path: '/acorn/chat', label: 'Executive Chat', icon: <ForumIcon /> },
      { path: '/acorn/memory-chat', label: 'Memory Chat', icon: <MemoryIcon /> },
    ]
  }
];

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isSelected = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Box sx={{ p: 1 }}>
      {navigationItems.map((section) => (
        <Box key={section.section} sx={{ mb: 2 }}>
          <Typography 
            variant="overline" 
            sx={{ 
              px: 2, 
              color: 'text.secondary',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}
          >
            {section.section}
          </Typography>
          
          <List dense sx={{ mt: 0.5 }}>
            {section.items.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isSelected(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isSelected(item.path) ? 'bold' : 'normal'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
};