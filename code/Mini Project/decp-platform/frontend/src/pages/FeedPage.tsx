import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Fade,
  Paper,
  Avatar,
  Divider,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  TrendingUp,
  PhotoCamera,
  VideoLibrary,
  Article,
  People,
  Work,
  Event,
  Science,
  EmojiEvents,
  PersonAdd,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { CreatePost } from '@components/feed/CreatePost';
import { PostCard } from '@components/feed/PostCard';
import { FeedSkeleton, EmptyState, ErrorState } from '@components/common';
import { useGetPostsQuery } from '@services/postApi';
import { useGetUsersQuery, useFollowUserMutation } from '@services/userApi';
import { useGetUserPostsQuery } from '@services/postApi';
import { useInfiniteScroll } from '@hooks';
import { Post } from '@types';

// ─── Right panel widgets ─────────────────────────────────────────────────────

const StatsWidget: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const userId = user?._id || user?.id || '';
  const { data: postsData } = useGetUserPostsQuery(
    { userId, page: 1, limit: 1 },
    { skip: !userId, pollingInterval: 60000 }
  );

  const postCount = postsData?.total ?? '—';
  const connectionCount = Array.isArray(user?.connections) ? user.connections.length : 0;

  return (
    <Card
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        mb: 2,
        boxShadow: '0 2px 8px rgba(22,101,52,0.12)',
      }}
    >
      {/* Banner */}
      <Box
        sx={{
          height: 64,
          background: 'linear-gradient(135deg, #15803d 0%, #166534 50%, #14b8a6 100%)',
          position: 'relative',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/profile')}
      >
        <Box
          className="absolute inset-0 opacity-20"
          sx={{
            backgroundImage: `radial-gradient(circle at 15px 15px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }}
        />
      </Box>
      <CardContent sx={{ pt: 0, pb: '16px !important' }}>
        {/* Avatar overlapping banner */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: -3.5, mb: 1 }}>
          <Avatar
            src={user?.avatar || user?.profilePicture}
            onClick={() => navigate('/profile')}
            sx={{
              width: 56,
              height: 56,
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '1.2rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #15803d, #166534)',
              cursor: 'pointer',
            }}
          >
            {user?.firstName?.[0]?.toUpperCase() || 'U'}
          </Avatar>
        </Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, textAlign: 'center', lineHeight: 1.2, cursor: 'pointer' }}
          onClick={() => navigate('/profile')}
        >
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mb: 1.5 }}>
          {user?.department || user?.role || 'Department Member'}
        </Typography>
        <Divider sx={{ mb: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          {[
            { label: 'Posts', value: postCount },
            { label: 'Connections', value: connectionCount },
          ].map((s) => (
            <Box
              key={s.label}
              sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              onClick={() => navigate('/profile')}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {s.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

const QuickActionsWidget: React.FC = () => {
  const navigate = useNavigate();
  const items = [
    { label: 'Browse Jobs', icon: Work, path: '/jobs', color: '#6366f1' },
    { label: 'View Events', icon: Event, path: '/events', color: '#f59e0b' },
    { label: 'Research Hub', icon: Science, path: '/research', color: '#3b82f6' },
    { label: 'Community', icon: People, path: '/search', color: '#166534' },
  ];
  return (
    <Card sx={{ borderRadius: '16px', mb: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmojiEvents fontSize="small" sx={{ color: 'primary.main' }} />
          Quick Access
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          {items.map(({ label, icon: Icon, path, color }) => (
            <Box
              key={path}
              onClick={() => navigate(path)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                p: 1.5,
                borderRadius: '12px',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': { borderColor: color, background: `${color}10`, transform: 'translateY(-2px)' },
              }}
            >
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}18` }}>
                <Icon sx={{ fontSize: 20, color }} />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

const SuggestedUsersWidget: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [followUser] = useFollowUserMutation();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useGetUsersQuery(
    { limit: 6 },
    { refetchOnMountOrArgChange: 60 }
  );

  const users = (data?.data || [])
    .filter((u: any) => (u._id || u.id) !== (currentUser?._id || currentUser?.id))
    .slice(0, 4);

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'faculty': return '#166534';
      case 'alumni': return '#f59e0b';
      case 'admin': return '#ef4444';
      default: return '#6366f1';
    }
  };

  const handleFollow = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowedIds(prev => new Set([...prev, userId]));
    try {
      await followUser(userId).unwrap();
    } catch {
      setFollowedIds(prev => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: '16px', mb: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUp fontSize="small" sx={{ color: 'primary.main' }} />
            People You May Know
          </Typography>
          {[1, 2, 3].map(i => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
              <Skeleton variant="circular" width={34} height={34} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="40%" height={12} />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError || users.length === 0) return null;

  return (
    <Card sx={{ borderRadius: '16px', mb: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TrendingUp fontSize="small" sx={{ color: 'primary.main' }} />
          People You May Know
        </Typography>
        <List disablePadding>
          {users.map((u: any, i: number) => {
            const uid = u._id || u.id || String(i);
            const isFollowed = followedIds.has(uid);
            return (
              <ListItem
                key={uid}
                disablePadding
                sx={{
                  py: 0.75,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  px: 0.5,
                  transition: 'background 0.2s',
                  '&:hover': { background: 'rgba(16,185,129,0.06)' },
                }}
                secondaryAction={
                  <Tooltip title={isFollowed ? 'Connected' : 'Connect'}>
                    <IconButton
                      size="small"
                      onClick={(e) => !isFollowed && handleFollow(uid, e)}
                      sx={{
                        color: isFollowed ? 'primary.main' : 'text.secondary',
                        '&:hover': { color: 'primary.main', background: 'rgba(22,101,52,0.1)' },
                      }}
                    >
                      <PersonAdd fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
                onClick={() => navigate(`/users/${uid}`)}
              >
                <ListItemAvatar sx={{ minWidth: 42 }}>
                  <Avatar
                    src={u.avatar || u.profilePicture}
                    sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700, background: 'linear-gradient(135deg,#15803d,#166534)' }}
                  >
                    {u.firstName?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: '0.8rem' }}>
                      {u.firstName} {u.lastName}
                    </Typography>
                  }
                  secondary={
                    <Chip
                      label={u.role || 'student'}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        color: getRoleColor(u.role),
                        borderColor: getRoleColor(u.role),
                        mt: 0.25,
                      }}
                      variant="outlined"
                    />
                  }
                />
              </ListItem>
            );
          })}
        </List>
        <Button
          size="small"
          onClick={() => navigate('/search')}
          sx={{ mt: 1, fontSize: '0.75rem', color: 'primary.main', fontWeight: 600, width: '100%' }}
        >
          See more people
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Main Feed Page ───────────────────────────────────────────────────────────

export const FeedPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  const { data, isLoading, isFetching, isError, error, refetch } = useGetPostsQuery(
    { page, limit: 10 },
    {
      pollingInterval: page === 1 ? 30000 : 0,
      refetchOnMountOrArgChange: 30, // Refresh if data is > 30s old on mount
    }
  );

  useEffect(() => {
    if (!data?.data) return;

    setAllPosts((prev) => {
      if (data.data.length === 0 && prev.length === 0) return prev;

      // Build an index of existing posts by ID for O(1) lookup
      const prevIndexMap = new Map<string, number>();
      prev.forEach((p, i) => {
        const id = p._id || p.id || '';
        if (id) prevIndexMap.set(id, i);
      });

      const result = [...prev];
      const toAppend: Post[] = [];

      data.data.forEach((post) => {
        const id = post._id || post.id || '';
        if (!id) return;

        if (prevIndexMap.has(id)) {
          // UPDATE the existing post with fresh server data (fixes stale likes/comments)
          result[prevIndexMap.get(id)!] = post;
        } else if (!seenIds.current.has(id)) {
          // ADD new post (pagination / new posts from polling)
          seenIds.current.add(id);
          toAppend.push(post);
        }
      });

      return toAppend.length > 0 ? [...result, ...toAppend] : result;
    });
  }, [data]);

  const handleLoadMore = useCallback(() => {
    if (data?.hasMore && !isFetching) setPage((prev) => prev + 1);
  }, [data?.hasMore, isFetching]);

  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore: data?.hasMore || false,
    isLoading: isFetching,
  });

  const handleRefresh = () => {
    setAllPosts([]);
    seenIds.current.clear();
    setPage(1);
    refetch();
  };

  const getErrorMessage = () => {
    if (!error) return 'Something went wrong. Please try again.';
    if ('data' in error && error.data && typeof error.data === 'object' && 'message' in (error.data as any))
      return (error.data as any).message as string;
    if ('message' in error && typeof (error as any).message === 'string') return (error as any).message as string;
    return 'Something went wrong. Please try again.';
  };

  // Use data.data directly as fallback so posts show without waiting for the useEffect
  // This eliminates the empty-state flash between skeleton unmounting and effect firing
  const displayPosts = allPosts.length > 0 ? allPosts : (data?.data || []);

  // Loading state — only show skeleton on initial load (no cached data yet)
  if (isLoading && page === 1 && displayPosts.length === 0) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 300px' }, gap: 3, alignItems: 'start' }}>
        <Box>
          <Paper sx={{ p: 2, mb: 2, borderRadius: '16px' }}>
            <Box className="flex items-center gap-3">
              <Skeleton variant="circular" width={42} height={42} />
              <Skeleton variant="rounded" height={44} sx={{ flex: 1, borderRadius: '22px' }} />
            </Box>
          </Paper>
          <FeedSkeleton count={3} />
        </Box>
        <Box className="hidden xl:block" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box className="max-w-2xl mx-auto">
        <ErrorState
          title="Failed to load feed"
          message={getErrorMessage()}
          action={
            <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
              Try Again
            </Button>
          }
        />
      </Box>
    );
  }

  const userInitials = user?.firstName?.[0]?.toUpperCase() || 'U';

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 300px' }, gap: 3, alignItems: 'start' }}>
      {/* ── Centre: Feed ── */}
      <Box>
        {/* Create Post Card */}
        <Fade in>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(16,185,129,0.08)',
            }}
          >
            {/* Top row */}
            <Box className="flex items-center gap-3 mb-3">
              <Avatar
                src={user?.avatar || user?.profilePicture}
                sx={{
                  width: 42,
                  height: 42,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #15803d, #166534)',
                }}
              >
                {userInitials}
              </Avatar>
              <Box
                className="flex-1 rounded-full px-4 flex items-center cursor-pointer transition-colors"
                onClick={() => setIsCreateModalOpen(true)}
                sx={{
                  height: 44,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    background: (t) =>
                      t.palette.mode === 'dark' ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  What's on your mind, {user?.firstName || 'there'}?
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            {/* Action buttons */}
            <Box className="flex items-center justify-between gap-2">
              {[
                { icon: PhotoCamera, label: 'Photo', color: '#166534' },
                { icon: VideoLibrary, label: 'Video', color: '#6366f1' },
                { icon: Article, label: 'Article', color: '#f59e0b' },
              ].map(({ icon: Icon, label, color }) => (
                <Button
                  key={label}
                  startIcon={<Icon sx={{ fontSize: 18, color }} />}
                  onClick={() => setIsCreateModalOpen(true)}
                  size="small"
                  sx={{
                    flex: 1,
                    py: 0.75,
                    borderRadius: '10px',
                    color: 'text.secondary',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    '&:hover': { background: `${color}12`, color },
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </Button>
              ))}
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={() => setIsCreateModalOpen(true)}
                sx={{
                  borderRadius: '10px',
                  py: 0.75,
                  px: 2,
                  fontSize: '0.8rem',
                  background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                Post
              </Button>
            </Box>
          </Paper>
        </Fade>

        <CreatePost open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

        {/* Posts */}
        {displayPosts.length === 0 && !isLoading && !isFetching ? (
          <EmptyState
            icon="empty"
            title="No posts yet"
            description="Be the first to share something with your department community!"
            action={
              <Button variant="contained" onClick={() => setIsCreateModalOpen(true)} startIcon={<AddIcon />}>
                Create Post
              </Button>
            }
          />
        ) : (
          <>
            {displayPosts.map((post, index) => (
              <Fade
                key={post._id || post.id || index}
                in
                style={{ transitionDelay: `${Math.min(index * 30, 200)}ms` }}
              >
                <Box>
                  <PostCard post={post} onPostUpdated={handleRefresh} />
                </Box>
              </Fade>
            ))}
            <Box ref={loadMoreRef} className="h-16 flex items-center justify-center">
              {isFetching ? (
                <CircularProgress size={24} sx={{ color: 'primary.main' }} />
              ) : !data?.hasMore && displayPosts.length > 0 ? (
                <Typography variant="caption" color="text.disabled">
                  You're all caught up ✓
                </Typography>
              ) : null}
            </Box>
          </>
        )}
      </Box>

      {/* ── Right panel (xl only) ── */}
      <Box className="hidden xl:block sticky" sx={{ top: 80 }}>
        <StatsWidget />
        <QuickActionsWidget />
        <SuggestedUsersWidget />
      </Box>
    </Box>
  );
};

export default FeedPage;
