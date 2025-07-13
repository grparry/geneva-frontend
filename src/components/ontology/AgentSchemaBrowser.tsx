import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MemoryIcon from '@mui/icons-material/Memory';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { apiClient } from '../../api/client';
import { SchemaViewer } from './SchemaViewer';
import { MemoryFieldsViewer } from './MemoryFieldsViewer';

interface Agent {
  id: string;
  name: string;
  type: string;
  description?: string;
  inputSchema?: any;
  outputSchema?: any;
  codexFields?: any;
  capabilities?: string[];
}

interface AgentSchema {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  description?: string;
  input_schema: any;
  output_schema: any;
  tools: any[];
  capabilities: string[];
  ontology_references: string[];
}

interface AgentSchemaBrowserProps {
  agentId?: string;
  showAllAgents?: boolean;
}

export const AgentSchemaBrowser: React.FC<AgentSchemaBrowserProps> = ({
  agentId,
  showAllAgents = true,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgentSchema, setSelectedAgentSchema] = useState<AgentSchema | null>(null);
  const [schemaView, setSchemaView] = useState<'input' | 'output' | 'memory'>('input');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (showAllAgents) {
      loadAgents();
    } else if (agentId) {
      loadSingleAgent(agentId);
    }
  }, [agentId, showAllAgents]);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, we'll use a mock list of agents
      // In a real implementation, this would query the agents API
      const mockAgents: Agent[] = [
        {
          id: 'substrate-reader',
          name: 'Substrate Reader',
          type: 'substrate_reader',
          description: 'Reads and queries substrate memory',
        },
        {
          id: 'substrate-writer',
          name: 'Substrate Writer',
          type: 'substrate_writer',
          description: 'Writes data to substrate memory',
        },
        {
          id: 'semantic-retriever',
          name: 'Semantic Retriever',
          type: 'semantic_retriever',
          description: 'Performs semantic search on memory',
        },
        {
          id: 'validator-agent',
          name: 'Validator Agent',
          type: 'validator',
          description: 'Validates data against schemas',
        },
      ];
      setAgents(mockAgents);
      if (mockAgents.length > 0) {
        setSelectedAgent(mockAgents[0]);
        await loadAgentSchema(mockAgents[0].id);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const loadSingleAgent = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/agents/${id}/schema`);
      const schema = response.data as AgentSchema;
      const agent: Agent = {
        id: schema.agent_id,
        name: schema.agent_name,
        type: schema.agent_type,
        description: schema.description,
        inputSchema: schema.input_schema,
        outputSchema: schema.output_schema,
        capabilities: schema.capabilities,
      };
      setAgents([agent]);
      setSelectedAgent(agent);
      setSelectedAgentSchema(schema);
    } catch (err) {
      console.error('Failed to load agent:', err);
      setError('Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  const loadAgentSchema = async (agentId: string) => {
    try {
      const response = await apiClient.get(`/api/agents/${agentId}/schema`);
      setSelectedAgentSchema(response.data);
    } catch (err) {
      console.error('Failed to load agent schema:', err);
      // Use mock schema for demo
      setSelectedAgentSchema({
        agent_id: agentId,
        agent_name: selectedAgent?.name || 'Unknown',
        agent_type: selectedAgent?.type || 'unknown',
        description: selectedAgent?.description,
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            namespace: { type: 'string', description: 'Memory namespace' },
            limit: { type: 'integer', description: 'Result limit', default: 10 },
          },
          required: ['query'],
        },
        output_schema: {
          type: 'object',
          properties: {
            results: { type: 'array', items: { type: 'object' } },
            count: { type: 'integer' },
            status: { type: 'string', enum: ['success', 'error'] },
          },
        },
        tools: [
          {
            name: 'semantic_search',
            description: 'Perform semantic search',
            parameters: {
              query: { type: 'string', required: true },
              k: { type: 'integer', default: 10 },
            },
          },
        ],
        capabilities: ['memory_read', 'semantic_search', 'filtering'],
        ontology_references: ['geneva.core.Memory', 'geneva.core.Query'],
      });
    }
  };

  const handleAgentSelect = async (agent: Agent) => {
    setSelectedAgent(agent);
    await loadAgentSchema(agent.id);
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getAgentIcon = (type: string) => {
    if (type.includes('memory') || type.includes('substrate')) {
      return <MemoryIcon />;
    }
    return <SmartToyIcon />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Agent List */}
      <Grid size={{ xs: 12, md: 3 }}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Agents
          </Typography>
          
          <TextField
            fullWidth
            size="small"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <List>
            {filteredAgents.map((agent) => (
              <ListItemButton
                key={agent.id}
                selected={selectedAgent?.id === agent.id}
                onClick={() => handleAgentSelect(agent)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getAgentIcon(agent.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={agent.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {agent.type}
                      </Typography>
                      {agent.description && (
                        <Typography variant="caption" color="textSecondary">
                          {agent.description.substring(0, 50)}...
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Schema Display */}
      <Grid size={{ xs: 12, md: 9 }}>
        {selectedAgent && selectedAgentSchema ? (
          <Paper sx={{ p: 3 }}>
            <Box mb={3}>
              <Typography variant="h5">{selectedAgentSchema.agent_name} Schema</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedAgentSchema.description}
              </Typography>
              
              {/* Capabilities */}
              <Box mt={2} display="flex" flexWrap="wrap" gap={0.5}>
                {selectedAgentSchema.capabilities.map((cap) => (
                  <Chip key={cap} label={cap} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>

            <Tabs
              value={schemaView}
              onChange={(_, value) => setSchemaView(value)}
              sx={{ mb: 3 }}
            >
              <Tab label="Input Schema" value="input" />
              <Tab label="Output Schema" value="output" />
              <Tab label="Memory Fields" value="memory" />
            </Tabs>

            {schemaView === 'input' && (
              <Box>
                <SchemaViewer
                  schema={selectedAgentSchema.input_schema}
                  title="Input Parameters"
                />
                
                {/* Tools */}
                {selectedAgentSchema.tools.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="h6" gutterBottom>
                      Available Tools
                    </Typography>
                    {selectedAgentSchema.tools.map((tool, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
                        <Typography variant="subtitle2">{tool.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {tool.description}
                        </Typography>
                        {tool.parameters && (
                          <Box mt={1}>
                            <Typography variant="caption" color="textSecondary">
                              Parameters: {Object.keys(tool.parameters).join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {schemaView === 'output' && (
              <SchemaViewer
                schema={selectedAgentSchema.output_schema}
                title="Output Format"
              />
            )}

            {schemaView === 'memory' && (
              <MemoryFieldsViewer
                agent={selectedAgentSchema}
                codexFields={selectedAgentSchema.ontology_references}
              />
            )}
          </Paper>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              Select an agent to view its schema
            </Typography>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
};