import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  AccountTree as DiagramIcon,
  Api as ApiIcon,
  Description as DocumentIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { MediaCarousel } from './MediaCarousel';
import { DiagramRenderer } from './DiagramRenderer';
import { APISpecViewer } from './APISpecViewer';
import { DocumentViewer } from './DocumentViewer';
import { CodeSnippetViewer } from './CodeSnippetViewer';
import { AnyMediaItem, MediaType, MultiModalContext } from '../../../types/multimodal';

interface MultiModalViewerProps {
  context: MultiModalContext;
  onClose?: () => void;
  embedded?: boolean; // If true, shows inline without dialog
  maxHeight?: number | string;
}

const getMediaIcon = (type: MediaType) => {
  switch (type) {
    case MediaType.IMAGE: return <ImageIcon />;
    case MediaType.DIAGRAM: return <DiagramIcon />;
    case MediaType.API_SPEC: return <ApiIcon />;
    case MediaType.DOCUMENT: return <DocumentIcon />;
    case MediaType.CODE_SNIPPET: return <CodeIcon />;
    default: return <DocumentIcon />;
  }
};

const getMediaColor = (type: MediaType) => {
  switch (type) {
    case MediaType.IMAGE: return 'primary';
    case MediaType.DIAGRAM: return 'secondary';
    case MediaType.API_SPEC: return 'warning';
    case MediaType.DOCUMENT: return 'info';
    case MediaType.CODE_SNIPPET: return 'success';
    default: return 'default';
  }
};

export const MultiModalViewer: React.FC<MultiModalViewerProps> = ({
  context,
  onClose,
  embedded = false,
  maxHeight = '600px'
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<AnyMediaItem | null>(null);

  // Group media by type
  const mediaByType = context.mediaItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<MediaType, AnyMediaItem[]>);

  const mediaTypes = Object.keys(mediaByType) as MediaType[];

  const renderMediaContent = (items: AnyMediaItem[]) => {
    if (items.length === 0) return null;

    const firstItem = items[0];
    switch (firstItem.type) {
      case MediaType.IMAGE:
        return (
          <MediaCarousel
            images={items as any}
            onImageClick={(img) => {
              setSelectedMedia(img);
              setFullscreenOpen(true);
            }}
          />
        );
      case MediaType.DIAGRAM:
        return (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {items.map((item: any) => (
              <DiagramRenderer
                key={item.id}
                diagram={item}
                onFullscreen={() => {
                  setSelectedMedia(item);
                  setFullscreenOpen(true);
                }}
              />
            ))}
          </Box>
        );
      case MediaType.API_SPEC:
        return (
          <Stack spacing={2}>
            {items.map((item: any) => (
              <APISpecViewer key={item.id} spec={item} />
            ))}
          </Stack>
        );
      case MediaType.DOCUMENT:
        return (
          <Stack spacing={2}>
            {items.map((item: any) => (
              <DocumentViewer key={item.id} document={item} />
            ))}
          </Stack>
        );
      case MediaType.CODE_SNIPPET:
        return (
          <Stack spacing={2}>
            {items.map((item: any) => (
              <CodeSnippetViewer key={item.id} snippet={item} />
            ))}
          </Stack>
        );
      default:
        return null;
    }
  };

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!embedded && (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Multi-Modal Context
          </Typography>
          <Stack direction="row" spacing={1}>
            {mediaTypes.map(type => (
              <Chip
                key={type}
                icon={getMediaIcon(type)}
                label={`${mediaByType[type].length} ${type.toLowerCase()}`}
                size="small"
                color={getMediaColor(type) as any}
              />
            ))}
          </Stack>
          {onClose && (
            <IconButton onClick={onClose} sx={{ ml: 2 }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      )}

      {mediaTypes.length > 1 && (
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {mediaTypes.map((type, index) => (
            <Tab
              key={type}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getMediaIcon(type)}
                  <span>{type.replace('_', ' ')}</span>
                  <Badge badgeContent={mediaByType[type].length} color={getMediaColor(type) as any} />
                </Box>
              }
            />
          ))}
        </Tabs>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, maxHeight: embedded ? maxHeight : 'auto' }}>
        {mediaTypes.length === 1 ? (
          renderMediaContent(mediaByType[mediaTypes[0]])
        ) : (
          mediaTypes.map((type, index) => (
            <Box
              key={type}
              role="tabpanel"
              hidden={selectedTab !== index}
              sx={{ height: '100%' }}
            >
              {selectedTab === index && renderMediaContent(mediaByType[type])}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );

  if (embedded) {
    return <Paper sx={{ height: '100%', overflow: 'hidden' }}>{content}</Paper>;
  }

  return (
    <>
      <Dialog
        open={!embedded}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        {content}
      </Dialog>

      {/* Fullscreen viewer */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth={false}
        fullScreen
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {selectedMedia?.title || 'Media Viewer'}
            </Typography>
            <IconButton onClick={() => setFullscreenOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.900' }}>
          {selectedMedia && (
            <Box sx={{ maxWidth: '100%', maxHeight: '100%', p: 2 }}>
              {selectedMedia.type === MediaType.IMAGE && (
                <img
                  src={(selectedMedia as any).data}
                  alt={selectedMedia.title}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
              {selectedMedia.type === MediaType.DIAGRAM && (
                <DiagramRenderer diagram={selectedMedia as any} fullscreen />
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};