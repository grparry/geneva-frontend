import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar
} from '@mui/material';
import {
  Storage as StorageIcon,
  Visibility as ReadIcon,
  Edit as WriteIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  MemoryAccess
} from '../../../types/geneva-tools';

interface MemoryExplorerProps {
  memoryAccesses?: MemoryAccess[];
  projectId?: string;
  userId?: string;
  maxItems?: number;
  showFilters?: boolean;
}

const OPERATION_ICONS = {
  read: <ReadIcon />,
  write: <WriteIcon />,
  update: <UpdateIcon />,
  delete: <DeleteIcon />
};

const OPERATION_COLORS = {
  read: 'info',
  write: 'success',
  update: 'warning',
  delete: 'error'
} as const;

const TARGET_TYPE_COLORS = {
  node: 'primary',
  relationship: 'secondary',
  property: 'default'
} as const;

export const MemoryExplorer: React.FC<MemoryExplorerProps> = ({
  memoryAccesses = [],
  projectId,
  userId,
  maxItems = 20,
  showFilters = true
}) => {
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate mock data for demonstration
  const mockMemoryAccesses: MemoryAccess[] = [
    {
      id: 'access-1',
      operation: 'write',
      targetType: 'node',
      targetId: 'react-component-auth',
      content: {
        type: 'react_component',
        name: 'AuthenticationForm',
        description: 'User authentication form with validation',
        tags: ['react', 'authentication', 'typescript'],
        code: 'export const AuthenticationForm = () => { ... }'
      },
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      userId: 'alice-001',
      projectId: projectId || 'project-1',
      success: true,
      duration: 234
    },
    {
      id: 'access-2',
      operation: 'read',
      targetType: 'relationship',
      targetId: 'component-dependencies',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      userId: 'bob-002',
      projectId: projectId || 'project-1',
      success: true,
      duration: 89
    },
    {
      id: 'access-3',
      operation: 'update',
      targetType: 'property',
      targetId: 'component-metadata',
      content: {
        lastModified: new Date().toISOString(),
        version: '2.1.0',
        testCoverage: 0.87
      },
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      userId: 'alice-001',
      projectId: projectId || 'project-1',
      success: true,
      duration: 156
    },
    {
      id: 'access-4',
      operation: 'read',
      targetType: 'node',
      targetId: 'api-patterns',
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      userId: 'carol-003',
      projectId: projectId || 'project-1',
      success: true,
      duration: 67
    },
    {
      id: 'access-5',
      operation: 'write',
      targetType: 'node',
      targetId: 'error-handling-pattern',
      content: {
        type: 'pattern',
        name: 'Error Boundary Pattern',
        description: 'React error boundary implementation with fallback UI',
        category: 'error-handling',
        usage_count: 12
      },
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      userId: 'bob-002',
      projectId: projectId || 'project-1',
      success: true,
      duration: 312
    },
    {
      id: 'access-6',
      operation: 'delete',
      targetType: 'node',
      targetId: 'deprecated-component',
      timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
      userId: 'alice-001',
      projectId: projectId || 'project-1',
      success: false,
      duration: 1200
    },
    {
      id: 'access-7',
      operation: 'read',
      targetType: 'node',
      targetId: 'testing-patterns',
      timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
      userId: 'carol-003',
      projectId: projectId || 'project-1',
      success: true,
      duration: 145
    },
    {
      id: 'access-8',
      operation: 'update',
      targetType: 'relationship',
      targetId: 'component-inheritance',
      content: {
        relationship_type: 'extends',
        strength: 0.8,
        bidirectional: false
      },
      timestamp: new Date(Date.now() - 75 * 60000).toISOString(),
      userId: 'bob-002',
      projectId: projectId || 'project-1',
      success: true,
      duration: 198
    }
  ];

  const effectiveAccesses = memoryAccesses.length > 0 ? memoryAccesses : mockMemoryAccesses;

  const filteredAccesses = useMemo(() => {
    return effectiveAccesses.filter(access => {
      if (operationFilter !== 'all' && access.operation !== operationFilter) return false;
      if (targetTypeFilter !== 'all' && access.targetType !== targetTypeFilter) return false;
      if (userFilter !== 'all' && access.userId !== userFilter) return false;
      if (searchTerm && !access.targetId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    }).slice(0, maxItems);
  }, [effectiveAccesses, operationFilter, targetTypeFilter, userFilter, searchTerm, maxItems]);

  const uniqueUsers = Array.from(new Set(effectiveAccesses.map(a => a.userId)));

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return time.toLocaleDateString();
  };

  const getOperationDescription = (access: MemoryAccess) => {
    const action = access.operation.charAt(0).toUpperCase() + access.operation.slice(1);
    const target = access.targetType;
    return `${action} ${target}: ${access.targetId}`;
  };

  const getUserDisplayName = (userId: string) => {
    const userMap: Record<string, string> = {
      'alice-001': 'Alice Johnson',
      'bob-002': 'Bob Chen', 
      'carol-003': 'Carol Davis'
    };
    return userMap[userId] || userId;
  };

  const getUserColor = (userId: string) => {
    const colors = ['#2196f3', '#4caf50', '#ff9800', '#e91e63', '#9c27b0'];
    const index = uniqueUsers.indexOf(userId) % colors.length;
    return colors[index];
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Memory Access Timeline
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Track all memory operations across the Geneva substrate. Monitor reads, writes, 
        updates, and deletions to understand system usage patterns.
      </Typography>

      {/* Filters */}
      {showFilters && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search by target ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Operation</InputLabel>
              <Select
                value={operationFilter}
                onChange={(e) => setOperationFilter(e.target.value)}
                label="Operation"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="write">Write</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Target Type</InputLabel>
              <Select
                value={targetTypeFilter}
                onChange={(e) => setTargetTypeFilter(e.target.value)}
                label="Target Type"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="node">Node</MenuItem>
                <MenuItem value="relationship">Relationship</MenuItem>
                <MenuItem value="property">Property</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>User</InputLabel>
              <Select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                label="User"
              >
                <MenuItem value="all">All</MenuItem>
                {uniqueUsers.map(user => (
                  <MenuItem key={user} value={user}>
                    {getUserDisplayName(user)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      )}

      {/* Summary Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="h6">
              {filteredAccesses.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Memory Operations
            </Typography>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="h6">
              {Math.round(filteredAccesses.filter(a => a.success).length / filteredAccesses.length * 100)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Success Rate
            </Typography>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="h6">
              {Math.round(filteredAccesses.reduce((sum, a) => sum + a.duration, 0) / filteredAccesses.length)}ms
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Duration
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Timeline */}
      {filteredAccesses.length > 0 ? (
        <Timeline>
          {filteredAccesses.map((access, index) => (
            <TimelineItem key={access.id}>
              <TimelineSeparator>
                <TimelineDot 
                  color={OPERATION_COLORS[access.operation]}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 40,
                    height: 40
                  }}
                >
                  {OPERATION_ICONS[access.operation]}
                </TimelineDot>
                {index < filteredAccesses.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              
              <TimelineContent>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2">
                        {getOperationDescription(access)}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {access.success ? (
                          <SuccessIcon fontSize="small" color="success" />
                        ) : (
                          <ErrorIcon fontSize="small" color="error" />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(access.timestamp)}
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        size="small"
                        label={access.operation.toUpperCase()}
                        color={OPERATION_COLORS[access.operation]}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={access.targetType}
                        color={TARGET_TYPE_COLORS[access.targetType]}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={formatDuration(access.duration)}
                        icon={<SpeedIcon />}
                        variant="outlined"
                      />
                    </Stack>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar 
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          bgcolor: getUserColor(access.userId),
                          fontSize: '0.7rem'
                        }}
                      >
                        {getUserDisplayName(access.userId).charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {getUserDisplayName(access.userId)}
                      </Typography>
                    </Box>

                    {access.content && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="caption">
                            View operation details
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ 
                            bgcolor: 'grey.50', 
                            p: 2, 
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            overflow: 'auto'
                          }}>
                            <pre>{JSON.stringify(access.content, null, 2)}</pre>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      ) : (
        <Alert severity="info">
          No memory access operations found matching the current filters.
        </Alert>
      )}

      {filteredAccesses.length === maxItems && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Showing first {maxItems} results. Use filters to narrow down the search.
        </Alert>
      )}
    </Paper>
  );
};