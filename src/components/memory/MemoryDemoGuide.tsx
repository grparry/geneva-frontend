import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Psychology as BrainIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  Chat as ChatIcon,
  Speed as PerformanceIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

interface MemoryDemoGuideProps {
  onStartDemo?: () => void;
}

export const MemoryDemoGuide: React.FC<MemoryDemoGuideProps> = ({ onStartDemo }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: 'Create Memory-Enhanced Chat Room',
      description: 'Start by creating a new chat room with memory enhancement enabled',
      icon: <MemoryIcon />,
      actions: [
        'Click "New Memory Chat" button',
        'Enable "Memory Enhancement" toggle',
        'Select system agents (Thedra, Bradley, Greta)',
        'Add ACORN executives if desired',
        'Create the room'
      ]
    },
    {
      label: 'Observe Memory Status Indicators',
      description: 'Notice the memory indicators next to system agents',
      icon: <BrainIcon />,
      actions: [
        'Look for memory chips next to system agent names',
        'Click on memory indicators to see detailed stats',
        'Notice cache hit rates and item counts',
        'Observe real-time performance metrics'
      ]
    },
    {
      label: 'Engage in Contextual Conversations',
      description: 'Start chatting and watch agents use memory context',
      icon: <ChatIcon />,
      actions: [
        'Ask Bradley about security best practices',
        'Notice memory-enhanced responses with context chips',
        'Click on memory indicators in messages',
        'See how agents reference previous conversations'
      ]
    },
    {
      label: 'Experience Cross-Agent Learning',
      description: 'Watch agents share insights with each other',
      icon: <ShareIcon />,
      actions: [
        'Ask Thedra about memory optimization',
        'Ask Digby about automation for memory tasks',
        'Notice cross-agent insight chips in responses',
        'Observe learning patterns being applied'
      ]
    },
    {
      label: 'Explore Memory Panel',
      description: 'Use the memory panel to see conversation context',
      icon: <TrendingUpIcon />,
      actions: [
        'Click the memory book icon in the agent panel',
        'Browse memory contexts by agent',
        'Expand agent sections to see detailed memory items',
        'View learning patterns and cross-agent insights'
      ]
    },
    {
      label: 'Test Memory Commands',
      description: 'Try memory-specific chat commands',
      icon: <PerformanceIcon />,
      actions: [
        'Type "/memory" to open the memory panel',
        'Type "/memory-stats" to toggle memory indicators',
        'Type "/remember [text]" to store custom memory',
        'Notice how agents adapt to your preferences'
      ]
    }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🧠 Memory Enhancement Demo Guide
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Follow this guide to explore ACORN's memory-enhanced chat features
        </Typography>
      </Box>

      {/* Feature Overview */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>🚀 What's New in Memory-Enhanced Chat</AlertTitle>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          <Chip icon={<MemoryIcon />} label="Persistent Memory" color="primary" size="small" />
          <Chip icon={<BrainIcon />} label="Context Loading" color="secondary" size="small" />
          <Chip icon={<ShareIcon />} label="Cross-Agent Learning" color="success" size="small" />
          <Chip icon={<TrendingUpIcon />} label="Pattern Recognition" color="warning" size="small" />
          <Chip icon={<PerformanceIcon />} label="<100ms Performance" color="error" size="small" />
        </Box>
      </Alert>

      {/* System Agents Quick Reference */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🤖 Memory-Enhanced System Agents
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><MemoryIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Thedra (Chief Memory Officer)" 
                secondary="Manages conversation memory, retrieval, and semantic search"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><BrainIcon color="secondary" /></ListItemIcon>
              <ListItemText 
                primary="Greta (Chief Ontology Officer)" 
                secondary="Validates concepts and maintains semantic consistency"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><MemoryIcon color="error" /></ListItemIcon>
              <ListItemText 
                primary="Bradley (Chief Security Officer)" 
                secondary="Provides security guidance with contextual awareness"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              optional={
                index === steps.length - 1 ? (
                  <Typography variant="caption">Last step</Typography>
                ) : null
              }
              icon={step.icon}
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography sx={{ mb: 2 }}>{step.description}</Typography>
              <List dense>
                {step.actions.map((action, actionIndex) => (
                  <ListItem key={actionIndex} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={action}
                      sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mb: 2 }}>
                <div>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {index === steps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Completion */}
      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            🎉 Ready to Experience Memory-Enhanced Chat!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You're now ready to explore ACORN's advanced memory capabilities.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Review Guide
            </Button>
            <Button
              variant="contained"
              onClick={onStartDemo}
              sx={{ mt: 1 }}
            >
              Start Memory Chat Demo
            </Button>
          </Box>
        </Paper>
      )}

      {/* Quick Tips */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" gutterBottom>
        💡 Quick Tips
      </Typography>
      <List dense>
        <ListItem>
          <ListItemIcon><MemoryIcon color="primary" /></ListItemIcon>
          <ListItemText 
            primary="Memory indicators show real-time performance"
            secondary="Click any memory chip to see detailed statistics"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><BrainIcon color="secondary" /></ListItemIcon>
          <ListItemText 
            primary="Agents learn and adapt to your preferences"
            secondary="The more you chat, the better they understand your needs"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><ShareIcon color="success" /></ListItemIcon>
          <ListItemText 
            primary="Cross-agent learning shares knowledge"
            secondary="Security insights from Bradley help inform other agents"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><PerformanceIcon color="warning" /></ListItemIcon>
          <ListItemText 
            primary="All memory operations are performance optimized"
            secondary="Cache hit rates >80% ensure fast response times"
          />
        </ListItem>
      </List>
    </Paper>
  );
};

export default MemoryDemoGuide;