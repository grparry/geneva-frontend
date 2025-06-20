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
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const navigationItems = [
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