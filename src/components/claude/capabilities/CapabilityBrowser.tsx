import React, { useState, useMemo } from 'react';
import {
  Box,
  Drawer,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Paper,
  Badge,
  Divider,
  Button,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Psychology as PsychologyIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Architecture as ArchitectureIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import {
  CapabilitySpec,
  CapabilityCategory,
  ConfidenceLevel,
  TaskComplexity,
  CapabilityFilter
} from '../../../types/capability';

interface CapabilityBrowserProps {
  open: boolean;
  onClose: () => void;
  capabilities: CapabilitySpec[];
  onCapabilitySelect?: (capability: CapabilitySpec) => void;
}

const CATEGORY_ICONS: Record<CapabilityCategory, React.ReactElement> = {
  [CapabilityCategory.CODE_GENERATION]: <CodeIcon />,
  [CapabilityCategory.CODE_ANALYSIS]: <AssessmentIcon />,
  [CapabilityCategory.DEBUGGING]: <BugIcon />,
  [CapabilityCategory.TESTING]: <SpeedIcon />,
  [CapabilityCategory.DOCUMENTATION]: <PsychologyIcon />,
  [CapabilityCategory.REFACTORING]: <CodeIcon />,
  [CapabilityCategory.API_DESIGN]: <ArchitectureIcon />,
  [CapabilityCategory.ARCHITECTURE]: <ArchitectureIcon />,
  [CapabilityCategory.DEPLOYMENT]: <SpeedIcon />,
  [CapabilityCategory.SECURITY]: <SecurityIcon />,
  [CapabilityCategory.DATABASE]: <AssessmentIcon />,
  [CapabilityCategory.FRONTEND]: <CodeIcon />,
  [CapabilityCategory.BACKEND]: <CodeIcon />,
  [CapabilityCategory.DEVOPS]: <SpeedIcon />,
  [CapabilityCategory.DATA_ANALYSIS]: <AssessmentIcon />
};

const CONFIDENCE_COLORS = {
  [ConfidenceLevel.HIGH]: 'success',
  [ConfidenceLevel.MEDIUM]: 'warning',
  [ConfidenceLevel.LOW]: 'error'
} as const;

const COMPLEXITY_COLORS = {
  [TaskComplexity.SIMPLE]: 'success',
  [TaskComplexity.MODERATE]: 'info',
  [TaskComplexity.COMPLEX]: 'warning',
  [TaskComplexity.EXPERT]: 'error'
} as const;

export const CapabilityBrowser: React.FC<CapabilityBrowserProps> = ({
  open,
  onClose,
  capabilities,
  onCapabilitySelect
}) => {
  const [filter, setFilter] = useState<CapabilityFilter>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredCapabilities = useMemo(() => {
    return capabilities.filter(capability => {
      if (filter.categories && filter.categories.length > 0 && !filter.categories.includes(capability.category)) {
        return false;
      }
      if (filter.confidence && filter.confidence.length > 0 && !filter.confidence.includes(capability.confidence)) {
        return false;
      }
      if (filter.complexity && filter.complexity.length > 0 && !filter.complexity.includes(capability.complexity)) {
        return false;
      }
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        return (
          capability.name.toLowerCase().includes(searchLower) ||
          capability.description.toLowerCase().includes(searchLower) ||
          capability.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [capabilities, filter]);

  const groupedCapabilities = useMemo(() => {
    const groups: Record<CapabilityCategory, CapabilitySpec[]> = {} as any;
    filteredCapabilities.forEach(capability => {
      if (!groups[capability.category]) {
        groups[capability.category] = [];
      }
      groups[capability.category].push(capability);
    });
    return groups;
  }, [filteredCapabilities]);

  const handleCategoryChange = (category: CapabilityCategory) => {
    setFilter(prev => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...(prev.categories || []), category]
    }));
  };

  const clearFilters = () => {
    setFilter({});
  };

  const renderCapabilityCard = (capability: CapabilitySpec) => (
    <Paper
      key={capability.id}
      sx={{
        p: 2,
        mb: 1,
        cursor: onCapabilitySelect ? 'pointer' : 'default',
        '&:hover': onCapabilitySelect ? {
          bgcolor: 'action.hover'
        } : {}
      }}
      onClick={() => onCapabilitySelect?.(capability)}
    >
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {capability.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip
              size="small"
              label={capability.confidence}
              color={CONFIDENCE_COLORS[capability.confidence]}
              variant="outlined"
            />
            <Chip
              size="small"
              label={capability.complexity}
              color={COMPLEXITY_COLORS[capability.complexity]}
              variant="outlined"
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          {capability.description}
        </Typography>

        {capability.estimatedTime && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {capability.estimatedTime.simple} - {capability.estimatedTime.complex}
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {capability.tags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Stack>

        {capability.examples.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Examples:
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              • {capability.examples[0]}
              {capability.examples.length > 1 && ` (+${capability.examples.length - 1} more)`}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 450,
          p: 0
        }
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Claude Capabilities
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <TextField
          fullWidth
          placeholder="Search capabilities..."
          value={filter.searchTerm || ''}
          onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          size="small"
        />

        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Confidence</InputLabel>
            <Select
              multiple
              value={filter.confidence || []}
              onChange={(e) => setFilter(prev => ({ ...prev, confidence: e.target.value as ConfidenceLevel[] }))}
              label="Confidence"
            >
              {Object.values(ConfidenceLevel).map(level => (
                <MenuItem key={level} value={level}>{level}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Complexity</InputLabel>
            <Select
              multiple
              value={filter.complexity || []}
              onChange={(e) => setFilter(prev => ({ ...prev, complexity: e.target.value as TaskComplexity[] }))}
              label="Complexity"
            >
              {Object.values(TaskComplexity).map(level => (
                <MenuItem key={level} value={level}>{level}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            size="small"
            onClick={clearFilters}
            disabled={Object.keys(filter).length === 0}
          >
            Clear
          </Button>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Found {filteredCapabilities.length} capabilities
        </Typography>

        {Object.entries(groupedCapabilities).map(([category, categoryCapabilities]) => (
          <Accordion
            key={category}
            expanded={expandedCategory === category}
            onChange={(_, isExpanded) => setExpandedCategory(isExpanded ? category : null)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {CATEGORY_ICONS[category as CapabilityCategory]}
                <Typography sx={{ fontWeight: 600 }}>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
                <Badge badgeContent={categoryCapabilities.length} color="primary" />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Box sx={{ p: 2 }}>
                {categoryCapabilities.map(renderCapabilityCard)}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {filteredCapabilities.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No capabilities match your current filters
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Capabilities represent Claude's current skills and confidence levels. 
          Use these to understand what tasks are feasible and how long they might take.
        </Typography>
      </Box>
    </Drawer>
  );
};