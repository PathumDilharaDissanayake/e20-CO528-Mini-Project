import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Avatar,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  ChatBubbleOutline,
  Share,
  MoreVert,
  BookmarkBorder,
  Bookmark,
  Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useDeletePostMutation, useBookmarkPostMutation, useLikePostMutation, useUnlikePostMutation, useVotePollMutation } from '@services/postApi';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { Post } from '@types';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
}

const ROLE_CONFIG: Record<string, { color: string; bg: string; label: string; gradient: string }> = {
  admin:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Admin',   gradient: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)' },
  faculty: { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Faculty', gradient: 'linear-gradient(180deg, #10b981 0%, #059669 100%)' },
  alumni:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Alumni',  gradient: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)' },
  student: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'Student', gradient: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' },
};

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  // Normalize likes/comments — backend may return array of user IDs or a plain count
  const toLikeCount = (v: typeof post.likes) => typeof v === 'number' ? v : (Array.isArray(v) ? v.length : 0);
  const toCommentCount = (v: typeof post.comments) => typeof v === 'number' ? v : (Array.isArray(v) ? v.length : 0);
  const [likesCount, setLikesCount] = useState<number>(toLikeCount(post.likes));
  const [hasLiked, setHasLiked] = useState(!!post.myReaction);

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [deletePost] = useDeletePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [likePost] = useLikePostMutation();
  const [removeLike] = useUnlikePostMutation();
  const [votePoll] = useVotePollMutation();

  const [pollOptions, setPollOptions] = useState(post.pollOptions || []);
  const [hasVoted, setHasVoted] = useState<number | null>(null);

  useEffect(() => {
    if (post.pollOptions) {
      setPollOptions(post.pollOptions);
      if (currentUser) {
        const votedIndex = post.pollOptions.findIndex(opt =>
          opt.votes?.includes(currentUser._id || currentUser.id || '')
        );
        setHasVoted(votedIndex >= 0 ? votedIndex : null);
      }
    }
  }, [post.pollOptions, currentUser]);

  // Sync likes when post prop updates (from feed refetch)
  useEffect(() => {
    setLikesCount(toLikeCount(post.likes));
    setHasLiked(!!post.myReaction);
  }, [post.likes, post.myReaction]);

  const isOwner = currentUser?._id === post.userId || currentUser?.id === post.userId;

  const getMediaUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  const getMediaItems = (post: Post): any[] => {
    if (Array.isArray(post?.media)) return post.media;
    const mediaUrls = post?.mediaUrls;
    if (Array.isArray(mediaUrls)) {
      return mediaUrls.map((url: string) => ({
        url,
        type: /\.(mp4|webm|ogg)$/i.test(url) ? 'video' : 'image',
      }));
    }
    return [];
  };

  const mediaItems = getMediaItems(post);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${post.author?._id || post.author?.id}`);
  };

  const handleDelete = async () => {
    try {
      await deletePost(post._id || post.id!).unwrap();
      setAnchorEl(null);
      if (onPostUpdate) onPostUpdate();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      await bookmarkPost(post._id || post.id!).unwrap();
      setBookmarked(!bookmarked);
      setAnchorEl(null);
    } catch (error) {
      console.error('Failed to bookmark:', error);
    }
  };

  const handleLike = async () => {
    const postId = post._id || post.id!;
    // Optimistic update
    const newLiked = !hasLiked;
    setHasLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    try {
      if (!newLiked) {
        await removeLike(postId).unwrap();
      } else {
        await likePost({ postId, reactionType: 'like' }).unwrap();
      }
    } catch (error) {
      // Revert on failure
      setHasLiked(!newLiked);
      setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
      console.error('Failed to like:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  const handleVote = async (index: number) => {
    if (hasVoted !== null || !currentUser) return;
    const postId = post._id || post.id!;
    try {
      const newOptions = [...pollOptions];
      newOptions[index] = {
        ...newOptions[index],
        votes: [...(newOptions[index].votes || []), currentUser._id || currentUser.id || ''],
      };
      setPollOptions(newOptions);
      setHasVoted(index);
      await votePoll({ postId, optionIndex: index }).unwrap();
    } catch (err) {
      console.error('Vote failed:', err);
      setPollOptions(post.pollOptions || []);
      setHasVoted(null);
    }
  };

  const roleInfo = ROLE_CONFIG[post.author.role] || ROLE_CONFIG.student;

  const renderPoll = () => {
    if (!pollOptions || pollOptions.length === 0) return null;
    const totalVotes = pollOptions.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);

    const POLL_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6'];

    return (
      <Box sx={{ mt: 2, mb: 0.5, p: 1.5, borderRadius: '12px', background: (t: any) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(16,185,129,0.03)', border: '1px solid', borderColor: (t: any) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.1)' }}>
        {pollOptions.map((option, index) => {
          const pct = totalVotes > 0 ? Math.round(((option.votes?.length || 0) / totalVotes) * 100) : 0;
          const isVotedOption = hasVoted === index;
          const pollColor = POLL_COLORS[index % POLL_COLORS.length];

          return (
            <Box
              key={index}
              onClick={() => handleVote(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleVote(index)}
              sx={{
                mb: 1,
                position: 'relative',
                overflow: 'hidden',
                border: '1.5px solid',
                borderColor: isVotedOption ? pollColor : 'divider',
                borderRadius: '10px',
                cursor: hasVoted !== null ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isVotedOption ? `0 2px 8px ${pollColor}30` : 'none',
                '&:hover': hasVoted !== null ? {} : {
                  borderColor: pollColor,
                  background: `${pollColor}0a`,
                  transform: 'translateX(2px)',
                },
              }}
            >
              {/* Progress fill background */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: hasVoted !== null ? `${pct}%` : 0,
                  background: isVotedOption
                    ? `linear-gradient(90deg, ${pollColor}30, ${pollColor}18)`
                    : (t: any) => t.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.04)',
                  transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  borderRadius: '8px',
                }}
              />
              <Box sx={{ position: 'relative', px: 2, py: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {hasVoted !== null && (
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: isVotedOption ? pollColor : 'transparent', border: `2px solid ${pollColor}`, flexShrink: 0 }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: isVotedOption ? 700 : 500, color: isVotedOption ? pollColor : 'inherit' }}>
                    {option.text}
                  </Typography>
                </Box>
                {hasVoted !== null && (
                  <Typography variant="caption" sx={{ fontWeight: 800, color: isVotedOption ? pollColor : 'text.secondary', ml: 1, flexShrink: 0 }}>
                    {pct}%
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            {hasVoted !== null && ' · You voted'}
          </Typography>
          {post.pollEndsAt && (
            <Typography variant="caption" color="text.secondary">
              Ends {format(new Date(post.pollEndsAt), 'MMM d')}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderMedia = () => {
    if (!mediaItems.length) return null;

    if (mediaItems.length === 1) {
      const item = mediaItems[0];
      if (item.type === 'video') {
        return (
          <Box sx={{ borderRadius: '0', overflow: 'hidden', mx: 0 }}>
            <video
              controls
              src={getMediaUrl(item.url)}
              style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        );
      }
      return (
        <Box sx={{ overflow: 'hidden', borderRadius: 0 }}>
          <CardMedia
            component="img"
            image={getMediaUrl(item.url)}
            alt="Post media"
            sx={{
              maxHeight: '500px',
              objectFit: 'cover',
              width: '100%',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.01)' },
            }}
          />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0.5,
        }}
      >
        {mediaItems.slice(0, 4).map((item: any, index: number) => (
          <Box
            key={index}
            sx={{ position: 'relative', paddingTop: '75%', overflow: 'hidden' }}
          >
            {item.type === 'video' ? (
              <video
                controls
                src={getMediaUrl(item.url)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <CardMedia
                component="img"
                image={getMediaUrl(item.url)}
                alt={`Media ${index + 1}`}
                sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            {index === 3 && mediaItems.length > 4 && (
              <Box
                sx={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  bgcolor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Typography variant="h5" color="white" fontWeight={700}>+{mediaItems.length - 4}</Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Card
      className="card-hover"
      sx={{
        mb: 2,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background: (t) =>
          t.palette.mode === 'dark'
            ? `linear-gradient(145deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.9) 100%)`
            : 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        boxShadow: (t) =>
          t.palette.mode === 'dark'
            ? '0 2px 12px rgba(0,0,0,0.25)'
            : '0 2px 12px rgba(16,185,129,0.06)',
        position: 'relative',
        '&:hover': {
          borderColor: roleInfo.color,
          boxShadow: (t) =>
            t.palette.mode === 'dark'
              ? `0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px ${roleInfo.color}30`
              : `0 12px 40px rgba(16,185,129,0.15), 0 0 0 1px ${roleInfo.color}30`,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Gradient accent bar — role-based color */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: roleInfo.gradient,
          borderRadius: '16px 0 0 16px',
        }}
      />
      <CardContent sx={{ pb: 1, px: 2.5, pt: 2.5, pl: 3 }}>
        {/* Author row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
          <Avatar
            src={post.author.avatar}
            onClick={handleProfileClick}
            sx={{
              cursor: 'pointer',
              width: 48,
              height: 48,
              mr: 1.5,
              background: roleInfo.gradient,
              fontWeight: 700,
              fontSize: '1.1rem',
              flexShrink: 0,
              border: '2.5px solid',
              borderColor: `${roleInfo.color}50`,
              boxShadow: `0 0 0 3px ${roleInfo.color}18`,
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'scale(1.07)', boxShadow: `0 0 0 4px ${roleInfo.color}30` },
            }}
          >
            {getInitials(post.author.firstName, post.author.lastName)}
          </Avatar>
          <Box sx={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={handleProfileClick}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                sx={{
                  lineHeight: 1.2,
                  fontSize: '0.925rem',
                  background: (t) => t.palette.mode === 'dark'
                    ? `linear-gradient(90deg, #f1f5f9, ${roleInfo.color}cc)`
                    : `linear-gradient(90deg, #0f172a, ${roleInfo.color})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {post.author.firstName} {post.author.lastName}
              </Typography>
              <Box
                sx={{
                  px: 1,
                  py: 0.2,
                  borderRadius: '20px',
                  background: roleInfo.gradient,
                  boxShadow: `0 2px 6px ${roleInfo.color}40`,
                }}
              >
                <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.03em' }}>
                  {roleInfo.label}
                </Typography>
              </Box>
              {post.type === 'announcement' && (
                <Chip label="Announcement" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', boxShadow: '0 2px 6px rgba(245,158,11,0.4)' }} />
              )}
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
              {format(new Date(post.createdAt), 'MMM d, yyyy · h:mm a')}
            </Typography>
          </Box>

          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
            sx={{ ml: 0.5, color: 'text.secondary', flexShrink: 0, '&:hover': { color: 'primary.main' } }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        {/* Context menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: { borderRadius: '12px', minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider' },
          }}
        >
          <MenuItem onClick={handleBookmark} sx={{ py: 1, '&:hover': { background: 'rgba(16,185,129,0.08)' } }}>
            <ListItemIcon>
              {bookmarked ? (
                <Bookmark fontSize="small" sx={{ color: 'primary.main' }} />
              ) : (
                <BookmarkBorder fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {bookmarked ? 'Saved' : 'Save post'}
            </ListItemText>
          </MenuItem>
          {isOwner && (
            <MenuItem
              onClick={handleDelete}
              sx={{ py: 1, '&:hover': { background: 'rgba(239,68,68,0.08)' } }}
            >
              <ListItemIcon>
                <Delete fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500, color: 'error.main' }}>
                Delete post
              </ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Content */}
        <Typography
          variant="body1"
          sx={{ mb: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.65, fontSize: '0.9375rem' }}
        >
          {post.content}
        </Typography>

        {(post.type === 'poll' || (post.pollOptions && post.pollOptions.length > 0)) && renderPoll()}
      </CardContent>

      {/* Media */}
      {renderMedia()}

      <Divider sx={{ opacity: 0.6 }} />

      {/* Actions */}
      <CardActions sx={{ px: 2, py: 0.75, gap: 0 }}>
        <Tooltip title={hasLiked ? 'Unlike' : 'Like'}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              flex: 1,
              borderRadius: '10px',
              py: 0.75,
              px: 0.5,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              background: hasLiked
                ? 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.08) 100%)'
                : 'transparent',
              border: hasLiked ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
              '&:hover': {
                background: hasLiked
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(220,38,38,0.14) 100%)'
                  : 'rgba(239,68,68,0.06)',
                transform: 'scale(1.03)',
              },
              '&:active': { transform: 'scale(0.96)' },
            }}
            onClick={handleLike}
          >
            <IconButton
              size="small"
              sx={{
                p: 0.5,
                transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': { transform: 'scale(1.3)', background: 'transparent' },
              }}
            >
              {hasLiked ? (
                <Favorite
                  sx={{
                    color: '#ef4444',
                    fontSize: 21,
                    filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.5))',
                    animation: 'none',
                  }}
                />
              ) : (
                <FavoriteBorder sx={{ fontSize: 20, color: 'text.secondary' }} />
              )}
            </IconButton>
            <Typography
              variant="body2"
              sx={{
                color: hasLiked ? '#ef4444' : 'text.secondary',
                fontWeight: hasLiked ? 800 : 400,
                fontSize: '0.8rem',
                letterSpacing: hasLiked ? '0.01em' : 'normal',
              }}
            >
              {likesCount > 0 ? likesCount : ''}
            </Typography>
          </Box>
        </Tooltip>

        <Tooltip title="Comments">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              flex: 1,
              borderRadius: '8px',
              py: 0.5,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': { background: 'rgba(99,102,241,0.08)' },
            }}
            onClick={() => setShowComments(!showComments)}
          >
            <IconButton size="small" sx={{ p: 0.5 }}>
              <ChatBubbleOutline
                sx={{ fontSize: 20, color: showComments ? 'secondary.main' : 'text.secondary' }}
              />
            </IconButton>
            <Typography
              variant="body2"
              sx={{ color: showComments ? 'secondary.main' : 'text.secondary', fontWeight: showComments ? 700 : 400, fontSize: '0.8rem' }}
            >
              {toCommentCount(post.comments) > 0 ? toCommentCount(post.comments) : ''}
            </Typography>
          </Box>
        </Tooltip>

        <Tooltip title="Share">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              flex: 1,
              borderRadius: '8px',
              py: 0.5,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': { background: 'rgba(16,185,129,0.08)' },
            }}
          >
            <IconButton size="small" sx={{ p: 0.5 }}>
              <Share sx={{ fontSize: 20, color: 'text.secondary' }} />
            </IconButton>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              {post.shares > 0 ? post.shares : ''}
            </Typography>
          </Box>
        </Tooltip>
      </CardActions>

      {showComments && (
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2, pb: 2 }}>
          <CommentSection
            postId={post._id || post.id!}
            onUpdate={onPostUpdate}
          />
        </Box>
      )}
    </Card>
  );
};

export default PostCard;
