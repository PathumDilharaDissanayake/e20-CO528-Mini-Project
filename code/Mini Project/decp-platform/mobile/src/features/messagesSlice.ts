import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '../types';
import { messagesService } from '../services/messagesService';

interface MessagesState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  typingUsers: Record<string, boolean>;
  onlineUsers: string[];
}

const initialState: MessagesState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,
  typingUsers: {},
  onlineUsers: [],
};

export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messagesService.getConversations();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const response = await messagesService.getMessages(conversationId);
      return { conversationId, messages: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const createConversation = createAsyncThunk(
  'messages/createConversation',
  async (participantIds: string[], { rejectWithValue }) => {
    try {
      const response = await messagesService.createConversation(participantIds);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (
    { conversationId, content, type = 'text' }: 
    { conversationId: string; content: string; type?: Message['type'] },
    { rejectWithValue }
  ) => {
    try {
      const response = await messagesService.sendMessage(conversationId, { content, type });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      await messagesService.markAsRead(conversationId);
      return conversationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async ({ conversationId, messageId }: { conversationId: string; messageId: string }, { rejectWithValue }) => {
    try {
      await messagesService.deleteMessage(conversationId, messageId);
      return { conversationId, messageId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message');
    }
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      if (state.currentConversation?.id === message.conversationId) {
        state.messages = [...state.messages, message];
      }
      // Update last message in conversations list
      const conversationIndex = state.conversations.findIndex(
        (c) => c.id === message.conversationId
      );
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        state.conversations[conversationIndex].updatedAt = message.createdAt;
        // Move to top
        const conversation = state.conversations.splice(conversationIndex, 1)[0];
        state.conversations.unshift(conversation);
      }
    },
    setTypingStatus: (state, action: PayloadAction<{ userId: string; isTyping: boolean }>) => {
      const { userId, isTyping } = action.payload;
      state.typingUsers[userId] = isTyping;
    },
    setOnlineStatus: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const { userId, isOnline } = action.payload;
      if (isOnline) {
        if (!state.onlineUsers.includes(userId)) {
          state.onlineUsers.push(userId);
        }
      } else {
        state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
      }
    },
    updateUnreadCount: (state, action: PayloadAction<{ conversationId: string; count: number }>) => {
      const { conversationId, count } = action.payload;
      const conversation = state.conversations.find((c) => c.id === conversationId);
      if (conversation) {
        conversation.unreadCount = count;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action: PayloadAction<Conversation>) => {
        state.isLoading = false;
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        state.isSending = false;
        state.messages = [...state.messages, action.payload];
        // Update last message in conversation
        const conversation = state.conversations.find(
          (c) => c.id === action.payload.conversationId
        );
        if (conversation) {
          conversation.lastMessage = action.payload;
          conversation.updatedAt = action.payload.createdAt;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      })
      .addCase(markAsRead.fulfilled, (state, action: PayloadAction<string>) => {
        const conversation = state.conversations.find((c) => c.id === action.payload);
        if (conversation) {
          conversation.unreadCount = 0;
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId } = action.payload;
        state.messages = state.messages.filter((m) => m.id !== messageId);
      });
  },
});

export const {
  clearError,
  clearCurrentConversation,
  addMessage,
  setTypingStatus,
  setOnlineStatus,
  updateUnreadCount,
} = messagesSlice.actions;
export default messagesSlice.reducer;
