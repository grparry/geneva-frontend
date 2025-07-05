import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Stack,
  Alert,
  LinearProgress,
  TextField,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ThumbUp as ThumbUpIcon
} from '@mui/icons-material';
import { ClarificationRequest, ClarificationOption, ClarificationUrgency } from '../../../types/clarification';

interface ClarificationDialogProps {
  request: ClarificationRequest | null;
  open: boolean;
  onClose: () => void;
  onRespond: (optionId: string, reasoning?: string, additionalContext?: Record<string, any>) => void;
}

const getUrgencyColor = (urgency: ClarificationUrgency) => {
  switch (urgency) {
    case ClarificationUrgency.CRITICAL: return 'error';
    case ClarificationUrgency.HIGH: return 'warning';
    case ClarificationUrgency.MEDIUM: return 'info';
    case ClarificationUrgency.LOW: return 'success';
    default: return 'default';
  }
};

const formatTimeRemaining = (expiresAt: string): { text: string; percentage: number } => {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const total = expires - new Date(expiresAt).getTime() + (300 * 1000); // Assume 5 min total
  const remaining = Math.max(0, expires - now);
  const percentage = (remaining / total) * 100;
  
  if (remaining === 0) return { text: 'Expired', percentage: 0 };
  
  const seconds = Math.floor(remaining / 1000);
  if (seconds < 60) return { text: `${seconds}s`, percentage };
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return { text: `${minutes}m ${remainingSeconds}s`, percentage };
};

export const ClarificationDialog: React.FC<ClarificationDialogProps> = ({
  request,
  open,
  onClose,
  onRespond
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({ text: '', percentage: 100 });

  // Update timer
  useEffect(() => {
    if (!request) return;

    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(request.expires_at));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [request]);

  // Reset state when request changes
  useEffect(() => {
    setSelectedOption(null);
    setReasoning('');
    setShowContext(false);
  }, [request]);

  if (!request) return null;

  const handleSubmit = () => {
    if (selectedOption) {
      onRespond(selectedOption, reasoning || undefined);
      onClose();
    }
  };

  const renderOption = (option: ClarificationOption) => {
    const isSelected = selectedOption === option.id;
    
    return (
      <Card
        key={option.id}
        variant={isSelected ? 'elevation' : 'outlined'}
        sx={{
          mb: 2,
          borderColor: isSelected ? 'primary.main' : 'divider',
          borderWidth: isSelected ? 2 : 1,
          transition: 'all 0.2s'
        }}
      >
        <CardActionArea onClick={() => setSelectedOption(option.id)}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {option.description}
              </Typography>
              {option.recommended && (
                <Chip
                  icon={<ThumbUpIcon />}
                  label="Recommended"
                  color="primary"
                  size="small"
                />
              )}
            </Box>
            
            {(option.pros || option.cons) && (
              <Box sx={{ mt: 2 }}>
                {option.pros && option.pros.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      Pros:
                    </Typography>
                    <List dense disablePadding>
                      {option.pros.map((pro, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={pro} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {option.cons && option.cons.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                      Cons:
                    </Typography>
                    <List dense disablePadding>
                      {option.cons.map((con, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CancelIcon color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={con} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Claude Needs Your Input
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<TimerIcon />}
              label={timeRemaining.text}
              color={timeRemaining.percentage < 20 ? 'error' : 'default'}
              size="small"
            />
            <Chip
              label={request.urgency}
              color={getUrgencyColor(request.urgency)}
              size="small"
            />
          </Stack>
        </Box>
        <LinearProgress
          variant="determinate"
          value={timeRemaining.percentage}
          sx={{ mt: 1 }}
          color={timeRemaining.percentage < 20 ? 'error' : 'primary'}
        />
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {request.question}
          </Typography>
        </Alert>
        
        {request.context && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                mb: 1
              }}
              onClick={() => setShowContext(!showContext)}
            >
              <IconButton size="small">
                {showContext ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <Typography variant="subtitle2" color="text.secondary">
                Additional Context
              </Typography>
            </Box>
            <Collapse in={showContext}>
              <Box sx={{ pl: 4, pr: 2 }}>
                {request.context.current_implementation && (
                  <Typography variant="body2" paragraph>
                    <strong>Current Implementation:</strong> {request.context.current_implementation}
                  </Typography>
                )}
                {request.context.constraints && (
                  <Typography variant="body2" paragraph>
                    <strong>Constraints:</strong> {JSON.stringify(request.context.constraints, null, 2)}
                  </Typography>
                )}
                {request.context.related_files && request.context.related_files.length > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      Related Files:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      {request.context.related_files.map((file) => (
                        <Chip key={file} label={file} size="small" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        )}
        
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Select an option:
        </Typography>
        
        <Box>
          {request.options.map(renderOption)}
        </Box>
        
        {selectedOption && (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional reasoning or context (optional)"
              placeholder="Explain your choice or provide additional information..."
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              variant="outlined"
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Skip (Use Default)
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedOption}
        >
          Submit Choice
        </Button>
      </DialogActions>
    </Dialog>
  );
};