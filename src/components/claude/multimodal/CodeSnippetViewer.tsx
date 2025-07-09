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
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Code as CodeIcon,
  Visibility as ViewIcon,
  VisibilityOff as ViewOffIcon
} from '@mui/icons-material';
import { CodeSnippetMedia } from '../../../types/multimodal';

interface CodeSnippetViewerProps {
  snippet: CodeSnippetMedia;
  maxHeight?: number | string;
}

export const CodeSnippetViewer: React.FC<CodeSnippetViewerProps> = ({
  snippet,
  maxHeight = 400
}) => {
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const handleDownload = () => {
    const blob = new Blob([snippet.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = snippet.filename || `snippet.${getFileExtension(snippet.language)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const getFileExtension = (language: string) => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt',
      scala: 'scala',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yml',
      markdown: 'md',
      shell: 'sh',
      bash: 'sh',
      sql: 'sql'
    };
    return extensions[language.toLowerCase()] || 'txt';
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#ed8b00',
      cpp: '#00599c',
      csharp: '#239120',
      php: '#777bb4',
      ruby: '#cc342d',
      go: '#00add8',
      rust: '#000000',
      swift: '#fa7343',
      html: '#e34f26',
      css: '#1572b6',
      json: '#000000',
      sql: '#336791'
    };
    return colors[language.toLowerCase()] || '#666666';
  };

  const renderCodeWithLineNumbers = () => {
    const lines = snippet.code.split('\n');
    const startLine = snippet.startLine || 1;
    
    return (
      <Box sx={{ display: 'flex', fontFamily: 'monospace', fontSize: '0.875rem' }}>
        {showLineNumbers && (
          <Box
            sx={{
              pr: 2,
              borderRight: 1,
              borderColor: 'divider',
              color: 'text.secondary',
              userSelect: 'none',
              minWidth: '3em',
              textAlign: 'right'
            }}
          >
            {lines.map((_, index) => (
              <div key={index} style={{ lineHeight: '1.5' }}>
                {startLine + index}
              </div>
            ))}
          </Box>
        )}
        <Box
          sx={{
            pl: showLineNumbers ? 2 : 0,
            flexGrow: 1,
            whiteSpace: 'pre',
            overflow: 'auto'
          }}
        >
          {lines.map((line, index) => (
            <div
              key={index}
              style={{
                lineHeight: '1.5',
                backgroundColor: snippet.highlighted && 
                  snippet.startLine && snippet.endLine &&
                  index + startLine >= snippet.startLine && 
                  index + startLine <= snippet.endLine
                  ? 'rgba(255, 255, 0, 0.1)'
                  : 'transparent'
              }}
            >
              {line || '\u00A0'} {/* Non-breaking space for empty lines */}
            </div>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            {snippet.title || snippet.filename || 'Code Snippet'}
          </Typography>
        </Box>

        {snippet.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {snippet.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={snippet.language}
            size="small"
            sx={{
              bgcolor: getLanguageColor(snippet.language),
              color: 'white',
              '& .MuiChip-label': { fontWeight: 'bold' }
            }}
          />
          {snippet.filename && (
            <Chip label={snippet.filename} size="small" />
          )}
          <Chip
            label={`${snippet.code.split('\n').length} lines`}
            size="small"
          />
          {snippet.startLine && snippet.endLine && (
            <Chip
              label={`Lines ${snippet.startLine}-${snippet.endLine}`}
              size="small"
              color="primary"
            />
          )}
        </Stack>

        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: 'grey.50'
          }}
        >
          <Box
            sx={{
              maxHeight,
              overflow: 'auto',
              p: 1
            }}
          >
            {renderCodeWithLineNumbers()}
          </Box>
        </Box>
      </CardContent>

      <CardActions>
        <IconButton onClick={handleDownload} title="Download">
          <DownloadIcon />
        </IconButton>
        <IconButton onClick={handleCopy} title="Copy to clipboard">
          <CopyIcon />
        </IconButton>
        <Tooltip title={showLineNumbers ? "Hide line numbers" : "Show line numbers"}>
          <IconButton onClick={() => setShowLineNumbers(!showLineNumbers)}>
            {showLineNumbers ? <ViewOffIcon /> : <ViewIcon />}
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};