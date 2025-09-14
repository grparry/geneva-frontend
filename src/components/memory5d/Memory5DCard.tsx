/**
 * Memory5DCard Component
 * Display card for individual 5D memories with dimensional visualization
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Menu,
  MenuItem,
  Divider,
  Badge,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Psychology as PsychologyIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  School as SchoolIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon,
  Link as LinkIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

import type {
  Memory5D,
  Memory5DCardProps,
  getDimensionColor,
  getDimensionIcon,
  formatDimensionValue,
  calculateCoherenceScore,
} from '../../types/memory5d';

import {
  useDeleteMemory5DMutation,
  useGetRelatedMemoriesQuery,
} from '../../services/memory5d/api';

const Memory5DCard: React.FC<Memory5DCardProps> = ({
  memory,
  selected = false,
  onSelect,
  showAllDimensions = true,
  enableQuickEdit = false,
  compact = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mutations
  const [deleteMemory, { isLoading: isDeleting }] = useDeleteMemory5DMutation();

  // Get related memories for additional context
  const { data: relatedMemories } = useGetRelatedMemoriesQuery({
    memoryId: memory.id,
    limit: 3,
  }, {
    skip: !showDetails,
  });

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(memory);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    try {
      await deleteMemory(memory.id).unwrap();
      setShowDeleteConfirm(false);
      handleMenuClose();
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const getDimensionChips = () => {
    const dimensions = [
      { key: 'cognitive_type', value: memory.cognitive_type, icon: <PsychologyIcon fontSize="small" /> },
      { key: 'temporal_tier', value: memory.temporal_tier, icon: <ScheduleIcon fontSize="small" /> },
      { key: 'organizational_scope', value: memory.organizational_scope, icon: <BusinessIcon fontSize="small" /> },
      { key: 'security_classification', value: memory.security_classification, icon: <SecurityIcon fontSize="small" /> },
      { key: 'ontological_schema', value: memory.ontological_schema, icon: <SchoolIcon fontSize="small" /> },
    ];

    if (compact) {
      // Show only the first 2-3 most important dimensions in compact mode
      return dimensions.slice(0, 3);
    }

    return showAllDimensions ? dimensions : dimensions.slice(0, 3);
  };

  const getProcessingStatus = () => {
    const statuses = [];

    if (memory.bradley_processed_at) {
      statuses.push({ agent: 'Bradley', color: '#2196f3', icon: '🛡️' });
    }
    if (memory.greta_processed_at) {
      statuses.push({ agent: 'Greta', color: '#4caf50', icon: '🎓' });
    }
    if (memory.thedra_processed_at) {
      statuses.push({ agent: 'Thedra', color: '#ff9800', icon: '🔄' });
    }

    return statuses;
  };

  const coherenceScore = calculateCoherenceScore(memory);
  const processingStatuses = getProcessingStatus();

  const cardContent = (
    <>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box flexGrow={1}>
          <Typography variant={compact ? "body1" : "h6"} fontWeight="medium" sx={{ mb: 0.5 }}>
            Memory #{memory.id.slice(-8)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(memory.created_at), 'MMM dd, yyyy')} •
            {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {/* Processing Status Indicators */}
          {processingStatuses.length > 0 && (
            <Box display="flex" gap={0.5}>
              {processingStatuses.map((status, index) => (
                <Tooltip key={index} title={`Processed by ${status.agent}`}>
                  <Chip
                    label={status.icon}
                    size="small"
                    sx={{
                      height: 20,
                      width: 20,
                      minWidth: 20,
                      '& .MuiChip-label': { px: 0 },
                      backgroundColor: status.color,
                      color: 'white',
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}

          {/* Menu */}
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ opacity: selected ? 1 : 0.7 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Content Preview */}
      <Typography
        variant="body2"
        color="text.primary"
        sx={{
          mb: 2,
          display: '-webkit-box',
          WebkitLineClamp: compact ? 2 : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.4,
        }}
      >
        {memory.content}
      </Typography>

      {/* Dimensional Chips */}
      <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
        {getDimensionChips().map((dimension) => (
          <Tooltip
            key={dimension.key}
            title={`${dimension.key.replace('_', ' ')}: ${formatDimensionValue(dimension.key as any, dimension.value)}`}
          >
            <Chip
              icon={dimension.icon}
              label={formatDimensionValue(dimension.key as any, dimension.value)}
              size="small"
              sx={{
                backgroundColor: getDimensionColor(dimension.key as any, dimension.value),
                fontSize: '0.7rem',
                height: 24,
              }}
            />
          </Tooltip>
        ))}

        {!showAllDimensions && (
          <Chip
            label="+2 more"
            size="small"
            variant="outlined"
            onClick={() => setShowDetails(true)}
            sx={{ fontSize: '0.7rem', height: 24, cursor: 'pointer' }}
          />
        )}
      </Box>

      {/* Scores and Metrics */}
      {!compact && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="caption" color="text.secondary">
              Coherence Score
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(coherenceScore * 100).toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={coherenceScore * 100}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: coherenceScore > 0.7 ? '#4caf50' : coherenceScore > 0.4 ? '#ff9800' : '#f44336',
              },
            }}
          />

          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="text.secondary">
              Importance: {(memory.importance_score * 100).toFixed(0)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Confidence: {(memory.confidence_score * 100).toFixed(0)}%
            </Typography>
          </Box>
        </Box>
      )}

      {/* Concept Tags */}
      {memory.concept_tags.length > 0 && (
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Concepts:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {memory.concept_tags.slice(0, compact ? 3 : 5).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  borderColor: 'rgba(0,0,0,0.2)',
                }}
              />
            ))}
            {memory.concept_tags.length > (compact ? 3 : 5) && (
              <Typography variant="caption" color="text.secondary">
                +{memory.concept_tags.length - (compact ? 3 : 5)} more
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </>
  );

  return (
    <>
      {/* Main Card */}
      <Card
        onClick={handleCardClick}
        sx={{
          cursor: onSelect ? 'pointer' : 'default',
          border: selected ? '2px solid #1976d2' : '1px solid #e0e0e0',
          boxShadow: selected ? 3 : 1,
          transition: 'all 0.2s ease-in-out',
          '&:hover': onSelect ? {
            boxShadow: 3,
            transform: 'translateY(-1px)',
          } : {},
          position: 'relative',
          ...(compact && {
            '& .MuiCardContent-root': { pb: 1 },
          }),
        }}
      >
        {/* Processing Status Indicator */}
        {memory.processing_status !== 'processed' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: memory.processing_status === 'processing' ? '#ff9800' : '#f44336',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: '0 0 0 8px',
              fontSize: '0.7rem',
            }}
          >
            {memory.processing_status}
          </Box>
        )}

        <CardContent sx={{ pb: compact ? 1 : 2 }}>
          {cardContent}
        </CardContent>

        {!compact && (
          <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
            >
              View Details
            </Button>

            {relatedMemories && relatedMemories.memories.length > 0 && (
              <Tooltip title={`${relatedMemories.memories.length} related memories`}>
                <Badge badgeContent={relatedMemories.memories.length} color="primary">
                  <LinkIcon fontSize="small" />
                </Badge>
              </Tooltip>
            )}
          </CardActions>
        )}
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => setShowDetails(true)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>

        {enableQuickEdit && (
          <MenuItem onClick={handleMenuClose}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Quick Edit
          </MenuItem>
        )}

        <MenuItem onClick={handleMenuClose}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Share
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => setShowDeleteConfirm(true)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Memory Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Content
            </Typography>
            <Typography variant="body1" paragraph>
              {memory.content}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Dimensional Classification
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {getDimensionChips().map((dimension) => (
                <Chip
                  key={dimension.key}
                  icon={dimension.icon}
                  label={`${dimension.key.replace('_', ' ')}: ${formatDimensionValue(dimension.key as any, dimension.value)}`}
                  sx={{
                    backgroundColor: getDimensionColor(dimension.key as any, dimension.value),
                  }}
                />
              ))}
            </Box>
          </Box>

          {memory.concept_tags.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Concept Tags
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {memory.concept_tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

          {relatedMemories && relatedMemories.memories.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Related Memories ({relatedMemories.memories.length})
              </Typography>
              {relatedMemories.memories.map((relatedMemory) => (
                <Box key={relatedMemory.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2">
                    {relatedMemory.content.substring(0, 100)}...
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Box>
            <Typography variant="h6" gutterBottom>
              Metadata
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {memory.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created: {format(new Date(memory.created_at), 'PPpp')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Updated: {format(new Date(memory.updated_at), 'PPpp')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Version: {memory.version}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="sm"
      >
        <DialogTitle>Delete Memory?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this memory? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
            "{memory.content.substring(0, 100)}..."
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={isDeleting}
            variant="contained"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Memory5DCard;