/**
 * Tier Navigation Component
 * Navigation interface for the 4-tier cognitive memory hierarchy
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Stack,
  Badge,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Psychology,
  Business,
  TrackChanges as Target,
  Description,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import type { 
  CognitiveTier,
  TierNavigationItem,
  TierStatsResponse,
} from '../../types/cognitive';
import { 
  TIER_DEFINITIONS,
  getTierColor,
} from '../../types/cognitive';

interface TierNavigationProps {
  stats: TierStatsResponse | null;
  selectedTier: CognitiveTier | null;
  onTierSelect: (tier: CognitiveTier) => void;
  loading?: boolean;
  compact?: boolean;
  showTrends?: boolean;
}

// Tier icons mapping
const TIER_ICONS = {
  1: Description,
  2: Target,
  3: Psychology,
  4: Business,
} as const;

export const TierNavigation: React.FC<TierNavigationProps> = ({
  stats,
  selectedTier,
  onTierSelect,
  loading = false,
  compact = false,
  showTrends = false,
}) => {
  const theme = useTheme();

  const tierItems: TierNavigationItem[] = [1, 2, 3, 4].map(tier => {
    const tierNum = tier as CognitiveTier;
    const tierStats = stats?.tier_distribution[tier.toString()];
    return {
      tier: tierNum,
      name: TIER_DEFINITIONS[tierNum].name,
      count: tierStats?.count || 0,
      percentage: tierStats?.percentage || 0,
      active: selectedTier === tierNum,
    };
  });

  const getTrendIcon = (percentage: number) => {
    if (percentage > 5) return TrendingUp;
    if (percentage < -5) return TrendingDown;
    return TrendingFlat;
  };

  const getTrendColor = (percentage: number) => {
    if (percentage > 5) return theme.palette.success.main;
    if (percentage < -5) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Memory Hierarchy
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse memories by cognitive tier
        </Typography>
      </Box>

      {/* Total Stats */}
      {stats && (
        <Card sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {stats.total_memories.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Memories Processed
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Tier Cards */}
      <Stack spacing={compact ? 1 : 2}>
        {tierItems.map((item) => {
          const Icon = TIER_ICONS[item.tier];
          const tierColor = getTierColor(item.tier);
          const tierDefinition = TIER_DEFINITIONS[item.tier];

          return (
            <Card
              key={item.tier}
              sx={{
                cursor: 'pointer',
                borderLeft: `4px solid ${tierColor}`,
                transition: 'all 0.2s ease-in-out',
                ...(item.active && {
                  bgcolor: alpha(tierColor, 0.1),
                  borderColor: tierColor,
                  transform: 'translateX(4px)',
                }),
                '&:hover': {
                  bgcolor: alpha(tierColor, 0.05),
                  transform: 'translateX(2px)',
                  boxShadow: theme.shadows[2],
                },
              }}
              onClick={() => onTierSelect(item.tier)}
            >
              <CardContent sx={{ 
                pb: compact ? '12px !important' : '16px !important',
                ...(compact && { pt: 1.5 })
              }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: compact ? 1 : 1.5 }}>
                  <Box
                    sx={{
                      bgcolor: alpha(tierColor, 0.1),
                      borderRadius: 1,
                      p: 0.75,
                      mr: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ color: tierColor, fontSize: 20 }} />
                  </Box>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant={compact ? 'subtitle2' : 'subtitle1'}
                        fontWeight="bold"
                        sx={{ 
                          color: item.active ? tierColor : 'text.primary',
                          flex: 1,
                          minWidth: 0,
                        }}
                        noWrap
                      >
                        Tier {item.tier}
                      </Typography>
                      
                      <Chip
                        label={item.count.toLocaleString()}
                        size="small"
                        sx={{
                          bgcolor: alpha(tierColor, 0.1),
                          color: tierColor,
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>
                    
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.25 }}
                    >
                      {item.name}
                    </Typography>
                  </Box>

                  {/* Trend Indicator */}
                  {showTrends && (
                    <Tooltip title="7-day trend">
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                        {React.createElement(getTrendIcon(item.percentage), {
                          sx: { 
                            color: getTrendColor(item.percentage),
                            fontSize: 16,
                          }
                        })}
                      </Box>
                    </Tooltip>
                  )}
                </Box>

                {/* Description */}
                {!compact && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5, lineHeight: 1.4 }}
                  >
                    {tierDefinition.description}
                  </Typography>
                )}

                {/* Progress Bar */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Distribution
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      fontWeight="medium"
                    >
                      {item.percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(tierColor, 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: tierColor,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>

                {/* Action Button */}
                {item.active ? (
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: tierColor,
                      color: 'white',
                      '&:hover': {
                        bgcolor: alpha(tierColor, 0.8),
                      },
                    }}
                  >
                    Currently Viewing
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderColor: alpha(tierColor, 0.3),
                      color: tierColor,
                      '&:hover': {
                        borderColor: tierColor,
                        bgcolor: alpha(tierColor, 0.05),
                      },
                    }}
                  >
                    Browse Tier {item.tier}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Loading State */}
      {loading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            Loading tier statistics...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TierNavigation;