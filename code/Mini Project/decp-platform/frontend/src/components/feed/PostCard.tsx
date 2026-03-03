import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  IconButton,
  Button,
  Box,
  Menu,
  MenuItem,
  TextField,
  Collapse,
  Divider,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  MoreVert,
  Edit,
  Delete,
  Send,
  BookmarkBorder,
  Bookmark,
  Close,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import {
  useLikePostMutation,
  useDeletePostMutation,
  useAddCommentMutation,
  useSharePostMutation,
  useGetPostCommentsQuery,
  useUpdatePostMutation,
} from '@services/postApi';
import { Post } from '@types';
import { formatRelativeTime } from '@utils';
import { ImageModal } from '@components/common';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  onPostUpdated?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdated }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [likePost] = useLikePostMutation();
  const [deletePost] = useDeletePostMutation();
  const [addComment] = useAddCommentMutation();
  const [sharePost] = useSharePostMutation();
  const [updatePost] = useUpdatePostMutation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Optimistic like state — cleared after server confirms so fresh data renders
  const [isLikedOpt, setIsLikedOpt] = useState<boolean | null>(null);
  const [likesOpt, setLikesOpt] = useState<number | null>(null);

  const postId = post._id || post.id || '';
  const currentUserId = user?._id || user?.id || '';

  // Fetch comments from server when section is expanded
  const { data: commentsData, isLoading: isLoadingComments } = useGetPostCommentsQuery(postId, {
    skip: !showComments || !postId,
  });

  const author: any = post.author || {
    _id: post.userId || 'unknown',
    id: post.userId || 'unknown',
    firstName: 'Community',
    lastName: 'Member',
    role: 'student',
  };

  const serverLikesCount = Array.isArray(post.likes)
    ? post.likes.length
    : Number(post.likes || 0);
  const likesCount = likesOpt !== null ? likesOpt : serverLikesCount;

  const serverIsLiked = Array.isArray(post.likes)
    ? post.likes.includes(currentUserId)
    : false;
  const isLiked = isLikedOpt !== null ? isLikedOpt : serverIsLiked;

  const commentsArr: any[] = commentsData?.data || [];
  const commentsCount =
    commentsData?.data != null
      ? commentsData.data.length
      : Array.isArray(post.comments)
      ? post.comments.length
      : Number(post.comments || 0);

  const isOwner = (author._id || author.id || post.userId) === currentUserId;

  const mediaItems: any[] = Array.isArray(post.media)
    ? post.media
    : Array.isArray((post as any).mediaUrls)
    ? (post as any).mediaUrls.map((url: string) => ({
        url,
        type: /\.(mp4|webm|ogg)$/i.test(url) ? 'video' : 'image',
      }))
    : [];

  const handleLike = async () => {
    const wasLiked = isLiked;
    const prevCount = likesCount;
    setIsLikedOpt(!wasLiked);
    setLikesOpt(wasLiked ? prevCount - 1 : prevCount + 1);
    try {
      await likePost(postId).unwrap();
      // After server confirms, clear optimistic state — the refreshed post data takes over
      setIsLikedOpt(null);
      setLikesOpt(null);
    } catch {
      setIsLikedOpt(wasLiked);
      setLikesOpt(prevCount);
    }
  };

  const handleDelete = async () => {
    setAnchorEl(null);
    try {
      await deletePost(postId).unwrap();
      onPostUpdated?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSave = async () => {
    if (!editContent.trim() || editSubmitting) return;
    setEditSubmitting(true);
    try {
      await updatePost({ id: postId, data: { content: editContent } }).unwrap();
      setEditOpen(false);
      onPostUpdated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment({ postId, content: commentText }).unwrap();
      setCommentText('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await sharePost(postId).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  const getBadge = (role?: string) => {
    if (role === 'alumni') return { bgcolor: '#f59e0b', color: 'white' };
    if (role === 'faculty') return { bgcolor: '#166534', color: 'white' };
    if (role === 'admin') return { bgcolor: '#ef4444', color: 'white' };
    return { bgcolor: '#6366f1', color: 'white' };
  };
  const bs = getBadge(author.role);

  const authorId = author._id || author.id || post.userId || '';

  return (
    <>
      <Card
        sx={{
          mb: 2,
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 4px 20px rgba(22,101,52,0.1)' },
        }}
      >
        <Box sx={{ height: 3, background: 'linear-gradient(90deg,#15803d,#166534,#14b8a6)' }} />

        <CardContent sx={{ pt: 2, pb: 1 }}>
          {/* Author row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5, flex: 1, minWidth: 0 }}>
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  src={author.avatar || author.profilePicture}
                  onClick={() => authorId && navigate(`/users/${authorId}`)}
                  sx={{
                    width: 44,
                    height: 44,
                    background: 'linear-gradient(135deg,#15803d,#166534)',
                    fontWeight: 700,
                    cursor: authorId ? 'pointer' : 'default',
                  }}
                >
                  {(author.firstName || 'C')[0]}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -1,
                    right: -1,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: '#22c55e',
                    border: '2px solid white',
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ lineHeight: 1.2, cursor: authorId ? 'pointer' : 'default' }}
                    onClick={() => authorId && navigate(`/users/${authorId}`)}
                  >
                    {author.firstName || 'Community'} {author.lastName || 'Member'}
                  </Typography>
                  <Box sx={{ px: 1, py: 0.15, borderRadius: '20px', fontSize: '0.62rem', fontWeight: 700, ...bs }}>
                    {author.role || 'student'}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {author.department ? `${author.department} · ` : ''}
                  {formatRelativeTime(post.createdAt || new Date().toISOString())}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              <IconButton size="small" onClick={() => setIsSaved(!isSaved)}>
                {isSaved ? (
                  <Bookmark fontSize="small" sx={{ color: 'primary.main' }} />
                ) : (
                  <BookmarkBorder fontSize="small" />
                )}
              </IconButton>
              {isOwner && (
                <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Post content */}
          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mb: mediaItems.length > 0 ? 1.5 : 0 }}
          >
            {post.content || ''}
          </Typography>

          {/* Media */}
          {mediaItems.length > 0 && (
            <Box
              sx={{
                mt: 1.5,
                display: 'grid',
                gap: 1,
                gridTemplateColumns: mediaItems.length === 1 ? '1fr' : '1fr 1fr',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {mediaItems.slice(0, 4).map((media: any, index: number) => (
                <Box
                  key={index}
                  sx={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                  onClick={() => media.type === 'image' && setSelectedImage(media.url)}
                >
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt="Post media"
                      style={{
                        width: '100%',
                        height: mediaItems.length === 1 ? 320 : 200,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <video
                      src={media.url}
                      controls
                      style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  {index === 3 && mediaItems.length > 4 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'rgba(0,0,0,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h5" fontWeight={700} color="white">
                        +{mediaItems.length - 4}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>

        <Divider />

        {/* Action bar */}
        <CardActions
          sx={{
            px: 2,
            py: 0.75,
            bgcolor: (t) =>
              t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
          }}
        >
          <Button
            size="small"
            startIcon={isLiked ? <Favorite sx={{ color: '#ef4444' }} /> : <FavoriteBorder />}
            onClick={handleLike}
            sx={{
              color: isLiked ? '#ef4444' : 'text.secondary',
              fontWeight: 600,
              borderRadius: '8px',
              px: 1.5,
              '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', color: '#ef4444' },
              transition: 'all 0.15s',
            }}
          >
            {likesCount > 0 ? likesCount : 'Like'}
          </Button>
          <Button
            size="small"
            startIcon={<Comment fontSize="small" />}
            onClick={() => setShowComments(!showComments)}
            sx={{
              color: showComments ? 'primary.main' : 'text.secondary',
              fontWeight: 600,
              borderRadius: '8px',
              px: 1.5,
              '&:hover': { bgcolor: 'rgba(16,185,129,0.08)', color: 'primary.main' },
            }}
          >
            {commentsCount > 0 ? commentsCount : 'Comment'}
          </Button>
          <Button
            size="small"
            startIcon={<Share fontSize="small" />}
            onClick={handleShare}
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              borderRadius: '8px',
              px: 1.5,
              '&:hover': { bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1' },
            }}
          >
            {post.shares ? post.shares : 'Share'}
          </Button>
        </CardActions>

        {/* Comments section */}
        <Collapse in={showComments}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />

            {/* Comment input */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'flex-end' }}>
              <Avatar
                src={user?.avatar || user?.profilePicture}
                sx={{
                  width: 34,
                  height: 34,
                  background: 'linear-gradient(135deg,#15803d,#166534)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {(user?.firstName || 'U')[0]}
              </Avatar>
              <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  maxRows={3}
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '20px',
                      '& fieldset': { borderColor: 'transparent' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                      bgcolor: (t) =>
                        t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleComment}
                  disabled={!commentText.trim() || submitting}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&:disabled': { bgcolor: 'action.disabledBackground' },
                  }}
                >
                  <Send fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Comments list */}
            {isLoadingComments ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[1, 2].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
                    <Skeleton variant="circular" width={34} height={34} />
                    <Skeleton variant="rounded" height={56} sx={{ flex: 1, borderRadius: '16px' }} />
                  </Box>
                ))}
              </Box>
            ) : commentsArr.length === 0 ? (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', textAlign: 'center', py: 1 }}
              >
                No comments yet — be the first!
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {commentsArr.map((comment: any) => {
                  const ca = comment.author || { firstName: 'Member', lastName: '' };
                  return (
                    <Box key={comment._id || comment.id} sx={{ display: 'flex', gap: 1.5 }}>
                      <Avatar
                        src={ca.avatar}
                        sx={{
                          width: 34,
                          height: 34,
                          background: 'linear-gradient(135deg,#15803d,#166534)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        {(ca.firstName || 'M')[0]}
                      </Avatar>
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: (t) => t.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
                          borderRadius: '4px 16px 16px 16px',
                          px: 2,
                          py: 1.25,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={700}>
                            {ca.firstName} {ca.lastName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ fontSize: '0.62rem' }}
                          >
                            {formatRelativeTime(comment.createdAt || new Date().toISOString())}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}
                        >
                          {comment.content || ''}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Owner actions menu */}
        {isOwner && (
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { borderRadius: '12px', minWidth: 160 } }}
          >
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setEditContent(post.content || '');
                setEditOpen(true);
              }}
              sx={{ gap: 1.5, '&:hover': { bgcolor: 'rgba(16,185,129,0.08)' } }}
            >
              <Edit fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={500}>Edit Post</Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleDelete}
              sx={{ gap: 1.5, '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}
            >
              <Delete fontSize="small" sx={{ color: 'error.main' }} />
              <Typography variant="body2" fontWeight={500} color="error">Delete Post</Typography>
            </MenuItem>
          </Menu>
        )}
      </Card>

      {/* Edit Post Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Edit Post</Typography>
          <IconButton size="small" onClick={() => setEditOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={5}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="What's on your mind?"
            sx={{ mt: 1 }}
          />
          <Typography
            variant="caption"
            color={editContent.length > 5000 ? 'error' : 'text.disabled'}
            sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}
          >
            {editContent.length}/5000
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={editSubmitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={!editContent.trim() || editSubmitting || editContent.length > 5000}
          >
            {editSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ImageModal open={!!selectedImage} imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
};

export default PostCard;
