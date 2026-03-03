import React, { useCallback } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { CloudUpload, Close, Image, Videocam, Description } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  accept: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  label?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image fontSize="small" />;
  if (type.startsWith('video/')) return <Videocam fontSize="small" />;
  return <Description fontSize="small" />;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  files,
  onFilesChange,
  label = 'Drag & drop files here, or click to select',
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - files.length,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <Box>
      <Box
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <CloudUpload
          className={`mb-2 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
          sx={{ fontSize: 40 }}
        />
        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
          {isDragActive ? 'Drop files here...' : label}
        </Typography>
        <Typography variant="caption" className="text-gray-400 mt-1 block">
          Max {maxFiles} files, {(maxSize / 1024 / 1024).toFixed(0)}MB each
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box className="mt-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <Chip
              key={index}
              icon={getFileIcon(file.type)}
              label={file.name}
              onDelete={() => removeFile(index)}
              deleteIcon={<Close fontSize="small" />}
              className="bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
