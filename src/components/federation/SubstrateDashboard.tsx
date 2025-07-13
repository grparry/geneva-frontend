import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import MonitorIcon from '@mui/icons-material/Monitor';
import { 
  Substrate, 
  SubstratePeer, 
  FederationMetrics,
  FederationEvent 
} from '../../types/federation';
import { CurrentSubstrateCard } from './CurrentSubstrateCard';
import { PeerSubstrateCard } from './PeerSubstrateCard';
import { FederationTopologyGraph } from './FederationTopologyGraph';
import { SimpleFederationGraph } from './SimpleFederationGraph';
import { FederationMetricsCard } from './FederationMetricsCard';
import { useWebSocket, useWebSocketSubscription } from '../../hooks/useWebSocket';
import { federationWebSocket } from '../../services/websocket';
import { TaskDelegationDialog } from './TaskDelegationDialog';
import { TrustManagementDialog } from './TrustManagementDialog';
import { DelegationHistoryTable } from './DelegationHistoryTable';
import { FederationMonitoringDashboard } from './FederationMonitoringDashboard';
import { useFederation } from '../../hooks/useFederation';
import { useFederationWebSocket } from '../../hooks/useFederationWebSocket';

interface SubstrateDashboardProps {
  onPeerSelect?: (peer: SubstratePeer) => void;
  onAddPeer?: () => void;
}

