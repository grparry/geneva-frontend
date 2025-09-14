/**
 * Memory5DAnalyticsPage
 * Analytics dashboard for 5D memory system performance and insights
 */

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

import {
  useGetMemoryAnalyticsQuery,
  useGetDimensionalStatsQuery,
} from '../../services/memory5d/api';

export const Memory5DAnalyticsPage: React.FC = () => {
  const {
    data: analytics,
    isLoading: analyticsLoading,
  } = useGetMemoryAnalyticsQuery({
    time_range: '7d',
    include_predictions: true,
  });

  const {
    data: dimensionalStats,
    isLoading: statsLoading,
  } = useGetDimensionalStatsQuery({
    time_range: '30d',
    include_trends: true,
  });

  // Mock data for demonstration
  const mockDimensionalData = [
    { name: 'Cognitive Type', observation: 45, analysis: 25, decision: 15, reflection: 10, pattern: 3, insight: 2 },
    { name: 'Temporal Tier', immediate: 20, session: 30, tactical: 25, strategic: 20, institutional: 5 },
    { name: 'Org Scope', personal: 15, team: 35, department: 25, organization: 20, ecosystem: 5 },
    { name: 'Security', public: 30, internal: 40, confidential: 20, restricted: 8, top_secret: 2 },
    { name: 'Ontology', technical: 40, business: 25, interpersonal: 15, creative: 10, operational: 7, strategic: 3 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (analyticsLoading || statsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          📊 5D Memory Analytics
        </Typography>
        <Typography>Loading analytics data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        📊 5D Memory Analytics Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Comprehensive analytics across all 5 dimensions of memory classification.
        Track trends, patterns, and system performance over time.
      </Typography>

      <Grid container spacing={3}>
        {/* System Overview */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processing Statistics
              </Typography>
              {analytics ? (
                <Box>
                  <Typography variant="body2">
                    Total Processed Today: {analytics.processing_stats.total_processed_today}
                  </Typography>
                  <Typography variant="body2">
                    Average Processing Time: {analytics.processing_stats.avg_processing_time_seconds.toFixed(1)}s
                  </Typography>
                  <Typography variant="body2">
                    Success Rate: {(analytics.processing_stats.success_rate * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    Error Rate: {(analytics.processing_stats.error_rate * 100).toFixed(2)}%
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Analytics data not available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Dimensional Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Memories by Dimension
              </Typography>
              {dimensionalStats ? (
                <Typography variant="h3" color="primary">
                  {dimensionalStats.total_memories.toLocaleString()}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Stats not available
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Cross-dimensional coherence: {dimensionalStats ? `${(dimensionalStats.cross_dimensional_coherence * 100).toFixed(1)}%` : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Dimensional Breakdown Chart */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Distribution Across Dimensions
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockDimensionalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="observation" stackId="a" fill="#0088FE" />
                  <Bar dataKey="analysis" stackId="a" fill="#00C49F" />
                  <Bar dataKey="decision" stackId="a" fill="#FFBB28" />
                  <Bar dataKey="reflection" stackId="a" fill="#FF8042" />
                  <Bar dataKey="pattern" stackId="a" fill="#8884D8" />
                  <Bar dataKey="insight" stackId="a" fill="#82CA9D" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Trending Analysis */}
        {analytics && analytics.dimensional_trends.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trending Dimensions
                </Typography>
                {analytics.dimensional_trends.map((trend, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{trend.dimension}:</strong>
                    </Typography>
                    {trend.trending_values.map((value, valueIndex) => (
                      <Typography key={valueIndex} variant="caption" sx={{ display: 'block', ml: 2 }}>
                        {value.value}: {value.growth_rate > 0 ? '+' : ''}{(value.growth_rate * 100).toFixed(1)}% growth
                      </Typography>
                    ))}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Usage Patterns */}
        {analytics && analytics.usage_patterns && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Usage Patterns
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Peak Usage Hours:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {analytics.usage_patterns.peak_hours.map((hour, index) => (
                    <Typography key={index} variant="caption" sx={{ mr: 1 }}>
                      {hour}:00
                    </Typography>
                  ))}
                </Box>

                <Typography variant="body2" gutterBottom>
                  Top Search Terms:
                </Typography>
                <Box>
                  {analytics.usage_patterns.popular_search_terms.slice(0, 5).map((term, index) => (
                    <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                      • {term}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};