"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const setupSocketIO = (io) => {
    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            socket.userId = decoded.userId;
            next();
        }
        catch (error) {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        logger_1.logger.info(`User connected: ${socket.userId}`);
        // Join user's room for direct messages
        socket.join(`user:${socket.userId}`);
        // ---- Join conversation room ----
        // Supports both snake_case (internal) and kebab-case (frontend) event names
        const handleJoinConversation = async (conversationId) => {
            try {
                const conversation = await models_1.Conversation.findByPk(conversationId);
                if (conversation && conversation.participants.includes(socket.userId)) {
                    socket.join(`conversation:${conversationId}`);
                    socket.emit('joined_conversation', conversationId);
                }
            }
            catch (error) {
                logger_1.logger.error('Join conversation error:', error);
            }
        };
        socket.on('join_conversation', handleJoinConversation);
        // Frontend uses kebab-case 'join-chat' with chatId
        socket.on('join-chat', (chatId) => handleJoinConversation(chatId));
        // ---- Leave conversation room ----
        const handleLeaveConversation = (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
        };
        socket.on('leave_conversation', handleLeaveConversation);
        socket.on('leave-chat', (chatId) => handleLeaveConversation(chatId));
        // ---- Send message ----
        // Server format: { conversationId, content, type? }
        // Frontend format: { chatId, content }
        const handleSendMessage = async (data) => {
            try {
                const conversationId = data.conversationId || data.chatId;
                const { content, type = 'text' } = data;
                if (!conversationId) {
                    socket.emit('error', { message: 'conversationId is required' });
                    return;
                }
                const conversation = await models_1.Conversation.findByPk(conversationId);
                if (!conversation || !conversation.participants.includes(socket.userId)) {
                    socket.emit('error', { message: 'Not authorized to send message in this conversation' });
                    return;
                }
                const message = await models_1.Message.create({
                    conversationId,
                    senderId: socket.userId,
                    content,
                    type: type
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
            }
            catch (error) {
                logger_1.logger.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        };
        socket.on('send_message', handleSendMessage);
        socket.on('send-message', handleSendMessage);
        // ---- Typing indicator ----
        // Supports both { conversationId, isTyping } and { chatId, isTyping }
        socket.on('typing', (data) => {
            const conversationId = data.conversationId || data.chatId;
            if (!conversationId)
                return;
            socket.to(`conversation:${conversationId}`).emit('typing', {
                userId: socket.userId,
                conversationId,
                isTyping: data.isTyping
            });
        });
        // Disconnect
        socket.on('disconnect', () => {
            logger_1.logger.info(`User disconnected: ${socket.userId}`);
        });
    });
};
exports.setupSocketIO = setupSocketIO;
