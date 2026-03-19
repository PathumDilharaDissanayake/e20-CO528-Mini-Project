"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getMessages = exports.createConversation = exports.getConversationById = exports.getConversations = void 0;
const sequelize_1 = require("sequelize");
const http_1 = __importDefault(require("http"));
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const socketInstance_1 = require("../socket/socketInstance");
const joi_1 = __importDefault(require("joi"));
/** Fetch participant profile data from user-service via internal endpoint */
async function enrichParticipants(userIds) {
    return new Promise((resolve) => {
        if (userIds.length === 0) {
            resolve(new Map());
            return;
        }
        const qs = `userIds=${userIds.join(',')}`;
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: `/internal/batch?${qs}`,
            method: 'GET',
            headers: {
                'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || 'decp-internal-svc-token-change-in-production-2026'
            }
        };
        const req = http_1.default.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const map = new Map();
                    (json?.data || []).forEach((p) => {
                        map.set(p.userId || p.id, {
                            _id: p.userId || p.id,
                            id: p.userId || p.id,
                            firstName: p.firstName || '',
                            lastName: p.lastName || '',
                            avatar: p.avatar || null,
                            role: p.role || 'student',
                            headline: p.headline || null
                        });
                    });
                    resolve(map);
                }
                catch {
                    resolve(new Map());
                }
            });
        });
        req.on('error', () => resolve(new Map()));
        req.setTimeout(3000, () => { req.destroy(); resolve(new Map()); });
        req.end();
    });
}
const createConversationSchema = joi_1.default.object({
    type: joi_1.default.string().valid('direct', 'group').required(),
    title: joi_1.default.string().max(200).when('type', { is: 'group', then: joi_1.default.required(), otherwise: joi_1.default.optional() }),
    participants: joi_1.default.array().items(joi_1.default.string().uuid()).min(1).required()
});
const sendMessageSchema = joi_1.default.object({
    content: joi_1.default.string().min(1).max(5000).required(),
    type: joi_1.default.string().valid('text', 'image', 'file').default('text')
});
const getConversations = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const conversations = await models_1.Conversation.findAll({
            where: { participants: { [sequelize_1.Op.contains]: [userId] } },
            order: [['updatedAt', 'DESC']]
        });
        // Collect all unique participant IDs across all conversations
        const allParticipantIds = new Set();
        conversations.forEach(c => (c.participants || []).forEach(id => allParticipantIds.add(id)));
        // Enrich participant IDs with profile data from user-service
        const profileMap = await enrichParticipants(Array.from(allParticipantIds));
        const enriched = conversations.map(c => ({
            ...c.toJSON(),
            participants: (c.participants || []).map(id => profileMap.get(id) || { _id: id, id, firstName: 'User', lastName: '', role: 'student', avatar: null })
        }));
        res.json({ success: true, data: { conversations: enriched } });
    }
    catch (error) {
        logger_1.logger.error('Get conversations error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getConversations = getConversations;
const getConversationById = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { conversationId } = req.params;
        const conversation = await models_1.Conversation.findByPk(conversationId);
        if (!conversation) {
            res.status(404).json({ success: false, message: 'Conversation not found' });
            return;
        }
        if (!conversation.participants.includes(userId)) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        res.json({ success: true, data: { conversation } });
    }
    catch (error) {
        logger_1.logger.error('Get conversation by id error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getConversationById = getConversationById;
const createConversation = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { error, value } = createConversationSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const participants = [...new Set([...value.participants, userId])];
        // Check for existing direct conversation
        if (value.type === 'direct' && participants.length === 2) {
            const existing = await models_1.Conversation.findOne({
                where: {
                    type: 'direct',
                    participants: { [sequelize_1.Op.contains]: participants }
                }
            });
            if (existing) {
                res.json({ success: true, message: 'Conversation already exists', data: { conversation: existing } });
                return;
            }
        }
        const conversation = await models_1.Conversation.create({
            ...value,
            participants,
            createdBy: userId
        });
        const profileMap = await enrichParticipants(participants);
        const enriched = {
            ...conversation.toJSON(),
            participants: participants.map(id => profileMap.get(id) || { _id: id, id, firstName: 'User', lastName: '', role: 'student', avatar: null })
        };
        res.status(201).json({ success: true, message: 'Conversation created', data: { conversation: enriched } });
    }
    catch (error) {
        logger_1.logger.error('Create conversation error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createConversation = createConversation;
const getMessages = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const conversation = await models_1.Conversation.findByPk(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const { count, rows: messages } = await models_1.Message.findAndCountAll({
            where: { conversationId, isDeleted: false },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        // Enrich each message with the sender's profile so the frontend can
        // display real names instead of "Unknown User".
        const uniqueSenderIds = [...new Set(messages.map(m => m.senderId).filter(Boolean))];
        const profileMap = await enrichParticipants(uniqueSenderIds);
        const enrichedMessages = messages.reverse().map(m => ({
            ...m.toJSON(),
            sender: profileMap.get(m.senderId) || {
                _id: m.senderId,
                id: m.senderId,
                firstName: 'Unknown',
                lastName: 'User',
                role: 'student',
                avatar: null,
            },
        }));
        res.json({
            success: true,
            data: enrichedMessages,
            meta: { page: parseInt(page), limit: parseInt(limit), total: count }
        });
    }
    catch (error) {
        logger_1.logger.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { conversationId } = req.params;
        const { error, value } = sendMessageSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const conversation = await models_1.Conversation.findByPk(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const message = await models_1.Message.create({
            ...value,
            conversationId,
            senderId: userId
        });
        // Broadcast in real-time to everyone in this conversation room.
        // This covers recipients who have the conversation open right now.
        const io = (0, socketInstance_1.getSocketIO)();
        if (io) {
            const msgJson = message.toJSON();
            const payload = { ...msgJson, conversationId, chat: conversationId };
            // Emit to conversation room (users actively viewing this chat)
            io.to(`conversation:${conversationId}`).emit('new-message', payload);
            io.to(`conversation:${conversationId}`).emit('new_message', { message: payload, conversationId });
            // Also emit to each participant's personal room so they receive it
            // even if they haven't joined the conversation room yet.
            conversation.participants.forEach((participantId) => {
                io.to(`user:${participantId}`).emit('new-message', payload);
                io.to(`user:${participantId}`).emit('new_message', { message: payload, conversationId });
            });
        }
        res.status(201).json({ success: true, message: 'Message sent', data: { message } });
    }
    catch (error) {
        logger_1.logger.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.sendMessage = sendMessage;
