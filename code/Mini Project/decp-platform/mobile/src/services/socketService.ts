import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { store } from '../store';
import { addMessage, setTypingStatus, setOnlineStatus, updateUnreadCount } from '../features/messagesSlice';
import { addNotification, setUnreadCount } from '../features/notificationsSlice';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Message events
    this.socket.on('new_message', (message) => {
      store.dispatch(addMessage(message));
    });

    this.socket.on('typing', ({ userId, conversationId, isTyping }) => {
      store.dispatch(setTypingStatus({ userId, isTyping }));
    });

    this.socket.on('message_read', ({ conversationId, userId }) => {
      // Handle message read receipt
    });

    // Notification events
    this.socket.on('notification', (notification) => {
      store.dispatch(addNotification(notification));
    });

    this.socket.on('unread_count', ({ count }) => {
      store.dispatch(setUnreadCount(count));
    });

    // Online status events
    this.socket.on('user_online', ({ userId }) => {
      store.dispatch(setOnlineStatus({ userId, isOnline: true }));
    });

    this.socket.on('user_offline', ({ userId }) => {
      store.dispatch(setOnlineStatus({ userId, isOnline: false }));
    });
  }

  // Emit events
  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave_conversation', conversationId);
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    this.socket?.emit('typing', { conversationId, isTyping });
  }

  sendMessage(conversationId: string, content: string, type: string = 'text') {
    this.socket?.emit('send_message', { conversationId, content, type });
  }

  markMessagesRead(conversationId: string) {
    this.socket?.emit('mark_read', { conversationId });
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
