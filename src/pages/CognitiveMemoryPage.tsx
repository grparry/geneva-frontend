/**
 * Cognitive Memory Page
 * Main page for Geneva's Cognitive Memory system
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Home,
  Psychology,
  Search,
  Security,
  Analytics,
  AccountTree,
  Refresh,
  Help,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { 
  MemoryBrowser,
  SearchInterface,
  SecurityDashboard,
  ConceptExplorer,
  AnalyticsDashboard,
} from '../components/cognitive';
import {
  selectCognitiveUI,
  setViewMode,
} from '../store/cognitive/slice';
import {
  useGetHealthStatusQuery,
} from '../services/cognitive/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cognitive-tabpanel-${index}`}
      aria-labelledby={`cognitive-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const CognitiveMemoryPage: React.FC = () => {
  const dispatch = useDispatch();
  const uiState = useSelector(selectCognitiveUI);
  const [tabValue, setTabValue] = useState(0);

  // Health status check
  const {
    data: healthStatus,
    error: healthError,
    refetch: refetchHealth,
  } = useGetHealthStatusQuery();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update view mode in state
    const viewModes = ['browser', 'search', 'security', 'concepts'] as const;
    dispatch(setViewMode(viewModes[newValue]));
  };

  const isHealthy = healthStatus?.status === 'healthy';
  const isDegraded = healthStatus?.status === 'degraded';

  return (
    <Container maxWidth="xl" sx={{ py: 3, height: '100%', overflow: 'auto' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 0.5 }} fontSize="inherit" />
          Cognitive Memory
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" component="h1">
            Cognitive Memory System
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Health Status Indicator */}
            {healthStatus && (
              <Tooltip title={`System Status: ${healthStatus.status}`}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: isHealthy ? 'success.main' : isDegraded ? 'warning.main' : 'error.main',
                  }}
                />
              </Tooltip>
            )}
            
            <Tooltip title="Refresh System Status">
              <IconButton size="small" onClick={() => refetchHealth()}>
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Help & Documentation">
              <IconButton size="small">
                <Help />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary">
          Explore and analyze your organization's intelligent memory hierarchy
        </Typography>
      </Box>

      {/* Health Alerts */}
      {healthError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to connect to cognitive memory system. Some features may be unavailable.
        </Alert>
      )}
      
      {healthStatus && !isHealthy && (
        <Alert 
          severity={isDegraded ? 'warning' : 'error'} 
          sx={{ mb: 3 }}
        >
          {isDegraded 
            ? 'Cognitive memory system is experiencing degraded performance. Some operations may be slower than usual.'
            : 'Cognitive memory system is currently unhealthy. Please contact support if issues persist.'
          }
        </Alert>
      )}

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab 
              icon={<Psychology />} 
              label="Memory Browser" 
              id="cognitive-tab-0"
              aria-controls="cognitive-tabpanel-0"
            />
            <Tab 
              icon={<Search />} 
              label="Advanced Search" 
              id="cognitive-tab-1"
              aria-controls="cognitive-tabpanel-1"
            />
            <Tab 
              icon={<Security />} 
              label="Security Dashboard" 
              id="cognitive-tab-2"
              aria-controls="cognitive-tabpanel-2"
            />
            <Tab 
              icon={<AccountTree />} 
              label="Concept Explorer" 
              id="cognitive-tab-3"
              aria-controls="cognitive-tabpanel-3"
            />
            <Tab 
              icon={<Analytics />} 
              label="Analytics" 
              id="cognitive-tab-4"
              aria-controls="cognitive-tabpanel-4"
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <MemoryBrowser
            showStats={true}
            onMemorySelect={(memory) => {
              console.log('Selected memory:', memory);
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <SearchInterface
            onSearch={(params) => {
              console.log('Search params:', params);
            }}
            onMemorySelect={(memory) => {
              console.log('Selected memory from search:', memory);
            }}
            showAdvancedFilters={true}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <SecurityDashboard
            showAlerts={true}
            onRiskLevelSelect={(level) => {
              console.log('Selected risk level:', level);
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <ConceptExplorer
            onConceptSelect={(concept) => {
              console.log('Selected concept:', concept);
            }}
            showUsageStats={true}
            maxConcepts={100}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <AnalyticsDashboard
            refreshInterval={30000}
            showDetailedBreakdown={true}
          />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default CognitiveMemoryPage;