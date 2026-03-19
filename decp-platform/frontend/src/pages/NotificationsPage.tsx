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

// ─── Type color config ─────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { border: string; bg: string; iconColor: string; chipBg: string; chipColor: string; label: string }> = {
  connection: {
    border: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    iconColor: '#10b981',
    chipBg: 'rgba(16,185,129,0.12)',
    chipColor: '#059669',
    label: 'Connection',
  },
  like: {
    border: '#ef4444',
    bg: 'rgba(239,68,68,0.06)',
    iconColor: '#ef4444',
    chipBg: 'rgba(239,68,68,0.1)',
    chipColor: '#dc2626',
    label: 'Like',
  },
  mention: {
    border: '#ef4444',
    bg: 'rgba(239,68,68,0.06)',
    iconColor: '#ef4444',
    chipBg: 'rgba(239,68,68,0.1)',
    chipColor: '#dc2626',
    label: 'Mention',
  },
  comment: {
    border: '#3b82f6',
    bg: 'rgba(59,130,246,0.06)',
    iconColor: '#3b82f6',
    chipBg: 'rgba(59,130,246,0.1)',
    chipColor: '#2563eb',
    label: 'Comment',
  },
  share: {
    border: '#10b981',
    bg: 'rgba(16,185,129,0.06)',
    iconColor: '#10b981',
    chipBg: 'rgba(16,185,129,0.1)',
    chipColor: '#059669',
    label: 'Share',
  },
  message: {
    border: '#6366f1',
    bg: 'rgba(99,102,241,0.06)',
    iconColor: '#6366f1',
    chipBg: 'rgba(99,102,241,0.1)',
    chipColor: '#4f46e5',
    label: 'Message',
  },
  job: {
    border: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    iconColor: '#f59e0b',
    chipBg: 'rgba(245,158,11,0.1)',
    chipColor: '#d97706',
    label: 'Job',
  },
  event: {
    border: '#14b8a6',
    bg: 'rgba(20,184,166,0.06)',
    iconColor: '#14b8a6',
    chipBg: 'rgba(20,184,166,0.1)',
    chipColor: '#0d9488',
    label: 'Event',
  },
  research: {
    border: '#06b6d4',
    bg: 'rgba(6,182,212,0.06)',
    iconColor: '#06b6d4',
    chipBg: 'rgba(6,182,212,0.1)',
    chipColor: '#0891b2',
    label: 'Research',
  },
};

const getTypeConfig = (type: string) =>
  TYPE_CONFIG[type] || {
    border: '#94a3b8',
    bg: 'rgba(148,163,184,0.06)',
    iconColor: '#94a3b8',
    chipBg: 'rgba(148,163,184,0.1)',
    chipColor: '#64748b',
    label: 'Notification',
  };

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const getNotificationIcon = (type: string) => {
  const cfg = getTypeConfig(type);
  const sx = { fontSize: 18, color: cfg.iconColor };
  switch (type) {
    case 'like':
    case 'mention': return <Favorite sx={sx} />;
    case 'comment': return <Comment sx={sx} />;
    case 'share':   return <Share sx={sx} />;
    case 'connection': return <PersonAdd sx={sx} />;
    case 'message': return <Message sx={sx} />;
    case 'job':     return <Work sx={sx} />;
    case 'event':   return <Event sx={sx} />;
    case 'research':return <Science sx={sx} />;
    default:        return <NotificationsIcon sx={sx} />;
  }
};

