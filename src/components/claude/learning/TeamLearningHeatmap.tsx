import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tooltip,
  Avatar,
  Chip,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import {
  TeamLearningData,
  SkillArea
} from '../../../types/learning';

interface TeamLearningHeatmapProps {
  teamData: TeamLearningData[];
  timeRange: string;
}

interface HeatmapCell {
  userId: string;
  userName: string;
  skillName: string;
  level: number;
  progressRate: number;
  category: string;
}

export const TeamLearningHeatmap: React.FC<TeamLearningHeatmapProps> = ({
  teamData,
  timeRange
}) => {
  const { heatmapData, skillCategories, topPerformers } = useMemo(() => {
    // Extract all unique skills and categories
    const allSkills = new Set<string>();
    const categories = new Set<string>();
    
    teamData.forEach(member => {
      member.skillAreas.forEach(skill => {
        allSkills.add(skill.name);
        categories.add(skill.category);
      });
    });

    // Create heatmap data
    const heatmap: HeatmapCell[] = [];
    teamData.forEach(member => {
      member.skillAreas.forEach(skill => {
        heatmap.push({
          userId: member.userId,
          userName: member.userName,
          skillName: skill.name,
          level: skill.currentLevel,
          progressRate: skill.progressRate,
          category: skill.category
        });
      });
    });

    // Find top performers
    const performers = teamData
      .map(member => ({
        ...member,
        averageSkillLevel: member.skillAreas.reduce((sum, skill) => sum + skill.currentLevel, 0) / member.skillAreas.length,
        improvingSkills: member.skillAreas.filter(skill => skill.progressRate > 0).length
      }))
      .sort((a, b) => b.averageSkillLevel - a.averageSkillLevel)
      .slice(0, 3);

    return {
      heatmapData: heatmap,
      skillCategories: Array.from(categories),
      topPerformers: performers
    };
  }, [teamData]);

  const getHeatColor = (level: number, progressRate: number) => {
    // Base color based on skill level
    let baseColor = '';
    if (level >= 80) baseColor = '#4caf50'; // Green
    else if (level >= 60) baseColor = '#ff9800'; // Orange  
    else if (level >= 40) baseColor = '#2196f3'; // Blue
    else baseColor = '#f44336'; // Red

    // Adjust opacity based on progress rate
    const opacity = Math.max(0.3, Math.min(1, (progressRate + 5) / 10));
    
    return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  const getProgressIcon = (progressRate: number) => {
    if (progressRate > 1) return <TrendingUpIcon fontSize="small" color="success" />;
    if (progressRate < -1) return <TrendingDownIcon fontSize="small" color="error" />;
    return <TrendingFlatIcon fontSize="small" color="info" />;
  };

  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, HeatmapCell[]> = {};
    skillCategories.forEach(category => {
      grouped[category] = heatmapData.filter(cell => cell.category === category);
    });
    return grouped;
  }, [heatmapData, skillCategories]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Team Learning Heatmap - {timeRange}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Skill levels and learning progress across the team. Darker colors indicate higher skill levels,
        with icons showing learning velocity.
      </Typography>

      {/* Top Performers */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          🏆 Top Learners
        </Typography>
        <Grid container spacing={2}>
          {topPerformers.map((performer, index) => (
            <Grid item xs={12} sm={4} key={performer.userId}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ 
                    mx: 'auto', 
                    mb: 1,
                    bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : '#CD7F32',
                    color: 'white'
                  }}>
                    {performer.userName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="subtitle2">
                    {performer.userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Avg Level: {Math.round(performer.averageSkillLevel)}%
                  </Typography>
                  <Chip 
                    size="small" 
                    label={`${performer.improvingSkills} skills improving`}
                    color="success"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Velocity: {performer.learningVelocity.toFixed(1)}/week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Heatmap by Category */}
      {skillCategories.map(category => {
        const categoryData = groupedByCategory[category];
        const uniqueUsers = Array.from(new Set(categoryData.map(cell => cell.userName)));
        const uniqueSkills = Array.from(new Set(categoryData.map(cell => cell.skillName)));

        return (
          <Paper key={category} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Typography>
            
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: `150px repeat(${uniqueSkills.length}, 120px)`,
                gap: 1,
                minWidth: 150 + (uniqueSkills.length * 120)
              }}>
                {/* Header */}
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2">Team Member</Typography>
                </Box>
                {uniqueSkills.map(skill => (
                  <Box key={skill} sx={{ p: 1 }}>
                    <Typography variant="caption" sx={{ 
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      fontSize: '0.7rem'
                    }}>
                      {skill}
                    </Typography>
                  </Box>
                ))}

                {/* Data Rows */}
                {uniqueUsers.map(userName => (
                  <React.Fragment key={userName}>
                    {/* User name */}
                    <Box sx={{ 
                      p: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      borderRight: 1,
                      borderColor: 'divider'
                    }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.7rem' }}>
                        {userName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {userName}
                      </Typography>
                    </Box>

                    {/* Skill cells */}
                    {uniqueSkills.map(skillName => {
                      const cell = categoryData.find(c => 
                        c.userName === userName && c.skillName === skillName
                      );
                      
                      if (!cell) {
                        return (
                          <Box key={skillName} sx={{ 
                            p: 1, 
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="caption" color="text.secondary">
                              N/A
                            </Typography>
                          </Box>
                        );
                      }

                      return (
                        <Tooltip 
                          key={skillName}
                          title={
                            <Box>
                              <Typography variant="caption" display="block">
                                {userName} - {skillName}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Level: {cell.level}%
                              </Typography>
                              <Typography variant="caption" display="block">
                                Progress: {cell.progressRate > 0 ? '+' : ''}{cell.progressRate.toFixed(1)}/week
                              </Typography>
                            </Box>
                          }
                        >
                          <Box sx={{ 
                            p: 1,
                            bgcolor: getHeatColor(cell.level, cell.progressRate),
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 60,
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8
                            }
                          }}>
                            <Typography variant="caption" sx={{ 
                              fontWeight: 600,
                              color: cell.level > 50 ? 'white' : 'black'
                            }}>
                              {cell.level}%
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {getProgressIcon(cell.progressRate)}
                            </Box>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          </Paper>
        );
      })}

      {/* Legend */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Legend
        </Typography>
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <Box>
            <Typography variant="caption" display="block" gutterBottom>
              Skill Level Colors:
            </Typography>
            <Stack direction="row" spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#f44336', borderRadius: 0.5 }} />
                <Typography variant="caption">0-40%</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#2196f3', borderRadius: 0.5 }} />
                <Typography variant="caption">40-60%</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: 0.5 }} />
                <Typography variant="caption">60-80%</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: 0.5 }} />
                <Typography variant="caption">80%+</Typography>
              </Box>
            </Stack>
          </Box>
          
          <Box>
            <Typography variant="caption" display="block" gutterBottom>
              Progress Indicators:
            </Typography>
            <Stack direction="row" spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon fontSize="small" color="success" />
                <Typography variant="caption">Improving</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingFlatIcon fontSize="small" color="info" />
                <Typography variant="caption">Stable</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingDownIcon fontSize="small" color="error" />
                <Typography variant="caption">Declining</Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};