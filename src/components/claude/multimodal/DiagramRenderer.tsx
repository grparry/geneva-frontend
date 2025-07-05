import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { DiagramMedia, DiagramType } from '../../../types/multimodal';

interface DiagramRendererProps {
  diagram: DiagramMedia;
  onFullscreen?: () => void;
  fullscreen?: boolean;
  maxHeight?: number | string;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  diagram,
  onFullscreen,
  fullscreen = false,
  maxHeight = 400
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [svgContent, setSvgContent] = useState<string | null>(null);

  // Mock Mermaid rendering (would integrate with real mermaid.js)
  const renderMermaidDiagram = async (source: string): Promise<string> => {
    // Simulate rendering delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock SVG generation based on diagram type
    const mockSvg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="380" height="280" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2" rx="5"/>
        <text x="200" y="40" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">
          ${diagram.title || 'Diagram'}
        </text>
        <text x="200" y="70" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">
          ${diagram.diagramType.toUpperCase()} Diagram
        </text>
        <rect x="50" y="100" width="100" height="60" fill="#007bff" stroke="#0056b3" rx="5"/>
        <text x="100" y="135" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
          Component A
        </text>
        <line x1="150" y1="130" x2="200" y2="130" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>
        <rect x="250" y="100" width="100" height="60" fill="#28a745" stroke="#1e7e34" rx="5"/>
        <text x="300" y="135" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
          Component B
        </text>
        <text x="200" y="200" text-anchor="middle" font-family="Arial" font-size="10" fill="#888">
          Source: ${source.substring(0, 50)}${source.length > 50 ? '...' : ''}
        </text>
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#333"/>
          </marker>
        </defs>
      </svg>
    `;
    
    return mockSvg;
  };

  useEffect(() => {
    const renderDiagram = async () => {
      if (diagram.renderedSvg) {
        setSvgContent(diagram.renderedSvg);
        return;
      }

      setIsRendering(true);
      setRenderError(null);

      try {
        let renderedSvg = '';
        
        switch (diagram.diagramType) {
          case DiagramType.MERMAID:
            renderedSvg = await renderMermaidDiagram(diagram.source);
            break;
          case DiagramType.PLANTUML:
          case DiagramType.GRAPHVIZ:
          case DiagramType.DRAWIO:
            // For demo purposes, use the same mock renderer
            renderedSvg = await renderMermaidDiagram(diagram.source);
            break;
          default:
            throw new Error(`Unsupported diagram type: ${diagram.diagramType}`);
        }
        
        setSvgContent(renderedSvg);
      } catch (error) {
        setRenderError(error instanceof Error ? error.message : 'Failed to render diagram');
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [diagram]);

  const handleDownload = () => {
    if (!svgContent) return;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram.title || 'diagram'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(diagram.source);
    } catch (error) {
      console.error('Failed to copy diagram source:', error);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleRefresh = () => {
    setSvgContent(null);
    setRenderError(null);
    // Re-trigger useEffect
    setIsRendering(true);
  };

  if (renderError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Failed to render diagram</Typography>
            <Typography variant="body2">{renderError}</Typography>
          </Alert>
          {diagram.title && (
            <Typography variant="h6" gutterBottom>
              {diagram.title}
            </Typography>
          )}
          <Chip label={diagram.diagramType} size="small" color="error" />
        </CardContent>
        <CardActions>
          <IconButton onClick={handleRefresh} title="Retry">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={handleCopySource} title="Copy source">
            <CopyIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {diagram.title && (
          <Typography variant="h6" gutterBottom>
            {diagram.title}
          </Typography>
        )}
        {diagram.description && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {diagram.description}
          </Typography>
        )}
        
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: fullscreen ? '80vh' : maxHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            minHeight: 200
          }}
        >
          {isRendering && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Rendering {diagram.diagramType} diagram...
              </Typography>
            </Box>
          )}
          
          {svgContent && !isRendering && (
            <Box
              sx={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s'
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
          
          {/* Zoom controls */}
          {svgContent && !fullscreen && (
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'background.paper',
                borderRadius: 1,
                p: 0.5
              }}
            >
              <Tooltip title="Zoom in">
                <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom out">
                <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography
                variant="caption"
                sx={{
                  alignSelf: 'center',
                  px: 1,
                  minWidth: 45,
                  textAlign: 'center'
                }}
              >
                {Math.round(zoom * 100)}%
              </Typography>
            </Stack>
          )}
        </Box>
        
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Chip label={diagram.diagramType} size="small" />
          <Chip label={`${diagram.source.split('\n').length} lines`} size="small" />
        </Stack>
      </CardContent>
      
      <CardActions>
        <IconButton onClick={handleDownload} title="Download SVG" disabled={!svgContent}>
          <DownloadIcon />
        </IconButton>
        <IconButton onClick={handleCopySource} title="Copy source">
          <CopyIcon />
        </IconButton>
        <IconButton onClick={handleRefresh} title="Refresh">
          <RefreshIcon />
        </IconButton>
        {onFullscreen && (
          <IconButton onClick={onFullscreen} title="View fullscreen">
            <FullscreenIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};