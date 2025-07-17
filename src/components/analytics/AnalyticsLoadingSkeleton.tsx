/**
 * Loading skeleton components for analytics sections
 */

import React from 'react';
import { 
  Box, 
  Skeleton, 
  Grid, 
  Card, 
  CardContent,
  Stack,
} from '@mui/material';

// KPI Card Skeleton
export const KPICardSkeleton: React.FC = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="text" width="30%" height={20} />
      </Box>
    </CardContent>
  </Card>
);

// Chart Skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1 }} />
    </CardContent>
  </Card>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
      
      {/* Table Header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, px: 1 }}>
        <Skeleton variant="text" width="25%" height={24} />
        <Skeleton variant="text" width="20%" height={24} />
        <Skeleton variant="text" width="20%" height={24} />
        <Skeleton variant="text" width="15%" height={24} />
        <Skeleton variant="text" width="20%" height={24} />
      </Box>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <Box 
          key={index}
          sx={{ 
            display: 'flex', 
            gap: 2, 
            py: 1.5, 
            px: 1,
            borderTop: index === 0 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Skeleton variant="text" width="25%" height={20} />
          <Skeleton variant="text" width="20%" height={20} />
          <Skeleton variant="text" width="20%" height={20} />
          <Skeleton variant="text" width="15%" height={20} />
          <Skeleton variant="text" width="20%" height={20} />
        </Box>
      ))}
    </CardContent>
  </Card>
);

// Executive Dashboard Skeleton
export const ExecutiveDashboardSkeleton: React.FC = () => (
  <Box>
    {/* KPI Cards */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {[1, 2, 3, 4].map((item) => (
        <Grid xs={12} sm={6} md={3} key={item}>
          <KPICardSkeleton />
        </Grid>
      ))}
    </Grid>

    {/* Charts Row */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid xs={12} md={8}>
        <ChartSkeleton height={400} />
      </Grid>
      <Grid xs={12} md={4}>
        <ChartSkeleton height={400} />
      </Grid>
    </Grid>

    {/* Table */}
    <TableSkeleton rows={5} />
  </Box>
);

// Cost Analysis Skeleton
export const CostAnalysisSkeleton: React.FC = () => (
  <Box>
    {/* Summary Cards */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {[1, 2, 3].map((item) => (
        <Grid xs={12} md={4} key={item}>
          <KPICardSkeleton />
        </Grid>
      ))}
    </Grid>

    {/* Charts */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid xs={12} md={6}>
        <ChartSkeleton height={350} />
      </Grid>
      <Grid xs={12} md={6}>
        <ChartSkeleton height={350} />
      </Grid>
    </Grid>

    {/* Breakdown Table */}
    <TableSkeleton rows={8} />
  </Box>
);

// Workflow Analytics Skeleton
export const WorkflowAnalyticsSkeleton: React.FC = () => (
  <Box>
    {/* Summary Stats */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {[1, 2, 3, 4].map((item) => (
        <Grid xs={12} sm={6} md={3} key={item}>
          <KPICardSkeleton />
        </Grid>
      ))}
    </Grid>

    {/* Performance Chart */}
    <Box sx={{ mb: 3 }}>
      <ChartSkeleton height={400} />
    </Box>

    {/* Workflow List */}
    <TableSkeleton rows={10} />
  </Box>
);

// Agent Performance Skeleton
export const AgentPerformanceSkeleton: React.FC = () => (
  <Box>
    {/* Agent Cards */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid xs={12} sm={6} md={4} key={item}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="70%" height={24} />
                  <Skeleton variant="text" width="50%" height={20} />
                </Box>
              </Box>
              <Stack spacing={1}>
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="80%" height={20} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Utilization Chart */}
    <ChartSkeleton height={400} />
  </Box>
);

// Alert List Skeleton
export const AlertListSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <Stack spacing={2}>
    {Array.from({ length: items }).map((_, index) => (
      <Card key={index}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
          </Box>
          <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="text" width="30%" height={20} />
            <Skeleton variant="text" width="30%" height={20} />
          </Box>
        </CardContent>
      </Card>
    ))}
  </Stack>
);

// Generic Analytics Section Skeleton
export const AnalyticsSectionSkeleton: React.FC<{ 
  title?: boolean;
  cards?: number;
  chart?: boolean;
  table?: boolean;
  tableRows?: number;
}> = ({ 
  title = true, 
  cards = 0, 
  chart = false, 
  table = false, 
  tableRows = 5 
}) => (
  <Box>
    {title && (
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
    )}
    
    {cards > 0 && (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Array.from({ length: cards }).map((_, index) => (
          <Grid xs={12} sm={6} md={12 / cards} key={index}>
            <KPICardSkeleton />
          </Grid>
        ))}
      </Grid>
    )}
    
    {chart && (
      <Box sx={{ mb: 3 }}>
        <ChartSkeleton />
      </Box>
    )}
    
    {table && <TableSkeleton rows={tableRows} />}
  </Box>
);

export default {
  KPICardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  ExecutiveDashboardSkeleton,
  CostAnalysisSkeleton,
  WorkflowAnalyticsSkeleton,
  AgentPerformanceSkeleton,
  AlertListSkeleton,
  AnalyticsSectionSkeleton,
};