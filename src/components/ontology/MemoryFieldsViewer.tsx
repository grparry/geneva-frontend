import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReadIcon from '@mui/icons-material/Visibility';
import WriteIcon from '@mui/icons-material/Edit';
import ModifyIcon from '@mui/icons-material/Transform';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import { apiClient } from '../../api/client';

interface CodexFieldMapping {
  field_name: string;
  field_type: string;
  access_type: string;
  description?: string;
  namespace?: string;
}

interface AgentCodexMapping {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  reads_fields: CodexFieldMapping[];
  writes_fields: CodexFieldMapping[];
  modifies_fields: CodexFieldMapping[];
  total_interactions: number;
}

interface MemoryFieldsViewerProps {
  agent: any;
  codexFields?: string[];
}

export const MemoryFieldsViewer: React.FC<MemoryFieldsViewerProps> = ({
  agent,
  codexFields = [],
}) => {
  const [codexMappings, setCodexMappings] = useState<AgentCodexMapping | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    reads: true,
    writes: true,
    modifies: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCodexMappings();
  }, [agent.agent_id]);

  const loadCodexMappings = async () => {
    try {
      const response = await apiClient.get('/agents/codex-mappings', {
        params: { agent_type: agent.agent_type },
      });
      const mappings = response.data as AgentCodexMapping[];
      const agentMapping = mappings.find((m) => m.agent_id === agent.agent_id);
      setCodexMappings(agentMapping || null);
    } catch (error) {
      console.error('Failed to load codex mappings:', error);
      // Use mock data for demo
      setCodexMappings({
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        agent_type: agent.agent_type,
        reads_fields: [
          {
            field_name: 'content',
            field_type: 'memory',
            access_type: 'read',
            description: 'Memory content field',
            namespace: 'default',
          },
          {
            field_name: 'metadata',
            field_type: 'memory',
            access_type: 'read',
            description: 'Memory metadata',
            namespace: 'default',
          },
        ],
        writes_fields: [
          {
            field_name: 'vector_embedding',
            field_type: 'memory',
            access_type: 'write',
            description: 'Vector embeddings for semantic search',
            namespace: 'embeddings',
          },
        ],
        modifies_fields: [
          {
            field_name: 'tags',
            field_type: 'memory',
            access_type: 'modify',
            description: 'Memory tags for categorization',
            namespace: 'default',
          },
        ],
        total_interactions: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getAccessIcon = (accessType: string) => {
    switch (accessType) {
      case 'read':
        return <ReadIcon />;
      case 'write':
        return <WriteIcon />;
      case 'modify':
        return <ModifyIcon />;
      default:
        return <MemoryIcon />;
    }
  };

  const getAccessColor = (accessType: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (accessType) {
      case 'read':
        return 'info';
      case 'write':
        return 'success';
      case 'modify':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderFieldMappingSection = (
    title: string,
    fields: CodexFieldMapping[],
    sectionKey: keyof typeof expandedSections
  ) => {
    return (
      <Box mb={3}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          onClick={() => toggleSection(sectionKey)}
          sx={{ cursor: 'pointer' }}
        >
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            {title}
            <Chip label={fields.length} size="small" />
          </Typography>
          <IconButton size="small">
            {expandedSections[sectionKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={expandedSections[sectionKey]}>
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Namespace</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getAccessIcon(field.access_type)}
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {field.field_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={field.field_type}
                        size="small"
                        color={getAccessColor(field.access_type)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {field.namespace || 'default'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {field.description || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </Box>
    );
  };

  if (loading) {
    return <Typography>Loading memory field mappings...</Typography>;
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Memory Interactions
              </Typography>
              <Typography variant="h4">
                {codexMappings?.total_interactions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Namespaces Accessed
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                {Array.from(new Set([
                  ...(codexMappings?.reads_fields.map(f => f.namespace) || []),
                  ...(codexMappings?.writes_fields.map(f => f.namespace) || []),
                  ...(codexMappings?.modifies_fields.map(f => f.namespace) || []),
                ].filter(Boolean))).map((ns) => (
                  <Chip key={ns} label={ns} size="small" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Access Breakdown
              </Typography>
              <Box display="flex" gap={2} mt={1}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ReadIcon fontSize="small" color="info" />
                  <Typography variant="body2">
                    {codexMappings?.reads_fields.length || 0}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <WriteIcon fontSize="small" color="success" />
                  <Typography variant="body2">
                    {codexMappings?.writes_fields.length || 0}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ModifyIcon fontSize="small" color="warning" />
                  <Typography variant="body2">
                    {codexMappings?.modifies_fields.length || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Field Mappings */}
      {codexMappings && (
        <>
          {renderFieldMappingSection(
            'Read Operations',
            codexMappings.reads_fields,
            'reads'
          )}
          {renderFieldMappingSection(
            'Write Operations',
            codexMappings.writes_fields,
            'writes'
          )}
          {renderFieldMappingSection(
            'Modify Operations',
            codexMappings.modifies_fields,
            'modifies'
          )}
        </>
      )}

      {/* Ontology References */}
      {codexFields.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Ontology References
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <List dense>
              {codexFields.map((field, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <StorageIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={field}
                    secondary="Ontology binding"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* Memory Access Pattern */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Memory Access Pattern
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" paragraph>
            This agent interacts with the Codex memory system through {codexMappings?.total_interactions || 0} distinct
            field operations across {Array.from(new Set([
              ...(codexMappings?.reads_fields.map(f => f.namespace) || []),
              ...(codexMappings?.writes_fields.map(f => f.namespace) || []),
              ...(codexMappings?.modifies_fields.map(f => f.namespace) || []),
            ].filter(Boolean))).length || 0} namespaces.
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Access Flow:
          </Typography>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Chip label="Agent" color="primary" />
            <Typography>→</Typography>
            {codexMappings?.reads_fields.length! > 0 && (
              <>
                <Chip label="Read Memory" color="info" size="small" />
                <Typography>→</Typography>
              </>
            )}
            <Chip label="Process" color="default" size="small" />
            {codexMappings?.writes_fields.length! > 0 && (
              <>
                <Typography>→</Typography>
                <Chip label="Write Memory" color="success" size="small" />
              </>
            )}
            {codexMappings?.modifies_fields.length! > 0 && (
              <>
                <Typography>→</Typography>
                <Chip label="Modify Memory" color="warning" size="small" />
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};