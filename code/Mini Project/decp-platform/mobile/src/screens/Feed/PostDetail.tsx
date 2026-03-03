import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  IconButton,
  Text,
  ActivityIndicator,
  Appbar,
  Avatar,
  Divider,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchPostById,
  addComment,
  clearCurrentPost,
  likePost,
  unlikePost,
} from '../../features/feedSlice';
import { RootScreenProps } from '../../navigation/types';
import { formatRelativeTime } from '../../utils/helpers';
import { Comment } from '../../types';

type Props = RootScreenProps<'PostDetail'>;

const PostDetail: React.FC<Props> = ({ route, navigation }) => {
  const { postId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { currentPost, isLoading } = useAppSelector((state) => state.feed);
  const { user } = useAppSelector((state) => state.auth);

  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchPostById(postId));

    return () => {
      dispatch(clearCurrentPost());
    };
  }, [postId]);

  const handleLike = async () => {
    if (!currentPost) return;

    if (currentPost.isLiked) {
      await dispatch(unlikePost(currentPost.id));
    } else {
      await dispatch(likePost(currentPost.id));
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentPost) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        addComment({ postId: currentPost.id, content: commentText.trim() })
      ).unwrap();
      setCommentText('');
    } catch (error) {
      // Error handled by slice
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <View style={styles.commentItem}>
        <Avatar.Image
          size={36}
          source={{ uri: item.author.avatar }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text variant="bodySmall" style={styles.commentAuthor}>
              {item.author.firstName} {item.author.lastName}
            </Text>
            <Text variant="bodyMedium">{item.content}</Text>
          </View>
          <Text variant="bodySmall" style={styles.commentTime}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </View>
    ),
    []
  );

  if (isLoading || !currentPost) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Post" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Post" />
        {currentPost.author.id === user?.id && (
          <Appbar.Action
            icon="dots-vertical"
            onPress={() => {
              // TODO: Show post options menu
            }}
          />
        )}
      </Appbar.Header>

      <FlatList
        data={currentPost.comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.postHeader}>
              <Avatar.Image
                size={48}
                source={{ uri: currentPost.author.avatar }}
                style={styles.avatar}
              />
              <View style={styles.postHeaderText}>
                <Text variant="titleSmall" style={styles.authorName}>
                  {currentPost.author.firstName} {currentPost.author.lastName}
                </Text>
                <Text variant="bodySmall" style={styles.postTime}>
                  {formatRelativeTime(currentPost.createdAt)}
                </Text>
              </View>
            </View>

            <Text variant="bodyLarge" style={styles.postContent}>
              {currentPost.content}
            </Text>

            {currentPost.media && currentPost.media.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mediaScroll}
              >
                {currentPost.media.map((mediaItem) => (
                  <Image
                    key={mediaItem.id}
                    source={{ uri: mediaItem.url }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}

            <View style={styles.statsRow}>
              <Text variant="bodySmall" style={styles.statsText}>
                {currentPost.likes.length} likes
              </Text>
              <Text variant="bodySmall" style={styles.statsText}>
                {currentPost.comments.length} comments
              </Text>
            </View>

            <Divider />

            <View style={styles.actionsRow}>
              <IconButton
                icon={currentPost.isLiked ? 'heart' : 'heart-outline'}
                iconColor={currentPost.isLiked ? theme.colors.error : theme.colors.onSurface}
                size={24}
                onPress={handleLike}
              />
              <Text variant="bodyMedium">Like</Text>

              <IconButton
                icon="comment-outline"
                size={24}
                onPress={() => {
                  // Focus on comment input
                }}
              />
              <Text variant="bodyMedium">Comment</Text>

              <IconButton
                icon="share-outline"
                size={24}
                onPress={() => {
                  // TODO: Implement share
                }}
              />
              <Text variant="bodyMedium">Share</Text>
            </View>

            <Divider />

            <Text variant="titleSmall" style={styles.commentsHeader}>
              Comments
            </Text>
          </>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.noComments}>
            <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
              No comments yet. Be the first to comment!
            </Text>
          </View>
        }
      />

      <View style={[styles.commentInputContainer, { backgroundColor: theme.colors.surface }]}>
        <Avatar.Image
          size={36}
          source={{ uri: user?.avatar }}
          style={styles.commentInputAvatar}
        />
        <TextInput
          placeholder="Write a comment..."
          value={commentText}
          onChangeText={setCommentText}
          style={[styles.commentInput, { backgroundColor: theme.colors.background }]}
          multiline
          maxLength={500}
          disabled={isSubmitting}
        />
        <Button
          mode="text"
          onPress={handleAddComment}
          disabled={!commentText.trim() || isSubmitting}
          loading={isSubmitting}
        >
          Post
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
  },
  postTime: {
    opacity: 0.6,
  },
  postContent: {
    marginBottom: 12,
    lineHeight: 22,
  },
  mediaScroll: {
    marginBottom: 12,
  },
  mediaImage: {
    width: 300,
    height: 200,
    borderRadius: 8,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsText: {
    opacity: 0.6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  commentsHeader: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  commentAuthor: {
    fontWeight: '600',
    marginBottom: 4,
  },
  commentTime: {
    opacity: 0.5,
    marginTop: 4,
    marginLeft: 12,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentInputAvatar: {
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    maxHeight: 100,
    paddingHorizontal: 16,
  },
});

export default PostDetail;
