import React, { useState, useRef, useEffect } from 'react';
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
  Tooltip,
  Modal,
} from '@mui/material';
import {
  Comment,
  Share,
  MoreVert,
  Edit,
  Delete,
  Send,
  BookmarkBorder,
  Bookmark,
  Close,
  ThumbUpOutlined,
  Check,
  Link as LinkIcon,
  Repeat,
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
  useBookmarkPostMutation,
  useVotePollMutation,
} from '@services/postApi';
import { Post, PollOption } from '@types';
import { formatRelativeTime } from '@utils';
import { useNavigate } from 'react-router-dom';

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like', color: '#1877f2' },
  { type: 'love', emoji: '❤️', label: 'Love', color: '#e0245e' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate', color: '#f5a623' },
  { type: 'insightful', emoji: '💡', label: 'Insightful', color: '#0073b1' },
  { type: 'curious', emoji: '🤔', label: 'Curious', color: '#8b5cf6' },
];

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
  const [bookmarkPost] = useBookmarkPostMutation();
  const [votePoll] = useVotePollMutation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Reaction state
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>((post as any).myReaction || null);
  const [reactionCount, setReactionCount] = useState<number>(() => {
    const v = post.likes;
    return Array.isArray(v) ? v.length : Number(v || 0);
  });
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Poll options local state (optimistic updates)
  const [localPollOptions, setLocalPollOptions] = useState<PollOption[] | null>(post.pollOptions || null);
  useEffect(() => {
    setLocalPollOptions(post.pollOptions || null);
  }, [post.pollOptions]);

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Share state
  const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);
  const [shareDone, setShareDone] = useState(false);

  // Lightbox state
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Video ref for autoplay
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const commentsArr: any[] = commentsData?.data || [];
  const commentsCount =
    commentsData?.data != null
      ? commentsData.data.length
      : Array.isArray(post.comments)
        ? post.comments.length
        : Number(post.comments || 0);

  const isOwner = (author._id || author.id || post.userId) === currentUserId;

  const getMediaUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
    // /uploads/... paths are served by the API gateway which proxies to feed-service
    const origin = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
    // Normalize: ensure single leading slash
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${origin}${normalized}`;
  };

  const mediaItems: any[] = Array.isArray(post.media)
    ? post.media
    : Array.isArray((post as any).mediaUrls)
      ? (post as any).mediaUrls.map((url: string) => ({
        url,
        type: /\.(mp4|webm|ogg)$/i.test(url) ? 'video' : 'image',
      }))
      : [];

  // Video autoplay with IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => { });
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Reaction handlers
  const handleReactionHover = () => {
    reactionTimerRef.current = setTimeout(() => setShowReactionPicker(true), 400);
  };
  const handleReactionLeave = () => {
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    setTimeout(() => setShowReactionPicker(false), 300);
  };

  const handleReact = async (reactionType: string) => {
    setShowReactionPicker(false);
    const prev = myReaction;
    const isRemoving = myReaction === reactionType;
    setMyReaction(isRemoving ? null : reactionType);
    setReactionCount((c) => (isRemoving ? Math.max(0, c - 1) : prev ? c : c + 1));
    try {
      await likePost({ postId, reactionType }).unwrap();
    } catch {
      setMyReaction(prev);
      setReactionCount((c) => (isRemoving ? c + 1 : prev ? c : Math.max(0, c - 1)));
    }
  };

  const activeReaction = REACTIONS.find((r) => r.type === myReaction);

  // Bookmark handler
  const handleBookmark = async () => {
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      await bookmarkPost(postId).unwrap();
    } catch {
      setIsBookmarked(prev);
    }
  };

  // Share handlers
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
    setShareDone(true);
    setShareAnchor(null);
    setTimeout(() => setShareDone(false), 2000);
  };

  const handleReshare = async () => {
    setShareAnchor(null);
    try {
      await sharePost(postId).unwrap();
      setShareDone(true);
      setTimeout(() => setShareDone(false), 2000);
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  // Poll vote handler with optimistic update
  const handleVotePoll = async (optionIndex: number) => {
    if (!postId || !localPollOptions) return;
    const prevOptions = localPollOptions;
    // Optimistic: toggle vote on selected option, remove from others
    const newOptions = localPollOptions.map((opt, i) => {
      const votes = opt.votes || [];
      if (i === optionIndex) {
        return { ...opt, votes: votes.includes(currentUserId) ? votes.filter(v => v !== currentUserId) : [...votes, currentUserId] };
      }
      return { ...opt, votes: votes.filter(v => v !== currentUserId) };
    });
    setLocalPollOptions(newOptions);
    try {
      const result = await votePoll({ postId, optionIndex }).unwrap();
      if (result?.data?.pollOptions) setLocalPollOptions(result.data.pollOptions);
    } catch (e) {
      console.error(e);
      setLocalPollOptions(prevOptions);
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

  const getBadge = (role?: string) => {
    if (role === 'alumni') return { bgcolor: '#f59e0b', color: 'white' };
    if (role === 'faculty') return { bgcolor: '#166534', color: 'white' };
    if (role === 'admin') return { bgcolor: '#ef4444', color: 'white' };
    return { bgcolor: '#6366f1', color: 'white' };
  };
  const bs = getBadge(author.role);

  const authorId = author._id || author.id || post.userId || '';
  const pollOptions: PollOption[] | null = localPollOptions;

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
              <Tooltip title={isBookmarked ? 'Saved' : 'Save post'}>
                <IconButton size="small" onClick={handleBookmark} sx={{ color: isBookmarked ? 'primary.main' : 'text.secondary' }}>
                  {isBookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
                </IconButton>
              </Tooltip>
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
            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mb: (mediaItems.length > 0 || pollOptions) ? 1.5 : 0 }}
          >
            {post.content || ''}
          </Typography>

          {/* Poll display */}
          {pollOptions && Array.isArray(pollOptions) && pollOptions.length > 0 && (
            <Box sx={{ mt: 1.5, mb: 1 }}>
              {pollOptions.map((option: any, i: number) => {
                const totalVotes = pollOptions.reduce((s: number, o: any) => s + (o.votes?.length || 0), 0);
                const myVote = (option.votes || []).includes(currentUserId);
                const pct = totalVotes > 0 ? Math.round((option.votes?.length || 0) / totalVotes * 100) : 0;
                return (
                  <Box key={i} sx={{ mb: 1 }} onClick={() => handleVotePoll(i)}>
                    <Box sx={{
                      position: 'relative', border: '1px solid', borderColor: myVote ? 'primary.main' : 'divider',
                      borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', p: 1.5,
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                    }}>
                      <Box sx={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
                        bgcolor: myVote ? 'primary.main' : 'action.selected', opacity: 0.15, transition: 'width 0.4s ease',
                      }} />
                      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight={myVote ? 700 : 400}>{option.text}</Typography>
                        <Typography variant="body2" color="text.secondary">{pct}%</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              <Typography variant="caption" color="text.secondary">
                {pollOptions.reduce((s: number, o: any) => s + (o.votes?.length || 0), 0)} votes
              </Typography>
            </Box>
          )}

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
                  onClick={() => media.type === 'image' && setLightboxSrc(getMediaUrl(media.url))}
                >
                  {media.type === 'image' ? (
                    <img
                      src={getMediaUrl(media.url)}
                      alt="Post media"
                      style={{
                        width: '100%',
                        height: mediaItems.length === 1 ? 320 : 200,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <video
                      ref={index === 0 ? videoRef : undefined}
                      src={getMediaUrl(media.url)}
                      muted
                      loop
                      playsInline
                      controls
                      style={{ width: '100%', maxHeight: 450, borderRadius: 12, display: 'block' }}
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
          {/* Reaction area */}
          <Box
            sx={{ position: 'relative' }}
            onMouseEnter={handleReactionHover}
            onMouseLeave={handleReactionLeave}
          >
            {/* Reaction picker popup */}
            {showReactionPicker && (
              <Box sx={{
                position: 'absolute', bottom: '110%', left: 0, zIndex: 100,
                bgcolor: 'background.paper', borderRadius: '24px', p: '6px 8px',
                display: 'flex', gap: 0.5, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: '1px solid', borderColor: 'divider',
                animation: 'reactionFadeIn 0.15s ease-out',
              }}>
                {REACTIONS.map((r) => (
                  <Tooltip key={r.type} title={r.label} placement="top">
                    <Box
                      onClick={() => handleReact(r.type)}
                      sx={{
                        fontSize: '1.6rem', cursor: 'pointer', p: '4px',
                        borderRadius: '50%', lineHeight: 1,
                        transition: 'transform 0.15s',
                        '&:hover': { transform: 'scale(1.4)', bgcolor: 'action.hover' },
                      }}
                    >
                      {r.emoji}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            )}

            {/* Like/Reaction button */}
            <Button
              size="small"
              onClick={() => handleReact('like')}
              sx={{
                color: activeReaction ? activeReaction.color : 'text.secondary',
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: activeReaction ? 700 : 400,
                px: 1.5,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {activeReaction ? (
                <>
                  <span style={{ fontSize: '1.1em', marginRight: 4 }}>{activeReaction.emoji}</span>
                  {activeReaction.label}
                </>
              ) : (
                <>
                  <ThumbUpOutlined fontSize="small" sx={{ mr: 0.5 }} />
                  Like
                </>
              )}
              {reactionCount > 0 && (
                <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 600 }}>{reactionCount}</Typography>
              )}
            </Button>
          </Box>

          {/* Comment button */}
          <Button
            size="small"
            startIcon={<Comment fontSize="small" />}
            onClick={() => setShowComments(!showComments)}
            sx={{
              color: showComments ? 'primary.main' : 'text.secondary',
              fontWeight: 600,
              borderRadius: '8px',
              px: 1.5,
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(16,185,129,0.08)', color: 'primary.main' },
            }}
          >
            {commentsCount > 0 ? commentsCount : 'Comment'}
          </Button>

          {/* Share button */}
          <Button
            size="small"
            onClick={(e) => setShareAnchor(e.currentTarget)}
            startIcon={shareDone ? <Check fontSize="small" /> : <Share fontSize="small" />}
            sx={{
              color: shareDone ? 'success.main' : 'text.secondary',
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.5,
              '&:hover': { bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1' },
            }}
          >
            {shareDone ? 'Done!' : `Share${(post.shares || 0) > 0 ? ` \u00b7 ${post.shares}` : ''}`}
          </Button>

          <Menu
            anchorEl={shareAnchor}
            open={Boolean(shareAnchor)}
            onClose={() => setShareAnchor(null)}
            PaperProps={{ sx: { borderRadius: '12px', minWidth: 200 } }}
          >
            <MenuItem onClick={handleCopyLink}>
              <LinkIcon sx={{ mr: 1.5, fontSize: 20 }} /> Copy link
            </MenuItem>
            <MenuItem onClick={handleReshare}>
              <Repeat sx={{ mr: 1.5, fontSize: 20 }} /> Share to feed
            </MenuItem>
          </Menu>
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
            {editSubmitting ? 'Saving\u2026' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox */}
      <Modal
        open={Boolean(lightboxSrc)}
        onClose={() => setLightboxSrc(null)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.9)', zIndex: 9999 }}
        onClick={() => setLightboxSrc(null)}
      >
        <Box onClick={(e) => e.stopPropagation()} sx={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
          <IconButton
            onClick={() => setLightboxSrc(null)}
            sx={{ position: 'absolute', top: -40, right: 0, color: 'white' }}
          >
            <Close />
          </IconButton>
          <Box
            component="img"
            src={lightboxSrc || ''}
            alt="Full size"
            sx={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', display: 'block' }}
          />
        </Box>
      </Modal>
    </>
  );
};

export default PostCard;
