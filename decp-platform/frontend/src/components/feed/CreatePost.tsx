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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Fade,
  Typography,
  Divider,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Image,
  Videocam,
  Send,
  Close,
  Poll,
  Add,
  Delete,
  EmojiEmotions,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@store';
import { useCreatePostMutation } from '@services/postApi';
import { postSchema, PostFormData } from '@utils';
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from '@utils';
import { addToast } from '@features/uiSlice';

interface CreatePostProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface PollOption {
  text: string;
  votes: string[];
}

export const CreatePost: React.FC<CreatePostProps> = ({ open, onClose, onSuccess }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { text: '', votes: [] },
    { text: '', votes: [] },
  ]);
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
    const validFiles = selectedFiles.filter((file) => file.size <= MAX_FILE_SIZE);
    const invalidFiles = selectedFiles.filter((file) => file.size > MAX_FILE_SIZE);

    if (invalidFiles.length > 0) {
      setError(`Some files were too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const newPreviews = validFiles.map((f) => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' as const : 'image' as const,
    }));
    setFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, { text: '', votes: [] }]);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, text: string) => {
    const updated = [...pollOptions];
    updated[index] = { ...updated[index], text };
    setPollOptions(updated);
  };

  const togglePoll = () => {
    setShowPoll(!showPoll);
    if (!showPoll) {
      // Clear files when switching to poll mode
      setFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
    }
  };

  const onSubmit = async (data: PostFormData) => {
    setError(null);

    if (!data.content.trim() && files.length === 0 && !showPoll) {
      setError('Please enter some content or add media');
      return;
    }

    if (showPoll) {
      const validOptions = pollOptions.filter((o) => o.text.trim());
      if (validOptions.length < 2) {
        setError('Please add at least 2 poll options');
        return;
      }

      // For polls, send as JSON
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('type', 'poll');
      formData.append('pollOptions', JSON.stringify(validOptions));

      try {
        await createPost(formData).unwrap();
        dispatch(addToast({ message: 'Poll created successfully!', type: 'success' }));
        reset();
        setShowPoll(false);
        setPollOptions([{ text: '', votes: [] }, { text: '', votes: [] }]);
        onSuccess?.();
        if (isModal && onClose) onClose();
      } catch (err: any) {
        const errorMessage = err.data?.message || 'Failed to create poll. Please try again.';
        setError(errorMessage);
        dispatch(addToast({ message: errorMessage, type: 'error' }));
      }
      return;
    }

    const formData = new FormData();
    formData.append('content', data.content);

    if (files.length > 0) {
      files.forEach((file) => {
        formData.append('media', file, file.name);
      });
      const hasVideo = files.some(f => f.type.startsWith('video/'));
      formData.append('type', hasVideo ? 'video' : 'image');
    }

    try {
      await createPost(formData).unwrap();
      dispatch(addToast({ message: 'Post created successfully!', type: 'success' }));
      reset();
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setFiles([]);
      setPreviews([]);
      onSuccess?.();
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
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setFiles([]);
    setPreviews([]);
    setError(null);
    setShowPoll(false);
    setPollOptions([{ text: '', votes: [] }, { text: '', votes: [] }]);
    if (onClose) onClose();
  };

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Error Alert */}
      {error && (
        <Fade in>
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </Fade>
      )}

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Avatar
          src={user?.avatar || user?.profilePicture}
          sx={{
            width: 44,
            height: 44,
            background: 'linear-gradient(135deg, #15803d, #166534)',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {user?.firstName?.[0]}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={isModal ? 4 : 3}
            placeholder={showPoll ? "Ask a question..." : "What's on your mind? Share knowledge, insights, or updates..."}
            {...register('content')}
            error={!!errors.content || charCount > maxChars}
            helperText={errors.content?.message}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'primary.light' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            <Typography
              variant="caption"
              sx={{ color: charCount > maxChars ? 'error.main' : 'text.disabled' }}
            >
              {charCount}/{maxChars}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Media previews */}
      {previews.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: previews.length === 1 ? '1fr' : '1fr 1fr',
            gap: 1,
            mt: 2,
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {previews.map((preview, i) => (
            <Box key={i} sx={{ position: 'relative' }}>
              {preview.type === 'video' ? (
                <video
                  src={preview.url}
                  style={{
                    width: '100%',
                    height: previews.length === 1 ? 240 : 150,
                    objectFit: 'cover',
                    borderRadius: '8px',
                    display: 'block',
                  }}
                  controls={false}
                  muted
                />
              ) : (
                <img
                  src={preview.url}
                  alt={`preview-${i}`}
                  style={{
                    width: '100%',
                    height: previews.length === 1 ? 240 : 150,
                    objectFit: 'cover',
                    borderRadius: '8px',
                    display: 'block',
                  }}
                />
              )}
              <IconButton
                size="small"
                onClick={() => removeFile(i)}
                disabled={isLoading}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                  p: 0.5,
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* Poll builder */}
      {showPoll && (
        <Box sx={{ mt: 2, p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Poll sx={{ fontSize: 18, color: 'primary.main' }} />
              Poll Options
            </Typography>
            <Chip label={`${pollOptions.filter(o => o.text.trim()).length} / ${pollOptions.length}`} size="small" color="primary" variant="outlined" />
          </Box>
          {pollOptions.map((option, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={`Option ${i + 1}${i < 2 ? ' (required)' : ''}`}
                value={option.text}
                onChange={(e) => updatePollOption(i, e.target.value)}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                  },
                }}
              />
              {pollOptions.length > 2 && (
                <IconButton size="small" onClick={() => removePollOption(i)} sx={{ color: 'error.main', flexShrink: 0 }}>
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          {pollOptions.length < 6 && (
            <Button
              size="small"
              startIcon={<Add />}
              onClick={addPollOption}
              sx={{ mt: 0.5, borderRadius: '8px', textTransform: 'none', color: 'primary.main' }}
            >
              Add option
            </Button>
          )}
        </Box>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        style={{ display: 'none' }}
        multiple
        disabled={isLoading}
      />

      <Divider sx={{ my: 1.5 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Add photo">
            <span>
              <IconButton
                size="small"
                onClick={() => { setShowPoll(false); handleFileSelect('image'); }}
                disabled={isLoading || files.length >= 5 || showPoll}
                sx={{
                  color: 'success.main',
                  borderRadius: '8px',
                  '&:hover': { bgcolor: 'rgba(22,163,74,0.08)' },
                }}
              >
                <Image fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Add video">
            <span>
              <IconButton
                size="small"
                onClick={() => { setShowPoll(false); handleFileSelect('video'); }}
                disabled={isLoading || files.length >= 5 || showPoll}
                sx={{
                  color: 'error.main',
                  borderRadius: '8px',
                  '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' },
                }}
              >
                <Videocam fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={showPoll ? 'Remove poll' : 'Create poll'}>
            <IconButton
              size="small"
              onClick={togglePoll}
              disabled={isLoading || files.length > 0}
              sx={{
                color: showPoll ? 'primary.main' : 'text.secondary',
                borderRadius: '8px',
                bgcolor: showPoll ? 'rgba(22,101,52,0.08)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(22,101,52,0.12)' },
              }}
            >
              <Poll fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isModal && (
            <Button
              onClick={handleClose}
              disabled={isLoading}
              variant="outlined"
              size="small"
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={isLoading || (!content?.trim() && previews.length === 0 && !showPoll) || charCount > maxChars}
            endIcon={isLoading ? <CircularProgress size={14} /> : <Send sx={{ fontSize: '16px !important' }} />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #15803d, #166534)',
              boxShadow: '0 4px 12px rgba(22,101,52,0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #166534, #14532d)',
                boxShadow: '0 6px 16px rgba(22,101,52,0.4)',
              },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {isLoading ? 'Posting...' : showPoll ? 'Create Poll' : 'Post'}
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
          sx: { borderRadius: '20px', overflow: 'hidden' },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg,#15803d,#166534)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmojiEmotions sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            Create Post
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 8px rgba(22,101,52,0.06)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: '0 4px 16px rgba(22,101,52,0.1)' },
      }}
    >
      <Box sx={{ height: 3, background: 'linear-gradient(90deg,#15803d,#166534,#14b8a6)' }} />
      <CardContent sx={{ pt: 2 }}>
        {formContent}
      </CardContent>
    </Card>
  );
};
