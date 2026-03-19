import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, Avatar, IconButton, useTheme, Divider } from 'react-native-paper';
import { Post } from '../types';
import { formatRelativeTime } from '../utils/helpers';
import { useAppDispatch } from '../store';
import { likePost, unlikePost } from '../features/feedSlice';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onProfilePress?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPress, onProfilePress }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const handleLike = async () => {
    if (post.isLiked) {
      await dispatch(unlikePost(post.id));
    } else {
      await dispatch(likePost(post.id));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onProfilePress}>
          <Avatar.Image size={40} source={{ uri: post.author.avatar }} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={onProfilePress}>
            <Text variant="titleSmall" style={styles.authorName}>
              {post.author.firstName} {post.author.lastName}
            </Text>
          </TouchableOpacity>
          <Text variant="bodySmall" style={styles.timestamp}>
            {formatRelativeTime(post.createdAt)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Text variant="bodyMedium" style={styles.content} numberOfLines={5}>
          {post.content}
        </Text>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <View style={styles.mediaContainer}>
            {post.media.slice(0, 4).map((mediaItem, index) => (
              <View key={mediaItem.id} style={styles.mediaWrapper}>
                <Image source={{ uri: mediaItem.url }} style={styles.mediaImage} />
                {post.media!.length > 4 && index === 3 && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreText}>+{post.media!.length - 4}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      <Divider style={styles.divider} />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <IconButton
            icon={post.isLiked ? 'heart' : 'heart-outline'}
            iconColor={post.isLiked ? theme.colors.error : theme.colors.onSurface}
            size={20}
            onPress={handleLike}
          />
          <Text variant="bodySmall" style={styles.actionText}>
            {post.likes.length || 'Like'}
          </Text>
        </View>

        <View style={styles.actionItem}>
          <IconButton icon="comment-outline" size={20} onPress={onPress} />
          <Text variant="bodySmall" style={styles.actionText}>
            {post.comments.length || 'Comment'}
          </Text>
        </View>

        <View style={styles.actionItem}>
          <IconButton icon="share-outline" size={20} />
          <Text variant="bodySmall" style={styles.actionText}>
            Share
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
  },
  timestamp: {
    opacity: 0.6,
  },
  content: {
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  mediaWrapper: {
    width: '50%',
    padding: 4,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 8,
  },
  moreText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: -4,
    opacity: 0.7,
  },
});

export default PostCard;
