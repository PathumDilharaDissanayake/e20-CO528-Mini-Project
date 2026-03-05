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
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  ChatBubbleOutline,
  Share,
  MoreVert,
  BookmarkBorder,
  Bookmark,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useDeletePostMutation, useBookmarkPostMutation, useLikePostMutation, useUnlikePostMutation, useVotePollMutation } from '@services/postApi';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import CommentSection from './CommentSection';

interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
}

interface PollOption {
  text: string;
  votes: string[];
}

interface Post {
  _id: string;
  id?: string;
  userId: string;
  author: Author;
  content: string;
  type: 'text' | 'image' | 'video' | 'poll' | 'event' | 'announcement';
  media?: Array<{ url: string; type: string }>;
  mediaUrls?: string[];
  likes: number;
  comments: number;
  shares: number;
  pollOptions?: PollOption[];
  pollEndsAt?: string;
  myReaction?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [hasLiked, setHasLiked] = useState(!!post.myReaction);

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [deletePost] = useDeletePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [likePost] = useLikePostMutation();
  const [removeLike] = useUnlikePostMutation();
  const [votePoll] = useVotePollMutation();

  // Poll state for interactive voting
  const [pollOptions, setPollOptions] = useState(post.pollOptions || []);
  const [hasVoted, setHasVoted] = useState<number | null>(null);

  // Sync poll options when post changes
  useEffect(() => {
    if (post.pollOptions) {
      setPollOptions(post.pollOptions);
      // Check if user already voted
      if (currentUser) {
        const votedIndex = post.pollOptions.findIndex(opt => 
          opt.votes?.includes(currentUser._id || currentUser.id || '')
        );
        setHasVoted(votedIndex >= 0 ? votedIndex : null);
      }
    }
  }, [post.pollOptions, currentUser]);

  const isOwner = currentUser?._id === post.userId || currentUser?.id === post.userId;

  const getMediaUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;

