import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  IconButton, 
  Fade, 
  CircularProgress,
  Collapse
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { IntermediateStatus } from '../../hooks/useACORNMessages';
import { getMessageTypeCategory } from '../../types/acorn-messages';

interface IntermediateStatusDisplayProps {
  statuses: IntermediateStatus[];
  onRemoveStatus?: (statusId: string) => void;
  maxVisible?: number;
  showTimestamp?: boolean;
}

interface StatusItemProps {
  status: IntermediateStatus;
  onRemove?: (statusId: string) => void;
  showTimestamp?: boolean;
}

const StatusItem: React.FC<StatusItemProps> = ({ 
  status, 
  onRemove, 
  showTimestamp = false 
}) => {
  const handleRemove = () => {
    onRemove?.(status.id);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Fade in={status.isActive} timeout={300}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 1,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'primary.light',
          borderLeft: '4px solid',
          borderLeftColor: 'primary.main',
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: 'action.selected',
            borderLeftColor: 'primary.dark'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Agent Avatar or Operation Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 40 }}>
            {status.agentAvatar ? (
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  fontSize: '1rem',
                  bgcolor: 'primary.main'
                }}
              >
                {status.agentAvatar}
              </Avatar>
            ) : (
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CircularProgress size={16} thickness={4} />
              </Box>
            )}
          </Box>

          {/* Status Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                wordBreak: 'break-word'
              }}
            >
              {status.message}
            </Typography>
            
            {(status.agentName || status.operationType || showTimestamp) && (
              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                {status.agentName && (
                  <Typography variant="caption" color="text.secondary">
                    {status.agentName}
                  </Typography>
                )}
                
                {status.operationType && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: '0.625rem'
                    }}
                  >
                    {status.operationType}
                  </Typography>
                )}
                
                {showTimestamp && (
                  <Typography variant="caption" color="text.disabled">
                    {formatTime(status.timestamp)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Close Button */}
          {onRemove && (
            <IconButton
              size="small"
              onClick={handleRemove}
              sx={{
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                  bgcolor: 'action.hover'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

export const IntermediateStatusDisplay: React.FC<IntermediateStatusDisplayProps> = ({
  statuses,
  onRemoveStatus,
  maxVisible = 5,
  showTimestamp = false
}) => {
  const visibleStatuses = statuses.slice(0, maxVisible);
  const hiddenCount = Math.max(0, statuses.length - maxVisible);

  if (statuses.length === 0) {
    return null;
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Hidden count indicator */}
      {hiddenCount > 0 && (
        <Paper
          sx={{
            p: 1,
            mb: 1,
            textAlign: 'center',
            bgcolor: 'action.hover',
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            +{hiddenCount} more status update{hiddenCount !== 1 ? 's' : ''} (showing recent {maxVisible})
          </Typography>
        </Paper>
      )}

      {/* Visible statuses */}
      <Collapse in={visibleStatuses.length > 0}>
        <Box>
          {visibleStatuses.map((status) => (
            <StatusItem
              key={status.id}
              status={status}
              onRemove={onRemoveStatus}
              showTimestamp={showTimestamp}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};