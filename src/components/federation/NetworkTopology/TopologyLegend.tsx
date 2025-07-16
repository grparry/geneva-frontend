/**
 * Topology Legend Component
 * 
 * Legend showing node and edge meanings for network topology visualization.
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  FiberManualRecordOutlined,
  TrendingFlatOutlined,
  CallMadeOutlined,
} from '@mui/icons-material';

interface TopologyLegendProps {
  viewMode: 'trust' | 'activity' | 'status' | 'delegation';
}

const TopologyLegend: React.FC<TopologyLegendProps> = ({ viewMode }) => {
  const getNodeLegend = () => {
    switch (viewMode) {
      case 'trust':
        return [
          { color: '#f44336', label: 'No Trust', size: 'small' },
          { color: '#ff9800', label: 'Basic Trust', size: 'small' },
          { color: '#2196f3', label: 'Verified', size: 'medium' },
          { color: '#4caf50', label: 'Trusted', size: 'medium' },
          { color: '#9c27b0', label: 'Full Trust', size: 'large' },
        ];
      
      case 'activity':
        return [
          { color: '#4caf50', label: 'Active (< 1min)', size: 'small' },
          { color: '#ff9800', label: 'Recent (< 5min)', size: 'small' },
          { color: '#f44336', label: 'Inactive (> 5min)', size: 'small' },
        ];
      
      case 'status':
        return [
          { color: '#4caf50', label: 'Healthy', size: 'large' },
          { color: '#2196f3', label: 'Connected', size: 'small' },
          { color: '#ff9800', label: 'Degraded', size: 'small' },
          { color: '#f44336', label: 'Offline', size: 'small' },
          { color: '#d32f2f', label: 'Error', size: 'small' },
        ];
      
      case 'delegation':
        return [
          { color: '#2196f3', label: 'Low Activity', size: 'small' },
          { color: '#2196f3', label: 'Medium Activity', size: 'medium' },
          { color: '#2196f3', label: 'High Activity', size: 'large' },
        ];
      
      default:
        return [];
    }
  };

  const getEdgeLegend = () => {
    return [
      {
        type: 'trust',
        color: '#4caf50',
        label: 'Trust Relationship',
        style: 'curved',
      },
      {
        type: 'delegation',
        color: '#2196f3',
        label: 'Delegation Path',
        style: 'arrow',
      },
      {
        type: 'active',
        color: '#ff9800',
        label: 'Active Connection',
        style: 'animated',
      },
    ];
  };

  const getNodeSizeIcon = (size: string) => {
    const iconStyle = {
      small: { fontSize: '16px' },
      medium: { fontSize: '20px' },
      large: { fontSize: '24px' },
    };
    
    return (
      <FiberManualRecordOutlined 
        sx={{ 
          ...iconStyle[size as keyof typeof iconStyle],
          color: 'inherit',
        }} 
      />
    );
  };

  const getEdgeIcon = (style: string, color: string) => {
    switch (style) {
      case 'curved':
        return <TrendingFlatOutlined sx={{ color, transform: 'rotate(-15deg)' }} />;
      case 'arrow':
        return <CallMadeOutlined sx={{ color }} />;
      case 'animated':
        return <TrendingFlatOutlined sx={{ color, animation: 'pulse 1s infinite' }} />;
      default:
        return <TrendingFlatOutlined sx={{ color }} />;
    }
  };

  const nodeLegend = getNodeLegend();
  const edgeLegend = getEdgeLegend();

  return (
    <Paper 
      sx={{ 
        p: 2, 
        minWidth: 200,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Legend
      </Typography>
      
      {/* Node Legend */}
      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
        Nodes ({viewMode})
      </Typography>
      
      <List dense sx={{ py: 0 }}>
        {nodeLegend.map((item, index) => (
          <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Box sx={{ color: item.color }}>
                {getNodeSizeIcon(item.size)}
              </Box>
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Edge Legend */}
      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
        Connections
      </Typography>
      
      <List dense sx={{ py: 0 }}>
        {edgeLegend.map((item, index) => (
          <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {getEdgeIcon(item.style, item.color)}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
        ))}
      </List>

      {/* Additional Info */}
      <Divider sx={{ my: 1 }} />
      
      <Typography variant="caption" color="text.secondary">
        • Click nodes for details
        • Scroll to zoom
        • Drag to pan
      </Typography>
    </Paper>
  );
};

export default TopologyLegend;