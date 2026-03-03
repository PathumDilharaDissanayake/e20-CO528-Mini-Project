import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Appbar,
  useTheme,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchUserPosts,
  fetchMoreUserPosts,
  clearProfile,
} from '../../features/profileSlice';
import { RootScreenProps } from '../../navigation/types';
import PostCard from '../../components/PostCard';
import { Post } from '../../types';

type Props = RootScreenProps<'UserPosts'>;

const UserPosts: React.FC<Props> = ({ route, navigation }) => {
  const { userId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { posts, isLoading, isLoadingMore, hasMore, page } = useAppSelector(
    (state) => state.profile
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();

    return () => {
      dispatch(clearProfile());
    };
  }, [userId]);

  const loadPosts = async () => {
    await dispatch(fetchUserPosts({ userId, params: { page: 1, limit: 10 } })).unwrap();
  };

  const loadMorePosts = () => {
    if (!isLoadingMore && hasMore) {
      dispatch(fetchMoreUserPosts({ userId, params: { page: page + 1, limit: 10 } }));
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
          No posts yet
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Posts" />
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
});

export default UserPosts;
