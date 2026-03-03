import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Appbar, useTheme, Text, ActivityIndicator, Avatar, IconButton, Divider, Badge } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../features/notificationsSlice';
import { RootScreenProps } from '../../navigation/types';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/helpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = RootScreenProps<'Notifications'>;

const NotificationsList: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { notifications, isLoading } = useAppSelector((state) => state.notifications);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setRefreshing(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return 'heart';
      case 'comment': return 'comment';
      case 'follow': return 'account-plus';
      case 'message': return 'message';
      case 'job': return 'briefcase';
      case 'event': return 'calendar';
      case 'mention': return 'at';
      case 'connection_request': return 'account-network';
      default: return 'bell';
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      dispatch(markNotificationAsRead(notification.id));
    }
    // Navigate based on notification type and data
    if (notification.data?.postId) {
      navigation.navigate('PostDetail', { postId: notification.data.postId });
    } else if (notification.data?.userId) {
      navigation.navigate('Profile', { userId: notification.data.userId });
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, { backgroundColor: item.isRead ? theme.colors.surface : `${theme.colors.primary}10` }]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
        <MaterialCommunityIcons name={getNotificationIcon(item.type)} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.notificationContent}>
        <Text variant="bodyMedium" style={styles.notificationTitle}>{item.title}</Text>
        <Text variant="bodySmall" style={styles.notificationBody}>{item.body}</Text>
        <Text variant="bodySmall" style={styles.timestamp}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
      {!item.isRead && <Badge style={styles.unreadDot} size={10} />}
      <IconButton icon="close" size={16} onPress={() => dispatch(deleteNotification(item.id))} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Notifications" />
        <Appbar.Action icon="check-all" onPress={() => dispatch(markAllNotificationsAsRead())} />
      </Appbar.Header>

      {isLoading && !refreshing ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <Divider />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bell-off" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge" style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { flexGrow: 1 },
  notificationItem: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontWeight: '600', marginBottom: 2 },
  notificationBody: { opacity: 0.7, marginBottom: 4 },
  timestamp: { opacity: 0.5, fontSize: 12 },
  unreadDot: { position: 'absolute', top: 16, right: 48 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { opacity: 0.6, marginTop: 16 },
});

export default NotificationsList;