    // Use relative path - Vite will proxy /uploads to API Gateway (port 3000)
    // This avoids CORS issues since it's same-origin
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return normalized;
  };

  const getMediaItems = (post: Post): any[] => {
    // Try post.media first (normalized format)
    if (Array.isArray(post?.media)) {
      return post.media;
    }
    // Try mediaUrls as array of strings (direct from DB)
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
    navigate(`/profile/${post.author._id}`);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    try {
      await deletePost(post._id || post.id!).unwrap();
      handleClose();
      if (onPostUpdate) onPostUpdate();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      await bookmarkPost(post._id || post.id!).unwrap();
      setBookmarked(!bookmarked);
      handleClose();
    } catch (error) {
      console.error('Failed to bookmark:', error);
    }
  };

  const handleLike = async () => {
    try {
      const postId = post._id || post.id!;
      if (hasLiked) {
        await removeLike(postId).unwrap();
        setLikesCount(prev => prev - 1);
      } else {
        await likePost({ postId, reactionType: 'like' }).unwrap();
        setLikesCount(prev => prev + 1);
      }
      setHasLiked(!hasLiked);
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'faculty': return 'primary';
      case 'alumni': return 'secondary';
      case 'student': return 'info';
      default: return 'default';
    }
  };

  const handleVote = async (index: number) => {
    // Prevent multiple votes
    if (hasVoted !== null) {
      console.log('User already voted on this option');
      return;
    }

    if (!currentUser) {
      console.log('No user logged in - cannot vote');
      return;
    }

    const postId = post._id || post.id!;
    try {
      // Optimistic update - immediately show the vote
      const newOptions = [...pollOptions];
      newOptions[index] = {
        ...newOptions[index],
        votes: [...(newOptions[index].votes || []), currentUser._id || currentUser.id || '']
      };
      setPollOptions(newOptions);
      setHasVoted(index);

      // Then call API
      const result = await votePoll({ postId, optionIndex: index }).unwrap();
      console.log('Vote successful', result);
    } catch (err) {
      console.error('Vote failed:', err);
      // Revert on error
      setPollOptions(post.pollOptions || []);
      setHasVoted(null);
    }
  };

  const renderPoll = () => {
    if (!pollOptions || pollOptions.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        {pollOptions.map((option, index) => {
          const totalVotes = pollOptions.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0) || 0;
          const percentage = totalVotes > 0 ? ((option.votes?.length || 0) / totalVotes) * 100 : 0;
          const hasVotedThis = hasVoted === index;

          return (
            <Box
              key={index}
              onClick={() => handleVote(index)}
              onKeyDown={(e) => e.key === 'Enter' && handleVote(index)}
              role="button"
              tabIndex={0}
              sx={{
                mb: 1,
                p: 1.5,
                border: '1px solid',
                borderColor: hasVotedThis ? 'primary.main' : 'divider',
                borderRadius: 1,
                cursor: hasVoted !== null ? 'not-allowed' : 'pointer',
                bgcolor: hasVotedThis ? 'primary.main' : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                color: hasVotedThis ? 'white' : 'text.primary',
                transition: 'all 0.2s ease',
                '&:hover': hasVoted !== null ? {} : { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: hasVotedThis ? 'white' : 'text.primary' }}>{option.text}</Typography>
                <Typography variant="body2" sx={{ color: hasVotedThis ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}>
                  {Math.round(percentage)}%
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: hasVotedThis ? 'rgba(255,255,255,0.3)' : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'grey.200',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${percentage}%`,
                    bgcolor: hasVotedThis ? 'white' : 'primary.main',
                    transition: 'width 0.5s ease-in-out',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: hasVotedThis ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                {option.votes?.length || 0} vote{option.votes?.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          );
        })}
        {post.pollEndsAt && (
          <Typography variant="caption" color="text.secondary">
            Poll ends: {format(new Date(post.pollEndsAt), 'MMM d, yyyy')}
          </Typography>
        )}
        {hasVoted !== null && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'primary.main', fontWeight: 500 }}>
            ✓ You voted
          </Typography>
        )}
      </Box>
    );
  };

  const renderMedia = () => {
    if (!mediaItems.length) return null;

    if (mediaItems.length === 1) {
      const item = mediaItems[0];
      if (item.type === 'video') {
        return (
          <video
            controls
            src={getMediaUrl(item.url)}
            style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
          />
        );
      }
      return (
        <CardMedia
          component="img"
          image={getMediaUrl(item.url)}
          alt="Post media"
          sx={{
            maxHeight: '500px',
            objectFit: 'cover',
            bgcolor: 'grey.100',
          }}
        />
      );
    }

    // Grid for multiple images
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: mediaItems.length === 2 ? '1fr 1fr' : '1fr 1fr',
          gap: 0.5,
          bgcolor: 'grey.100',
        }}
      >
        {mediaItems.slice(0, 4).map((item, index) => (
          <Box
            key={index}
            sx={{
              position: 'relative',
              paddingTop: '100%',
              overflow: 'hidden',
            }}
          >
            {item.type === 'video' ? (
              <video
                controls
                src={getMediaUrl(item.url)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <CardMedia
                component="img"
                image={getMediaUrl(item.url)}
                alt={`Media ${index + 1}`}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            {index === 3 && mediaItems.length > 4 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h4" color="white">
                  +{mediaItems.length - 4}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Card sx={{ mb: 2, boxShadow: 1, '&:hover': { boxShadow: 2 } }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar
            src={post.author.avatar}
            onClick={handleProfileClick}
            sx={{
              cursor: 'pointer',
              width: 48,
              height: 48,
              mr: 1.5,
              bgcolor: 'primary.main',
            }}
          >
            {getInitials(post.author.firstName, post.author.lastName)}
          </Avatar>
          <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={handleProfileClick}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight="600">
                {post.author.firstName} {post.author.lastName}
              </Typography>
              <Chip
                label={post.author.role}
                size="small"
                color={getRoleColor(post.author.role) as any}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}
            </Typography>
          </Box>

          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{ sx: { width: 200 } }}
        >
          {isOwner && (
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <MoreVert fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleBookmark}>
            <ListItemIcon>
              {bookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{bookmarked ? 'Bookmarked' : 'Bookmark'}</ListItemText>
          </MenuItem>
        </Menu>

        <Typography variant="body1" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {post.content}
        </Typography>

        {(post.type === 'poll' || (post.pollOptions && post.pollOptions.length > 0)) && renderPoll()}
      </CardContent>

      {renderMedia()}

      <Divider />

      <CardActions sx={{ px: 2, py: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <IconButton onClick={handleLike} size="small">
            {hasLiked ? (
              <Favorite color="error" />
            ) : (
              <FavoriteBorder />
            )}
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            {likesCount}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <IconButton onClick={() => setShowComments(!showComments)} size="small">
            <ChatBubbleOutline />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {post.comments}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <IconButton size="small">
            <Share />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {post.shares}
          </Typography>
        </Box>
      </CardActions>

      {showComments && (
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
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
