/**
 * Memory5DDemo Component
 * Demo component showing integration of all 5D memory components
 * Use this for testing and as a reference for integration
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  Button,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

import Memory5DBrowser from './Memory5DBrowser';
import Memory5DContentViewer from './Memory5DContentViewer';
import TrinityAgentPanel from './TrinityAgentPanel';
import type { Memory5D } from '../../types/memory5d';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const Memory5DDemo: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedMemory, setSelectedMemory] = useState<Memory5D | null>(null);

  const handleMemorySelect = (memory: Memory5D) => {
    setSelectedMemory(memory);
    // Auto-switch to content viewer when a memory is selected
    if (selectedTab === 0) {
      setSelectedTab(1);
    }
  };

  const handleMemoryUpdate = (updatedMemory: Memory5D) => {
    setSelectedMemory(updatedMemory);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h3" component="h1" gutterBottom>
        🧠 5D Memory Management System
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Complete frontend implementation for Geneva's 5D Memory Architecture.
        Explore memories across 5 dimensions: Cognitive Type, Temporal Tier,
        Organizational Scope, Security Classification, and Ontological Schema.
      </Typography>

      {/* Quick Start Guide */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          <strong>Quick Start Guide:</strong>
        </Typography>
        <Typography variant="body2">
          1. Use the <strong>Browser</strong> tab to explore and search memories across all 5 dimensions<br />
          2. Select a memory to view and edit its content in the <strong>Content Viewer</strong><br />
          3. Use the <strong>Trinity Panel</strong> to manage the three specialized AI agents<br />
          4. All changes are validated for dimensional consistency in real-time
        </Typography>
      </Alert>

      {/* Integration Status */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          ✅ Integration Status: Ready
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="body2">
              <strong>API Client:</strong> Connected to /api/v1/memory/
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="body2">
              <strong>Type Safety:</strong> Full TypeScript integration
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="body2">
              <strong>Components:</strong> 6 core components
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="body2">
              <strong>Validation:</strong> Cross-dimensional consistency
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Selected Memory Info */}
      {selectedMemory && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Selected Memory:</strong> {selectedMemory.id.slice(-8)} -
            {selectedMemory.content.substring(0, 100)}...
          </Typography>
        </Alert>
      )}

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab
            icon={<MemoryIcon />}
            label="Memory Browser"
            sx={{ textTransform: 'none' }}
          />
          <Tab
            icon={<VisibilityIcon />}
            label="Content Viewer"
            disabled={!selectedMemory}
            sx={{ textTransform: 'none' }}
          />
          <Tab
            icon={<PsychologyIcon />}
            label="Trinity Agents"
            sx={{ textTransform: 'none' }}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={selectedTab} index={0}>
        <Memory5DBrowser
          onMemorySelect={handleMemorySelect}
          showDimensionStats={true}
          enableCrossDimensionalSearch={true}
        />
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        {selectedMemory ? (
          <Memory5DContentViewer
            memory={selectedMemory}
            onMemoryUpdate={handleMemoryUpdate}
            showEditHistory={true}
            enableDimensionalValidation={true}
          />
        ) : (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              Select a memory from the browser to view its content
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setSelectedTab(0)}
              sx={{ mt: 2 }}
            >
              Go to Browser
            </Button>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        <TrinityAgentPanel
          showDetailedMetrics={true}
          refreshInterval={30000}
        />
      </TabPanel>
    </Box>
  );
};

export default Memory5DDemo;