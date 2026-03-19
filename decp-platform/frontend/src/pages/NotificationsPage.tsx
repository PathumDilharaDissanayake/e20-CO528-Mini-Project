import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  Divider,
  Badge,
  Paper,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Delete,
  DoneAll,
  Favorite,
  Comment,
  Share,
  PersonAdd,
  Message,
  Work,
  Event,
  Science,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '@services/notificationApi';
import { Notification } from '@types';

// ─── Time helpers ─────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getGroup(dateStr: string): 'Today' | 'This week' | 'Earlier' {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = diff / 3600000;
  if (hours < 24) return 'Today';
  if (hours < 168) return 'This week';
  return 'Earlier';
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return <Favorite sx={{ fontSize: 18, color: '#ef4444' }} />;
    case 'mention': return <Favorite sx={{ fontSize: 18, color: '#ef4444' }} />;
    case 'comment': return <Comment sx={{ fontSize: 18, color: '#3b82f6' }} />;
    case 'share': return <Share sx={{ fontSize: 18, color: '#166534' }} />;
    case 'connection': return <PersonAdd sx={{ fontSize: 18, color: '#8b5cf6' }} />;
    case 'message': return <Message sx={{ fontSize: 18, color: '#f59e0b' }} />;
    case 'job': return <Work sx={{ fontSize: 18, color: '#6366f1' }} />;
    case 'event': return <Event sx={{ fontSize: 18, color: '#ec4899' }} />;
    case 'research': return <Science sx={{ fontSize: 18, color: '#06b6d4' }} />;
    default: return <NotificationsIcon sx={{ fontSize: 18, color: '#94a3b8' }} />;
  }
};

const getIconBg = (type: string): string => {
  switch (type) {
    case 'like':
    case 'mention': return 'rgba(239,68,68,0.12)';
    case 'comment': return 'rgba(59,130,246,0.12)';
    case 'share': return 'rgba(22,101,52,0.12)';
    case 'connection': return 'rgba(139,92,246,0.12)';
    case 'message': return 'rgba(245,158,11,0.12)';
    case 'job': return 'rgba(99,102,241,0.12)';
    case 'event': return 'rgba(236,72,153,0.12)';
    case 'research': return 'rgba(6,182,212,0.12)';
    default: return 'rgba(148,163,184,0.12)';
  }
};

