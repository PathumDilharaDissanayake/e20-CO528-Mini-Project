import { api } from './api';
import { Conversation, Message } from '../types';
import { extractData, mapUser } from './utils';

const mapMessage = (raw: any): Message => ({
  id: raw?._id || raw?.id || '',
  conversationId: raw?.conversationId || '',
  sender: mapUser(raw?.sender || { id: raw?.senderId || '', firstName: 'User' }),
  content: raw?.content || '',
  type: raw?.type || 'text',
  mediaUrl: raw?.mediaUrl,
  isRead: Array.isArray(raw?.readBy) ? raw.readBy.length > 0 : false,
  createdAt: raw?.createdAt || new Date().toISOString(),
});

const mapConversation = (raw: any): Conversation => {
  const id = raw?._id || raw?.id || '';
  const participantIds = Array.isArray(raw?.participants) ? raw.participants : [];
  return {
    id,
    participants: participantIds.map((participantId: string) =>
      mapUser({ id: participantId, firstName: 'User', lastName: participantId.slice(0, 6) })
    ),
    lastMessage: raw?.lastMessage ? mapMessage(raw.lastMessage) : undefined,
    unreadCount: Number(raw?.unreadCount || 0),
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || raw?.createdAt || new Date().toISOString(),
  };
};

export const messagesService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/conversations');
    const data = extractData<any>(response);
    const conversations = Array.isArray(data?.conversations) ? data.conversations : [];
    return conversations.map(mapConversation);
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    const data = extractData<any[]>(response);
    const messages = Array.isArray(data) ? data : [];
    return messages.map(mapMessage);
  },

  createConversation: async (participantIds: string[]): Promise<Conversation> => {
    const response = await api.post('/conversations', {
      type: participantIds.length > 1 ? 'group' : 'direct',
      title: participantIds.length > 1 ? 'Group Chat' : undefined,
      participants: participantIds,
    });
    const data = extractData<any>(response);
    return mapConversation(data?.conversation || data);
  },

  sendMessage: async (
    conversationId: string,
    messageData: { content: string; type?: Message['type']; mediaUrl?: string }
  ): Promise<Message> => {
    const response = await api.post(`/conversations/${conversationId}/messages`, messageData);
    const data = extractData<any>(response);
    return mapMessage(data?.message || data);
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await Promise.resolve(conversationId);
  },

  deleteMessage: async (conversationId: string, messageId: string): Promise<void> => {
    await Promise.resolve({ conversationId, messageId });
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await Promise.resolve(conversationId);
  },

  archiveConversation: async (conversationId: string): Promise<void> => {
    await Promise.resolve(conversationId);
  },

  unarchiveConversation: async (conversationId: string): Promise<void> => {
    await Promise.resolve(conversationId);
  },

  getConversationByUserId: async (userId: string): Promise<Conversation | null> => {
    const conversations = await messagesService.getConversations();
    return conversations.find((conversation) =>
      conversation.participants.some((participant) => participant.id === userId)
    ) || null;
  },
};
