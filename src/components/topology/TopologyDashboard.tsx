import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DnsIcon from '@mui/icons-material/Dns';
import InfoIcon from '@mui/icons-material/Info';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { SubstrateTopologyGraph } from './SubstrateTopologyGraph';
import { DelegationFlowMap } from './DelegationFlowMap';
import { InfrastructureMap } from './InfrastructureMap';
import { ExportMenu } from '../common/ExportMenu';
import { ExportPresets } from '../../utils/export';

interface TopologyDashboardProps {
  substrateId?: string;
}

interface NodeDetails {
  node: any;
  type: 'substrate' | 'infrastructure' | 'delegation';
}

export const TopologyDashboard: React.FC<TopologyDashboardProps> = ({
  substrateId,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [nodeDetailsOpen, setNodeDetailsOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeDetails | null>(null);

  const handleNodeClick = (node: any, type: 'substrate' | 'infrastructure' | 'delegation') => {
    setSelectedNode({ node, type });
    setNodeDetailsOpen(true);
  };

  const handleTaskClick = (task: any) => {
    setSelectedNode({ node: task, type: 'delegation' });
    setNodeDetailsOpen(true);
  };

  const renderNodeDetails = () => {
    if (!selectedNode) return null;

    const { node, type } = selectedNode;

    switch (type) {
      case 'substrate':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {node.name}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Type
                </Typography>
                <Typography>{node.type}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={node.status}
                  color={node.status === 'active' ? 'success' : 'error'}
                  size="small"
                />
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Trust Level
                </Typography>
                <Typography>{node.trust_level || 'N/A'}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Group
                </Typography>
                <Typography>{node.group}</Typography>
              </Grid>
            </Grid>

            {node.capabilities && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Capabilities
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {node.capabilities.map((cap: string) => (
                    <Chip key={cap} label={cap} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {node.metrics && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Metrics
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(node.metrics).map(([key, value]) => (
                    <Grid size={6} key={key}>
                      <Typography variant="caption" color="textSecondary">
                        {key.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="body2">
                        {typeof value === 'number' ? value.toFixed(1) : String(value)}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        );

      case 'infrastructure':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {node.name}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Type
                </Typography>
                <Typography>{node.type}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={node.status}
                  color={
                    node.status === 'healthy' ? 'success' :
                    node.status === 'degraded' ? 'warning' : 'error'
                  }
                  size="small"
                />
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Region
                </Typography>
                <Typography>{node.region || 'N/A'}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Last Heartbeat
                </Typography>
                <Typography>
                  {node.last_heartbeat
                    ? new Date(node.last_heartbeat).toLocaleTimeString()
                    : 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            {node.components && node.components.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Components
                </Typography>
                {node.components.map((comp: any) => (
                  <Box key={comp.component_id} mb={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{comp.name}</Typography>
                      <Chip
                        label={comp.status}
                        size="small"
                        color={comp.status === 'healthy' ? 'success' : 'error'}
                      />
                    </Box>
                    {comp.version && (
                      <Typography variant="caption" color="textSecondary">
                        Version: {comp.version}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );

      case 'delegation':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Delegation Task
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Task ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {node.task_id}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Type
                </Typography>
                <Typography>{node.task_type}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={node.status}
                  color={
                    node.status === 'completed' ? 'success' :
                    node.status === 'failed' ? 'error' : 'warning'
                  }
                  size="small"
                />
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Flow
                </Typography>
                <Typography>
                  {node.source_substrate} → {node.target_substrate}
                </Typography>
                {node.source_agent && (
                  <Typography variant="caption" color="textSecondary">
                    {node.source_agent} → {node.target_agent || 'any'}
                  </Typography>
                )}
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Priority
                </Typography>
                <Typography>P{node.priority}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Payload Size
                </Typography>
                <Typography>{node.payload_size} bytes</Typography>
              </Grid>
            </Grid>

            {node.error_message && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Error
                </Typography>
                <Typography variant="body2">{node.error_message}</Typography>
              </Box>
            )}

            {node.metadata && Object.keys(node.metadata).length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Metadata
                </Typography>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                    {JSON.stringify(node.metadata, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Substrate Topology & Delegation</Typography>
        <Box display="flex" gap={1}>
          <ExportMenu
            data={[]} // This will be populated based on active tab
            filename="topology-report"
            title="Topology Report"
            headers={ExportPresets.topologyNodes.headers}
          />
          <Tooltip title="View full documentation">
            <IconButton
              size="small"
              onClick={() => window.open('/docs/topology', '_blank')}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <AccountTreeIcon color="primary" />
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Connected Substrates
                  </Typography>
                  <Typography variant="h6">4</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <SwapHorizIcon color="secondary" />
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Active Delegations
                  </Typography>
                  <Typography variant="h6">8</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <DnsIcon color="success" />
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Infrastructure Nodes
                  </Typography>
                  <Typography variant="h6">12</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                  }}
                />
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    System Health
                  </Typography>
                  <Typography variant="h6">98%</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
        >
          <Tab
            label="Federation Topology"
            icon={<AccountTreeIcon />}
            iconPosition="start"
          />
          <Tab
            label="Delegation Flows"
            icon={<SwapHorizIcon />}
            iconPosition="start"
          />
          <Tab
            label="Infrastructure Map"
            icon={<DnsIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ minHeight: 600 }}>
        {activeTab === 0 && (
          <Paper sx={{ p: 2, height: 600, position: 'relative' }}>
            <SubstrateTopologyGraph
              substrateId={substrateId}
              viewMode="federation"
              onNodeClick={(node) => handleNodeClick(node, 'substrate')}
            />
          </Paper>
        )}
        
        {activeTab === 1 && (
          <DelegationFlowMap
            substrateId={substrateId}
            timeRange="24h"
            onTaskClick={handleTaskClick}
          />
        )}
        
        {activeTab === 2 && (
          <InfrastructureMap
            viewMode="topology"
            onNodeClick={(node) => handleNodeClick(node, 'infrastructure')}
          />
        )}
      </Box>

      {/* Node Details Dialog */}
      <Dialog
        open={nodeDetailsOpen}
        onClose={() => setNodeDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Details</Typography>
            <IconButton
              size="small"
              onClick={() => {
                // Open in new window/tab for full details
                console.log('Open full details:', selectedNode);
              }}
            >
              <OpenInNewIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>{renderNodeDetails()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setNodeDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};