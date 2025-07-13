import React from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { CognitiveProcessingView } from '../../components/codex/CognitiveProcessingView';
import { MemoryLifecycleVisualizer } from '../../components/codex/MemoryLifecycleVisualizer';

export const CognitiveProcessingPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Cognitive Processing
      </Typography>
      
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Processing Pipeline" />
        <Tab label="Memory Lifecycle" />
      </Tabs>

      <Box sx={{ height: 'calc(100% - 120px)' }}>
        {activeTab === 0 && <CognitiveProcessingView memory={{ id: 'demo', content: {}, memory_type: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), metadata: {} }} />}
        {activeTab === 1 && <MemoryLifecycleVisualizer />}
      </Box>
    </Box>
  );
};