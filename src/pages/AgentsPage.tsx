import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const agents = [
  {
    id: 'claude-agent-1',
    name: 'Claude Primary',
    status: 'active',
    executions: 47,
    successRate: 94.2,
    lastActivity: '2 minutes ago'
  },
  {
    id: 'memory-service',
    name: 'Memory Service',
    status: 'active',
    executions: 156,
    successRate: 98.1,
    lastActivity: '30 seconds ago'
  },
  {
    id: 'substrate-indexer',
    name: 'Substrate Indexer',
    status: 'idle',
    executions: 23,
    successRate: 91.3,
    lastActivity: '1 hour ago'
  }
];

export const AgentsPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Agent Overview
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor and manage all agents in the Geneva platform
      </Typography>

      <Grid container spacing={3}>
        {agents.map((agent) => (
          <Grid key={agent.id} size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <SmartToyIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {agent.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {agent.id}
                    </Typography>
                  </Box>
                  <Chip 
                    icon={agent.status === 'active' ? <CheckCircleIcon /> : <WarningIcon />}
                    label={agent.status}
                    color={agent.status === 'active' ? 'success' : 'warning'}
                    size="small"
                  />
                </Stack>

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Executions
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {agent.executions}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {agent.successRate}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Activity
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {agent.lastActivity}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};