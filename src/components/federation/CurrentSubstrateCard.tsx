import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  Hub as HubIcon,
  Memory as MemoryIcon,
  Code as CodeIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  NetworkCheck as NetworkIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { Substrate } from '../../types/federation';

interface CurrentSubstrateCardProps {
  substrate: Substrate;
}

export const CurrentSubstrateCard: React.FC<CurrentSubstrateCardProps> = ({ substrate }) => {
  const getCapabilityIcon = (capability: string) => {
    const lowerCap = capability.toLowerCase();
    if (lowerCap.includes('memory')) return <MemoryIcon />;
    if (lowerCap.includes('code') || lowerCap.includes('execution')) return <CodeIcon />;
    if (lowerCap.includes('analytics') || lowerCap.includes('analysis')) return <AnalyticsIcon />;
    if (lowerCap.includes('security') || lowerCap.includes('auth')) return <SecurityIcon />;
    if (lowerCap.includes('network') || lowerCap.includes('federation')) return <NetworkIcon />;
    if (lowerCap.includes('storage') || lowerCap.includes('data')) return <StorageIcon />;
    return <HubIcon />;
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <HubIcon fontSize="large" color="primary" />
            <Box>
              <Typography variant="h5" component="div">
                {substrate.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Substrate
              </Typography>
            </Box>
          </Box>
          <Chip
            label="ACTIVE"
            color="success"
            variant="filled"
          />
        </Box>

        <Box display="flex" gap={3} flexWrap="wrap">
          <Box flex={{ xs: "1 1 100%", md: "1 1 45%" }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Substrate Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Substrate ID"
                    secondary={substrate.id}
                    secondaryTypographyProps={{ 
                      sx: { 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        wordBreak: 'break-all'
                      } 
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="URL"
                    secondary={substrate.url}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip 
                        label={substrate.status} 
                        size="small" 
                        color="primary"
                        sx={{ mt: 0.5 }}
                      />
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>

          <Box flex={{ xs: "1 1 100%", md: "1 1 45%" }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Capabilities ({substrate.capabilities.length})
              </Typography>
              <List dense>
                {substrate.capabilities.map((capability: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getCapabilityIcon(capability)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={capability}
                      primaryTypographyProps={{
                        sx: { textTransform: 'capitalize' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </Box>

        {substrate.metadata && Object.keys(substrate.metadata).length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Additional Metadata
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Object.entries(substrate.metadata).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};