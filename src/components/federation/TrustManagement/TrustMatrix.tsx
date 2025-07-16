/**
 * Trust Matrix Component
 * 
 * Visual matrix showing trust relationships between peers.
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  MoreVertOutlined,
  EditOutlined,
  BlockOutlined,
  VerifiedUserOutlined,
  InfoOutlined,
} from '@mui/icons-material';

// Federation types and components
import { SubstratePeer, TrustLevel, TrustRelationship } from '../../../types/federation';
import { TrustLevelBadge, PeerStatusIcon } from '../shared';

interface TrustMatrixProps {
  peers: SubstratePeer[];
  trustRelationships?: TrustRelationship[];
  isLoading: boolean;
  onUpdateTrust: (params: { peer_id: string; trust_level: TrustLevel }) => Promise<any>;
}

interface TrustCell {
  fromPeer: SubstratePeer;
  toPeer: SubstratePeer;
  trustLevel: TrustLevel;
  relationship?: TrustRelationship;
}

const TrustMatrix: React.FC<TrustMatrixProps> = ({
  peers,
  trustRelationships = [],
  isLoading,
  onUpdateTrust,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCell, setSelectedCell] = useState<TrustCell | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newTrustLevel, setNewTrustLevel] = useState<TrustLevel>(TrustLevel.NONE);
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  // Create trust matrix data
  const trustMatrix = useMemo(() => {
    const matrix: TrustCell[][] = [];

    peers.forEach((fromPeer) => {
      const row: TrustCell[] = [];
      
      peers.forEach((toPeer) => {
        if (fromPeer.id === toPeer.id) {
          // Self-trust (always full)
          row.push({
            fromPeer,
            toPeer,
            trustLevel: TrustLevel.FULL,
          });
        } else {
          // Find existing trust relationship
          const relationship = trustRelationships.find(
            r => r.from_peer_id === fromPeer.id && r.to_peer_id === toPeer.id
          );
          
          row.push({
            fromPeer,
            toPeer,
            trustLevel: relationship?.trust_level || TrustLevel.NONE,
            relationship,
          });
        }
      });
      
      matrix.push(row);
    });

    return matrix;
  }, [peers, trustRelationships]);

  const handleCellClick = (event: React.MouseEvent<HTMLElement>, cell: TrustCell) => {
    if (cell.fromPeer.id === cell.toPeer.id) return; // Can't edit self-trust
    
    setAnchorEl(event.currentTarget);
    setSelectedCell(cell);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCell(null);
  };

  const handleEditTrust = () => {
    if (!selectedCell) return;
    
    setNewTrustLevel(selectedCell.trustLevel);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleUpdateTrust = async () => {
    if (!selectedCell) return;

    const updateKey = `${selectedCell.fromPeer.id}-${selectedCell.toPeer.id}`;
    setUpdating(prev => new Set(prev).add(updateKey));

    try {
      await onUpdateTrust({
        peer_id: selectedCell.toPeer.id,
        trust_level: newTrustLevel,
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update trust level:', error);
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }
  };

  const getTrustColor = (level: TrustLevel) => {
    switch (level) {
      case TrustLevel.NONE: return '#f5f5f5';
      case TrustLevel.BASIC: return '#e3f2fd';
      case TrustLevel.VERIFIED: return '#fff3e0';
      case TrustLevel.TRUSTED: return '#e8f5e8';
      case TrustLevel.FULL: return '#e8eaf6';
      default: return '#f5f5f5';
    }
  };

  const getTrustIcon = (level: TrustLevel) => {
    switch (level) {
      case TrustLevel.NONE: return <BlockOutlined fontSize="small" />;
      case TrustLevel.BASIC: return <InfoOutlined fontSize="small" />;
      case TrustLevel.VERIFIED: return <VerifiedUserOutlined fontSize="small" />;
      case TrustLevel.TRUSTED: return <VerifiedUserOutlined fontSize="small" />;
      case TrustLevel.FULL: return <VerifiedUserOutlined fontSize="small" />;
      default: return <BlockOutlined fontSize="small" />;
    }
  };

  const getRelationshipTooltip = (cell: TrustCell) => {
    if (cell.fromPeer.id === cell.toPeer.id) {
      return 'Self-trust (always full)';
    }
    
    const { relationship } = cell;
    if (!relationship) {
      return `No trust relationship between ${cell.fromPeer.name} and ${cell.toPeer.name}`;
    }

    return (
      <Box>
        <Typography variant="body2">
          Trust: {cell.fromPeer.name} → {cell.toPeer.name}
        </Typography>
        <Typography variant="caption" display="block">
          Level: {relationship.trust_level}
        </Typography>
        <Typography variant="caption" display="block">
          Since: {new Date(relationship.created_at).toLocaleDateString()}
        </Typography>
        {relationship.last_verified_at && (
          <Typography variant="caption" display="block">
            Verified: {new Date(relationship.last_verified_at).toLocaleDateString()}
          </Typography>
        )}
      </Box>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading trust matrix...
        </Typography>
      </Paper>
    );
  }

  // Empty state
  if (peers.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="h6" gutterBottom>
          No peers available
        </Typography>
        <Typography variant="body2">
          The trust matrix will appear when federation peers are connected.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Trust Relationship Matrix</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {peers.length}×{peers.length} matrix
          </Typography>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Trust Levels:
        </Typography>
        {Object.values(TrustLevel).map((level) => (
          <Chip
            key={level}
            size="small"
            icon={getTrustIcon(level)}
            label={level}
            sx={{ 
              bgcolor: getTrustColor(level),
              '& .MuiChip-icon': {
                color: 'text.secondary',
              },
            }}
            variant="outlined"
          />
        ))}
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120, bgcolor: 'grey.50' }}>
                <Typography variant="caption" fontWeight="bold">
                  From \ To
                </Typography>
              </TableCell>
              {peers.map((peer) => (
                <TableCell 
                  key={peer.id}
                  align="center"
                  sx={{ 
                    minWidth: 80,
                    bgcolor: 'grey.50',
                    transform: 'rotate(-45deg)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Tooltip title={peer.name}>
                    <Typography variant="caption" fontWeight="bold">
                      {peer.name.slice(0, 8)}
                    </Typography>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {trustMatrix.map((row, rowIndex) => (
              <TableRow key={peers[rowIndex].id}>
                <TableCell 
                  sx={{ 
                    bgcolor: 'grey.50',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeerStatusIcon status={peers[rowIndex].status} size="small" withTooltip={false} />
                    <Typography variant="body2" noWrap>
                      {peers[rowIndex].name}
                    </Typography>
                  </Box>
                </TableCell>
                {row.map((cell, colIndex) => {
                  const updateKey = `${cell.fromPeer.id}-${cell.toPeer.id}`;
                  const isUpdating = updating.has(updateKey);
                  const isSelfTrust = cell.fromPeer.id === cell.toPeer.id;
                  
                  return (
                    <TableCell 
                      key={cell.toPeer.id}
                      align="center"
                      sx={{
                        bgcolor: getTrustColor(cell.trustLevel),
                        cursor: isSelfTrust ? 'default' : 'pointer',
                        position: 'relative',
                        '&:hover': isSelfTrust ? {} : {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={isSelfTrust ? undefined : (e) => handleCellClick(e, cell)}
                    >
                      <Tooltip title={getRelationshipTooltip(cell)} arrow>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {isUpdating ? (
                            <CircularProgress size={16} />
                          ) : (
                            <TrustLevelBadge 
                              level={cell.trustLevel} 
                              size="small" 
                              showLabel={false}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditTrust}>
          <EditOutlined sx={{ mr: 1 }} />
          Edit Trust Level
        </MenuItem>
      </Menu>

      {/* Edit Trust Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>
          Update Trust Level
        </DialogTitle>
        <DialogContent>
          {selectedCell && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Updating trust from <strong>{selectedCell.fromPeer.name}</strong> to{' '}
                <strong>{selectedCell.toPeer.name}</strong>
              </Typography>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Trust Level</InputLabel>
                <Select
                  value={newTrustLevel}
                  label="Trust Level"
                  onChange={(e) => setNewTrustLevel(e.target.value as TrustLevel)}
                >
                  {Object.values(TrustLevel).map((level) => (
                    <MenuItem key={level} value={level}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrustLevelBadge level={level} size="small" showLabel={false} />
                        {level}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateTrust}
            variant="contained"
            disabled={!selectedCell || updating.size > 0}
          >
            Update Trust
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrustMatrix;