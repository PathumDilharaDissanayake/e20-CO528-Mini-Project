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
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '@services/notificationApi';
import { Notification } from '@types';
import { formatRelativeTime } from '@utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return <Favorite sx={{ fontSize: 18, color: '#ef4444' }} />;
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

const getIconBg = (type: string) => {
  switch (type) {
    case 'like': return 'rgba(239,68,68,0.1)';
    case 'comment': return 'rgba(59,130,246,0.1)';
    case 'share': return 'rgba(22,101,52,0.1)';
    case 'connection': return 'rgba(139,92,246,0.1)';
    case 'message': return 'rgba(245,158,11,0.1)';
    case 'job': return 'rgba(99,102,241,0.1)';
    case 'event': return 'rgba(236,72,153,0.1)';
    case 'research': return 'rgba(6,182,212,0.1)';
    default: return 'rgba(148,163,184,0.1)';
  }
};

export const NotificationsPage: React.FC = () => {
  const { data: notificationsData, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 50 },
    { pollingInterval: 15000 } // Poll every 15 seconds for real-time notifications
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

  const handleDelete = async (id: string) => {
    try { await deleteNotification(id).unwrap(); } catch (e) { console.error(e); }
  };

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
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
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

      {/* Loading */}
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

      {/* Notifications list */}
      {!isLoading && notifications.length > 0 && (
        <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <List disablePadding>
            {notifications.map((notification: Notification, index: number) => {
              const id = notification._id || notification.id || '';
              return (
                <React.Fragment key={id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 2.5,
                      cursor: !notification.isRead ? 'pointer' : 'default',
                      bgcolor: !notification.isRead
                        ? (t) => t.palette.mode === 'dark' ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)'
                        : 'transparent',
                      transition: 'background 0.2s',
                      '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                      pr: 7,
                    }}
                    onClick={() => !notification.isRead && handleMarkAsRead(id)}
                    secondaryAction={
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleDelete(id); }}
                        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: 'rgba(239,68,68,0.08)' } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Badge variant="dot" color="primary" invisible={notification.isRead} overlap="circular"
                        sx={{ '& .MuiBadge-dot': { width: 10, height: 10, border: '2px solid white' } }}>
                        <Avatar sx={{ bgcolor: getIconBg(notification.type), width: 44, height: 44 }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
                            {notification.message || notification.body || ''}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem', mt: 0.25, display: 'block' }}>
                            {formatRelativeTime(notification.createdAt || new Date().toISOString())}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default NotificationsPage;
