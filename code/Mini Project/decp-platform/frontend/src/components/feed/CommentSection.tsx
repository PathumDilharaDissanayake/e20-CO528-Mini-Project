import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Send, ChatBubbleOutline } from '@mui/icons-material';
import { useGetPostCommentsQuery, useAddCommentMutation } from '@services/postApi';
import { useSelector } from 'react-redux';
import { RootState } from '@store';

interface CommentSectionProps {
  postId: string;
  onUpdate?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, onUpdate }) => {
  const [newComment, setNewComment] = useState('');
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const { data: commentsData, isLoading, error } = useGetPostCommentsQuery(postId);
  const [addComment, { isLoading: isSubmitting }] = useAddCommentMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      await addComment({ postId, content: newComment.trim() }).unwrap();
      setNewComment('');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const comments = commentsData?.data || [];

  return (
    <Box 
      sx={{ 
        p: 2, 
        bgcolor: 'transparent',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Comment input */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Avatar 
          src={currentUser?.avatar || currentUser?.profilePicture}
          sx={{ width: 32, height: 32 }}
        >
          {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
        </Avatar>
        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            multiline
            maxRows={4}
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': (t) => ({
                bgcolor: t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
              })
            }}
          />
          <IconButton 
            type="submit" 
            color="primary"
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} /> : <Send />}
          </IconButton>
        </Box>
      </Box>

      {/* Comments list */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error" sx={{ textAlign: 'center', py: 2 }}>
          Failed to load comments
        </Typography>
      ) : comments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <ChatBubbleOutline sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">No comments yet. Be the first to comment!</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {comments.map((comment: any, index: number) => (
            <Box 
              key={comment.id || index} 
              sx={{ display: 'flex', gap: 1 }}
            >
              <Avatar 
                src={comment.author?.avatar || comment.author?.profilePicture}
                sx={{ width: 28, height: 28 }}
              >
                {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
              </Avatar>
              <Box sx={{ 
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', 
                p: 1.5, 
                borderRadius: 1,
                flex: 1
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {comment.author?.firstName} {comment.author?.lastName}
                </Typography>
                <Typography variant="body2">
                  {comment.content}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CommentSection;
