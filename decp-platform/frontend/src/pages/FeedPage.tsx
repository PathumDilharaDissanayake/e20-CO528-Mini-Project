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
  People,
  Work,
  Event,
  Science,
  EmojiEvents,
  PersonAdd,
  HourglassEmpty,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { CreatePost } from '@components/feed/CreatePost';
import PostCard from '@components/feed/PostCard';
import { FeedSkeleton, EmptyState, ErrorState } from '@components/common';
import { useGetPostsQuery } from '@services/postApi';
import { useGetSuggestedUsersQuery, useGetUsersQuery, useSendConnectionRequestMutation, useGetConnectionsQuery } from '@services/userApi';
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
  const { data: connectionsData } = useGetConnectionsQuery(undefined, { pollingInterval: 60000 });

  const postCount = postsData?.total ?? '—';
  const connectionCount: number | string = connectionsData?.total ?? '—';

  return (
    <Card
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        mb: 2,
        boxShadow: '0 4px 20px rgba(16,185,129,0.18)',
        border: '1px solid rgba(16,185,129,0.15)',
      }}
    >
      {/* Banner */}
      <Box
        sx={{
          height: 72,
          background: 'linear-gradient(135deg, #059669 0%, #10b981 40%, #14b8a6 70%, #0891b2 100%)',
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        onClick={() => navigate('/profile')}
      >
        {/* Animated shimmer overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.25) 1px, transparent 0)`,
            backgroundSize: '22px 22px',
            opacity: 0.6,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            right: -20,
            top: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            right: 30,
            bottom: -30,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
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
        <Divider sx={{ mb: 1.5, borderColor: 'rgba(16,185,129,0.15)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          {[
            { label: 'Posts', value: postCount, color: '#10b981' },
            { label: 'Connections', value: connectionCount, color: '#6366f1' },
          ].map((s) => (
            <Box
              key={s.label}
              sx={{
                textAlign: 'center',
                cursor: 'pointer',
                p: 1,
                borderRadius: '10px',
                transition: 'all 0.2s',
                '&:hover': { background: `${s.color}10`, transform: 'translateY(-1px)' },
              }}
              onClick={() => navigate('/profile')}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${s.color}, ${s.color}bb)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2,
                }}
              >
                {s.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
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
    { label: 'Browse Jobs', icon: Work, path: '/jobs', color: '#10b981', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
    { label: 'View Events', icon: Event, path: '/events', color: '#f59e0b', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },
    { label: 'Research Hub', icon: Science, path: '/research', color: '#14b8a6', gradient: 'linear-gradient(135deg, #0891b2, #14b8a6)' },
    { label: 'Community', icon: People, path: '/search', color: '#6366f1', gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)' },
  ];
  return (
    <Card sx={{ borderRadius: '16px', mb: 2, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmojiEvents fontSize="small" sx={{ color: '#f59e0b', filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }} />
          Quick Access
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          {items.map(({ label, icon: Icon, path, color, gradient }) => (
            <Box
              key={path}
              onClick={() => navigate(path)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                p: 1.5,
                borderRadius: '12px',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: color,
                  background: `${color}12`,
                  transform: 'translateY(-3px)',
                  boxShadow: `0 6px 16px ${color}25`,
                },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: gradient,
                  boxShadow: `0 4px 10px ${color}35`,
                }}
              >
                <Icon sx={{ fontSize: 20, color: '#fff' }} />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center', lineHeight: 1.2, color: 'text.primary' }}>
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
  const [sendConnectionRequest] = useSendConnectionRequestMutation();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const { data: suggestedData, isLoading: isSuggestedLoading, isError: isSuggestedError, refetch } = useGetSuggestedUsersQuery(
    { limit: 6 },
    { refetchOnMountOrArgChange: 60 }
  );

  // Fallback: when /suggested returns an error or empty, use the general user list
  // and filter out self. This ensures the widget always shows real people.
  const suggestedFailed = isSuggestedError || (!isSuggestedLoading && (suggestedData?.data || []).length === 0);
  const { data: fallbackData, isLoading: isFallbackLoading } = useGetUsersQuery(
    { limit: 10 },
    { skip: !suggestedFailed }
  );
  const { refetch: refetchConnections } = useGetConnectionsQuery(undefined);

  const isLoading = isSuggestedLoading || (suggestedFailed && isFallbackLoading);

  const currentId = currentUser?._id || currentUser?.id || '';
  const users = suggestedFailed
    ? (fallbackData?.data || []).filter((u: any) => (u._id || u.id) !== currentId).slice(0, 4)
    : (suggestedData?.data || []).slice(0, 4);

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'faculty': return '#10b981';
      case 'alumni': return '#f59e0b';
      case 'admin': return '#ef4444';
      default: return '#6366f1';
    }
  };

  const handleConnect = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingIds(prev => new Set([...prev, userId]));
    try {
      await sendConnectionRequest(userId).unwrap();
      refetch(); // Refetch suggested users to remove the pending user
      refetchConnections(); // Refetch connections to update the count
    } catch {
      setPendingIds(prev => { const next = new Set(prev); next.delete(userId); return next; });
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

  if (!isLoading && users.length === 0) return null;

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
            const isPending = pendingIds.has(uid);
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
                  <Tooltip title={isPending ? 'Pending' : 'Connect'}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={(e) => !isPending && handleConnect(uid, e)}
                        disabled={isPending}
                        sx={{
                          color: isPending ? 'warning.main' : 'text.secondary',
                          '&:hover': { color: isPending ? 'warning.main' : 'primary.main', background: isPending ? 'rgba(245,158,11,0.1)' : 'rgba(22,101,52,0.1)' },
                          '&.Mui-disabled': { color: 'warning.main', opacity: 0.85 },
                        }}
                      >
                        {isPending ? <HourglassEmpty fontSize="small" /> : <PersonAdd fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                }
                onClick={() => navigate(`/users/${uid}`)}
              >
                <ListItemAvatar sx={{ minWidth: 42 }}>
                  <Avatar
                    src={u.avatar || u.profilePicture}
                    sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700, background: `linear-gradient(135deg,${getRoleColor(u.role)},${getRoleColor(u.role)}bb)` }}
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
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  // Lock prevents the observer from triggering multiple page increments
  // before RTK Query's isFetching flag has time to propagate
  const fetchLockRef = useRef(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetPostsQuery(
    { page, limit: 10 },
    {
      // No polling — avoid re-triggering the observer loop every 30 s
      pollingInterval: 0,
      refetchOnMountOrArgChange: false,
    }
  );

  // Release lock as soon as RTK Query confirms the fetch finished
  useEffect(() => {
    if (!isFetching) fetchLockRef.current = false;
  }, [isFetching]);

  useEffect(() => {
    if (!data?.data) return;

    setAllPosts((prev) => {
      if (data.data.length === 0 && prev.length === 0) return prev;

      const prevIndexMap = new Map<string, number>();
      prev.forEach((p, i) => {
        const id = p._id || p.id || '';
        if (id) prevIndexMap.set(id, i);
      });

      const result = [...prev];
      const toAppend: Post[] = [];
      const toPrepend: Post[] = [];

      data.data.forEach((post) => {
        const id = post._id || post.id || '';
        if (!id) return;

        if (prevIndexMap.has(id)) {
          result[prevIndexMap.get(id)!] = post;
        } else if (!seenIds.current.has(id)) {
          seenIds.current.add(id);
          if (page === 1) {
            toPrepend.push(post);
          } else {
            toAppend.push(post);
          }
        }
      });

      if (toPrepend.length > 0) return [...toPrepend, ...result];
      return toAppend.length > 0 ? [...result, ...toAppend] : result;
    });
  }, [data, page]);

  const handleLoadMore = useCallback(() => {
    // Guard: skip if already loading, locked, or no more pages
    if (fetchLockRef.current || isFetching || !data?.hasMore) return;
    fetchLockRef.current = true;
    setPage((prev) => prev + 1);
  }, [data?.hasMore, isFetching]);

  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore: data?.hasMore || false,
    isLoading: isFetching,
    threshold: 200,
  });

  const handleRefresh = () => {
    fetchLockRef.current = false;
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

  const FEED_ROLE_COLORS: Record<string, { color: string; label: string; gradient: string }> = {
    admin:   { color: '#ef4444', label: 'Admin',   gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    faculty: { color: '#10b981', label: 'Faculty', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    alumni:  { color: '#f59e0b', label: 'Alumni',  gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    student: { color: '#6366f1', label: 'Student', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  };
  const userRoleInfo = FEED_ROLE_COLORS[user?.role || 'student'] || FEED_ROLE_COLORS.student;

  const MOTIVATIONAL: Record<string, string> = {
    admin:   'Shaping the future of your department.',
    faculty: 'Inspiring minds and driving excellence.',
    alumni:  'Your journey continues — share your story.',
    student: 'Every connection is a step forward.',
  };
  const motivationalMsg = MOTIVATIONAL[user?.role || 'student'] || MOTIVATIONAL.student;

  return (
    <Box className="page-enter" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 300px' }, gap: 3, alignItems: 'start' }}>
      {/* ── Centre: Feed ── */}
      <Box>
        {/* Welcome hero banner — shown only when feed is empty (no posts yet) */}
        {displayPosts.length === 0 && !isLoading && !isFetching && (
          <Fade in>
            <Box
              sx={{
                mb: 2.5,
                borderRadius: '18px',
                overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 35%, #14b8a6 65%, #0891b2 100%)',
                boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
              }}
            >
              {/* Decorative circles */}
              <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', bottom: -20, right: 60, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', top: 10, right: 120, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.12) 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                  pointerEvents: 'none',
                }}
              />
              <Avatar
                src={user?.avatar || user?.profilePicture}
                sx={{
                  width: 60,
                  height: 60,
                  border: '3px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  background: userRoleInfo.gradient,
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                {userInitials}
              </Avatar>
              <Box sx={{ zIndex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Typography
                    variant="h6"
                    sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2, fontSize: '1.1rem' }}
                  >
                    Welcome back, {user?.firstName || 'there'}!
                  </Typography>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.25,
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Typography sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                      {userRoleInfo.label.toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.88)', fontWeight: 500, fontSize: '0.875rem' }}
                >
                  {motivationalMsg}
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Create Post Card */}
        <Fade in>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '18px',
              border: '1px solid',
              borderColor: 'rgba(16,185,129,0.25)',
              boxShadow: (t) => t.palette.mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(16,185,129,0.1)',
              background: (t) => t.palette.mode === 'dark'
                ? 'linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.9))'
                : 'rgba(255,255,255,0.98)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #059669, #10b981, #14b8a6, #0891b2)',
              },
            }}
          >
            {/* Top row */}
            <Box className="flex items-center gap-3 mb-3">
              <Avatar
                src={user?.avatar || user?.profilePicture}
                sx={{
                  width: 46,
                  height: 46,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
                  border: '2px solid rgba(16,185,129,0.4)',
                  fontSize: '1.1rem',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 0 4px rgba(16,185,129,0.3)' },
                }}
              >
                {userInitials}
              </Avatar>
              <Box
                className="flex-1 rounded-full px-4 flex items-center cursor-pointer"
                onClick={() => setIsCreateModalOpen(true)}
                sx={{
                  height: 46,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  borderRadius: '23px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: (t) => t.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(16,185,129,0.02)',
                  '&:hover': {
                    borderColor: '#10b981',
                    background: (t) => t.palette.mode === 'dark'
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(16,185,129,0.05)',
                    boxShadow: '0 0 0 3px rgba(16,185,129,0.12)',
                  },
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  What's on your mind, {user?.firstName || 'there'}?
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 1.5, borderColor: 'rgba(16,185,129,0.12)' }} />

            {/* Action buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                startIcon={<PhotoCamera sx={{ fontSize: 18, color: '#45bd62' }} />}
                onClick={() => setIsCreateModalOpen(true)}
                size="small"
                sx={{ flex: 1, py: 0.75, borderRadius: '10px', color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', '&:hover': { background: 'rgba(69,189,98,0.1)', color: '#45bd62' }, transition: 'all 0.2s' }}
              >
                Photo/Video
              </Button>
              <Button
                startIcon={<Event sx={{ fontSize: 18, color: '#e86771' }} />}
                onClick={() => navigate('/events')}
                size="small"
                sx={{ flex: 1, py: 0.75, borderRadius: '10px', color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', '&:hover': { background: 'rgba(232,103,113,0.1)', color: '#e86771' }, transition: 'all 0.2s' }}
              >
                Events
              </Button>
              <Button
                startIcon={<Work sx={{ fontSize: 18, color: '#1876f2' }} />}
                onClick={() => navigate('/jobs')}
                size="small"
                sx={{ flex: 1, py: 0.75, borderRadius: '10px', color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', '&:hover': { background: 'rgba(24,118,242,0.1)', color: '#1876f2' }, transition: 'all 0.2s' }}
              >
                Jobs
              </Button>
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
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #14b8a6 100%)',
                  boxShadow: '0 3px 10px rgba(16,185,129,0.4)',
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #0891b2 100%)',
                    boxShadow: '0 5px 14px rgba(16,185,129,0.5)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                Post
              </Button>
            </Box>
          </Paper>
        </Fade>

        <CreatePost open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleRefresh} />

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
                  <PostCard post={post} onPostUpdate={handleRefresh} />
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
