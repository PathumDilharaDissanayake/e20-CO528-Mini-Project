import { apiSlice } from './api';
import { Chat, Message, PaginatedResponse, ApiResponse } from '@types';

const placeholderUser = (id: string) => ({
  _id: id,
  id,
  firstName: 'User',
  lastName: id.slice(0, 6),
  role: 'student' as const,
});

const normalizeChat = (raw: any): Chat => {
  const participants = Array.isArray(raw?.participants)
    ? raw.participants.map((participant: any) => {
      if (typeof participant === 'string') {
        return placeholderUser(participant);
      }

      const id = participant?._id || participant?.id || '';
      return {
        _id: id,
        id,
        firstName: participant?.firstName || 'User',
        lastName: participant?.lastName || id.slice(0, 6),
        avatar: participant?.avatar,
        role: participant?.role || 'student',
      };
    })
    : [];

  const chatId = raw?._id || raw?.id || '';
  const isGroup = raw?.isGroup ?? raw?.type === 'group';

  return {
    _id: chatId,
    id: chatId,
    participants,
    isGroup,
    type: raw?.type || (isGroup ? 'group' : 'direct'),
    groupName: raw?.groupName || raw?.title,
    title: raw?.title,
    groupAvatar: raw?.groupAvatar,
    lastMessage: raw?.lastMessage,
    unreadCount: Number(raw?.unreadCount || 0),
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
  };
};

const normalizeMessage = (raw: any): Message => {
  const senderId = raw?.sender?._id || raw?.sender?.id || raw?.senderId || '';
  const messageId = raw?._id || raw?.id || '';
  const chatId = raw?.chat || raw?.conversationId || '';

  return {
    _id: messageId,
    id: messageId,
    chat: chatId,
    conversationId: chatId,
    senderId,
    sender: raw?.sender || placeholderUser(senderId || 'unknown'),
    content: raw?.content || '',
    type: raw?.type || 'text',
    attachments: raw?.attachmentUrl ? [{ url: raw.attachmentUrl, type: raw?.type || 'file', name: 'Attachment' }] : [],
    readBy: raw?.readBy || [],
    createdAt: raw?.createdAt,
  };
};

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<ApiResponse<Chat[]>, void>({
      query: () => '/conversations',
      transformResponse: (response: any) => ({
        ...response,
        // Backend returns { data: { conversations: [...] } }
        data: (Array.isArray(response?.data?.conversations)
          ? response.data.conversations
          : Array.isArray(response?.data)
          ? response.data
          : []
        ).map(normalizeChat),
      }),
      providesTags: ['Chat'],
    }),
    getChatById: builder.query<ApiResponse<Chat>, string>({
      query: (chatId) => `/conversations/${chatId}`,
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeChat(response?.data?.conversation || response?.data),
      }),
      providesTags: (result, error, id) => [{ type: 'Chat', id }],
    }),
    getMessages: builder.query<PaginatedResponse<Message>, { chatId: string; page?: number; limit?: number }>({
      query: ({ chatId, page = 1, limit = 50 }) => `/conversations/${chatId}/messages?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.data) ? response.data : [];
        const page = Number(response?.meta?.page || 1);
        const limit = Number(response?.meta?.limit || items.length || 50);
        const total = Number(response?.meta?.total || items.length || 0);

        return {
          data: items.map(normalizeMessage),
          page,
          limit,
          total,
          hasMore: page * limit < total,
        };
      },
      providesTags: ['Message'],
    }),
    createChat: builder.mutation<ApiResponse<Chat>, { participantId: string } | { groupName: string; participantIds: string[] }>({
      query: (data: any) => ({
        url: '/conversations',
        method: 'POST',
        body: data.participantId
          ? { type: 'direct', participants: [data.participantId] }
          : { type: 'group', title: data.groupName, participants: data.participantIds || [] },
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeChat(response?.data || response?.data?.conversation),
      }),
      invalidatesTags: ['Chat'],
    }),
    sendMessage: builder.mutation<ApiResponse<Message>, { chatId: string; content: string; attachments?: File[] }>({
      query: ({ chatId, content }) => ({
        url: `/conversations/${chatId}/messages`,
        method: 'POST',
        body: { content, type: 'text' },
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeMessage(response?.data?.message || response?.data),
      }),
      invalidatesTags: ['Message'],
    }),
    markAsRead: builder.mutation<ApiResponse<void>, string>({
      queryFn: async () => ({
        data: {
          success: true,
          message: 'Read receipts are handled by realtime updates',
          data: undefined,
        },
      }),
      invalidatesTags: ['Chat'],
    }),
    deleteChat: builder.mutation<ApiResponse<void>, string>({
      queryFn: async () => ({
        data: {
          success: true,
          message: 'Delete conversation endpoint is not available',
          data: undefined,
        },
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
});

export const {
  useGetChatsQuery,
  useGetChatByIdQuery,
  useGetMessagesQuery,
  useCreateChatMutation,
  useSendMessageMutation,
  useMarkAsReadMutation,
  useDeleteChatMutation,
} = chatApi;
