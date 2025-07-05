import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { DocumentMedia } from '../../../types/multimodal';

interface DocumentViewerProps {
  document: DocumentMedia;
  maxHeight?: number | string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  maxHeight = 400
}) => {
  const handleDownload = () => {
    const blob = new Blob([document.content], {
      type: document.mimeType || 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.title || 'document'}.${getFileExtension(document.format)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(document.content);
    } catch (error) {
      console.error('Failed to copy document:', error);
    }
  };

  const getFileExtension = (format: string) => {
    switch (format) {
      case 'markdown': return 'md';
      case 'html': return 'html';
      case 'text': return 'txt';
      case 'pdf': return 'pdf';
      default: return 'txt';
    }
  };

  const renderContent = () => {
    switch (document.format) {
      case 'markdown':
        // Simple markdown rendering (would use a proper markdown library in production)
        return (
          <Box
            sx={{
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              '& h1, & h2, & h3': { fontWeight: 'bold', mt: 2, mb: 1 },
              '& p': { mb: 1 },
              '& code': { bgcolor: 'grey.100', p: 0.5, borderRadius: 0.5 }
            }}
          >
            {document.content}
          </Box>
        );
      case 'html':
        return (
          <Box
            dangerouslySetInnerHTML={{ __html: document.content }}
            sx={{ '& *': { maxWidth: '100%' } }}
          />
        );
      case 'text':
      default:
        return (
          <Typography
            component="pre"
            sx={{
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {document.content}
          </Typography>
        );
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            {document.title || 'Document'}
          </Typography>
        </Box>

        {document.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {document.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={document.format.toUpperCase()} size="small" color="primary" />
          <Chip
            label={`${document.content.length} chars`}
            size="small"
          />
          <Chip
            label={`${document.content.split('\n').length} lines`}
            size="small"
          />
        </Stack>

        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            maxHeight,
            overflow: 'auto',
            bgcolor: 'background.default'
          }}
        >
          {renderContent()}
        </Box>
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