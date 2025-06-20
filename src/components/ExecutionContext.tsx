import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Card,
  CardContent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Terminal as TerminalIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  AccountTree as GitIcon,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ExecutionContextData {
  context_id: string;
  execution_id: string;
  working_directory: string;
  git_repository?: string;
  initial_files: string[];
  modified_files: string[];
  created_files: string[];
  deleted_files: string[];
  environment_variables: Record<string, string>;
  tool_availability: string[];
  memory_context: Record<string, any>;
  final_state: Record<string, any>;
}

interface ExecutionContextProps {
  executionId: string;
}

export const ExecutionContext: React.FC<ExecutionContextProps> = ({ executionId }) => {
  const [contextData, setContextData] = useState<ExecutionContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    const loadContext = async () => {
      setLoading(true);
      try {
        // Mock data - in production this would be: await api.getExecutionContext(executionId)
        const mockContext: ExecutionContextData = {
          context_id: 'ctx-001',
          execution_id: executionId,
          working_directory: '/Users/Geneva/Documents/0_substrate/Geneva',
          git_repository: 'https://github.com/geneva/platform.git',
          initial_files: [
            'src/api/app.py',
            'src/observability/core.py',
            'requirements.txt',
            'package.json'
          ],
          modified_files: [
            'src/api/app.py',
            'src/observability/communication_stream.py',
            'package.json'
          ],
          created_files: [
            'src/observability/stream_monitor.py',
            'test_stream_simple.py',
            'src/components/StreamMessage.tsx'
          ],
          deleted_files: [
            'legacy_monitor.py'
          ],
          environment_variables: {
            'NODE_ENV': 'development',
            'REACT_APP_API_URL': 'http://localhost:8000',
            'OBSERVABILITY_ENABLED': 'true',
            'DATABASE_URL': 'postgresql://user:pass@localhost/geneva'
          },
          tool_availability: [
            'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
            'MultiEdit', 'Task', 'WebFetch', 'TodoRead', 'TodoWrite'
          ],
          memory_context: {
            'project_type': 'React + FastAPI',
            'current_task': 'Communication stream enhancement',
            'files_in_context': ['StreamViewer.tsx', 'communication_stream.py'],
            'recent_changes': 'Enhanced message rendering with syntax highlighting'
          },
          final_state: {
            'status': 'completed',
            'files_changed': 3,
            'tests_passing': true,
            'build_successful': true,
            'deployment_ready': true
          }
        };
        
        setContextData(mockContext);
      } catch (error) {
        console.error('Failed to load execution context:', error);
      } finally {
        setLoading(false);
      }
    };

    if (executionId) {
      loadContext();
    }
  }, [executionId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const renderFileList = (files: string[], icon: React.ReactNode, color: string) => {
    if (files.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No files
        </Typography>
      );
    }

    return (
      <List dense>
        {files.map((file, index) => (
          <ListItem key={index}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Box sx={{ color }}>{icon}</Box>
            </ListItemIcon>
            <ListItemText 
              primary={file}
              primaryTypographyProps={{ 
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!contextData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No execution context available
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <TerminalIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Execution Context
          </Typography>
          <Chip 
            label={executionId.slice(-6)}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Environment" />
          <Tab label="File Changes" />
          <Tab label="Git Activity" />
          <Tab label="Memory Context" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Environment Tab */}
        {selectedTab === 0 && (
          <Stack spacing={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Working Directory
                </Typography>
                <TextField
                  fullWidth
                  value={contextData.working_directory}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ fontFamily: 'monospace' }}
                />
              </CardContent>
            </Card>

            {contextData.git_repository && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <GitIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Git Repository
                  </Typography>
                  <TextField
                    fullWidth
                    value={contextData.git_repository}
                    InputProps={{ readOnly: true }}
                    size="small"
                    sx={{ fontFamily: 'monospace' }}
                  />
                </CardContent>
              </Card>
            )}

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Environment Variables ({Object.keys(contextData.environment_variables).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <SyntaxHighlighter
                  language="bash"
                  style={tomorrow}
                  customStyle={{ margin: 0, borderRadius: 4 }}
                >
                  {Object.entries(contextData.environment_variables)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('\n')}
                </SyntaxHighlighter>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Available Tools ({contextData.tool_availability.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {contextData.tool_availability.map((tool) => (
                    <Chip 
                      key={tool}
                      label={tool}
                      size="small"
                      variant="outlined"
                      icon={<CodeIcon />}
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}

        {/* File Changes Tab */}
        {selectedTab === 1 && (
          <Stack spacing={2}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  <AddIcon sx={{ mr: 1, color: 'success.main' }} />
                  Created Files ({contextData.created_files.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderFileList(contextData.created_files, <FileIcon />, 'success.main')}
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  <EditIcon sx={{ mr: 1, color: 'warning.main' }} />
                  Modified Files ({contextData.modified_files.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderFileList(contextData.modified_files, <FileIcon />, 'warning.main')}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  <DeleteIcon sx={{ mr: 1, color: 'error.main' }} />
                  Deleted Files ({contextData.deleted_files.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderFileList(contextData.deleted_files, <FileIcon />, 'error.main')}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Initial Files ({contextData.initial_files.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {renderFileList(contextData.initial_files, <FileIcon />, 'text.secondary')}
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}

        {/* Git Activity Tab */}
        {selectedTab === 2 && (
          <Stack spacing={2}>
            <Typography variant="h6">Git Activity</Typography>
            <Typography variant="body2" color="text.secondary">
              Git integration coming soon. This will show commits, branches, and repository changes.
            </Typography>
          </Stack>
        )}

        {/* Memory Context Tab */}
        {selectedTab === 3 && (
          <Stack spacing={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <MemoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Memory Context
                </Typography>
                <SyntaxHighlighter
                  language="json"
                  style={tomorrow}
                  customStyle={{ margin: 0, borderRadius: 4 }}
                >
                  {JSON.stringify(contextData.memory_context, null, 2)}
                </SyntaxHighlighter>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Final State
                </Typography>
                <SyntaxHighlighter
                  language="json"
                  style={tomorrow}
                  customStyle={{ margin: 0, borderRadius: 4 }}
                >
                  {JSON.stringify(contextData.final_state, null, 2)}
                </SyntaxHighlighter>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>
    </Paper>
  );
};