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
  EmojiEmotions,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import {
  useLikePostMutation,
  useDeletePostMutation,
  useAddCommentMutation,
  useSharePostMutation,
} from '@services/postApi';
import { Post } from '@types';
import { formatRelativeTime } from '@utils';
import { ImageModal } from '@components/common';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [likePost] = useLikePostMutation();
  const [deletePost] = useDeletePostMutation();
  const [addComment] = useAddCommentMutation();
  const [sharePost] = useSharePostMutation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const postId = post._id || post.id || '';
  const currentUserId = user?._id || user?.id || '';

  const author = post.author || {
    _id: post.userId || 'unknown',
    id: post.userId || 'unknown',
    firstName: 'Community',
    lastName: 'Member',
    role: 'student' as const,
  };

  const likesCount = Array.isArray(post.likes) ? post.likes.length : Number(post.likes || 0);
  const commentsCount = Array.isArray(post.comments) ? post.comments.length : Number(post.comments || 0);
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const isLiked = Array.isArray(post.likes) ? post.likes.includes(currentUserId) : false;
  const isOwner = (author._id || author.id || post.userId) === currentUserId;

  const mediaItems = Array.isArray(post.media)
    ? post.media
    : Array.isArray(post.mediaUrls)
      ? post.mediaUrls.map((url) => ({
        url,
        type: /\.(mp4|webm|ogg)$/i.test(url) ? ('video' as const) : ('image' as const),
      }))
      : [];

  const handleLike = async () => {
    try {
      await likePost(postId).unwrap();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(postId).unwrap();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
    setAnchorEl(null);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment({ postId, content: commentText }).unwrap();
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleShare = async () => {
    try {
      await sharePost(postId).unwrap();
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  };

  // Get role badge color - Green theme
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'alumni': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'faculty': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'student': return 'bg-gradient-to-r from-teal-500 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  return (
    <>
      <Card className="mb-4 shadow-card hover:shadow-card-hover transition-all duration-300 rounded-2xl overflow-hidden">
        {/* Gradient Border Accent - Green Theme */}
        <Box className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />

        <CardContent className="pt-4">
          <Box className="flex justify-between items-start mb-3">
            <Box className="flex gap-3">
              <Box className="relative">
                <Avatar
                  src={author.avatar || author.profilePicture}
                  className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600"
                >
                  {(author.firstName || 'C')[0]}
                </Avatar>
                {/* Online indicator */}
                <Box className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
              </Box>
              <Box>
                <Box className="flex items-center gap-2">
                  <Typography variant="subtitle1" className="font-semibold">
                    {author.firstName || 'Community'} {author.lastName || 'Member'}
                  </Typography>
                  <Box className={`px-2 py-0.5 rounded-full text-[10px] text-white font-medium ${getRoleBadgeColor(author.role)}`}>
                    {author.role || 'student'}
                  </Box>
                </Box>
                <Typography variant="caption" className="text-gray-500">
                  {author.department || 'Department'} • {formatRelativeTime(post.createdAt || new Date().toISOString())}
                </Typography>
              </Box>
            </Box>
            {isOwner && (
              <>
                <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} className="hover:bg-gray-100">
                  <MoreVert />
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} className="rounded-xl">
                  <MenuItem className="hover:bg-green-50">
                    <Edit fontSize="small" className="mr-2 text-green-600" /> Edit
                  </MenuItem>
                  <MenuItem onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                    <Delete fontSize="small" className="mr-2" /> Delete
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

          <Typography variant="body1" className="whitespace-pre-wrap mb-3 text-gray-700 dark:text-gray-300">
            {post.content || ''}
          </Typography>

          {mediaItems.length > 0 && (
            <Box className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-2">
              {mediaItems.map((media, index) => (
                <Box
                  key={index}
                  className="relative rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedImage(media.url)}
                >
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt="Post media"
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <video src={media.url} controls className="w-full h-64 object-cover" />
                  )}
                  {/* Overlay on hover */}
                  <Box className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </Box>
              ))}
            </Box>
          )}
        </CardContent>

        <Divider />

        <CardActions className="px-4 py-1 bg-gray-50/50 dark:bg-gray-800/50">
          <Button
            size="small"
            startIcon={isLiked ? <Favorite className="text-red-500" /> : <FavoriteBorder />}
            onClick={handleLike}
            className={`${isLiked ? 'text-red-500' : 'text-gray-600'} hover:bg-red-50 rounded-lg transition-colors`}
          >
            {likesCount}
          </Button>
          <Button size="small" startIcon={<Comment className="text-gray-500" />} onClick={() => setShowComments(!showComments)} className="text-gray-600 hover:bg-green-50 rounded-lg transition-colors">
            {commentsCount}
          </Button>
          <Button size="small" startIcon={<Share className="text-gray-500" />} onClick={handleShare} className="text-gray-600 hover:bg-teal-50 rounded-lg transition-colors">
            {post.shares || 0}
          </Button>

          <Box className="flex-1" />
          <IconButton size="small" className="text-yellow-500 hover:bg-yellow-50">
            <EmojiEmotions fontSize="small" />
          </IconButton>
        </CardActions>

        <Collapse in={showComments}>
          <CardContent className="pt-0 bg-gray-50/30 dark:bg-gray-800/30">
            <Divider className="mb-3" />

            <Box className="flex gap-2 mb-4">
              <Avatar
                src={user?.avatar || user?.profilePicture}
                className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600"
              >
                {(user?.firstName || 'U')[0]}
              </Avatar>
              <Box className="flex-1 flex gap-2">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="bg-white dark:bg-gray-800 rounded-full"
                />
                <IconButton
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="text-green-600 hover:bg-green-50 disabled:text-gray-400"
                >
                  <Send />
                </IconButton>
              </Box>
            </Box>

            <Box className="space-y-3">
              {comments.map((comment) => {
                const commentAuthor = comment.author || {
                  firstName: 'Member',
                  lastName: '',
                  role: 'student' as const,
                };

                return (
                  <Box key={comment._id || comment.id} className="flex gap-2 animate-fade-in">
                    <Avatar
                      src={commentAuthor.avatar || commentAuthor.profilePicture}
                      className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600"
                    >
                      {(commentAuthor.firstName || 'M')[0]}
                    </Avatar>
                    <Box className="flex-1 bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-sm">
                      <Box className="flex items-center gap-2 mb-1">
                        <Typography variant="subtitle2" className="font-semibold">
                          {commentAuthor.firstName || 'Member'} {commentAuthor.lastName || ''}
                        </Typography>
                        <Typography variant="caption" className="text-gray-400 text-xs">
                          {formatRelativeTime(comment.createdAt || new Date().toISOString())}
                        </Typography>
                      </Box>
                      <Typography variant="body2" className="text-gray-700 dark:text-gray-300">{comment.content || ''}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Collapse>
      </Card>

      <ImageModal open={!!selectedImage} imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
};

export default PostCard;
