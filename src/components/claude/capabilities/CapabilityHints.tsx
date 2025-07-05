import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Fade,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import {
  CapabilityHint,
  ConfidenceLevel
} from '../../../types/capability';

interface CapabilityHintsProps {
  hints: CapabilityHint[];
  inputValue: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onHintSelect?: (hint: CapabilityHint) => void;
  maxHints?: number;
  showConfidence?: boolean;
}

const CONFIDENCE_CONFIG = {
  [ConfidenceLevel.HIGH]: {
    color: 'success' as const,
    icon: <CheckIcon fontSize="small" />,
    label: 'High'
  },
  [ConfidenceLevel.MEDIUM]: {
    color: 'warning' as const,
    icon: <WarningIcon fontSize="small" />,
    label: 'Medium'
  },
  [ConfidenceLevel.LOW]: {
    color: 'error' as const,
    icon: <ErrorIcon fontSize="small" />,
    label: 'Low'
  }
};

export const CapabilityHints: React.FC<CapabilityHintsProps> = ({
  hints,
  inputValue,
  inputRef,
  onHintSelect,
  maxHints = 5,
  showConfidence = true
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const hintsRef = useRef<HTMLDivElement>(null);

  const displayHints = hints.slice(0, maxHints);

  useEffect(() => {
    setVisible(displayHints.length > 0 && inputValue.length >= 3);
    setSelectedIndex(-1);
  }, [displayHints.length, inputValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible || displayHints.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < displayHints.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : displayHints.length - 1
          );
          break;
        case 'Enter':
          if (selectedIndex >= 0) {
            e.preventDefault();
            handleHintSelect(displayHints[selectedIndex]);
          }
          break;
        case 'Escape':
          setVisible(false);
          setSelectedIndex(-1);
          break;
      }
    };

    const inputElement = inputRef?.current;
    if (inputElement) {
      inputElement.addEventListener('keydown', handleKeyDown);
      return () => inputElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, displayHints, selectedIndex, inputRef]);

  const handleHintSelect = (hint: CapabilityHint) => {
    onHintSelect?.(hint);
    setVisible(false);
    setSelectedIndex(-1);
  };

  const getInputPosition = () => {
    if (!inputRef?.current) return { top: 0, left: 0, width: 300 };

    const rect = inputRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width
    };
  };

  const position = getInputPosition();

  if (!visible || displayHints.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 1300,
        pointerEvents: 'auto'
      }}
    >
      <Fade in={visible}>
        <Paper
          ref={hintsRef}
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            border: 1,
            borderColor: 'divider',
            boxShadow: 3
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 1,
            bgcolor: 'grey.50',
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Capability Suggestions
              </Typography>
            </Box>
            <Tooltip title="Close suggestions">
              <IconButton 
                size="small" 
                onClick={() => setVisible(false)}
                sx={{ p: 0.25 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <List dense sx={{ p: 0 }}>
            {displayHints.map((hint, index) => {
              const config = CONFIDENCE_CONFIG[hint.confidence];
              const isSelected = index === selectedIndex;

              return (
                <ListItem
                  key={hint.id}
                  button
                  selected={isSelected}
                  onClick={() => handleHintSelect(hint)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    },
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <PsychologyIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {hint.suggestion}
                        </Typography>
                        {showConfidence && (
                          <Chip
                            icon={config.icon}
                            label={config.label}
                            size="small"
                            color={config.color}
                            variant="outlined"
                            sx={{ 
                              height: 20,
                              '& .MuiChip-icon': { fontSize: 12 },
                              '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 }
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {hint.reason}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>

          <Box sx={{ 
            p: 1, 
            bgcolor: 'grey.50', 
            borderTop: 1, 
            borderColor: 'divider' 
          }}>
            <Typography variant="caption" color="text.secondary">
              Use ↑↓ to navigate, Enter to select, Esc to close
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};