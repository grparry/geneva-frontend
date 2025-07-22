import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Box, useTheme, alpha, CircularProgress, Typography } from '@mui/material';
import { Substrate, SubstratePeer, PeerStatus, TrustLevel } from '../../types/federation';
import { safeForceGraphImport } from '../../utils/aframe-stub';

interface FederationTopologyGraphProps {
  currentSubstrate: Substrate;
  peers: SubstratePeer[];
  selectedPeer?: SubstratePeer | null;
  onNodeClick?: (node: GraphNode) => void;
  height?: number;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'current' | 'peer';
  status?: PeerStatus;
  color?: string;
  size?: number;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  trustLevel?: TrustLevel;
  color?: string;
}

export const FederationTopologyGraph: React.FC<FederationTopologyGraphProps> = ({
  currentSubstrate,
  peers,
  selectedPeer,
  onNodeClick,
  height = 400
}) => {
  const theme = useTheme();
  const graphRef = useRef<any>(null);
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamically import ForceGraph2D to avoid AFRAME issues
  useEffect(() => {
    const loadForceGraph = async () => {
      try {
        const module = await safeForceGraphImport();
        setForceGraph2D(() => module.ForceGraph2D);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load ForceGraph2D:', err);
        setError('Failed to load graph visualization');
        setLoading(false);
      }
    };

    loadForceGraph();
  }, []);

  const getNodeColor = (node: GraphNode): string => {
    if (node.type === 'current') {
      return theme.palette.primary.main;
    }

    switch (node.status) {
      case PeerStatus.CONNECTED:
        return theme.palette.success.main;
      case PeerStatus.ERROR:
        return theme.palette.error.main;
      case PeerStatus.OFFLINE:
        return theme.palette.grey[500];
      default:
        return theme.palette.warning.main;
    }
  };

  const getLinkColor = (link: GraphLink): string => {
    switch (link.trustLevel) {
      case TrustLevel.FULL:
        return alpha(theme.palette.success.main, 0.8);
      case TrustLevel.TRUSTED:
        return alpha(theme.palette.success.light, 0.7);
      case TrustLevel.VERIFIED:
        return alpha(theme.palette.warning.main, 0.6);
      case TrustLevel.BASIC:
        return alpha(theme.palette.warning.light, 0.5);
      default:
        return alpha(theme.palette.grey[500], 0.4);
    }
  };

  const getLinkWidth = (link: GraphLink): number => {
    switch (link.trustLevel) {
      case TrustLevel.FULL:
        return 4;
      case TrustLevel.TRUSTED:
        return 3;
      case TrustLevel.VERIFIED:
        return 2;
      default:
        return 1;
    }
  };

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [
      {
        id: currentSubstrate.id,
        label: currentSubstrate.name,
        type: 'current',
        size: 12
      },
      ...peers.map(peer => ({
        id: peer.substrate_id,
        label: peer.name,
        type: 'peer' as const,
        status: peer.status,
        size: 8
      }))
    ];

    const links: GraphLink[] = peers.map(peer => ({
      source: currentSubstrate.id,
      target: peer.substrate_id,
      value: 1,
      trustLevel: peer.trust_level
    }));

    return { nodes, links };
  }, [currentSubstrate, peers]);

  // Apply colors to nodes and links
  const coloredGraphData = useMemo(() => ({
    nodes: graphData.nodes.map(node => ({
      ...node,
      color: getNodeColor(node)
    })),
    links: graphData.links.map(link => ({
      ...link,
      color: getLinkColor(link)
    }))
  }), [graphData, theme]);

  // Center graph on mount
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  }, []);

  // Highlight selected peer
  useEffect(() => {
    if (graphRef.current && selectedPeer) {
      const node = coloredGraphData.nodes.find(n => n.id === selectedPeer.substrate_id);
      if (node) {
        // Note: node positions may not be available until after force simulation
        // Use the graph's node getter if available
        const graphNode = graphRef.current.graph2ScreenCoords?.(node.id);
        if (graphNode) {
          graphRef.current.centerAt(graphNode.x, graphNode.y, 1000);
        }
      }
    }
  }, [selectedPeer, coloredGraphData.nodes]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          borderRadius: 1
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !ForceGraph2D) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          borderRadius: 1,
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography color="text.secondary">
          {error || 'Graph visualization unavailable'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Showing peer list instead
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height,
        bgcolor: 'background.default',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={coloredGraphData}
        width={undefined}
        height={height}
        nodeLabel="label"
        nodeColor="color"
        nodeRelSize={1}
        nodeVal={(node: any) => node.size || 6}
        linkColor="color"
        linkWidth={(link: any) => getLinkWidth(link as GraphLink)}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0}
        onNodeClick={(node: any) => onNodeClick?.(node as GraphNode)}
        onNodeHover={(node: any) => {
          document.body.style.cursor = node ? 'pointer' : 'default';
        }}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        minZoom={0.5}
        maxZoom={5}
        nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
          const label = (node as GraphNode).label;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

          // Draw node
          ctx.fillStyle = node.color || theme.palette.primary.main;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, (node.size || 6), 0, 2 * Math.PI, false);
          ctx.fill();

          // Draw outline for selected node
          if (selectedPeer && (node as GraphNode).id === selectedPeer.substrate_id) {
            ctx.strokeStyle = theme.palette.primary.main;
            ctx.lineWidth = 2 / globalScale;
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, (node.size || 6) + 2, 0, 2 * Math.PI, false);
            ctx.stroke();
          }

          // Draw label background
          ctx.fillStyle = alpha(theme.palette.background.paper, 0.8);
          ctx.fillRect(
            (node.x || 0) - bckgDimensions[0] / 2,
            (node.y || 0) + (node.size || 6) + 1,
            bckgDimensions[0],
            bckgDimensions[1]
          );

          // Draw label
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = theme.palette.text.primary;
          ctx.fillText(label, node.x || 0, (node.y || 0) + (node.size || 6) + fontSize);
        }}
        backgroundColor={theme.palette.background.paper}
      />
    </Box>
  );
};