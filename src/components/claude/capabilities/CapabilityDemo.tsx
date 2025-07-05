import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Tabs,
  Tab,
  Alert,
  TextField,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { CapabilityBrowser } from './CapabilityBrowser';
import { TaskFeasibilityChecker } from './TaskFeasibilityChecker';
import { CapabilityHints } from './CapabilityHints';
import { useCapabilityManager } from '../../../hooks/useCapabilityManager';
import { CapabilitySpec, CapabilityHint } from '../../../types/capability';

export const CapabilityDemo: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [selectedCapability, setSelectedCapability] = useState<CapabilitySpec | null>(null);
  const [selectedHint, setSelectedHint] = useState<CapabilityHint | null>(null);

  const {
    capabilities,
    loading,
    error,
    validateTask,
    getCapabilityHints
  } = useCapabilityManager();

  const hints = getCapabilityHints(testInput);

  const handleCapabilitySelect = (capability: CapabilitySpec) => {
    setSelectedCapability(capability);
    setBrowserOpen(false);
  };

  const handleHintSelect = (hint: CapabilityHint) => {
    setSelectedHint(hint);
    const capability = capabilities.find(c => c.id === hint.capability);
    if (capability) {
      setSelectedCapability(capability);
    }
  };

  const demoTasks = [
    'Create a React component for user authentication',
    'Build a responsive data table with sorting',
    'Implement real-time chat functionality',
    'Set up automated testing for the frontend',
    'Design a secure API for user management',
    'Optimize application performance and bundle size'
  ];

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto', my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Capability Discovery Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases Claude's capability discovery system that helps users understand
        what tasks are feasible and provides intelligent suggestions during conversation.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab icon={<SearchIcon />} label="Capability Browser" />
          <Tab icon={<AssessmentIcon />} label="Task Feasibility" />
          <Tab icon={<LightbulbIcon />} label="Smart Hints" />
        </Tabs>
      </Box>

      {selectedTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Capability Browser
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Browse and search through Claude's capabilities to understand what tasks are possible.
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              onClick={() => setBrowserOpen(true)}
              startIcon={<SearchIcon />}
              disabled={loading}
            >
              Open Capability Browser
            </Button>

            {selectedCapability && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Selected: {selectedCapability.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedCapability.description}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Category:</Typography>
                      <Typography variant="body2">
                        {selectedCapability.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Confidence:</Typography>
                      <Typography variant="body2" color={
                        selectedCapability.confidence === 'HIGH' ? 'success.main' :
                        selectedCapability.confidence === 'MEDIUM' ? 'warning.main' : 'error.main'
                      }>
                        {selectedCapability.confidence}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Example Tasks:</Typography>
                      <ul>
                        {selectedCapability.examples.map((example, index) => (
                          <li key={index}>
                            <Typography variant="body2">{example}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Stack>

          <CapabilityBrowser
            open={browserOpen}
            onClose={() => setBrowserOpen(false)}
            capabilities={capabilities}
            onCapabilitySelect={handleCapabilitySelect}
          />
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Task Feasibility Checker
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Describe a task and get Claude's assessment of feasibility, required time, and approach.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Try these example tasks:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {demoTasks.map((task, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => setTestInput(task)}
                >
                  {task}
                </Button>
              ))}
            </Stack>
          </Box>

          <TaskFeasibilityChecker onValidateTask={validateTask} />
        </Box>
      )}

      {selectedTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Smart Capability Hints
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Type in the input below to see intelligent capability suggestions based on your text.
          </Typography>

          <Box sx={{ position: 'relative', mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Start typing a task description..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              helperText="Type at least 3 characters to see capability hints"
            />
            
            <CapabilityHints
              hints={hints}
              inputValue={testInput}
              onHintSelect={handleHintSelect}
              maxHints={3}
            />
          </Box>

          {hints.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Current Hints ({hints.length}):
              </Typography>
              <Stack spacing={1}>
                {hints.map((hint) => (
                  <Card key={hint.id} variant="outlined">
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {hint.suggestion}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {hint.reason} • Confidence: {hint.confidence}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {selectedHint && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Selected hint: <strong>{selectedHint.suggestion}</strong>
              <br />
              {selectedHint.reason}
            </Alert>
          )}
        </Box>
      )}

      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Usage in ACORN Chat:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Click the <strong>🔍</strong> button in chat to open the capability browser<br/>
          • Use <strong>/feasibility [task]</strong> to quickly check if a task is possible<br/>
          • Capability hints appear automatically as you type<br/>
          • Click any capability to get detailed information and examples
        </Typography>
      </Box>
    </Paper>
  );
};