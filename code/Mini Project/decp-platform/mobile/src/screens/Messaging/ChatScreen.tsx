import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TextInput as RNTextInput } from 'react-native';
import { IconButton, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMessages, sendMessage, markAsRead, addMessage, clearCurrentConversation } from '../../features/messagesSlice';
import { socketService } from '../../services/socketService';
import { RootScreenProps } from '../../navigation/types';
import { Message } from '../../types';
import { formatRelativeTime } from '../../utils/helpers';

type Props = RootScreenProps<'Chat'>;

const ChatScreen: React.FC<Props> = ({ route }) => {
  const { conversationId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { messages, currentConversation, isLoading, isSending } = useAppSelector((state) => state.messages);
  const { user } = useAppSelector((state) => state.auth);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    dispatch(fetchMessages(conversationId));
    socketService.joinConversation(conversationId);
    dispatch(markAsRead(conversationId));

    return () => {
      socketService.leaveConversation(conversationId);
      dispatch(clearCurrentConversation());
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    const text = messageText.trim();
    setMessageText('');
    await dispatch(sendMessage({ conversationId, content: text }));
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMe = item.sender.id === user?.id;
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.messageBubble, { backgroundColor: isMe ? theme.colors.primary : theme.colors.surface }]}>
          <Text style={{ color: isMe ? 'white' : theme.colors.onSurface }}>{item.content}</Text>
        </View>
        <Text variant="bodySmall" style={styles.timestamp}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
    );
  }, [user, theme]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            inverted={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
            <RNTextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.onSurface }]}
              multiline
              maxLength={1000}
            />
            <IconButton icon="send" size={24} onPress={handleSend} disabled={!messageText.trim() || isSending} loading={isSending} />
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageContainer: { marginBottom: 12, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end' },
  theirMessage: { alignSelf: 'flex-start' },
  messageBubble: { padding: 12, borderRadius: 16, borderBottomRightRadius: 4 },
  timestamp: { opacity: 0.5, marginTop: 4, fontSize: 11 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, marginRight: 8 },
});

export default ChatScreen;