// Navigate target based on notification data
function getNavTarget(notification: Notification): string | null {
  const d = notification.data as any;
  if (d?.postId) return `/?highlight=${d.postId}`;
  if (d?.eventId) return `/events`;
  if (d?.projectId) return `/research`;
  if (d?.jobId) return `/jobs`;
  if (d?.conversationId) return `/messages/${d.conversationId}`;
  if (d?.userId) return `/users/${d.userId}`;
  if (d?.fromUserId) return `/users/${d.fromUserId}`;
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
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #0f172a 100%)',
        }}
      >
        <Box
          className="absolute inset-0 opacity-15"
          sx={{
            backgroundImage: `radial-gradient(circle at 18px 18px, rgba(255,255,255,0.4) 1.5px, transparent 0)`,
            backgroundSize: '30px 30px',
          }}
        />
        <Box sx={{ position: 'absolute', top: '-20%', right: '-5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <Box sx={{ position: 'absolute', bottom: '-30%', left: '10%', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        <Box sx={{ position: 'relative', p: { xs: 2.5, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.35), rgba(5,150,105,0.2))',
                  border: '1px solid rgba(16,185,129,0.4)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <NotificationsIcon sx={{ color: '#6ee7b7', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  color="white"
                  sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
                >
                  Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.3 }}>
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up!'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {unreadCount > 0 && (
                <Chip
                  label={unreadCount}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16,185,129,0.25)',
                    color: '#6ee7b7',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    border: '1px solid rgba(16,185,129,0.45)',
                    height: 26,
                  }}
                />
              )}
              {unreadCount > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<DoneAll sx={{ fontSize: '16px !important' }} />}
                  onClick={handleMarkAllAsRead}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    px: 2,
                    py: 0.75,
                    boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      boxShadow: '0 6px 20px rgba(16,185,129,0.5)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Mark all read
                </Button>
              )}
            </Box>
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
              width: 80,
              height: 80,
              borderRadius: '22px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
              boxShadow: '0 0 30px rgba(16,185,129,0.1)',
            }}
          >
            <NotificationsIcon sx={{ fontSize: 40, color: '#10b981' }} />
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
              <Box key={group} sx={{ mb: 2.5 }}>
                {/* Group label */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, pb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.disabled',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontSize: '0.68rem',
                    }}
                  >
                    {group}
                  </Typography>
                  <Box sx={{ flex: 1, height: '1px', background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }} />
                  <Chip
                    label={items.length}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                      color: 'text.disabled',
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <List disablePadding>
                    {items.map((notification: Notification, index: number) => {
                      const id = notification._id || notification.id || '';
                      const navTarget = getNavTarget(notification);
                      const isClickable = !notification.isRead || !!navTarget;
                      const cfg = getTypeConfig(notification.type);

                      return (
                        <React.Fragment key={id}>
                          <ListItem
                            sx={{
                              py: 2,
                              px: 2.5,
                              cursor: isClickable ? 'pointer' : 'default',
                              // Unread: subtle gradient glow + type-colored left border
                              bgcolor: !notification.isRead
                                ? (t) =>
                                  t.palette.mode === 'dark'
                                    ? `${cfg.bg}`
                                    : `${cfg.bg}`
                                : 'transparent',
                              background: !notification.isRead
                                ? (t) =>
                                  t.palette.mode === 'dark'
                                    ? `linear-gradient(90deg, ${cfg.bg} 0%, transparent 100%)`
                                    : `linear-gradient(90deg, ${cfg.bg} 0%, transparent 100%)`
                                : undefined,
                              borderLeft: `4px solid`,
                              borderLeftColor: !notification.isRead ? cfg.border : 'transparent',
                              transition: 'all 0.25s ease',
                              '&:hover': {
                                bgcolor: (t) =>
                                  t.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.04)'
                                    : 'rgba(0,0,0,0.03)',
                                transform: 'translateX(2px)',
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
                                  transition: 'all 0.2s',
                                  '&:hover': { color: 'error.main', bgcolor: 'rgba(239,68,68,0.08)', transform: 'scale(1.1)' },
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
                                sx={{
                                  '& .MuiBadge-dot': {
                                    width: 11,
                                    height: 11,
                                    border: '2px solid white',
                                    boxShadow: `0 0 6px ${cfg.border}`,
                                  },
                                }}
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: cfg.chipBg,
                                    width: 46,
                                    height: 46,
                                    border: !notification.isRead ? `2px solid ${cfg.border}40` : '2px solid transparent',
                                    boxShadow: !notification.isRead ? `0 0 12px ${cfg.border}30` : 'none',
                                    transition: 'all 0.25s ease',
                                  }}
                                >
                                  {getNotificationIcon(notification.type)}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>

                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
                                  <Typography
                                    variant="body2"
                                    fontWeight={!notification.isRead ? 700 : 500}
                                    sx={{ lineHeight: 1.4, flex: 1 }}
                                  >
                                    {notification.title || 'Notification'}
                                  </Typography>
                                  {/* Type chip */}
                                  <Chip
                                    label={cfg.label}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.58rem',
                                      fontWeight: 700,
                                      bgcolor: cfg.chipBg,
                                      color: cfg.chipColor,
                                      border: `1px solid ${cfg.border}30`,
                                      '& .MuiChip-label': { px: 0.75 },
                                      letterSpacing: '0.03em',
                                    }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.5, display: 'block' }}
                                  >
                                    {notification.message || (notification as any).body || ''}
                                  </Typography>
                                  {/* Stylish timestamp */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                    <Box
                                      sx={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        bgcolor: !notification.isRead ? cfg.border : 'text.disabled',
                                        opacity: 0.7,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.62rem',
                                        fontWeight: !notification.isRead ? 600 : 400,
                                        color: !notification.isRead ? cfg.border : 'text.disabled',
                                        letterSpacing: '0.02em',
                                      }}
                                    >
                                      {timeAgo(notification.createdAt || new Date().toISOString())}
                                    </Typography>
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < items.length - 1 && <Divider sx={{ opacity: 0.6 }} />}
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
