import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Stack,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  AnyMediaItem,
  MediaType,
  DiagramType,
  ImageMedia,
  DiagramMedia,
  CodeSnippetMedia,
  DocumentMedia,
  APISpecMedia,
  MediaUploadResult
} from '../../../types/multimodal';

interface MediaUploadProps {
  onMediaAdded: (media: AnyMediaItem[]) => void;
  acceptedTypes?: MediaType[];
  maxFileSize?: number; // in MB
  multiple?: boolean;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onMediaAdded,
  acceptedTypes = Object.values(MediaType),
  maxFileSize = 10,
  multiple = true
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<MediaType>(MediaType.IMAGE);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for manual input
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    language: 'javascript',
    diagramType: DiagramType.MERMAID,
    format: 'openapi'
  });

  const handleFileSelect = useCallback(async (files: FileList) => {
    setError(null);
    const mediaItems: AnyMediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`);
        continue;
      }

      try {
        const media = await processFile(file);
        if (media) {
          mediaItems.push(media);
        }
      } catch (err) {
        setError(`Failed to process ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (mediaItems.length > 0) {
      onMediaAdded(mediaItems);
    }
  }, [maxFileSize, onMediaAdded]);

  const processFile = async (file: File): Promise<AnyMediaItem | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const id = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        try {
          if (file.type.startsWith('image/')) {
            const imageMedia: ImageMedia = {
              id,
              type: MediaType.IMAGE,
              title: file.name,
              data: result,
              mimeType: file.type,
              timestamp
            };
            resolve(imageMedia);
          } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
            // Try to parse as API spec
            const apiMedia: APISpecMedia = {
              id,
              type: MediaType.API_SPEC,
              title: file.name,
              content: result,
              format: 'openapi',
              timestamp
            };
            resolve(apiMedia);
          } else {
            // Default to document
            const docMedia: DocumentMedia = {
              id,
              type: MediaType.DOCUMENT,
              title: file.name,
              content: result,
              format: file.name.endsWith('.md') ? 'markdown' : 'text',
              mimeType: file.type,
              timestamp
            };
            resolve(docMedia);
          }
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleManualAdd = () => {
    const id = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    let media: AnyMediaItem;

    switch (selectedType) {
      case MediaType.DIAGRAM:
        media = {
          id,
          type: MediaType.DIAGRAM,
          title: formData.title || 'Untitled Diagram',
          description: formData.description,
          source: formData.content,
          diagramType: formData.diagramType,
          timestamp
        } as DiagramMedia;
        break;

      case MediaType.CODE_SNIPPET:
        media = {
          id,
          type: MediaType.CODE_SNIPPET,
          title: formData.title || 'Code Snippet',
          description: formData.description,
          code: formData.content,
          language: formData.language,
          timestamp
        } as CodeSnippetMedia;
        break;

      case MediaType.API_SPEC:
        media = {
          id,
          type: MediaType.API_SPEC,
          title: formData.title || 'API Specification',
          description: formData.description,
          content: formData.content,
          format: formData.format as any,
          timestamp
        } as APISpecMedia;
        break;

      case MediaType.DOCUMENT:
        media = {
          id,
          type: MediaType.DOCUMENT,
          title: formData.title || 'Document',
          description: formData.description,
          content: formData.content,
          format: 'text',
          timestamp
        } as DocumentMedia;
        break;

      default:
        return;
    }

    onMediaAdded([media]);
    setUploadDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      content: '',
      language: 'javascript',
      diagramType: DiagramType.MERMAID,
      format: 'openapi'
    });
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!e.clipboardData) return;

    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length > 0) {
      e.preventDefault();
      
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          try {
            const media = await processFile(file);
            if (media) {
              onMediaAdded([media]);
            }
          } catch (err) {
            setError(`Failed to process pasted image: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }
    }
  }, [onMediaAdded]);

  // Listen for paste events
  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <>
      <Paper
        sx={{
          p: 3,
          border: 2,
          borderStyle: 'dashed',
          borderColor: dragOver ? 'primary.main' : 'grey.300',
          bgcolor: dragOver ? 'primary.light' : 'background.paper',
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Stack spacing={2} alignItems="center">
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
          <Typography variant="h6" textAlign="center">
            Drop files here or click to upload
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Supports images, diagrams, code, API specs, and documents
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Maximum file size: {maxFileSize}MB
          </Typography>
        </Stack>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
          accept={acceptedTypes.includes(MediaType.IMAGE) ? 'image/*' : undefined}
        />
      </Paper>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Add Content
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" color="text.secondary">
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* Manual Content Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Add Content
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setUploadDialogOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Content Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as MediaType)}
                label="Content Type"
              >
                <MenuItem value={MediaType.DIAGRAM}>Diagram</MenuItem>
                <MenuItem value={MediaType.CODE_SNIPPET}>Code Snippet</MenuItem>
                <MenuItem value={MediaType.API_SPEC}>API Specification</MenuItem>
                <MenuItem value={MediaType.DOCUMENT}>Document</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />

            {selectedType === MediaType.CODE_SNIPPET && (
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  label="Language"
                >
                  <MenuItem value="javascript">JavaScript</MenuItem>
                  <MenuItem value="typescript">TypeScript</MenuItem>
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="java">Java</MenuItem>
                  <MenuItem value="cpp">C++</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                  <MenuItem value="css">CSS</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                </Select>
              </FormControl>
            )}

            {selectedType === MediaType.DIAGRAM && (
              <FormControl fullWidth>
                <InputLabel>Diagram Type</InputLabel>
                <Select
                  value={formData.diagramType}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagramType: e.target.value as DiagramType }))}
                  label="Diagram Type"
                >
                  <MenuItem value={DiagramType.MERMAID}>Mermaid</MenuItem>
                  <MenuItem value={DiagramType.PLANTUML}>PlantUML</MenuItem>
                  <MenuItem value={DiagramType.GRAPHVIZ}>Graphviz</MenuItem>
                </Select>
              </FormControl>
            )}

            {selectedType === MediaType.API_SPEC && (
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={formData.format}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                  label="Format"
                >
                  <MenuItem value="openapi">OpenAPI</MenuItem>
                  <MenuItem value="swagger">Swagger</MenuItem>
                  <MenuItem value="asyncapi">AsyncAPI</MenuItem>
                  <MenuItem value="graphql">GraphQL</MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField
              label="Content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              fullWidth
              multiline
              rows={8}
              placeholder={selectedType === MediaType.DIAGRAM ? 'Enter diagram source...' : 
                          selectedType === MediaType.CODE_SNIPPET ? 'Enter code...' :
                          selectedType === MediaType.API_SPEC ? 'Enter API specification...' :
                          'Enter content...'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleManualAdd}
            disabled={!formData.content.trim()}
          >
            Add Content
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};