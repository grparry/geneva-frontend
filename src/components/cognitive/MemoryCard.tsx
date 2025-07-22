/**
 * Memory Card Component
 * Displays individual cognitive memory with metadata and actions
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Collapse,
  Badge,
  Avatar,
  Stack,
  Button,
  Menu,
  MenuItem,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Star,
  StarBorder,
  Security,
  Psychology,
  Timeline,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Share,
  BookmarkBorder,
  Bookmark,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import type { 
  CognitiveMemory, 
  MemoryCardProps,
  CognitiveTier,
  SecurityRiskLevel,
} from '../../types/cognitive';
import { 
  TIER_DEFINITIONS,
  SECURITY_RISK_DEFINITIONS,
  getRiskLevel,
  getRiskColor,
  getTierColor,
  formatRiskScore,
  formatImportance,
} from '../../types/cognitive';

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  selected = false,
  onSelect,
  showFullContent = false,
  showMetadata = true,
  compact = false,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(showFullContent);
  const [bookmarked, setBookmarked] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const riskLevel = getRiskLevel(memory.risk_score || 0);
  const riskColor = getRiskColor(memory.risk_score || 0);
  const tierColor = getTierColor(memory.tier || 1);
  const tierDefinition = TIER_DEFINITIONS[memory.tier || 1];
  const riskDefinition = SECURITY_RISK_DEFINITIONS[riskLevel];

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(memory);
    }
  };

  const handleExpandClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setExpanded(!expanded);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleBookmarkToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setBookmarked(!bookmarked);
  };

  const content = memory.content || '';
  const truncatedContent = content.length > 200 
    ? `${content.substring(0, 200)}...`
    : content;

  const displayContent = expanded ? content : truncatedContent;
  const shouldShowExpandButton = content.length > 200 && !showFullContent;

  return (
    <Card
      sx={{
        cursor: onSelect ? 'pointer' : 'default',
        borderLeft: `4px solid ${tierColor}`,
        borderRadius: 2,
        mb: 2,
        transition: 'all 0.2s ease-in-out',
        ...(selected && {
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderColor: theme.palette.primary.main,
        }),
        '&:hover': onSelect ? {
          bgcolor: alpha(theme.palette.action.hover, 0.04),
          transform: 'translateY(-1px)',
          boxShadow: theme.shadows[4],
        } : {},
        ...(compact && {
          '& .MuiCardContent-root': {
            pb: 1,
          },
        }),
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ pb: compact ? 1 : 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          {/* Tier Avatar */}
          <Avatar
            sx={{
              bgcolor: tierColor,
              color: theme.palette.text.primary,
              width: 32,
              height: 32,
              fontSize: '0.875rem',
              mr: 1,
            }}
          >
            {tierDefinition.icon}
          </Avatar>

          {/* Title and Metadata */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.text.primary,
                  flex: 1,
                  minWidth: 0,
                }}
                noWrap
              >
                {(memory.memory_type || 'Unknown').toUpperCase()} Memory
              </Typography>
              
              <Chip
                label={`Tier ${memory.tier || 1}`}
                size="small"
                sx={{
                  bgcolor: tierColor,
                  color: theme.palette.text.primary,
                  fontSize: '0.75rem',
                  height: 20,
                }}
              />
            </Box>

            {/* Risk and Importance */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={`Risk Score: ${formatRiskScore(memory.risk_score || 0)} (${riskDefinition?.name || 'Unknown'})`}>
                <Chip
                  icon={<Security />}
                  label={formatRiskScore(memory.risk_score || 0)}
                  size="small"
                  sx={{
                    bgcolor: alpha(riskColor, 0.1),
                    color: riskColor,
                    fontSize: '0.75rem',
                    height: 20,
                  }}
                />
              </Tooltip>
              
              <Tooltip title={`Importance: ${formatImportance(memory.importance || 0)}`}>
                <Chip
                  icon={<Psychology />}
                  label={formatImportance(memory.importance || 0)}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.75rem',
                    height: 20,
                  }}
                />
              </Tooltip>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
            <IconButton
              size="small"
              onClick={handleBookmarkToggle}
              sx={{ color: bookmarked ? 'warning.main' : 'action.secondary' }}
            >
              {bookmarked ? <Bookmark /> : <BookmarkBorder />}
            </IconButton>
            
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ color: 'action.secondary' }}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            mb: 1,
            lineHeight: 1.4,
          }}
        >
          {displayContent}
        </Typography>

        {/* Concepts */}
        {memory.concepts && memory.concepts.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {memory.concepts.slice(0, expanded ? memory.concepts.length : 5).map((concept) => (
              <Chip
                key={concept}
                label={concept}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: 18,
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            ))}
            {!expanded && memory.concepts && memory.concepts.length > 5 && (
              <Chip
                label={`+${memory.concepts.length - 5} more`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: 18,
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            )}
          </Box>
        )}

        {/* Metadata */}
        {showMetadata && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Created {memory.created_at ? formatDistanceToNow(new Date(memory.created_at)) : 'Unknown'} ago
            </Typography>
            
            <Chip
              label={memory.status || 'Unknown'}
              size="small"
              color={memory.status === 'processed' ? 'success' : 'default'}
              sx={{
                fontSize: '0.7rem',
                height: 16,
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
            
            <Typography variant="caption" color="text.secondary">
              ID: {memory.id ? memory.id.slice(-8) : 'Unknown'}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Expand/Collapse Button */}
      {shouldShowExpandButton && (
        <CardActions sx={{ pt: 0, pb: 1 }}>
          <Button
            size="small"
            onClick={handleExpandClick}
            startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            sx={{ ml: 'auto' }}
          >
            {expanded ? 'Show Less' : 'Show More'}
          </Button>
        </CardActions>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 160,
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit Memory
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Share sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem onClick={handleMenuClose} divider>
          <Timeline sx={{ mr: 1 }} />
          View Related
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default MemoryCard;