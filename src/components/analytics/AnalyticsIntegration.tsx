/**
 * Analytics integration example for app shell/layout
 * Shows how to integrate analytics into navigation and header
 */

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Badge,
  Divider,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MenuRounded,
  NotificationsRounded,
  AssessmentRounded,
  ExpandLessRounded,
  ExpandMoreRounded,
  DashboardRounded,
  LogoutRounded,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

import { analyticsNavigationItems } from '../../navigation/analyticsRoutes';
import { useCostAlerts } from '../../hooks/useAnalyticsWebSocket';
import { ConnectionIndicator } from './WebSocketConnectionManager';
import { CostAlertNotification } from './CostAlertsPanel';

const drawerWidth = 280;

// Sidebar navigation with analytics
const SidebarWithAnalytics: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" fontWeight="bold">
          Geneva Platform
        </Typography>
      </Toolbar>
      <Divider />
      
      <List sx={{ px: 2, py: 1 }}>
        {/* Dashboard */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => handleNavigate('/')}
            selected={location.pathname === '/'}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ListItemIcon>
              <DashboardRounded />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Analytics Section */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon>
              {analyticsNavigationItems.main.icon}
            </ListItemIcon>
            <ListItemText primary={analyticsNavigationItems.main.title} />
            {analyticsNavigationItems.main.badge && (
              <Badge
                badgeContent={analyticsNavigationItems.main.badge}
                color="primary"
                sx={{ mr: 2 }}
              />
            )}
            {analyticsExpanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={analyticsExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2 }}>
            {analyticsNavigationItems.main.children.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  selected={isActiveRoute(item.path)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    secondary={item.description}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      sx: { display: 'block', mt: 0.5 },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Other navigation items would go here */}
      </List>
    </Drawer>
  );
};

// Header with analytics integration
const HeaderWithAnalytics: React.FC<{
  onMenuClick: () => void;
}> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { unreadCount } = useCostAlerts();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const handleViewAlerts = () => {
    navigate('/analytics/costs');
    handleNotificationClose();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuRounded />
        </IconButton>
        
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Geneva Analytics
        </Typography>

        {/* Live connection indicator */}
        <ConnectionIndicator size="small" showLabel />
        
        {/* Notifications */}
        <Tooltip title="Cost Alerts">
          <IconButton
            color="inherit"
            onClick={handleNotificationClick}
            sx={{ ml: 2 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsRounded />
            </Badge>
          </IconButton>
        </Tooltip>
        
        {/* User menu */}
        <IconButton color="inherit" sx={{ ml: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
        </IconButton>
        
        {/* Notifications dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: { width: 320 },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Notifications
            </Typography>
            {unreadCount > 0 ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  You have {unreadCount} unread cost alerts
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <MenuItem onClick={handleViewAlerts}>
                    <ListItemIcon>
                      <AssessmentRounded />
                    </ListItemIcon>
                    <ListItemText primary="View all alerts" />
                  </MenuItem>
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No new notifications
              </Typography>
            )}
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

// Main layout component with analytics
export const AppLayoutWithAnalytics: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header */}
      <HeaderWithAnalytics onMenuClick={() => setDrawerOpen(true)} />
      
      {/* Sidebar */}
      <SidebarWithAnalytics
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          mt: 8, // Account for AppBar height
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
      
      {/* Floating cost alert notifications */}
      <CostAlertNotification />
    </Box>
  );
};

// Example of how to use analytics in app routing
export const AppWithAnalyticsExample: React.FC = () => {
  return (
    <AppLayoutWithAnalytics>
      {/* Your app routes would go here */}
      <Typography>
        App content with analytics integration
      </Typography>
    </AppLayoutWithAnalytics>
  );
};

export default AppLayoutWithAnalytics;