/**
 * Node Details Component
 * 
 * Detailed information panel for selected network nodes.
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  CloseOutlined,
  DeviceHubOutlined,
  SecurityOutlined,
  AssignmentOutlined,
  ScheduleOutlined,
  SpeedOutlined,
  TrendingUpOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';

// Federation types and components
import { SubstratePeer, TrustRelationship, Delegation, TrustLevel, PeerStatus } from '../../../types/federation';
import { PeerStatusIcon, TrustLevelBadge } from '../shared';

interface NetworkNode {
  id: string;
  peer: SubstratePeer;
  x: number;
  y: number;
  size: number;
  color: string;
  connections: string[];
  trustLevel: TrustLevel;
  status: PeerStatus;
  delegationCount: number;
  lastActivity?: string;
}

interface NodeDetailsProps {
  node: NetworkNode;
  trustRelationships: TrustRelationship[];
  delegations: Delegation[];
  onClose: () => void;
}

const NodeDetails: React.FC<NodeDetailsProps> = ({
  node,
  trustRelationships,
  delegations,
  onClose,
}) => {
  const { peer } = node;

  // Calculate node-specific metrics
  const nodeMetrics = useMemo(() => {
    // Trust relationships
    const outgoingTrust = trustRelationships.filter(t => t.peer_id === peer.id);
    const incomingTrust = trustRelationships.filter(t => t.peer_id === peer.id);
    
    // Delegations
    const sentDelegations = delegations.filter(d => d.source_substrate === peer.substrate_id);
    const receivedDelegations = delegations.filter(d => d.target_substrate === peer.substrate_id);
    
    // Success rates
    const completedSent = sentDelegations.filter(d => d.status === 'completed').length;
    const completedReceived = receivedDelegations.filter(d => d.status === 'completed').length;
    
    const sentSuccessRate = sentDelegations.length > 0 ? 
      (completedSent / sentDelegations.length) * 100 : 0;
    const receivedSuccessRate = receivedDelegations.length > 0 ? 
      (completedReceived / receivedDelegations.length) * 100 : 0;

    // Performance metrics
    const avgExecutionTime = receivedDelegations
      .filter(d => d.execution_time_ms)
      .reduce((sum, d) => sum + (d.execution_time_ms || 0), 0) / 
      Math.max(receivedDelegations.filter(d => d.execution_time_ms).length, 1);

    return {
      outgoingTrust: outgoingTrust.length,
      incomingTrust: incomingTrust.length,
      sentDelegations: sentDelegations.length,
      receivedDelegations: receivedDelegations.length,
      sentSuccessRate,
      receivedSuccessRate,
      avgExecutionTime,
      connections: node.connections.length,
    };
  }, [node, peer, trustRelationships, delegations]);

  // Get recent activity
  const recentActivity = useMemo(() => {
    const recentDelegations = delegations
      .filter(d => 
        d.source_substrate === peer.substrate_id || 
        d.target_substrate === peer.substrate_id
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return recentDelegations;
  }, [delegations, peer.substrate_id]);

  // Format time
  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getHealthStatus = () => {
    if (peer.status === PeerStatus.HEALTHY) return 'healthy';
    if (peer.status === PeerStatus.CONNECTED) return 'good';
    if (peer.status === PeerStatus.DEGRADED) return 'warning';
    return 'error';
  };

  const getHealthColor = () => {
    const status = getHealthStatus();
    switch (status) {
      case 'healthy': return 'success';
      case 'good': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" noWrap>
          Node Details
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseOutlined />
        </IconButton>
      </Box>

      {/* Peer Information */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PeerStatusIcon status={peer.status} size="medium" withTooltip={false} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" noWrap fontWeight="bold">
                {peer.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                {peer.substrate_id.slice(0, 16)}...
              </Typography>
            </Box>
            <TrustLevelBadge level={peer.trust_level} size="medium" />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {peer.url}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<CheckCircleOutlined />}
              label={peer.status}
              size="small"
              color={getHealthColor()}
            />
            <Chip
              label={`${nodeMetrics.connections} connections`}
              size="small"
              variant="outlined"
            />
            {peer.mcp_version && (
              <Chip
                label={`MCP ${peer.mcp_version}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Health Status */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="subtitle2" gutterBottom>
            Health & Activity
          </Typography>
          
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ScheduleOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Last Activity"
                secondary={formatTime(peer.last_heartbeat)}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            
            {peer.error_count > 0 && (
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <WarningOutlined fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Error Count"
                  secondary={`${peer.error_count} errors`}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            )}
            
            {peer.last_error && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Last Error"
                  secondary={peer.last_error}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Trust Relationships */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="subtitle2" gutterBottom>
            Trust Relationships
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {nodeMetrics.outgoingTrust}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trusts
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {nodeMetrics.incomingTrust}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trusted by
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Delegation Performance */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="subtitle2" gutterBottom>
            Delegation Performance
          </Typography>
          
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <TrendingUpOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Sent Delegations"
                secondary={`${nodeMetrics.sentDelegations} total, ${nodeMetrics.sentSuccessRate.toFixed(1)}% success`}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <AssignmentOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Received Delegations"
                secondary={`${nodeMetrics.receivedDelegations} total, ${nodeMetrics.receivedSuccessRate.toFixed(1)}% success`}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            
            {nodeMetrics.avgExecutionTime > 0 && (
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <SpeedOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Avg Execution Time"
                  secondary={formatDuration(nodeMetrics.avgExecutionTime)}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            )}
          </List>

          {/* Success Rate Progress */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">Received Success Rate</Typography>
              <Typography variant="caption">{nodeMetrics.receivedSuccessRate.toFixed(1)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={nodeMetrics.receivedSuccessRate}
              color={nodeMetrics.receivedSuccessRate > 80 ? 'success' : 
                     nodeMetrics.receivedSuccessRate > 60 ? 'warning' : 'error'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Typography variant="subtitle2" gutterBottom>
              Recent Activity
            </Typography>
            
            <List dense sx={{ py: 0 }}>
              {recentActivity.map((delegation, index) => (
                <ListItem key={delegation.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={delegation.task_type}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {delegation.source_substrate === peer.substrate_id ? 'Sent' : 'Received'} • {delegation.status}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(delegation.created_at)}
                        </Typography>
                      </Box>
                    }
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Capabilities */}
      {peer.capabilities && Object.keys(peer.capabilities).length > 0 && (
        <Card variant="outlined">
          <CardContent sx={{ pb: '16px !important' }}>
            <Typography variant="subtitle2" gutterBottom>
              Capabilities
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.keys(peer.capabilities).map((capability) => (
                <Chip
                  key={capability}
                  label={capability}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default NodeDetails;