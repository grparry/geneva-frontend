/**
 * DimensionFilter Component
 * Interactive filter component for each of the 5 memory dimensions
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

import type {
  Memory5DFilters,
  DimensionFilterProps,
  COGNITIVE_TYPE_DEFINITIONS,
  TEMPORAL_TIER_DEFINITIONS,
  ORGANIZATIONAL_SCOPE_DEFINITIONS,
  SECURITY_CLASSIFICATION_DEFINITIONS,
  ONTOLOGICAL_SCHEMA_DEFINITIONS,
  getDimensionColor,
  getDimensionIcon,
  formatDimensionValue,
} from '../../types/memory5d';

import { useGetDimensionalStatsQuery } from '../../services/memory5d/api';

const DimensionFilter: React.FC<DimensionFilterProps> = ({
  dimension,
  selectedValues,
  onSelectionChange,
  showCounts = true,
  maxSelections,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Get dimensional stats for counts
  const { data: dimensionalStats } = useGetDimensionalStatsQuery({
    time_range: '30d',
    include_trends: false,
  }, {
    skip: !showCounts,
  });

  // Get available values for this dimension
  const getAvailableValues = () => {
    switch (dimension) {
      case 'cognitive_type':
        return Object.keys(COGNITIVE_TYPE_DEFINITIONS);
      case 'temporal_tier':
        return Object.keys(TEMPORAL_TIER_DEFINITIONS);
      case 'organizational_scope':
        return Object.keys(ORGANIZATIONAL_SCOPE_DEFINITIONS);
      case 'security_classification':
        return Object.keys(SECURITY_CLASSIFICATION_DEFINITIONS);
      case 'ontological_schema':
        return Object.keys(ONTOLOGICAL_SCHEMA_DEFINITIONS);
      default:
        return [];
    }
  };

  const availableValues = getAvailableValues();

  // Get display information for the dimension
  const getDimensionDisplayInfo = () => {
    switch (dimension) {
      case 'cognitive_type':
        return {
          title: 'Cognitive Type',
          description: 'What kind of mental process produced this memory',
          icon: '🧠'
        };
      case 'temporal_tier':
        return {
          title: 'Temporal Tier',
          description: 'When/how this memory should be consolidated',
          icon: '⏰'
        };
      case 'organizational_scope':
        return {
          title: 'Organizational Scope',
          description: 'Who/what organizational level this affects',
          icon: '🏢'
        };
      case 'security_classification':
        return {
          title: 'Security Classification',
          description: 'How sensitive this information is',
          icon: '🔒'
        };
      case 'ontological_schema':
        return {
          title: 'Ontological Schema',
          description: 'What domain knowledge structure this represents',
          icon: '📚'
        };
      default:
        return { title: dimension, description: '', icon: '❓' };
    }
  };

  const displayInfo = getDimensionDisplayInfo();

  const getValueCount = (value: string): number => {
    if (!dimensionalStats || !showCounts) return 0;
    const dimensionData = dimensionalStats[dimension as keyof typeof dimensionalStats];
    return (dimensionData as any)?.[value]?.count || 0;
  };

  const handleValueToggle = (value: string) => {
    let newSelection: string[];

    if (selectedValues.includes(value)) {
      // Remove from selection
      newSelection = selectedValues.filter(v => v !== value);
    } else {
      // Add to selection (respect maxSelections)
      if (maxSelections && selectedValues.length >= maxSelections) {
        // Replace the first selected value
        newSelection = [...selectedValues.slice(1), value];
      } else {
        newSelection = [...selectedValues, value];
      }
    }

    onSelectionChange(newSelection);
  };

  const clearAllSelections = () => {
    onSelectionChange([]);
  };

  const selectAllValues = () => {
    const valuesToSelect = maxSelections
      ? availableValues.slice(0, maxSelections)
      : availableValues;
    onSelectionChange(valuesToSelect);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Accordion
        expanded={expanded}
        onChange={(_, isExpanded) => setExpanded(isExpanded)}
        sx={{
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: selectedValues.length > 0 ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
            minHeight: 48,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
            },
          }}
        >
          <Box display="flex" alignItems="center" width="100%">
            <Typography variant="body1" sx={{ mr: 1 }}>
              {displayInfo.icon}
            </Typography>
            <Box flexGrow={1}>
              <Typography variant="subtitle2" fontWeight="medium">
                {displayInfo.title}
              </Typography>
              {selectedValues.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {selectedValues.length} selected
                </Typography>
              )}
            </Box>
            {selectedValues.length > 0 && (
              <Badge
                badgeContent={selectedValues.length}
                color="primary"
                sx={{ mr: 1 }}
              />
            )}
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ pt: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            {displayInfo.description}
          </Typography>

          {/* Action buttons */}
          <Box display="flex" gap={1} mb={2}>
            <Button
              size="small"
              variant="outlined"
              onClick={selectAllValues}
              disabled={availableValues.length === 0}
            >
              Select {maxSelections ? `${Math.min(maxSelections, availableValues.length)}` : 'All'}
            </Button>
            {selectedValues.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                onClick={clearAllSelections}
                startIcon={<ClearIcon />}
              >
                Clear
              </Button>
            )}
          </Box>

          {/* Value selection */}
          <FormGroup>
            {availableValues.map((value) => {
              const count = getValueCount(value);
              const isSelected = selectedValues.includes(value);
              const isDisabled = maxSelections && !isSelected && selectedValues.length >= maxSelections;

              return (
                <Box key={value} sx={{ mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleValueToggle(value)}
                        disabled={isDisabled}
                        size="small"
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" width="100%">
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {getDimensionIcon(dimension, value)}
                        </Typography>
                        <Box flexGrow={1}>
                          <Typography variant="body2">
                            {formatDimensionValue(dimension, value)}
                          </Typography>
                        </Box>
                        {showCounts && count > 0 && (
                          <Chip
                            label={count.toLocaleString()}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              backgroundColor: getDimensionColor(dimension, value),
                            }}
                          />
                        )}
                      </Box>
                    }
                    sx={{
                      width: '100%',
                      m: 0,
                      opacity: isDisabled ? 0.5 : 1,
                      '& .MuiFormControlLabel-label': {
                        width: '100%',
                      },
                    }}
                  />

                  {/* Selected indicator */}
                  {isSelected && (
                    <Box
                      sx={{
                        ml: 4,
                        height: 2,
                        backgroundColor: getDimensionColor(dimension, value),
                        borderRadius: 1,
                        opacity: 0.8,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </FormGroup>

          {/* Selection limit warning */}
          {maxSelections && selectedValues.length >= maxSelections && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              Maximum {maxSelections} selections allowed. Select a different value to replace an existing selection.
            </Typography>
          )}

          {/* Help text */}
          {selectedValues.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Select one or more {displayInfo.title.toLowerCase()} values to filter memories.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default DimensionFilter;