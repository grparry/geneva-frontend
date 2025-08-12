/**
 * Performance-optimized analytics dashboard
 * Integrates all performance optimization features
 */

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  DownloadRounded,
  SpeedRounded,
  CachedRounded,
  OfflinePinRounded,
  WarningRounded,
  CheckCircleRounded,
  InfoRounded,
} from '@mui/icons-material';

import { useGetKPIMetricsQuery } from '../../services/analyticsApi';
import { OptimizedLineChart, OptimizedAreaChart, OptimizedPieChart } from './OptimizedChart';
import { VirtualizedTable, createColumn } from './VirtualizedTable';
import { useChartOptimization, useLazyChartRender } from '../../hooks/useChartOptimization';
import { useServiceWorker, formatCacheSize } from '../../utils/serviceWorkerManager';
import { useDataExport, ExportFormat } from '../../utils/dataExport';
import { usePerformanceMonitor } from '../../utils/performanceMonitor';
import { cacheManager } from '../../services/analyticsCacheManager';

// Lazy load heavy components
const LazyRealtimeMetrics = React.lazy(() => import('./RealtimeMetrics'));
const LazyAlertsList = React.lazy(() => import('./AlertsList'));

export const PerformanceOptimizedDashboard: React.FC = () => {
  const theme = useTheme();
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [showServiceWorkerUpdate, setShowServiceWorkerUpdate] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Hooks
  const { data: kpiData, isLoading: kpiLoading } = useGetKPIMetricsQuery({ 
    time_range: '30d'
  });
  const serviceWorker = useServiceWorker({
    onUpdate: () => setShowServiceWorkerUpdate(true),
  });
  const { exportData, isExporting } = useDataExport();
  const { summary: performanceSummary } = usePerformanceMonitor();

  // Chart optimization for workflow trends
  const workflowTrendData = useMemo(() => {
    if (!kpiData?.workflows) return [];
    // Generate mock trend data
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      successful: Math.floor(Math.random() * 50) + 100,
      failed: Math.floor(Math.random() * 10) + 5,
      total: 0,
    })).map(d => ({ ...d, total: d.successful + d.failed }));
  }, [kpiData]);

  const { data: optimizedWorkflowData, isProcessing } = useChartOptimization(
    workflowTrendData,
    { maxDataPoints: 500, enableSampling: true }
  );

  // Lazy chart rendering
  const chartRef = React.useRef<HTMLDivElement>(null);
  const { shouldRender: shouldRenderChart } = useLazyChartRender(chartRef as React.RefObject<HTMLElement>);

  // Export handlers
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchor(null);
  };

  const handleExport = async (format: ExportFormat) => {
    handleExportClose();
    
    if (!kpiData) return;

    const exportPayload = [
      {
        metric: 'Total Workflows',
        value: kpiData.workflows.total,
        change: kpiData.workflows.trend,
        target: 500,
        status: 'On Track',
      },
      {
        metric: 'Success Rate',
        value: kpiData.workflows.success_rate,
        change: 5.2,
        target: 95,
        status: kpiData.workflows.success_rate >= 95 ? 'Achieved' : 'Below Target',
      },
      {
        metric: 'Total Cost',
        value: kpiData.costs.total,
        change: kpiData.costs.trend,
        target: 10000,
        status: kpiData.costs.total <= 10000 ? 'Under Budget' : 'Over Budget',
      },
    ];

    await exportData(exportPayload, {
      format,
      filename: 'analytics_dashboard',
      title: 'Geneva Analytics Dashboard Export',
      description: 'Performance metrics and KPIs',
      metadata: {
        exportDate: new Date().toISOString(),
        period: 'Last 30 days',
      },
    });
  };

  // Cache management
  const handleClearCache = async () => {
    await cacheManager.invalidate();
    await serviceWorker.clearCache();
    setCacheCleared(true);
  };

  // Service worker update
  const handleServiceWorkerUpdate = () => {
    serviceWorker.skipWaiting();
    setShowServiceWorkerUpdate(false);
  };

  // Performance status
  const performanceStatus = useMemo(() => {
    const criticalCount = performanceSummary.criticalIssues.length;
    if (criticalCount === 0) return { level: 'good', message: 'Excellent performance' };
    if (criticalCount <= 2) return { level: 'warning', message: `${criticalCount} performance issues` };
    return { level: 'critical', message: `${criticalCount} critical issues` };
  }, [performanceSummary]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold">
            Performance-Optimized Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Performance indicator */}
            <Chip
              icon={
                performanceStatus.level === 'good' ? <CheckCircleRounded /> :
                performanceStatus.level === 'warning' ? <WarningRounded /> :
                <WarningRounded />
              }
              label={performanceStatus.message}
              color={
                performanceStatus.level === 'good' ? 'success' :
                performanceStatus.level === 'warning' ? 'warning' :
                'error'
              }
              size="small"
            />

            {/* Cache info */}
            <Chip
              icon={<CachedRounded />}
              label={`Cache: ${formatCacheSize(serviceWorker.cacheSize)}`}
              size="small"
              variant="outlined"
            />

            {/* Offline status */}
            {serviceWorker.active && (
              <Chip
                icon={<OfflinePinRounded />}
                label="Offline Ready"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}

            {/* Export button */}
            <Button
              variant="outlined"
              startIcon={<DownloadRounded />}
              onClick={handleExportClick}
              disabled={isExporting || kpiLoading}
            >
              Export
            </Button>

            {/* Cache clear */}
            <Tooltip title="Clear all caches">
              <IconButton onClick={handleClearCache} size="small">
                <CachedRounded />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Main content grid */}
      <Grid container spacing={3}>
        {/* KPI Cards */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Workflow Success
            </Typography>
            <Typography variant="h3" color="primary">
              {kpiLoading ? <CircularProgress size={40} /> : `${kpiData?.workflows.success_rate.toFixed(1)}%`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {kpiData?.workflows.trend && kpiData.workflows.trend > 0 ? '+' : ''}{kpiData?.workflows.trend?.toFixed(1) || '0.0'}% from last period
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Total Cost
            </Typography>
            <Typography variant="h3" color="warning.main">
              {kpiLoading ? <CircularProgress size={40} /> : `$${kpiData?.costs.total.toFixed(2)}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg per workflow: ${kpiData?.costs.avg_per_workflow.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Active Agents
            </Typography>
            <Typography variant="h3" color="success.main">
              {kpiLoading ? <CircularProgress size={40} /> : kpiData?.agents.active_count || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {kpiData?.agents.active_count || 0} active agents
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Avg Response Time
            </Typography>
            <Typography variant="h3" color="info.main">
              {kpiLoading ? <CircularProgress size={40} /> : `${kpiData?.performance.avg_response_time || 0}ms`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Within target range
            </Typography>
          </Paper>
        </Grid>

        {/* Optimized workflow trend chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2, height: 400 }} ref={chartRef}>
            <Typography variant="h6" gutterBottom>
              Workflow Trends (Optimized)
            </Typography>
            {shouldRenderChart ? (
              <OptimizedLineChart
                data={optimizedWorkflowData}
                lines={[
                  { dataKey: 'successful', name: 'Successful', color: theme.palette.success.main },
                  { dataKey: 'failed', name: 'Failed', color: theme.palette.error.main },
                  { dataKey: 'total', name: 'Total', color: theme.palette.primary.main },
                ]}
                xDataKey="date"
                yAxisLabel="Workflows"
                loading={isProcessing}
                height={350}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
                <Typography color="text.secondary">Scroll to view chart</Typography>
              </Box>
            )}
            {isProcessing && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <InfoRounded fontSize="small" sx={{ mr: 1 }} />
                Processing {workflowTrendData.length} data points → {optimizedWorkflowData.length} optimized points
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Real-time metrics (lazy loaded) */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Real-time Metrics
            </Typography>
            <Suspense fallback={<CircularProgress />}>
              <LazyRealtimeMetrics />
            </Suspense>
          </Paper>
        </Grid>

        {/* Virtualized table example */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Workflows (Virtualized)
            </Typography>
            <VirtualizedTable
              columns={[
                createColumn({ id: 'name', label: 'Workflow Name', width: 300 }),
                createColumn({ id: 'status', label: 'Status', width: 120 }),
                createColumn({ id: 'duration', label: 'Duration (s)', numeric: true, width: 120 }),
                createColumn({ id: 'cost', label: 'Cost ($)', numeric: true, width: 120 }),
                createColumn({ id: 'timestamp', label: 'Timestamp', width: 200 }),
              ]}
              data={Array.from({ length: 1000 }, (_, i) => ({
                id: i.toString(),
                name: `Workflow ${i + 1}`,
                status: Math.random() > 0.8 ? 'Failed' : 'Success',
                duration: (Math.random() * 300).toFixed(2),
                cost: (Math.random() * 50).toFixed(2),
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
              }))}
              maxHeight={400}
            />
          </Paper>
        </Grid>

        {/* Alerts (lazy loaded) */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Alerts
            </Typography>
            <Suspense fallback={<CircularProgress />}>
              <LazyAlertsList />
            </Suspense>
          </Paper>
        </Grid>
      </Grid>

      {/* Export menu */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={handleExportClose}
      >
        <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
        <MenuItem onClick={() => handleExport('json')}>Export as JSON</MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>Export as Excel</MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
      </Menu>

      {/* Service worker update notification */}
      <Snackbar
        open={showServiceWorkerUpdate}
        message="New version available!"
        action={
          <Button color="secondary" size="small" onClick={handleServiceWorkerUpdate}>
            Update
          </Button>
        }
      />

      {/* Cache cleared notification */}
      <Snackbar
        open={cacheCleared}
        autoHideDuration={3000}
        onClose={() => setCacheCleared(false)}
        message="Cache cleared successfully"
      />
    </Box>
  );
};

export default PerformanceOptimizedDashboard;