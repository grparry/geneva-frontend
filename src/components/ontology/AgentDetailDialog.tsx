import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DetailDialog } from '../common/DetailDialog';
import { apiClient } from '../../api/client';
import { SchemaViewer } from './SchemaViewer';

interface AgentDetailDialogProps {
  open: boolean;
  onClose: () => void;
  agentId: string | null;
  agentName?: string;
}

export const AgentDetailDialog: React.FC<AgentDetailDialogProps> = ({
  open,
  onClose,
  agentId,
  agentName,
}) => {
  const [agentDetails, setAgentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && agentId) {
      fetchAgentDetails();
    }
  }, [open, agentId]);

  const fetchAgentDetails = async () => {
    if (!agentId) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/api/ontology/agents/${agentId}`);
      setAgentDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch agent details:', error);
      // Use mock data for demo
      setAgentDetails({
        id: agentId,
        name: agentName || 'Unknown Agent',
        type: 'cognitive',
        version: '1.0.0',
        description: 'A cognitive agent for processing complex tasks',
        capabilities: ['memory_access', 'task_delegation', 'pattern_recognition'],
        input_schema: {
          type: 'object',
          properties: {
            task: { type: 'string' },
            context: { type: 'object' },
            parameters: { type: 'object' },
          },
          required: ['task'],
        },
        output_schema: {
          type: 'object',
          properties: {
            result: { type: 'any' },
            confidence: { type: 'number' },
            metadata: { type: 'object' },
          },
        },
        memory_fields: {
          reads: ['context.user_preferences', 'history.recent_tasks'],
          writes: ['results.task_output', 'metrics.performance'],
          modifies: ['state.current_context'],
        },
        statistics: {
          total_executions: 1523,
          success_rate: 0.94,
          avg_execution_time: 234,
          last_executed: new Date().toISOString(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!agentDetails) return null;

  const overviewContent = (
    <Box>
      <Typography variant="body1" paragraph>
        {agentDetails.description}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid size={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Type
          </Typography>
          <Typography>{agentDetails.type}</Typography>
        </Grid>
        <Grid size={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Version
          </Typography>
          <Typography>{agentDetails.version}</Typography>
        </Grid>
      </Grid>

      <Box mt={2}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Capabilities
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {agentDetails.capabilities.map((cap: string) => (
            <Chip key={cap} label={cap} size="small" />
          ))}
        </Box>
      </Box>
    </Box>
  );

  const schemaContent = (
    <Box>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Input Schema</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SchemaViewer schema={agentDetails.input_schema} title="Input Schema" />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Output Schema</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SchemaViewer schema={agentDetails.output_schema} title="Output Schema" />
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  const statisticsContent = (
    <Box>
      <Grid container spacing={2}>
        <Grid size={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Executions
              </Typography>
              <Typography variant="h6">
                {agentDetails.statistics.total_executions.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
              <Typography variant="h6">
                {(agentDetails.statistics.success_rate * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Avg Execution Time
              </Typography>
              <Typography variant="h6">
                {agentDetails.statistics.avg_execution_time}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Last Executed
              </Typography>
              <Typography variant="body2">
                {new Date(agentDetails.statistics.last_executed).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {agentDetails.memory_fields && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Memory Access Pattern
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Reads
          </Typography>
          <List dense>
            {agentDetails.memory_fields.reads.map((field: string) => (
              <ListItem key={field}>
                <ListItemText primary={field} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );

  const actions = (
    <>
      <Button color="primary" onClick={() => {}}>
        Test Agent
      </Button>
      <Button color="primary" onClick={() => {}}>
        View Executions
      </Button>
      <Button onClick={onClose}>Close</Button>
    </>
  );

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={agentDetails.name}
      subtitle={`Agent ID: ${agentDetails.id}`}
      entityType="Agent"
      tabs={[
        { label: 'Overview', content: overviewContent },
        { label: 'Schema', content: schemaContent },
        { label: 'Statistics', content: statisticsContent },
      ]}
      actions={actions}
      navigateTo={`/ontology/agents/${agentDetails.id}`}
    />
  );
};