// Navigate target based on notification data
function getNavTarget(notification: Notification): string | null {
  const d = notification.data as any;
  // Specific content links
  if (d?.postId) return `/?highlight=${d.postId}`;
  if (d?.eventId) return `/events`;
  if (d?.projectId) return `/research`;
  if (d?.jobId) return `/jobs`;
  if (d?.conversationId) return `/messages/${d.conversationId}`;
  // User profile links
  if (d?.userId) return `/users/${d.userId}`;
  if (d?.fromUserId) return `/users/${d.fromUserId}`;
  // Type-based fallbacks
  if (notification.type === 'connection') return `/profile`;
  if (notification.type === 'message') return `/messages`;
  if (notification.type === 'job') return `/jobs`;
  if (notification.type === 'event') return `/events`;
  if (notification.type === 'research') return `/research`;
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: notificationsData, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 50 },
    { pollingInterval: 15000 }
  );
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications: Notification[] = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try { await markAsRead(id).unwrap(); } catch (e) { console.error(e); }
  };

  const handleMarkAllAsRead = async () => {
    try { await markAllAsRead().unwrap(); } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await deleteNotification(id).unwrap(); } catch (e) { console.error(e); }
  };

  const handleClick = (notification: Notification, id: string) => {
    if (!notification.isRead) handleMarkAsRead(id);
    const target = getNavTarget(notification);
    if (target) navigate(target);
  };

  // Group notifications
  const groups: Record<string, Notification[]> = { Today: [], 'This week': [], Earlier: [] };
  notifications.forEach((n) => {
    const g = getGroup(n.createdAt || new Date().toISOString());
    groups[g].push(n);
  });
  const groupOrder: Array<'Today' | 'This week' | 'Earlier'> = ['Today', 'This week', 'Earlier'];

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto' }}>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="white">Notifications</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700 }}
              />
            )}
            {unreadCount > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<DoneAll />}
                onClick={handleMarkAllAsRead}
                sx={{
                  borderColor: 'rgba(255,255,255,0.6)',
                  color: 'white',
                  borderRadius: '20px',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Loading skeletons */}
      {isLoading && (
        <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <List disablePadding>
            {[1, 2, 3, 4].map((i) => (
              <React.Fragment key={i}>
                <ListItem sx={{ py: 2, px: 2.5 }}>
                  <ListItemAvatar>
                    <Skeleton variant="circular" width={44} height={44} />
                  </ListItemAvatar>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="60%" height={18} sx={{ mb: 0.5 }} />
                    <Skeleton width="80%" height={14} />
                    <Skeleton width="30%" height={12} sx={{ mt: 0.5 }} />
                  </Box>
                </ListItem>
                {i < 4 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '20px',
              background: 'rgba(22,101,52,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <NotificationsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>You're all caught up!</Typography>
          <Typography variant="body2" color="text.secondary">No new notifications right now.</Typography>
        </Paper>
      )}

      {/* Grouped notifications */}
      {!isLoading && notifications.length > 0 && (
        <>
          {groupOrder.map((group) => {
            const items = groups[group];
            if (items.length === 0) return null;
            return (
              <Box key={group} sx={{ mb: 2 }}>
                {/* Group label */}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 1,
                    pb: 1,
                    color: 'text.disabled',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: '0.68rem',
                  }}
                >
                  {group}
                </Typography>

                <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <List disablePadding>
                    {items.map((notification: Notification, index: number) => {
                      const id = notification._id || notification.id || '';
                      const navTarget = getNavTarget(notification);
                      const isClickable = !notification.isRead || !!navTarget;

                      return (
                        <React.Fragment key={id}>
                          <ListItem
                            sx={{
                              py: 2,
                              px: 2.5,
                              cursor: isClickable ? 'pointer' : 'default',
                              bgcolor: !notification.isRead
                                ? (t) =>
                                  t.palette.mode === 'dark'
                                    ? 'rgba(16,185,129,0.07)'
                                    : 'rgba(16,185,129,0.05)'
                                : 'transparent',
                              borderLeft: !notification.isRead
                                ? '4px solid'
                                : '4px solid transparent',
                              borderLeftColor: !notification.isRead ? 'primary.main' : 'transparent',
                              transition: 'background 0.2s, border-color 0.2s',
                              '&:hover': {
                                bgcolor: (t) =>
                                  t.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.04)'
                                    : 'rgba(0,0,0,0.03)',
                              },
                              pr: 7,
                            }}
                            onClick={() => isClickable && handleClick(notification, id)}
                            secondaryAction={
                              <IconButton
                                size="small"
                                onClick={(e) => handleDelete(id, e)}
                                sx={{
                                  color: 'text.disabled',
                                  '&:hover': { color: 'error.main', bgcolor: 'rgba(239,68,68,0.08)' },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            }
                          >
                            <ListItemAvatar>
                              <Badge
                                variant="dot"
                                color="primary"
                                invisible={notification.isRead}
                                overlap="circular"
                                sx={{ '& .MuiBadge-dot': { width: 10, height: 10, border: '2px solid white' } }}
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: getIconBg(notification.type),
                                    width: 44,
                                    height: 44,
                                  }}
                                >
                                  {getNotificationIcon(notification.type)}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>

                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  fontWeight={!notification.isRead ? 700 : 500}
                                  sx={{ lineHeight: 1.4 }}
                                >
                                  {notification.title || 'Notification'}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.4, display: 'block' }}
                                  >
                                    {notification.message || (notification as any).body || ''}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.disabled"
                                    sx={{ fontSize: '0.62rem', mt: 0.25, display: 'block' }}
                                  >
                                    {timeAgo(notification.createdAt || new Date().toISOString())}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < items.length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Paper>
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
};

export default NotificationsPage;
