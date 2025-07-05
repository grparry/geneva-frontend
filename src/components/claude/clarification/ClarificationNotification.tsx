import React from 'react';
import { Badge, Avatar, Tooltip, Box, keyframes } from '@mui/material';
import { QuestionMark as QuestionIcon } from '@mui/icons-material';
import { ClarificationUrgency } from '../../../types/clarification';

interface ClarificationNotificationProps {
  count: number;
  urgency?: ClarificationUrgency;
  agentAvatar?: React.ReactNode;
  agentColor?: string;
  onClick?: () => void;
}

// Pulse animation for urgent clarifications
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Shake animation for critical clarifications
const shake = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px);
  }
`;

const getBadgeColor = (urgency?: ClarificationUrgency) => {
  switch (urgency) {
    case ClarificationUrgency.CRITICAL: return 'error';
    case ClarificationUrgency.HIGH: return 'warning';
    case ClarificationUrgency.MEDIUM: return 'info';
    case ClarificationUrgency.LOW: return 'success';
    default: return 'primary';
  }
};

const getAnimation = (urgency?: ClarificationUrgency) => {
  switch (urgency) {
    case ClarificationUrgency.CRITICAL:
      return `${shake} 0.5s ease-in-out infinite`;
    case ClarificationUrgency.HIGH:
      return `${pulse} 1.5s ease-in-out infinite`;
    default:
      return 'none';
  }
};

export const ClarificationNotification: React.FC<ClarificationNotificationProps> = ({
  count,
  urgency,
  agentAvatar,
  agentColor,
  onClick
}) => {
  if (count === 0) {
    return <>{agentAvatar}</>;
  }

  const badgeContent = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: 'background.paper',
        animation: getAnimation(urgency)
      }}
    >
      <QuestionIcon sx={{ fontSize: 14 }} />
    </Box>
  );

  const tooltipTitle = urgency === ClarificationUrgency.CRITICAL
    ? 'Critical clarification needed!'
    : urgency === ClarificationUrgency.HIGH
    ? 'Urgent clarification needed'
    : 'Clarification needed';

  return (
    <Tooltip title={tooltipTitle} arrow>
      <Box
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          display: 'inline-flex'
        }}
      >
        <Badge
          badgeContent={badgeContent}
          color={getBadgeColor(urgency)}
          overlap="circular"
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          {agentAvatar || (
            <Avatar sx={{ bgcolor: agentColor || 'primary.main' }}>
              <QuestionIcon />
            </Avatar>
          )}
        </Badge>
      </Box>
    </Tooltip>
  );
};

// Standalone notification indicator for use in lists
export const ClarificationIndicator: React.FC<{
  urgency?: ClarificationUrgency;
  size?: 'small' | 'medium';
}> = ({ urgency, size = 'medium' }) => {
  const iconSize = size === 'small' ? 16 : 20;
  
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: iconSize + 4,
        height: iconSize + 4,
        borderRadius: '50%',
        backgroundColor: `${getBadgeColor(urgency)}.main`,
        color: 'white',
        animation: getAnimation(urgency)
      }}
    >
      <QuestionIcon sx={{ fontSize: iconSize }} />
    </Box>
  );
};