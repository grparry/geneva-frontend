/**
 * Network Topology Visualization
 * 
 * Interactive visualization of federation network topology and peer connections.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  Button,
} from '@mui/material';
import {
  AccountTreeOutlined,
  BubbleChartOutlined,
  GridOnOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CenterFocusStrongOutlined,
  FullscreenOutlined,
  RefreshOutlined,
  SettingsOutlined,
  SecurityOutlined,
} from '@mui/icons-material';

// Federation hooks and services
import { 
  useGetPeersQuery,
  useGetTrustRelationshipsQuery,
  useGetDelegationsQuery,
} from '../../../api/federation';
import { useFederationWebSocket } from '../../../hooks/useFederationWebSocket';

// Federation types and components
import { SubstratePeer, TrustLevel, PeerStatus, TrustRelationship, Delegation } from '../../../types/federation';
import { PeerStatusIcon, TrustLevelBadge } from '../shared';

// Sub-components
import NetworkCanvas from './NetworkCanvas';
import TopologyLegend from './TopologyLegend';
import NodeDetails from './NodeDetails';
import ConnectionMetrics from './ConnectionMetrics';

type LayoutType = 'force' | 'circle' | 'grid' | 'hierarchy';
type ViewMode = 'trust' | 'activity' | 'status' | 'delegation';

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

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: 'trust' | 'delegation' | 'connection';
  color: string;
  animated: boolean;
  trustLevel?: TrustLevel;
  delegationCount?: number;
}

interface TopologyFilters {
  showTrustConnections: boolean;
  showDelegationPaths: boolean;
  showOfflinePeers: boolean;
  minTrustLevel: TrustLevel | 'all';
  highlightActiveOnly: boolean;
}

export const NetworkTopology: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<LayoutType>('force');
  const [viewMode, setViewMode] = useState<ViewMode>('trust');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filters, setFilters] = useState<TopologyFilters>({
    showTrustConnections: true,
    showDelegationPaths: true,
    showOfflinePeers: true,
    minTrustLevel: 'all',
    highlightActiveOnly: false,
  });

  // API queries
  const { 
    data: peersResponse, 
    isLoading: peersLoading, 
    error: peersError,
    refetch: refetchPeers 
  } = useGetPeersQuery({});
  
  const peers = peersResponse || [];

  const { 
    data: trustRelationships = [], 
    isLoading: trustLoading,
    refetch: refetchTrust 
  } = useGetTrustRelationshipsQuery({});

  const { 
    data: delegationsResponse, 
    isLoading: delegationsLoading,
    refetch: refetchDelegations 
  } = useGetDelegationsQuery({
    limit: 100,
    offset: 0,
  });
  
  const delegations = delegationsResponse?.items || [];

  // Real-time updates
  const { isConnected } = useFederationWebSocket({
    subscriptions: ['peers', 'delegations', 'trust'],
  });

  // Create network nodes from peers
  const networkNodes = useMemo((): NetworkNode[] => {
    return peers
      .filter((peer: SubstratePeer) => filters.showOfflinePeers || peer.status !== PeerStatus.OFFLINE)
      .filter((peer: SubstratePeer) => filters.minTrustLevel === 'all' || 
        getTrustLevelPriority(peer.trust_level) >= getTrustLevelPriority(filters.minTrustLevel as TrustLevel))
      .map((peer: SubstratePeer, index: number) => {
        const peerDelegations = delegations.filter(d => 
          d.target_substrate === peer.substrate_id || d.source_substrate === peer.substrate_id
        );

        return {
          id: peer.id,
          peer,
          x: Math.cos(index * 2 * Math.PI / peers.length) * 200 + 400,
          y: Math.sin(index * 2 * Math.PI / peers.length) * 200 + 300,
          size: getNodeSize(peer, peerDelegations.length, viewMode),
          color: getNodeColor(peer, viewMode),
          connections: getNodeConnections(peer.id, trustRelationships, delegations),
          trustLevel: peer.trust_level,
          status: peer.status,
          delegationCount: peerDelegations.length,
          lastActivity: peer.last_heartbeat,
        };
      });
  }, [peers, delegations, trustRelationships, filters, viewMode]);

  // Create network edges from relationships
  const networkEdges = useMemo((): NetworkEdge[] => {
    const edges: NetworkEdge[] = [];

    // Trust relationship edges
    if (filters.showTrustConnections) {
      trustRelationships.forEach(trust => {
        const trustNode = networkNodes.find(n => n.peer.id === trust.peer_id);
        
        if (trustNode && trust.mutual) {
          // For mutual trust, we can create connections to other peers
          // This is a simplified approach - in reality you'd need more complex logic
          const otherPeers = networkNodes.filter(n => n.peer.id !== trust.peer_id);
          otherPeers.forEach(otherPeer => {
            const mutualTrust = trustRelationships.find(t => 
              t.peer_id === otherPeer.peer.id && t.mutual && 
              t.trust_level === trust.trust_level
            );
            if (mutualTrust) {
              edges.push({
                source: trust.peer_id,
                target: otherPeer.peer.id,
                weight: getTrustWeight(trust.trust_level),
                type: 'trust',
                color: getTrustColor(trust.trust_level),
                animated: false,
                trustLevel: trust.trust_level,
              });
            }
          });
        }
      });
    }

    // Delegation path edges
    if (filters.showDelegationPaths) {
      const delegationPaths = new Map<string, number>();
      
      delegations.forEach(delegation => {
        const key = `${delegation.source_substrate}-${delegation.target_substrate}`;
        delegationPaths.set(key, (delegationPaths.get(key) || 0) + 1);
      });

      delegationPaths.forEach((count, path) => {
        const [sourceId, targetId] = path.split('-');
        const sourceNode = networkNodes.find(n => n.peer.substrate_id === sourceId);
        const targetNode = networkNodes.find(n => n.peer.substrate_id === targetId);
        
        if (sourceNode && targetNode && sourceNode.id !== targetNode.id) {
          edges.push({
            source: sourceNode.id,
            target: targetNode.id,
            weight: Math.min(count / 10, 1),
            type: 'delegation',
            color: getDelegationColor(count),
            animated: count > 5,
            delegationCount: count,
          });
        }
      });
    }

    return edges;
  }, [networkNodes, trustRelationships, delegations, filters]);

  // Helper functions
  function getTrustLevelPriority(level: TrustLevel): number {
    switch (level) {
      case TrustLevel.NONE: return 0;
      case TrustLevel.BASIC: return 1;
      case TrustLevel.VERIFIED: return 2;
      case TrustLevel.TRUSTED: return 3;
      case TrustLevel.FULL: return 4;
      default: return 0;
    }
  }

  function getNodeSize(peer: SubstratePeer, delegationCount: number, mode: ViewMode): number {
    const baseSize = 20;
    
    switch (mode) {
      case 'trust':
        return baseSize + getTrustLevelPriority(peer.trust_level) * 5;
      case 'activity':
        return baseSize + Math.min(delegationCount * 2, 30);
      case 'status':
        return peer.status === PeerStatus.HEALTHY ? baseSize + 10 : baseSize;
      case 'delegation':
        return baseSize + Math.min(delegationCount * 3, 40);
      default:
        return baseSize;
    }
  }

  function getNodeColor(peer: SubstratePeer, mode: ViewMode): string {
    switch (mode) {
      case 'trust':
        return getTrustColor(peer.trust_level);
      case 'activity':
        const timeSinceActivity = peer.last_heartbeat ? 
          Date.now() - new Date(peer.last_heartbeat).getTime() : Infinity;
        if (timeSinceActivity < 60000) return '#4caf50'; // Active
        if (timeSinceActivity < 300000) return '#ff9800'; // Recent
        return '#f44336'; // Inactive
      case 'status':
        return getStatusColor(peer.status);
      case 'delegation':
        return '#2196f3';
      default:
        return '#757575';
    }
  }

  function getTrustColor(level: TrustLevel): string {
    switch (level) {
      case TrustLevel.NONE: return '#f44336';
      case TrustLevel.BASIC: return '#ff9800';
      case TrustLevel.VERIFIED: return '#2196f3';
      case TrustLevel.TRUSTED: return '#4caf50';
      case TrustLevel.FULL: return '#9c27b0';
      default: return '#757575';
    }
  }

  function getStatusColor(status: PeerStatus): string {
    switch (status) {
      case PeerStatus.HEALTHY: return '#4caf50';
      case PeerStatus.CONNECTED: return '#2196f3';
      case PeerStatus.DEGRADED: return '#ff9800';
      case PeerStatus.OFFLINE: return '#f44336';
      case PeerStatus.ERROR: return '#d32f2f';
      default: return '#757575';
    }
  }

  function getTrustWeight(level: TrustLevel): number {
    return getTrustLevelPriority(level) / 4;
  }

  function getDelegationColor(count: number): string {
    if (count > 10) return '#4caf50';
    if (count > 5) return '#ff9800';
    return '#2196f3';
  }

  function getNodeConnections(
    nodeId: string, 
    trusts: TrustRelationship[], 
    delegations: Delegation[]
  ): string[] {
    const connections = new Set<string>();
    
    trusts.forEach(trust => {
      if (trust.peer_id === nodeId && trust.mutual) {
        // For mutual trust, this peer is connected to others with mutual trust
        const mutualTrusts = trusts.filter(t => t.mutual && t.trust_level === trust.trust_level && t.peer_id !== nodeId);
        mutualTrusts.forEach(mt => connections.add(mt.peer_id));
      }
    });

    return Array.from(connections);
  }

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchPeers(),
      refetchTrust(),
      refetchDelegations(),
    ]);
  };

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleCenterView = () => {
    setZoomLevel(1);
    // Reset canvas view to center
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Network statistics
  const networkStats = useMemo(() => {
    const totalNodes = networkNodes.length;
    const totalEdges = networkEdges.length;
    const connectedNodes = networkNodes.filter(n => n.connections.length > 0).length;
    const isolatedNodes = totalNodes - connectedNodes;
    const averageConnections = totalNodes > 0 ? 
      networkNodes.reduce((sum, n) => sum + n.connections.length, 0) / totalNodes : 0;
    
    return {
      totalNodes,
      totalEdges,
      connectedNodes,
      isolatedNodes,
      averageConnections: Math.round(averageConnections * 10) / 10,
    };
  }, [networkNodes, networkEdges]);

  // Loading state
  if (peersLoading || trustLoading || delegationsLoading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Loading Network Topology...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gathering peer data and relationships
        </Typography>
      </Paper>
    );
  }

  // Error state
  if (peersError) {
    return (
      <Alert severity="error">
        <Typography variant="h6" gutterBottom>
          Failed to Load Network Data
        </Typography>
        <Typography variant="body2">
          {peersError.toString()}
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ height: isFullscreen ? '100vh' : '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Controls Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="h6">Network Topology</Typography>
            <Typography variant="caption" color="text.secondary">
              {networkStats.totalNodes} nodes, {networkStats.totalEdges} connections
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Layout</InputLabel>
              <Select
                value={layout}
                label="Layout"
                onChange={(e) => setLayout(e.target.value as LayoutType)}
              >
                <MenuItem value="force">Force-Directed</MenuItem>
                <MenuItem value="circle">Circular</MenuItem>
                <MenuItem value="grid">Grid</MenuItem>
                <MenuItem value="hierarchy">Hierarchical</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="trust">
                <Tooltip title="Trust relationships">
                  <SecurityOutlined />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="activity">
                <Tooltip title="Activity levels">
                  <BubbleChartOutlined />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="status">
                <Tooltip title="Peer status">
                  <AccountTreeOutlined />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption">Zoom:</Typography>
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOutOutlined />
              </IconButton>
              <Slider
                value={zoomLevel}
                onChange={(_, value) => setZoomLevel(value as number)}
                min={0.3}
                max={3}
                step={0.1}
                sx={{ width: 80 }}
                size="small"
              />
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomInOutlined />
              </IconButton>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Center view">
                <IconButton size="small" onClick={handleCenterView}>
                  <CenterFocusStrongOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title="Fullscreen">
                <IconButton size="small" onClick={toggleFullscreen}>
                  <FullscreenOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh data">
                <IconButton size="small" onClick={handleRefreshAll}>
                  <RefreshOutlined />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Connection Status */}
        {!isConnected && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Real-time updates unavailable. Network topology may not reflect current state.
          </Alert>
        )}
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexGrow: 1, gap: 2 }}>
        {/* Network Visualization */}
        <Paper sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
          <NetworkCanvas
            ref={canvasRef}
            nodes={networkNodes}
            edges={networkEdges}
            layout={layout}
            zoomLevel={zoomLevel}
            onNodeClick={handleNodeClick}
            selectedNode={selectedNode}
            filters={filters}
          />
          
          {/* Legend Overlay */}
          <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
            <TopologyLegend viewMode={viewMode} />
          </Box>

          {/* Network Statistics Overlay */}
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <ConnectionMetrics stats={networkStats} />
          </Box>
        </Paper>

        {/* Side Panel */}
        {selectedNode && (
          <Paper sx={{ width: 320, p: 2 }}>
            <NodeDetails
              node={selectedNode}
              trustRelationships={trustRelationships}
              delegations={delegations}
              onClose={() => setSelectedNode(null)}
            />
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default NetworkTopology;