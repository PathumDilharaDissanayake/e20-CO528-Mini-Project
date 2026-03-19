import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Appbar, useTheme, Text, ActivityIndicator, Avatar, Badge, Divider } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchConversations } from '../../features/messagesSlice';
import { MessagesScreenProps } from '../../navigation/types';
import { formatRelativeTime } from '../../utils/helpers';
import { Conversation } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = MessagesScreenProps<'Conversations'>;

const ConversationsList: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { conversations, isLoading } = useAppSelector((state) => state.messages);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchConversations());
  }, []);

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.id !== user?.id);
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherParticipant(item);
    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            participantName: `${otherUser.firstName} ${otherUser.lastName}`,
          })
        }
      >
        <Avatar.Image size={56} source={{ uri: otherUser.avatar }} />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text variant="titleSmall" style={styles.participantName}>
              {otherUser.firstName} {otherUser.lastName}
            </Text>
            {item.lastMessage && (
              <Text variant="bodySmall" style={styles.timestamp}>
                {formatRelativeTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <View style={styles.messageRow}>
            <Text variant="bodyMedium" numberOfLines={1} style={styles.lastMessage}>
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
            {item.unreadCount > 0 && (
              <Badge style={styles.unreadBadge} size={22}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Badge>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Messages" />
        <Appbar.Action icon="plus" onPress={() => navigation.navigate('NewConversation')} />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="message-text-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge" style={styles.emptyText}>No conversations yet</Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>Start a new conversation to connect with others</Text>
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
  conversationItem: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  conversationContent: { flex: 1, marginLeft: 12 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  participantName: { fontWeight: '600', flex: 1 },
  timestamp: { opacity: 0.5 },
  messageRow: { flexDirection: 'row', alignItems: 'center' },
  lastMessage: { flex: 1, opacity: 0.7 },
  unreadBadge: { marginLeft: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { opacity: 0.6, marginTop: 16 },
  emptySubtext: { opacity: 0.4, marginTop: 8 },
});

export default ConversationsList;
