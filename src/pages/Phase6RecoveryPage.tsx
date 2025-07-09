import React from 'react';
import { Box } from '@mui/material';
import RecoveryManagementConsole from '../components/workflow/RecoveryManagementConsole';

export const Phase6RecoveryPage: React.FC = () => {
  // Mock data for demonstration
  const mockFailedWorkflows = [
    {
      id: 'fw-1',
      workflowId: 'wf-456',
      name: 'Market Analysis Workflow',
      failedAt: new Date(Date.now() - 1200000).toISOString(),
      stage: 'Data Processing',
      error: {
        type: 'APIError',
        message: 'Rate limit exceeded for financial data API',
        tool: 'market-data-fetcher',
        retryCount: 3
      },
      checkpoints: 5,
      lastCheckpoint: new Date(Date.now() - 1800000).toISOString(),
      priority: 'high' as const,
      estimatedRecoveryTime: 180
    },
    {
      id: 'fw-2',
      workflowId: 'wf-789',
      name: 'Content Generation Pipeline',
      failedAt: new Date(Date.now() - 3600000).toISOString(),
      stage: 'Content Synthesis',
      error: {
        type: 'ValidationError',
        message: 'Generated content failed quality checks',
        tool: 'content-validator',
        retryCount: 1
      },
      checkpoints: 3,
      lastCheckpoint: new Date(Date.now() - 4200000).toISOString(),
      priority: 'medium' as const,
      estimatedRecoveryTime: 120
    },
    {
      id: 'fw-3',
      workflowId: 'wf-012',
      name: 'Customer Feedback Analysis',
      failedAt: new Date(Date.now() - 7200000).toISOString(),
      stage: 'Sentiment Analysis',
      error: {
        type: 'TimeoutError',
        message: 'Analysis timed out after 300 seconds',
        tool: 'sentiment-analyzer',
        retryCount: 2
      },
      checkpoints: 2,
      priority: 'low' as const,
      estimatedRecoveryTime: 90
    }
  ];

  const mockRecoveryQueue = [
    {
      id: 'rec-1',
      workflowId: 'wf-111',
      strategy: 'resume',
      status: 'executing' as const,
      progress: 65,
      startedAt: new Date(Date.now() - 300000).toISOString(),
      steps: [
        { name: 'Restore State', status: 'completed' as const, duration: 15 },
        { name: 'Validate Dependencies', status: 'completed' as const, duration: 10 },
        { name: 'Resume Tools', status: 'running' as const },
        { name: 'Verify Results', status: 'pending' as const }
      ]
    },
    {
      id: 'rec-2',
      workflowId: 'wf-222',
      strategy: 'retry',
      status: 'queued' as const,
      progress: 0,
      steps: [
        { name: 'Identify Failed Tools', status: 'pending' as const },
        { name: 'Reset Tool State', status: 'pending' as const },
        { name: 'Retry Execution', status: 'pending' as const },
        { name: 'Validate Output', status: 'pending' as const }
      ]
    }
  ];

  const mockMetrics = {
    totalRecoveries: 156,
    successfulRecoveries: 142,
    failedRecoveries: 14,
    averageRecoveryTime: 145,
    successRate: 91.03,
    commonFailureReasons: [
      { reason: 'API Rate Limits', count: 45, percentage: 28.8 },
      { reason: 'Timeout Errors', count: 38, percentage: 24.4 },
      { reason: 'Validation Failures', count: 31, percentage: 19.9 },
      { reason: 'Resource Constraints', count: 22, percentage: 14.1 },
      { reason: 'Network Issues', count: 20, percentage: 12.8 }
    ]
  };

  const handleRecover = (workflowId: string, strategy: string, options?: any) => {
    console.log('Recovering workflow:', workflowId, 'with strategy:', strategy, options);
    // In a real implementation, this would call an API
  };

  const handleCancelRecovery = (recoveryId: string) => {
    console.log('Cancelling recovery:', recoveryId);
    // In a real implementation, this would call an API
  };

  const handleRetryRecovery = (recoveryId: string) => {
    console.log('Retrying recovery:', recoveryId);
    // In a real implementation, this would call an API
  };

  const handleManualIntervention = (workflowId: string, option: any) => {
    console.log('Manual intervention for workflow:', workflowId, 'with option:', option);
    // In a real implementation, this would call an API
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', backgroundColor: '#f5f5f5' }}>
      <RecoveryManagementConsole
        failedWorkflows={mockFailedWorkflows}
        recoveryQueue={mockRecoveryQueue}
        metrics={mockMetrics}
        onRecover={handleRecover}
        onCancelRecovery={handleCancelRecovery}
        onRetryRecovery={handleRetryRecovery}
        onManualIntervention={handleManualIntervention}
      />
    </Box>
  );
};