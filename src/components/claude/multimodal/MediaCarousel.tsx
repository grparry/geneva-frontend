import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Stack,
  Chip,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Skeleton
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { ImageMedia } from '../../../types/multimodal';

interface MediaCarouselProps {
  images: ImageMedia[];
  onImageClick?: (image: ImageMedia) => void;
  showThumbnails?: boolean;
  height?: number | string;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  images,
  onImageClick,
  showThumbnails = true,
  height = 400
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleDownload = (image: ImageMedia) => {
    const link = document.createElement('a');
    link.href = image.data;
    link.download = image.title || `image-${image.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = async (image: ImageMedia) => {
    try {
      // For base64 images, we need to convert to blob first
      if (image.data.startsWith('data:')) {
        const response = await fetch(image.data);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
      } else {
        // For URLs, copy the URL
        await navigator.clipboard.writeText(image.data);
      }
    } catch (error) {
      console.error('Failed to copy image:', error);
    }
  };

  if (images.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No images to display
        </Typography>
      </Box>
    );
  }

  if (images.length === 1) {
    // Single image view
    const image = images[0];
    return (
      <Card>
        {imageLoading[image.id] !== false && !imageError[image.id] && (
          <Skeleton variant="rectangular" height={height} />
        )}
        <CardMedia
          component="img"
          image={image.data}
          alt={image.title || image.description}
          sx={{
            height,
            objectFit: 'contain',
            cursor: onImageClick ? 'pointer' : 'default',
            display: imageLoading[image.id] === false || imageError[image.id] ? 'block' : 'none'
          }}
          onClick={() => onImageClick?.(image)}
          onLoad={() => setImageLoading(prev => ({ ...prev, [image.id]: false }))}
          onError={() => setImageError(prev => ({ ...prev, [image.id]: true }))}
        />
        {imageError[image.id] && (
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
            <Typography variant="body2" color="text.secondary">
              Failed to load image
            </Typography>
          </Box>
        )}
        <CardContent>
          {image.title && (
            <Typography variant="h6" gutterBottom>
              {image.title}
            </Typography>
          )}
          {image.description && (
            <Typography variant="body2" color="text.secondary">
              {image.description}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {image.width && image.height && (
              <Chip label={`${image.width}×${image.height}`} size="small" />
            )}
            <Chip label={image.mimeType} size="small" />
          </Stack>
        </CardContent>
        <CardActions>
          <IconButton onClick={() => handleDownload(image)} title="Download">
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={() => handleCopyToClipboard(image)} title="Copy to clipboard">
            <CopyIcon />
          </IconButton>
          {onImageClick && (
            <IconButton onClick={() => onImageClick(image)} title="View fullscreen">
              <FullscreenIcon />
            </IconButton>
          )}
        </CardActions>
      </Card>
    );
  }

  // Carousel view for multiple images
  return (
    <Box>
      <Card>
        <Box sx={{ position: 'relative' }}>
          {imageLoading[currentImage.id] !== false && !imageError[currentImage.id] && (
            <Skeleton variant="rectangular" height={height} />
          )}
          <CardMedia
            component="img"
            image={currentImage.data}
            alt={currentImage.title || currentImage.description}
            sx={{
              height,
              objectFit: 'contain',
              cursor: onImageClick ? 'pointer' : 'default',
              display: imageLoading[currentImage.id] === false || imageError[currentImage.id] ? 'block' : 'none'
            }}
            onClick={() => onImageClick?.(currentImage)}
            onLoad={() => setImageLoading(prev => ({ ...prev, [currentImage.id]: false }))}
            onError={() => setImageError(prev => ({ ...prev, [currentImage.id]: true }))}
          />
          {imageError[currentImage.id] && (
            <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
              <Typography variant="body2" color="text.secondary">
                Failed to load image
              </Typography>
            </Box>
          )}
          
          {/* Navigation buttons */}
          <IconButton
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' }
            }}
            onClick={handlePrevious}
          >
            <PrevIcon />
          </IconButton>
          <IconButton
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' }
            }}
            onClick={handleNext}
          >
            <NextIcon />
          </IconButton>
          
          {/* Image counter */}
          <Chip
            label={`${currentIndex + 1} / ${images.length}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper'
            }}
          />
        </Box>
        
        <CardContent>
          {currentImage.title && (
            <Typography variant="h6" gutterBottom>
              {currentImage.title}
            </Typography>
          )}
          {currentImage.description && (
            <Typography variant="body2" color="text.secondary">
              {currentImage.description}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {currentImage.width && currentImage.height && (
              <Chip label={`${currentImage.width}×${currentImage.height}`} size="small" />
            )}
            <Chip label={currentImage.mimeType} size="small" />
          </Stack>
        </CardContent>
        
        <CardActions>
          <IconButton onClick={() => handleDownload(currentImage)} title="Download">
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={() => handleCopyToClipboard(currentImage)} title="Copy to clipboard">
            <CopyIcon />
          </IconButton>
          {onImageClick && (
            <IconButton onClick={() => onImageClick(currentImage)} title="View fullscreen">
              <FullscreenIcon />
            </IconButton>
          )}
        </CardActions>
      </Card>
      
      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <ImageList sx={{ mt: 2, height: 120 }} cols={images.length} rowHeight={100}>
          {images.map((image, index) => (
            <ImageListItem
              key={image.id}
              sx={{
                cursor: 'pointer',
                opacity: index === currentIndex ? 1 : 0.6,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 }
              }}
              onClick={() => handleThumbnailClick(index)}
            >
              <img
                src={image.thumbnailData || image.data}
                alt={image.title || `Thumbnail ${index + 1}`}
                loading="lazy"
                style={{ height: '100%', objectFit: 'cover' }}
              />
              {index === currentIndex && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: 'primary.main'
                  }}
                />
              )}
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
};