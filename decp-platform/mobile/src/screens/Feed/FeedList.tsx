import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Appbar,
  FAB,
  useTheme,
  Text,
  IconButton,
  Badge,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchPosts,
  fetchMorePosts,
  resetFeed,
} from '../../features/feedSlice';
import { fetchUnreadCount } from '../../features/notificationsSlice';
import { RootScreenProps } from '../../navigation/types';
import PostCard from '../../components/PostCard';
import { Post } from '../../types';

type Props = RootScreenProps<'Main'>;

const FeedList: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { posts, isLoading, isLoadingMore, hasMore, page } = useAppSelector(
    (state) => state.feed
  );
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const { user } = useAppSelector((state) => state.auth);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
    dispatch(fetchUnreadCount());

    return () => {
      dispatch(resetFeed());
    };
  }, []);

  const loadPosts = async () => {
    await dispatch(fetchPosts({ page: 1, limit: 10 })).unwrap();
  };

  const loadMorePosts = () => {
    if (!isLoadingMore && hasMore) {
      dispatch(fetchMorePosts({ page: page + 1, limit: 10 }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        onProfilePress={() => navigation.navigate('Profile', { userId: item.author.id })}
      />
    ),
    [navigation]
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          No posts yet. Be the first to share!
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="DECP" />
        <Appbar.Action
          icon="magnify"
          onPress={() => {
            // TODO: Implement search
          }}
        />
        <Appbar.Action
          icon="bell"
          onPress={() => navigation.navigate('Notifications')}
        />
        {unreadCount > 0 && (
          <Badge style={styles.badge} size={16}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {user?.role === 'admin' && (
          <Appbar.Action
            icon="chart-bar"
            onPress={() => navigation.navigate('Analytics')}
          />
        )}
      </Appbar.Header>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreatePost')}
        color="white"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 8,
  },
  footer: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  badge: {
    position: 'absolute',
    right: 45,
    top: 10,
  },
});

export default FeedList;