export const SubstrateDashboard: React.FC<SubstrateDashboardProps> = ({
  onPeerSelect,
  onAddPeer
}) => {
  const {
    currentSubstrate,
    peers,
    metrics,
    loading,
    error,
    refreshPeers,
    refreshMetrics
  } = useFederation();

  const [selectedPeer, setSelectedPeer] = useState<SubstratePeer | null>(null);
  const [recentEvents, setRecentEvents] = useState<FederationEvent[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showDelegationDialog, setShowDelegationDialog] = useState(false);
  const [showTrustDialog, setShowTrustDialog] = useState(false);
  const [trustManagementPeer, setTrustManagementPeer] = useState<SubstratePeer | null>(null);
  
  // Use simple graph to avoid AFRAME issues
  const useSimpleGraph = true;

  // Set up WebSocket for real-time updates
  const { lastMessage, connectionStatus } = useFederationWebSocket('/api/federation/events/stream');

  useEffect(() => {
    if (lastMessage) {
      try {
        const event = JSON.parse(lastMessage) as FederationEvent;
        setRecentEvents(prev => [event, ...prev].slice(0, 10)); // Keep last 10 events
        
        // Refresh data based on event type
        if (event.type.startsWith('peer.')) {
          refreshPeers();
        }
        if (event.type.startsWith('delegation.')) {
          refreshMetrics();
        }
      } catch (e) {
        console.error('Failed to parse federation event:', e);
      }
    }
  }, [lastMessage, refreshPeers, refreshMetrics]);

  const handlePeerClick = (peer: SubstratePeer) => {
    setSelectedPeer(peer);
    onPeerSelect?.(peer);
  };

  const handleRefresh = async () => {
    await Promise.all([refreshPeers(), refreshMetrics()]);
  };

  if (loading && !currentSubstrate) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNetworkError = errorMessage.includes('Network') || errorMessage.includes('fetch');
    
    return (
      <Box sx={{ m: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Failed to load federation data
          </Typography>
          <Typography variant="body2">
            {errorMessage}
          </Typography>
          {isNetworkError && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Make sure the Geneva API is running on port 8400 (not 8000)
            </Typography>
          )}
        </Alert>
        <Button onClick={handleRefresh} variant="contained" startIcon={<RefreshIcon />}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" flexDirection="column" gap={3}>
        {/* Header */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1">
              Substrate Federation Dashboard
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              <Chip 
                label={connectionStatus} 
                color={connectionStatus === 'connected' ? 'success' : 'default'}
                size="small"
              />
              <Button
                startIcon={<SendIcon />}
                onClick={() => setShowDelegationDialog(true)}
                variant="outlined"
                size="small"
                disabled={peers.length === 0}
              >
                Delegate Task
              </Button>
              <Tooltip title="Add New Peer">
                <IconButton onClick={onAddPeer} color="primary">
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="Overview" />
            <Tab label="Monitoring" icon={<MonitorIcon />} iconPosition="start" />
            <Tab label="History" icon={<HistoryIcon />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && (
          <>
            {/* Current Substrate Status */}
        {currentSubstrate && (
          <Box>
            <CurrentSubstrateCard substrate={currentSubstrate} />
          </Box>
        )}

        {/* Metrics Overview */}
        {metrics && (
          <Box>
            <FederationMetricsCard metrics={metrics} />
          </Box>
        )}

        {/* Federation Topology and Events */}
        <Box display="flex" gap={3} flexWrap="wrap">
          <Box flex={{ xs: "1 1 100%", lg: "1 1 65%" }}>
            {currentSubstrate && (
              useSimpleGraph ? (
                <SimpleFederationGraph
                  currentSubstrate={currentSubstrate}
                  peers={peers}
                  selectedPeer={selectedPeer}
                  onNodeClick={handlePeerClick}
                  height={500}
                />
              ) : (
                <Paper elevation={2} sx={{ p: 2, height: 500 }}>
                  <Typography variant="h6" gutterBottom>
                    Federation Network Topology
                  </Typography>
                  <FederationTopologyGraph
                    currentSubstrate={currentSubstrate}
                    peers={peers}
                    selectedPeer={selectedPeer}
                    onNodeClick={(node) => {
                      if (node.id !== currentSubstrate.id) {
                        const peer = peers.find(p => p.substrate_id === node.id);
                        if (peer) handlePeerClick(peer);
                      }
                    }}
                  />
                </Paper>
              )
            )}
          </Box>

          {/* Recent Events */}
          <Box flex={{ xs: "1 1 100%", lg: "1 1 30%" }}>
          <Paper elevation={2} sx={{ p: 2, height: 500, overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Recent Federation Events
            </Typography>
            {recentEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent events
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                {recentEvents.map((event, index) => (
                  <Box 
                    key={`${event.timestamp}-${index}`}
                    sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip 
                        label={event.type} 
                        size="small" 
                        color={getEventColor(event.type)}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    {event.data?.message && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {event.data.message}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
          </Box>
        </Box>

        {/* Peer Substrates */}
        <Box>
          <Typography variant="h5" gutterBottom>
            Federated Peers ({peers.length})
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            {peers.map(peer => (
              <Box key={peer.id} sx={{ flex: { xs: "1 1 100%", md: "1 1 45%", lg: "1 1 30%" } }}>
                <PeerSubstrateCard
                  peer={peer}
                  selected={selectedPeer?.id === peer.id}
                  onClick={() => handlePeerClick(peer)}
                  onActionClick={(action) => {
                    if (action === 'delegate') {
                      setSelectedPeer(peer);
                      setShowDelegationDialog(true);
                    } else if (action === 'trust') {
                      setTrustManagementPeer(peer);
                      setShowTrustDialog(true);
                    }
                  }}
                />
              </Box>
            ))}
            {peers.length === 0 && (
              <Box sx={{ width: "100%" }}>
                <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No federated peers discovered yet
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={onAddPeer}
                    sx={{ mt: 2 }}
                  >
                    Add First Peer
                  </Button>
                </Paper>
              </Box>
            )}
          </Box>
        </Box>
          </>
        )}

        {activeTab === 1 && (
          <FederationMonitoringDashboard 
            metrics={metrics || {
              total_peers: peers.length,
              connected_peers: peers.filter(p => p.status === 'connected').length,
              total_delegations: 0,
              successful_delegations: 0,
              failed_delegations: 0,
              average_delegation_time_ms: 0,
              trust_violations: 0
            }}
          />
        )}

        {activeTab === 2 && (
          <DelegationHistoryTable 
            peers={peers}
            onRefresh={refreshMetrics}
          />
        )}
      </Box>
      
      {/* Dialogs */}
      <TaskDelegationDialog
        open={showDelegationDialog}
        onClose={() => setShowDelegationDialog(false)}
        preselectedPeer={selectedPeer || undefined}
      />
      
      {trustManagementPeer && (
        <TrustManagementDialog
          open={showTrustDialog}
          onClose={() => {
            setShowTrustDialog(false);
            setTrustManagementPeer(null);
          }}
          peer={trustManagementPeer}
          onTrustUpdated={refreshPeers}
        />
      )}
    </Box>
  );
};

function getEventColor(eventType: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  if (eventType.includes('error') || eventType.includes('failed')) return 'error';
  if (eventType.includes('connected') || eventType.includes('completed')) return 'success';
  if (eventType.includes('disconnected') || eventType.includes('revoked')) return 'warning';
  if (eventType.includes('discovered') || eventType.includes('received')) return 'info';
  return 'default';
}