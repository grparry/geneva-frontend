import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Api as ApiIcon
} from '@mui/icons-material';
import { APISpecMedia } from '../../../types/multimodal';

interface APISpecViewerProps {
  spec: APISpecMedia;
}

export const APISpecViewer: React.FC<APISpecViewerProps> = ({ spec }) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleDownload = () => {
    const blob = new Blob([spec.content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spec.title || 'api-spec'}.${spec.format === 'openapi' ? 'json' : spec.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(spec.content);
    } catch (error) {
      console.error('Failed to copy API spec:', error);
    }
  };

  // Parse API spec for display
  let parsedSpec: any = null;
  let parseError: string | null = null;

  try {
    parsedSpec = JSON.parse(spec.content);
  } catch (error) {
    parseError = 'Invalid JSON format';
  }

  const renderOpenAPIInfo = (specData: any) => {
    if (!specData || !specData.info) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">{specData.info.title}</Typography>
        {specData.info.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {specData.info.description}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <Chip label={`v${specData.info.version}`} size="small" />
          {specData.servers && specData.servers.length > 0 && (
            <Chip label={specData.servers[0].url} size="small" />
          )}
        </Stack>
      </Box>
    );
  };

  const renderPaths = (paths: any) => {
    if (!paths) return null;

    return Object.entries(paths).map(([path, methods]: [string, any]) => (
      <Accordion
        key={path}
        expanded={expanded === `path-${path}`}
        onChange={handleAccordionChange(`path-${path}`)}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
            {path}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {Object.entries(methods).map(([method, details]: [string, any]) => (
              <Box key={method} sx={{ pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    label={method.toUpperCase()}
                    size="small"
                    color={method === 'get' ? 'primary' : method === 'post' ? 'success' : 'default'}
                  />
                  {details.summary && (
                    <Typography variant="body2">{details.summary}</Typography>
                  )}
                </Stack>
                {details.description && (
                  <Typography variant="caption" color="text.secondary">
                    {details.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
    ));
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ApiIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            {spec.title || 'API Specification'}
          </Typography>
        </Box>

        {spec.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {spec.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={spec.format.toUpperCase()} size="small" color="primary" />
          {spec.version && <Chip label={spec.version} size="small" />}
        </Stack>

        {parseError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseError}
          </Alert>
        ) : (
          <Box>
            {parsedSpec && (
              <>
                {renderOpenAPIInfo(parsedSpec)}
                
                {parsedSpec.paths && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Endpoints ({Object.keys(parsedSpec.paths).length})
                    </Typography>
                    {renderPaths(parsedSpec.paths)}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </CardContent>

      <CardActions>
        <IconButton onClick={handleDownload} title="Download">
          <DownloadIcon />
        </IconButton>
        <IconButton onClick={handleCopy} title="Copy to clipboard">
          <CopyIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};