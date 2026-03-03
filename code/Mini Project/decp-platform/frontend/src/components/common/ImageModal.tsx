import React from 'react';
import {
  Dialog,
  IconButton,
  Box,
  Fade,
} from '@mui/material';
import { Close, Download, ZoomIn, ZoomOut } from '@mui/icons-material';

interface ImageModalProps {
  open: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ open, imageUrl, onClose }) => {
  const [zoom, setZoom] = React.useState(1);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'image';
      link.click();
    }
  };

  React.useEffect(() => {
    if (!open) setZoom(1);
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      TransitionComponent={Fade}
      className="bg-black/95"
      PaperProps={{
        className: 'bg-transparent shadow-none',
      }}
    >
      <Box className="relative w-full h-full flex items-center justify-center">
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
          size="large"
        >
          <Close />
        </IconButton>

        {/* Toolbar */}
        <Box className="absolute top-4 left-4 z-50 flex gap-2">
          <IconButton
            onClick={handleZoomOut}
            className="text-white hover:bg-white/10"
            size="large"
            disabled={zoom <= 0.5}
          >
            <ZoomOut />
          </IconButton>
          <IconButton
            onClick={handleZoomIn}
            className="text-white hover:bg-white/10"
            size="large"
            disabled={zoom >= 3}
          >
            <ZoomIn />
          </IconButton>
          <IconButton
            onClick={handleDownload}
            className="text-white hover:bg-white/10"
            size="large"
          >
            <Download />
          </IconButton>
        </Box>

        {/* Image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-[90%] max-h-[90%] object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />
        )}
      </Box>
    </Dialog>
  );
};

export default ImageModal;
