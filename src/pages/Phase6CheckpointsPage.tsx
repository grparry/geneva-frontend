import React, { useState } from 'react';
import { Box } from '@mui/material';
import CheckpointTimelineViewer from '../components/workflow/CheckpointTimelineViewer';

export const Phase6CheckpointsPage: React.FC = () => {
  // Mock data for demonstration
  const mockCheckpoints = [
    {
      id: 'cp-1',
      workflowId: 'wf-123',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      stage: 'Data Collection',
      status: 'success' as const,
      toolsCompleted: ['web-search', 'data-scraper'],
      toolsPending: ['analyzer'],
      artifacts: [
        { type: 'data', name: 'search_results.json', size: 2048 },
        { type: 'document', name: 'scraped_content.txt', size: 10240 }
      ],
      metadata: {
        duration: 45,
        tokensUsed: 1500,
        apiCalls: 5
      }
    },
    {
      id: 'cp-2',
      workflowId: 'wf-123',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      stage: 'Analysis',
      status: 'partial' as const,
      toolsCompleted: ['analyzer', 'sentiment-detector'],
      toolsPending: ['report-generator'],
      artifacts: [
        { type: 'data', name: 'analysis_results.json', size: 4096 },
        { type: 'insight', name: 'sentiment_scores.csv', size: 1024 }
      ],
      metadata: {
        duration: 120,
        tokensUsed: 3000,
        apiCalls: 8
      }
    },
    {
      id: 'cp-3',
      workflowId: 'wf-123',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      stage: 'Report Generation',
      status: 'failed' as const,
      toolsCompleted: ['report-generator'],
      toolsPending: [],
      artifacts: [],
      metadata: {
        duration: 30,
        tokensUsed: 500,
        apiCalls: 2
      }
    }
  ];

  const mockCurrentState = {
    workflowId: 'wf-123',
    currentStage: 'Report Generation',
    progress: 75,
    status: 'failed' as const,
    activeTools: [],
    errors: [
      {
        tool: 'report-generator',
        message: 'Template compilation failed: Missing required field "summary"',
        timestamp: new Date(Date.now() - 300000).toISOString()
      }
    ]
  };

  const handleRestore = (checkpointId: string, strategy: any) => {
    console.log('Restoring checkpoint:', checkpointId, 'with strategy:', strategy);
    // In a real implementation, this would call an API
  };

  const handleCompare = (checkpoint1: string, checkpoint2: string) => {
    console.log('Comparing checkpoints:', checkpoint1, 'and', checkpoint2);
    // In a real implementation, this would show a comparison view
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', backgroundColor: '#f5f5f5' }}>
      <CheckpointTimelineViewer
        workflowId="wf-123"
        checkpoints={mockCheckpoints}
        currentState={mockCurrentState}
        onRestore={handleRestore}
        onCompare={handleCompare}
      />
    </Box>
  );
};