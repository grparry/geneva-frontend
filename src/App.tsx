import React from 'react';
import { 
  Box,
  AppBar, 
  Toolbar, 
  Typography,
  Drawer,
  Stack,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ObservabilityDashboard } from './pages/ObservabilityDashboard';
import { CommunicationsPage } from './pages/CommunicationsPage';
import { MultiStreamPage } from './pages/MultiStreamPage';
import { ConversationReplayPage } from './pages/ConversationReplayPage';
import { GlobalSearchPage } from './pages/GlobalSearchPage';
import { PatternAnalysisPage } from './pages/PatternAnalysisPage';
import { AlertingSystemPage } from './pages/AlertingSystemPage';
import { ExecutionsPage } from './pages/ExecutionsPage';
import { AgentsPage } from './pages/AgentsPage';
import { ACORNTeamPage } from './pages/ACORNTeamPage';
import { ACORNWorkflowPage } from './pages/ACORNWorkflowPage';
import { ACORNTaskPage } from './pages/ACORNTaskPage';
import { ACORNChatPage } from './pages/ACORNChatPage';
import Phase6Dashboard from './components/phase6/Phase6Dashboard';
import { Phase6CheckpointsPage } from './pages/Phase6CheckpointsPage';
import { Phase6RecoveryPage } from './pages/Phase6RecoveryPage';
import { Phase6ResultsPage } from './pages/Phase6ResultsPage';
import { AdminHealthPage } from './pages/AdminHealthPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { OCLPage } from './pages/OCLPage';
import { CognitiveMemoryPage } from './pages/CognitiveMemoryPage';

const DRAWER_WIDTH = 280;

const AppContent: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/phase6/dashboard')) return 'Multi-Agent Coordination';
    if (path.startsWith('/phase6/checkpoints')) return 'Checkpoint Manager';
    if (path.startsWith('/phase6/recovery')) return 'Recovery Console';
    if (path.startsWith('/phase6/results')) return 'Result Aggregation';
    if (path.startsWith('/admin/health')) return 'System Health';
    if (path.startsWith('/admin/analytics')) return 'Analytics & Reports';
    if (path.startsWith('/ocl')) return 'OCL Messages';
    if (path.startsWith('/cognitive')) return 'Cognitive Memory';
    if (path.startsWith('/observability/dashboard')) return 'Dashboard';
    if (path.startsWith('/observability/communications')) return 'Communications';
    if (path.startsWith('/observability/multi-stream')) return 'Multi-Stream';
    if (path.startsWith('/observability/replay')) return 'Replay';
    if (path.startsWith('/observability/search')) return 'Search';
    if (path.startsWith('/observability/patterns')) return 'Pattern Analysis';
    if (path.startsWith('/observability/alerts')) return 'Alerts';
    if (path.startsWith('/observability/executions')) return 'Executions';
    if (path.startsWith('/observability/agents')) return 'Agents';
    if (path.startsWith('/acorn')) return 'ACORN Platform';
    return 'Geneva Platform';
  };

  const getPageSection = () => {
    const path = location.pathname;
    if (path.startsWith('/phase6')) return 'Phase 6';
    if (path.startsWith('/admin')) return 'Administration';
    if (path.startsWith('/ocl')) return 'Communication';
    if (path.startsWith('/cognitive')) return 'Memory';
    if (path.startsWith('/observability')) return 'Observability';
    if (path.startsWith('/acorn')) return 'ACORN';
    return '';
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'primary.main'
        }}
      >
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
            <VisibilityIcon />
            <Typography variant="h6" component="div" fontWeight="bold">
              Geneva Platform
            </Typography>
            {getPageSection() && (
              <Chip 
                label={getPageSection()} 
                size="small" 
                variant="outlined" 
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
            )}
          </Stack>
          
          <Typography variant="h6" sx={{ fontWeight: 'normal' }}>
            {getPageTitle()}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Navigation />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/phase6/dashboard" replace />} />
            
            {/* Phase 6 routes */}
            <Route path="/phase6/dashboard" element={<Phase6Dashboard />} />
            <Route path="/phase6/checkpoints" element={<Phase6CheckpointsPage />} />
            <Route path="/phase6/recovery" element={<Phase6RecoveryPage />} />
            <Route path="/phase6/results" element={<Phase6ResultsPage />} />
            
            {/* Admin routes */}
            <Route path="/admin/health" element={<AdminHealthPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            
            {/* OCL routes */}
            <Route path="/ocl" element={<OCLPage />} />
            
            {/* Cognitive Memory routes */}
            <Route path="/cognitive" element={<CognitiveMemoryPage />} />
            
            {/* Observability routes */}
            <Route path="/observability/dashboard" element={<ObservabilityDashboard />} />
            <Route path="/observability/communications" element={<CommunicationsPage />} />
            <Route path="/observability/multi-stream" element={<MultiStreamPage />} />
            <Route path="/observability/replay" element={<ConversationReplayPage />} />
            <Route path="/observability/search" element={<GlobalSearchPage />} />
            <Route path="/observability/patterns" element={<PatternAnalysisPage />} />
            <Route path="/observability/alerts" element={<AlertingSystemPage />} />
            <Route path="/observability/executions" element={<ExecutionsPage />} />
            <Route path="/observability/agents" element={<AgentsPage />} />
            
            {/* ACORN routes */}
            <Route path="/acorn/team" element={<ACORNTeamPage />} />
            <Route path="/acorn/workflows" element={<ACORNWorkflowPage />} />
            <Route path="/acorn/tasks" element={<ACORNTaskPage />} />
            <Route path="/acorn/chat" element={<ACORNChatPage />} />
            <Route path="/acorn/*" element={<Navigate to="/acorn/team" replace />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
