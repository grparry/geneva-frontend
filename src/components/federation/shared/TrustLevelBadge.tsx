/**
 * Trust Level Badge Component
 * 
 * Visual indicator for federation trust levels with consistent styling.
 */

import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import { 
  SecurityOutlined,
  VerifiedUserOutlined,
  ShieldOutlined,
  GppGoodOutlined,
  GppMaybeOutlined,
} from '@mui/icons-material';
import { TrustLevel } from '../../../types/federation';

interface TrustLevelBadgeProps {
  level: TrustLevel;
  size?: 'small' | 'medium';
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'filled' | 'outlined';
  interactive?: boolean;
  onClick?: () => void;
}

export const TrustLevelBadge: React.FC<TrustLevelBadgeProps> = ({
  level,
  size = 'small',
  showIcon = true,
  showLabel = true,
  variant = 'filled',
  interactive = false,
  onClick,
}) => {
  const getTrustConfig = (trustLevel: TrustLevel) => {
    switch (trustLevel) {
      case TrustLevel.NONE:
        return {
          color: 'default' as const,
          backgroundColor: '#f5f5f5',
          textColor: '#666',
          icon: <GppMaybeOutlined />,
          label: 'None',
          description: 'No trust established',
        };
      case TrustLevel.BASIC:
        return {
          color: 'warning' as const,
          backgroundColor: '#fff3e0',
          textColor: '#f57c00',
          icon: <SecurityOutlined />,
          label: 'Basic',
          description: 'Basic trust level - limited operations',
        };
      case TrustLevel.VERIFIED:
        return {
          color: 'info' as const,
          backgroundColor: '#e3f2fd',
          textColor: '#1976d2',
          icon: <VerifiedUserOutlined />,
          label: 'Verified',
          description: 'Identity verified - standard operations',
        };
      case TrustLevel.TRUSTED:
        return {
          color: 'primary' as const,
          backgroundColor: '#e8f5e8',
          textColor: '#2e7d32',
          icon: <ShieldOutlined />,
          label: 'Trusted',
          description: 'Highly trusted - most operations allowed',
        };
      case TrustLevel.FULL:
        return {
          color: 'success' as const,
          backgroundColor: '#e8f5e8',
          textColor: '#2e7d32',
          icon: <GppGoodOutlined />,
          label: 'Full',
          description: 'Full trust - all operations allowed',
        };
      default:
        return {
          color: 'default' as const,
          backgroundColor: '#f5f5f5',
          textColor: '#666',
          icon: <GppMaybeOutlined />,
          label: 'Unknown',
          description: 'Unknown trust level',
        };
    }
  };

  const config = getTrustConfig(level);
  
  const chipContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {showIcon && React.cloneElement(config.icon, { 
        sx: { fontSize: size === 'small' ? 16 : 18 } 
      })}
      {showLabel && config.label}
    </Box>
  );

  const chipElement = (
    <Chip
      label={chipContent}
      color={config.color}
      size={size}
      variant={variant}
      clickable={interactive}
      onClick={onClick}
      sx={{
        ...(variant === 'filled' && {
          backgroundColor: config.backgroundColor,
          color: config.textColor,
          '& .MuiChip-label': {
            color: config.textColor,
          },
        }),
        ...(interactive && {
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
          },
        }),
      }}
    />
  );

  if (showLabel) {
    return (
      <Tooltip title={config.description} arrow>
        {chipElement}
      </Tooltip>
    );
  }

  return chipElement;
};

export default TrustLevelBadge;