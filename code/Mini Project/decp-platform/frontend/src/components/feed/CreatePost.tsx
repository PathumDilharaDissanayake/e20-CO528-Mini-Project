import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  IconButton,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Fade,
  Typography,
} from '@mui/material';
import { Image, Videocam, Send, Close } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@store';
import { useCreatePostMutation } from '@services/postApi';
import { postSchema, PostFormData } from '@utils';
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from '@utils';
import { addToast } from '@features/uiSlice';

interface CreatePostProps {
  open?: boolean;
  onClose?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ open, onClose }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isModal = open !== undefined && onClose !== undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
    },
  });

  const content = watch('content');
  const charCount = content?.length || 0;
  const maxChars = 5000;

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileSelect = (type: 'image' | 'video') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' 
        ? ALLOWED_IMAGE_TYPES.join(',') 
        : ALLOWED_VIDEO_TYPES.join(',');
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.size <= MAX_FILE_SIZE
    );
    const invalidFiles = selectedFiles.filter(
      (file) => file.size > MAX_FILE_SIZE
    );
    
    if (invalidFiles.length > 0) {
      setError(`Some files were too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    setFiles((prev) => [...prev, ...validFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PostFormData) => {
    setError(null);
    
    if (!data.content.trim() && files.length === 0) {
      setError('Please enter some content or add media');
      return;
    }

    const formData = new FormData();
    formData.append('content', data.content);
    files.forEach((file) => formData.append('media', file));

    try {
      await createPost(formData).unwrap();
      dispatch(addToast({ message: 'Post created successfully!', type: 'success' }));
      reset();
      setFiles([]);
      if (isModal && onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to create post:', err);
      const errorMessage = err.data?.message || 'Failed to create post. Please try again.';
      setError(errorMessage);
      dispatch(addToast({ message: errorMessage, type: 'error' }));
    }
  };

  const handleClose = () => {
    reset();
    setFiles([]);
    setError(null);
    if (onClose) onClose();
  };

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Error Alert */}
      {error && (
        <Fade in>
          <Alert severity="error" className="mb-4 rounded-xl" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Fade>
      )}

      <Box className="flex gap-3">
        <Avatar
          src={user?.avatar}
          className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600"
        >
          {user?.firstName?.[0]}
        </Avatar>
        <Box className="flex-1">
          <Typography variant="subtitle2" className="font-semibold mb-1">
            {user?.firstName} {user?.lastName}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={isModal ? 5 : 3}
            placeholder="What's on your mind?"
            {...register('content')}
            error={!!errors.content || charCount > maxChars}
            helperText={errors.content?.message}
            disabled={isLoading}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-xl"
            InputProps={{
              className: 'rounded-xl',
            }}
          />
          <Box className="flex justify-end mt-1">
            <Typography 
              variant="caption" 
              className={charCount > maxChars ? 'text-red-500' : 'text-gray-400'}
            >
              {charCount}/{maxChars}
            </Typography>
          </Box>
        </Box>
      </Box>

      {files.length > 0 && (
        <Box className="mt-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              onDelete={() => removeFile(index)}
              deleteIcon={<Close />}
              className="bg-gray-100 dark:bg-gray-800"
              disabled={isLoading}
            />
          ))}
        </Box>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        multiple
        disabled={isLoading}
      />

      <Box className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Box className="flex gap-2">
          <Button
            size="small"
            startIcon={<Image />}
            onClick={() => handleFileSelect('image')}
            disabled={isLoading || files.length >= 5}
            className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            Photo
          </Button>
          <Button
            size="small"
            startIcon={<Videocam />}
            onClick={() => handleFileSelect('video')}
            disabled={isLoading || files.length >= 5}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Video
          </Button>
        </Box>
        <Box className="flex gap-2">
          {isModal && (
            <Button
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-xl"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || (!content?.trim() && files.length === 0) || charCount > maxChars}
            endIcon={isLoading ? <CircularProgress size={16} /> : <Send />}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {isLoading ? 'Posting...' : 'Post'}
          </Button>
        </Box>
      </Box>
    </form>
  );

  if (isModal) {
    return (
      <Dialog 
        open={open || false} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'rounded-2xl'
        }}
      >
        <DialogTitle className="flex justify-between items-center pb-0">
          <Typography variant="h6" className="font-bold">Create Post</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="mb-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
};

export default CreatePost;
