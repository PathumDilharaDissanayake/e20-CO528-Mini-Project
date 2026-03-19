import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Conversation, Message } from '../models';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketIO = (io: SocketIOServer): void => {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Join user's room for direct messages
    socket.join(`user:${socket.userId}`);

    // ---- Join conversation room ----
    // Supports both snake_case (internal) and kebab-case (frontend) event names
    const handleJoinConversation = async (conversationId: string) => {
      try {
        const conversation = await Conversation.findByPk(conversationId);
        if (conversation && conversation.participants.includes(socket.userId!)) {
          socket.join(`conversation:${conversationId}`);
          socket.emit('joined_conversation', conversationId);
        }
      } catch (error) {
        logger.error('Join conversation error:', error);
      }
    };

    socket.on('join_conversation', handleJoinConversation);
    // Frontend uses kebab-case 'join-chat' with chatId
    socket.on('join-chat', (chatId: string) => handleJoinConversation(chatId));

    // ---- Leave conversation room ----
    const handleLeaveConversation = (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    };

    socket.on('leave_conversation', handleLeaveConversation);
    socket.on('leave-chat', (chatId: string) => handleLeaveConversation(chatId));

    // ---- Send message ----
    // Server format: { conversationId, content, type? }
    // Frontend format: { chatId, content }
    const handleSendMessage = async (data: {
      conversationId?: string;
      chatId?: string;
      content: string;
      type?: string;
    }) => {
      try {
        const conversationId = data.conversationId || data.chatId;
        const { content, type = 'text' } = data;

        if (!conversationId) {
          socket.emit('error', { message: 'conversationId is required' });
          return;
        }

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation || !conversation.participants.includes(socket.userId!)) {
          socket.emit('error', { message: 'Not authorized to send message in this conversation' });
          return;
        }

        const message = await Message.create({
          conversationId,
          senderId: socket.userId!,
          content,
          type: type as any
        });

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message,
          conversationId
        });
        // Also emit with kebab-case for frontend compatibility
        io.to(`conversation:${conversationId}`).emit('new-message', {
          ...message.toJSON(),
          conversationId
        });

        // Notify offline participants
        conversation.participants.forEach(participantId => {
          if (participantId !== socket.userId) {
            io.to(`user:${participantId}`).emit('new_notification', {
              type: 'message',
              conversationId,
              senderId: socket.userId
            });
            // Also kebab-case alias
            io.to(`user:${participantId}`).emit('new-notification', {
              title: 'New Message',
              message: 'You have a new message',
              type: 'message',
              conversationId,
              senderId: socket.userId
            });
          }
        });
      } catch (error) {
        logger.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    };

    socket.on('send_message', handleSendMessage);
    socket.on('send-message', handleSendMessage);

    // ---- Typing indicator ----
    // Supports both { conversationId, isTyping } and { chatId, isTyping }
    socket.on('typing', (data: { conversationId?: string; chatId?: string; isTyping: boolean }) => {
      const conversationId = data.conversationId || data.chatId;
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('typing', {
        userId: socket.userId,
        conversationId,
        isTyping: data.isTyping
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });
};
