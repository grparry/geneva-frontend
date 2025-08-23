import React from 'react';
import { Chip, Tooltip, Box, Typography } from '@mui/material';
import { ACORNMessageType, getMessageTypeCategory, MESSAGE_TYPE_CATEGORIES } from '../../types/acorn-messages';

interface MessageTypeIndicatorProps {
  messageType: ACORNMessageType;
  size?: 'small' | 'medium';
  showCategory?: boolean;
  variant?: 'filled' | 'outlined';
}

export const MessageTypeIndicator: React.FC<MessageTypeIndicatorProps> = ({
  messageType,
  size = 'small',
  showCategory = false,
  variant = 'filled'
}) => {
  const category = getMessageTypeCategory(messageType);
  
  if (!category) {
    return (
      <Chip
        label={messageType.replace(/_/g, ' ')}
        size={size}
        variant={variant}
        sx={{ bgcolor: 'grey.500', color: 'white' }}
      />
    );
  }

  const displayName = messageType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());

  const tooltip = (
    <Box>
      <Typography variant="body2" fontWeight="bold">
        {category.icon} {category.name}
      </Typography>
      <Typography variant="caption" display="block">
        {displayName}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
        Priority: {category.priority}/10
      </Typography>
      {category.requiresResponse && (
        <Typography variant="caption" display="block" color="warning.main">
          Requires Response
        </Typography>
      )}
      {category.canTriggerWorkflows && (
        <Typography variant="caption" display="block" color="info.main">
          Can Trigger Workflows
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltip}>
      <Chip
        icon={showCategory ? <span>{category.icon}</span> : undefined}
        label={showCategory ? category.name : displayName}
        size={size}
        variant={variant}
        sx={{
          bgcolor: variant === 'filled' ? category.color : 'transparent',
          color: variant === 'filled' ? 'white' : category.color,
          borderColor: variant === 'outlined' ? category.color : undefined,
          fontWeight: 500,
          '& .MuiChip-icon': {
            color: variant === 'filled' ? 'white' : category.color
          }
        }}
      />
    </Tooltip>
  );
};