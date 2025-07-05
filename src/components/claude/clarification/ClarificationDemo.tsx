import React, { useState } from 'react';
import { Box, Button, Paper, Typography, Stack, Chip, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import { QuestionAnswer as QuestionIcon, Psychology as PsychologyIcon } from '@mui/icons-material';
import { ClarificationDialog } from './ClarificationDialog';
import { ClarificationNotification } from './ClarificationNotification';
import { ClarificationRequest, ClarificationUrgency } from '../../../types/clarification';

const createDemoClarification = (urgency: ClarificationUrgency): ClarificationRequest => {
  const now = new Date();
  const expires = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  return {
    id: `demo-${Date.now()}`,
    task_id: 'demo-task-001',
    agent_id: 'claude_code',
    question: 'I found multiple authentication approaches. Which would you prefer for your application?',
    options: [
      {
        id: 'jwt',
        description: 'JWT-based authentication',
        pros: ['Stateless and scalable', 'Industry standard', 'Works well with microservices'],
        cons: ['Token management complexity', 'Requires refresh token handling'],
        recommended: true
      },
      {
        id: 'session',
        description: 'Session-based authentication',
        pros: ['Simple implementation', 'Easy revocation', 'Full server control'],
        cons: ['Requires server state', 'Less scalable', 'Cookie management needed']
      },
      {
        id: 'oauth',
        description: 'OAuth 2.0 with external providers',
        pros: ['No password management', 'Social login support', 'Trusted providers'],
        cons: ['Complex setup', 'External dependencies', 'Privacy concerns']
      }
    ],
    context: {
      current_implementation: 'Basic authentication with hardcoded credentials',
      performance_requirements: { 
        concurrent_users: 1000, 
        response_time_ms: 100 
      },
      constraints: { 
        compliance: 'SOC2', 
        existing_infrastructure: 'Redis available' 
      },
      related_files: [
        'src/auth/auth.py',
        'src/auth/middleware.py',
        'tests/test_auth.py'
      ]
    },
    urgency,
    timeout_seconds: 300,
    created_at: now.toISOString(),
    expires_at: expires.toISOString()
  };
};

export const ClarificationDemo: React.FC = () => {
  const [demoRequest, setDemoRequest] = useState<ClarificationRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState<ClarificationUrgency>(ClarificationUrgency.HIGH);
  const [notificationCount, setNotificationCount] = useState(0);

  const handleCreateDemo = () => {
    const newRequest = createDemoClarification(selectedUrgency);
    setDemoRequest(newRequest);
    setDialogOpen(true);
    setNotificationCount(1);
  };

  const handleRespond = (optionId: string, reasoning?: string) => {
    console.log('Demo response:', { optionId, reasoning });
    setDialogOpen(false);
    setNotificationCount(0);
    setTimeout(() => setDemoRequest(null), 1000);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Interactive Clarification Demo
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This demo shows the interactive clarification system where Claude can ask questions
        during task execution. Select an urgency level and click "Create Demo" to see the dialog.
      </Typography>

      <Stack spacing={3}>
        <FormControl sx={{ maxWidth: 300 }}>
          <InputLabel>Urgency Level</InputLabel>
          <Select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value as ClarificationUrgency)}
            label="Urgency Level"
          >
            <MenuItem value={ClarificationUrgency.LOW}>Low</MenuItem>
            <MenuItem value={ClarificationUrgency.MEDIUM}>Medium</MenuItem>
            <MenuItem value={ClarificationUrgency.HIGH}>High</MenuItem>
            <MenuItem value={ClarificationUrgency.CRITICAL}>Critical</MenuItem>
          </Select>
        </FormControl>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<QuestionIcon />}
            onClick={handleCreateDemo}
          >
            Create Demo Clarification
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Agent with clarification:</Typography>
            <ClarificationNotification
              count={notificationCount}
              urgency={selectedUrgency}
              agentAvatar={
                <Chip
                  icon={<PsychologyIcon />}
                  label="Claude"
                  color="primary"
                />
              }
              onClick={() => {
                if (demoRequest) {
                  setDialogOpen(true);
                }
              }}
            />
          </Box>
        </Stack>

        <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Features Demonstrated:
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              • Rich option cards with pros and cons
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Urgency-based animations (Critical shakes, High pulses)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Timeout countdown with progress bar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Contextual information display
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Optional reasoning input
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Testing in Chat:
          </Typography>
          <Typography variant="caption">
            Type <code>/test-clarification</code> in any ACORN chat to trigger a mock clarification
          </Typography>
        </Box>
      </Stack>

      {/* Clarification Dialog */}
      {demoRequest && (
        <ClarificationDialog
          request={demoRequest}
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setNotificationCount(0);
          }}
          onRespond={handleRespond}
        />
      )}
    </Paper>
  );
};