import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Chip,
  Alert,
  AlertTitle,
  Grid
} from '@mui/material';
import {
  Security as SecurityIcon,
  Edit as EditIcon,
  Assignment as TaskIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { ConstraintValidator } from '../tools/ConstraintValidator';
import { CollaborativeEditor } from './CollaborativeEditor';
import { TaskPlanner } from './TaskPlanner';
import { PerformanceOverlay } from './PerformanceOverlay';

export const Phase4Demo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [performanceOverlayVisible, setPerformanceOverlayVisible] = useState(false);

  const features = [
    {
      id: 'constraint-validator',
      title: 'Constraint Validator',
      description: 'Security and compliance monitoring with real-time violation detection',
      icon: SecurityIcon,
      color: '#f44336',
      component: <ConstraintValidator projectId="demo-project" />
    },
    {
      id: 'collaborative-editor',
      title: 'Collaborative Editor',
      description: 'Monaco-based code editor with real-time collaboration features',
      icon: EditIcon,
      color: '#2196f3',
      component: <CollaborativeEditor sessionId="demo-session" height={500} />
    },
    {
      id: 'task-planner',
      title: 'Task Planner',
      description: 'Visual drag-drop task planning interface with dependency management',
      icon: TaskIcon,
      color: '#4caf50',
      component: <TaskPlanner planId="demo-plan" height={500} />
    },
    {
      id: 'performance-overlay',
      title: 'Performance Overlay',
      description: 'Real-time system metrics HUD with alerts and monitoring',
      icon: SpeedIcon,
      color: '#ff9800',
      component: null // Special handling for overlay
    }
  ];

  const handleFeatureSelect = (featureId: string) => {
    if (featureId === 'performance-overlay') {
      setPerformanceOverlayVisible(!performanceOverlayVisible);
    } else {
      setActiveDemo(activeDemo === featureId ? null : featureId);
    }
  };

  const activeFeature = features.find(f => f.id === activeDemo);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h4" gutterBottom>
          Claude Code Integration - Phase 4 Complete
        </Typography>
        <Typography variant="h6" gutterBottom>
          Advanced Integration Components
        </Typography>
        <Alert severity="success" sx={{ mt: 2, bgcolor: 'success.light' }}>
          <AlertTitle>Implementation Complete</AlertTitle>
          All Phase 4 components have been successfully implemented and integrated into ACORN chat.
        </Alert>
      </Paper>

      {/* Feature Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {features.map((feature) => {
          const IconComponent = feature.icon;
          const isActive = activeDemo === feature.id || (feature.id === 'performance-overlay' && performanceOverlayVisible);
          
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={feature.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: isActive ? 2 : 1,
                  borderColor: isActive ? feature.color : 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => handleFeatureSelect(feature.id)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <IconComponent 
                    sx={{ 
                      fontSize: 48, 
                      color: feature.color, 
                      mb: 2 
                    }} 
                  />
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button 
                    variant={isActive ? 'contained' : 'outlined'}
                    color="primary"
                    startIcon={isActive ? <CheckIcon /> : <IconComponent />}
                  >
                    {isActive ? 'Active' : 'Demo'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Active Demo Display */}
      {activeFeature && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              {activeFeature.title} Demo
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setActiveDemo(null)}
            >
              Close Demo
            </Button>
          </Box>
          
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {activeFeature.component}
          </Box>
        </Paper>
      )}

      {/* Features Summary */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Phase 4 Implementation Summary
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              ✅ Completed Components
            </Typography>
            <Stack spacing={1}>
              <Chip label="ConstraintValidator - Security & compliance monitoring" />
              <Chip label="CollaborativeEditor - Monaco editor with real-time collaboration" />
              <Chip label="TaskPlanner - Visual drag-drop task planning" />
              <Chip label="PerformanceOverlay - System metrics HUD" />
            </Stack>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              🎯 Key Features Delivered
            </Typography>
            <Stack spacing={1}>
              <Chip label="Real-time constraint validation" color="primary" />
              <Chip label="Multi-user code collaboration" color="primary" />
              <Chip label="Interactive task dependencies" color="primary" />
              <Chip label="Live performance monitoring" color="primary" />
            </Stack>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>Integration Status</AlertTitle>
          All Phase 4 components are now integrated into the ACORN chat interface. 
          Access them via the new tabs: Constraints, Code Editor, and Task Planner. 
          The Performance Overlay can be toggled from the chat input area.
        </Alert>
      </Paper>

      {/* Performance Overlay */}
      {performanceOverlayVisible && (
        <PerformanceOverlay
          position="bottom-right"
          updateInterval={2000}
          showAlerts={true}
          onMetricsUpdate={(metrics) => {
            console.log('Demo performance metrics:', metrics);
          }}
        />
      )}
    </Box>
  );
};