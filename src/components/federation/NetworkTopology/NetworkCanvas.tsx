/**
 * Network Canvas Component
 * 
 * Canvas-based network visualization using D3.js force simulation.
 */

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box } from '@mui/material';
import * as d3 from 'd3';
import { TrustLevel, PeerStatus, SubstratePeer } from '../../../types/federation';

export interface NetworkNode {
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
  trustLevel?: string;
  delegationCount?: number;
}

interface TopologyFilters {
  showTrustConnections: boolean;
  showDelegationPaths: boolean;
  showOfflinePeers: boolean;
  minTrustLevel: string;
  highlightActiveOnly: boolean;
}

interface NetworkCanvasProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  layout: 'force' | 'circle' | 'grid' | 'hierarchy';
  zoomLevel: number;
  onNodeClick: (node: NetworkNode) => void;
  selectedNode: NetworkNode | null;
  filters: TopologyFilters;
}

const NetworkCanvas = forwardRef<HTMLCanvasElement, NetworkCanvasProps>(({
  nodes,
  edges,
  layout,
  zoomLevel,
  onNodeClick,
  selectedNode,
  filters,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkEdge> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => canvasRef.current!);

  // Initialize canvas and simulation
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear any existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create D3 simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(canvas.width / 2, canvas.height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 5));

    simulationRef.current = simulation;

    // Apply layout-specific forces
    applyLayoutForces(simulation, layout, canvas.width, canvas.height);

    // Animation loop
    const animate = () => {
      drawNetwork(context, nodes, edges, canvas.width, canvas.height, zoomLevel, selectedNode);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start simulation and animation
    simulation.on('tick', () => {
      // Simulation will update node positions automatically
    });

    animate();

    // Handle canvas clicks
    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomLevel;
      const y = (event.clientY - rect.top) / zoomLevel;

      // Find clicked node
      const clickedNode = nodes.find(node => {
        const dx = node.x - x;
        const dy = node.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= node.size;
      });

      if (clickedNode) {
        onNodeClick(clickedNode);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [nodes, edges, layout, onNodeClick]);

  // Update zoom level
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Redraw with new zoom level
    drawNetwork(context, nodes, edges, canvas.width, canvas.height, zoomLevel, selectedNode);
  }, [zoomLevel, selectedNode]);

  // Apply layout-specific forces
  function applyLayoutForces(
    simulation: d3.Simulation<NetworkNode, NetworkEdge>,
    layoutType: string,
    width: number,
    height: number
  ) {
    switch (layoutType) {
      case 'circle':
        simulation
          .force('charge', null)
          .force('link', null)
          .force('radial', d3.forceRadial(Math.min(width, height) / 3, width / 2, height / 2));
        break;
      
      case 'grid':
        simulation
          .force('charge', d3.forceManyBody().strength(-50))
          .force('link', null)
          .force('x', d3.forceX().strength(0.1))
          .force('y', d3.forceY().strength(0.1));
        break;
      
      case 'hierarchy':
        simulation
          .force('charge', d3.forceManyBody().strength(-200))
          .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(80))
          .force('x', d3.forceX().strength(0.2))
          .force('y', d3.forceY(height / 2).strength(0.1));
        break;
      
      case 'force':
      default:
        // Default force-directed layout (already configured)
        break;
    }
  }

  // Draw network on canvas
  function drawNetwork(
    context: CanvasRenderingContext2D,
    nodes: NetworkNode[],
    edges: NetworkEdge[],
    width: number,
    height: number,
    zoom: number,
    selectedNode: NetworkNode | null
  ) {
    // Clear canvas
    context.clearRect(0, 0, width, height);
    
    // Apply zoom transform
    context.save();
    context.scale(zoom, zoom);

    // Draw edges first (behind nodes)
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        drawEdge(context, sourceNode, targetNode, edge);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      drawNode(context, node, isSelected);
    });

    // Draw node labels
    nodes.forEach(node => {
      drawNodeLabel(context, node);
    });

    context.restore();
  }

  // Draw individual edge
  function drawEdge(
    context: CanvasRenderingContext2D,
    source: NetworkNode,
    target: NetworkNode,
    edge: NetworkEdge
  ) {
    context.save();
    
    // Set edge style based on type
    context.strokeStyle = edge.color;
    context.lineWidth = Math.max(1, edge.weight * 3);
    context.globalAlpha = edge.animated ? 0.8 : 0.6;
    
    // Draw edge line
    context.beginPath();
    context.moveTo(source.x, source.y);
    
    if (edge.type === 'trust') {
      // Curved line for trust relationships
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      const offset = 20;
      context.quadraticCurveTo(midX + offset, midY - offset, target.x, target.y);
    } else {
      // Straight line for delegations
      context.lineTo(target.x, target.y);
    }
    
    context.stroke();

    // Draw arrow for directed edges
    if (edge.type === 'delegation') {
      drawArrow(context, source, target, edge.color);
    }

    context.restore();
  }

  // Draw arrow head
  function drawArrow(
    context: CanvasRenderingContext2D,
    source: NetworkNode,
    target: NetworkNode,
    color: string
  ) {
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;

    // Position arrow at edge of target node
    const arrowX = target.x - Math.cos(angle) * (target.size + 5);
    const arrowY = target.y - Math.sin(angle) * (target.size + 5);

    context.save();
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(arrowX, arrowY);
    context.lineTo(
      arrowX - arrowLength * Math.cos(angle - arrowAngle),
      arrowY - arrowLength * Math.sin(angle - arrowAngle)
    );
    context.lineTo(
      arrowX - arrowLength * Math.cos(angle + arrowAngle),
      arrowY - arrowLength * Math.sin(angle + arrowAngle)
    );
    context.closePath();
    context.fill();
    context.restore();
  }

  // Draw individual node
  function drawNode(
    context: CanvasRenderingContext2D,
    node: NetworkNode,
    isSelected: boolean
  ) {
    context.save();

    // Draw selection ring
    if (isSelected) {
      context.strokeStyle = '#2196f3';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(node.x, node.y, node.size + 5, 0, 2 * Math.PI);
      context.stroke();
    }

    // Draw node circle
    context.fillStyle = node.color;
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    // Draw status indicator
    if (node.status) {
      drawStatusIndicator(context, node);
    }

    context.restore();
  }

  // Draw status indicator
  function drawStatusIndicator(context: CanvasRenderingContext2D, node: NetworkNode) {
    const indicatorSize = 6;
    const indicatorX = node.x + node.size - indicatorSize;
    const indicatorY = node.y - node.size + indicatorSize;

    let indicatorColor = '#757575';
    switch (node.status) {
      case 'healthy':
        indicatorColor = '#4caf50';
        break;
      case 'connected':
        indicatorColor = '#2196f3';
        break;
      case 'degraded':
        indicatorColor = '#ff9800';
        break;
      case 'offline':
        indicatorColor = '#f44336';
        break;
    }

    context.fillStyle = indicatorColor;
    context.strokeStyle = '#ffffff';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(indicatorX, indicatorY, indicatorSize, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
  }

  // Draw node label
  function drawNodeLabel(context: CanvasRenderingContext2D, node: NetworkNode) {
    const label = node.peer.name;
    if (!label) return;

    context.save();
    context.fillStyle = '#333333';
    context.font = '12px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';

    // Add background for better readability
    const metrics = context.measureText(label);
    const padding = 4;
    const bgX = node.x - metrics.width / 2 - padding;
    const bgY = node.y + node.size + 5;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 16;

    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.fillRect(bgX, bgY, bgWidth, bgHeight);

    // Draw label text
    context.fillStyle = '#333333';
    context.fillText(label, node.x, bgY + 2);
    context.restore();
  }

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Update simulation center
      if (simulationRef.current) {
        simulationRef.current
          .force('center', d3.forceCenter(canvas.width / 2, canvas.height / 2))
          .alpha(0.3)
          .restart();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        cursor: 'crosshair',
        '&:hover': {
          cursor: 'pointer',
        },
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </Box>
  );
});

NetworkCanvas.displayName = 'NetworkCanvas';

export default NetworkCanvas;