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
} from '@mui/icons-material';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '@services/notificationApi';
import { EmptyState } from '@components/common';
import { Notification } from '@types';
import { formatRelativeTime } from '@utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return <Favorite className="text-red-500" />;
    case 'comment': return <Comment className="text-blue-500" />;
    case 'share': return <Share className="text-green-500" />;
    case 'connection': return <PersonAdd className="text-purple-500" />;
    case 'message': return <Message className="text-orange-500" />;
    case 'job': return <Work className="text-brown-500" />;
    case 'event': return <Event className="text-pink-500" />;
    case 'research': return <Science className="text-cyan-500" />;
    default: return null;
  }
};

export const NotificationsPage: React.FC = () => {
  const { data: notificationsData, isLoading } = useGetNotificationsQuery({});
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = notificationsData?.data || [];

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  if (isLoading) {
    return (
      <Box className="max-w-3xl mx-auto">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box className="max-w-3xl mx-auto">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold">
          Notifications
        </Typography>
        {notifications.some((n: Notification) => !n.isRead) && (
          <Button
            startIcon={<DoneAll />}
            onClick={handleMarkAllAsRead}
            className="text-blue-600"
          >
            Mark all as read
          </Button>
        )}
      </Box>

      {notifications.length === 0 ? (
        <EmptyState
          icon="empty"
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <Box className="bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden">
          <List className="p-0">
            {notifications.map((notification: Notification, index: number) => (
              <React.Fragment key={notification._id || notification.id}>
                <ListItem
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                    ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                  `}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(notification._id || notification.id || '')}
                      className="text-gray-400 hover:text-red-500"
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
                    >
                      <Avatar className="bg-gray-100 dark:bg-gray-700">
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                    <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        className={`${!notification.isRead ? 'font-semibold' : ''}`}
                      >
                        {notification.title || 'Notification'}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          className="text-gray-600 dark:text-gray-400"
                        >
                          {notification.message || notification.body || ''}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="text-gray-400 mt-1 block"
                        >
                          {formatRelativeTime(notification.createdAt || new Date().toISOString())}
                        </Typography>
                      </Box>
                    }
                    onClick={() => !notification.isRead && handleMarkAsRead(notification._id || notification.id || '')}
                    className="cursor-pointer"
                  />
                </ListItem>
                {index < notifications.length - 1 && (
                  <Divider className="my-0" />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default NotificationsPage;
