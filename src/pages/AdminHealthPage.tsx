import React, { useState } from 'react';
import { Box } from '@mui/material';
import SystemHealthDashboard from '../components/admin/SystemHealthDashboard';

export const AdminHealthPage: React.FC = () => {
  const [refreshCount, setRefreshCount] = useState(0);

  // Mock data for demonstration
  const mockSystemMetrics = {
    cpu: {
      usage: 42,
      cores: 8,
      temperature: 65
    },
    memory: {
      used: 12884901888, // 12 GB
      total: 17179869184, // 16 GB
      percentage: 75
    },
    storage: {
      used: 322122547200, // 300 GB
      total: 536870912000, // 500 GB
      percentage: 60
    },
    network: {
      latency: 23,
      bandwidth: 1048576, // 1 MB/s
      requests: 156
    }
  };

  const mockComponentHealth = [
    {
      id: 'api-gateway',
      name: 'API Gateway',
      status: 'healthy' as const,
      uptime: 2592000, // 30 days
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: 45,
        errorRate: 0.2,
        throughput: 1250
      }
    },
    {
      id: 'worker-pool',
      name: 'Worker Pool',
      status: 'healthy' as const,
      uptime: 1728000, // 20 days
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: 120,
        errorRate: 0.5,
        throughput: 450
      }
    },
    {
      id: 'websocket-server',
      name: 'WebSocket Server',
      status: 'degraded' as const,
      uptime: 864000, // 10 days
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: 180,
        errorRate: 2.3,
        throughput: 890
      }
    },
    {
      id: 'database',
      name: 'PostgreSQL Database',
      status: 'healthy' as const,
      uptime: 5184000, // 60 days
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: 15,
        errorRate: 0.1,
        throughput: 2500
      }
    },
    {
      id: 'redis-cache',
      name: 'Redis Cache',
      status: 'healthy' as const,
      uptime: 3456000, // 40 days
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: 5,
        errorRate: 0.0,
        throughput: 5000
      }
    },
    {
      id: 'ml-service',
      name: 'ML Service',
      status: 'down' as const,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: 0,
        errorRate: 100,
        throughput: 0
      }
    }
  ];

  const mockPerformanceMetrics = {
    avgResponseTime: 85,
    p95ResponseTime: 145,
    p99ResponseTime: 320,
    requestsPerSecond: 156,
    errorRate: 1.2,
    successRate: 98.8
  };

  const mockErrorRates = {
    total: 245,
    byType: [
      { type: 'Timeout Errors', count: 89, percentage: 36.3 },
      { type: 'Rate Limit Errors', count: 67, percentage: 27.3 },
      { type: 'Validation Errors', count: 45, percentage: 18.4 },
      { type: 'Network Errors', count: 28, percentage: 11.4 },
      { type: 'Other Errors', count: 16, percentage: 6.6 }
    ],
    trend: 'stable' as const
  };

  const mockCapacityMetrics = {
    activeWorkflows: 42,
    maxWorkflows: 100,
    activeAgents: 8,
    maxAgents: 20,
    queuedTasks: 156,
    processingCapacity: 78
  };

  // Generate mock historical data
  const generateHistoricalData = () => {
    const now = new Date();
    const dataPoints = 20;
    
    return {
      cpu: Array.from({ length: dataPoints }, (_, i) => ({
        time: new Date(now.getTime() - (dataPoints - i) * 60000).toLocaleTimeString(),
        value: 40 + Math.random() * 20
      })),
      memory: Array.from({ length: dataPoints }, (_, i) => ({
        time: new Date(now.getTime() - (dataPoints - i) * 60000).toLocaleTimeString(),
        value: 70 + Math.random() * 10
      })),
      requests: Array.from({ length: dataPoints }, (_, i) => ({
        time: new Date(now.getTime() - (dataPoints - i) * 60000).toLocaleTimeString(),
        value: 140 + Math.random() * 40
      })),
      errors: Array.from({ length: dataPoints }, (_, i) => ({
        time: new Date(now.getTime() - (dataPoints - i) * 60000).toLocaleTimeString(),
        value: Math.random() * 5
      }))
    };
  };

  const handleRefresh = () => {
    setRefreshCount(refreshCount + 1);
    console.log('Refreshing system health data...');
    // In a real implementation, this would fetch new data from the API
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', backgroundColor: '#f5f5f5' }}>
      <SystemHealthDashboard
        systemMetrics={mockSystemMetrics}
        componentHealth={mockComponentHealth}
        performanceMetrics={mockPerformanceMetrics}
        errorRates={mockErrorRates}
        capacityMetrics={mockCapacityMetrics}
        historicalData={generateHistoricalData()}
        onRefresh={handleRefresh}
      />
    </Box>
  );
};