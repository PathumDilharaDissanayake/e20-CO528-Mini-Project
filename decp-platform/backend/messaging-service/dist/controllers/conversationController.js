"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getMessages = exports.createConversation = exports.getConversationById = exports.getConversations = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
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
        res.json({ success: true, data: { conversations } });
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
        res.status(201).json({ success: true, message: 'Conversation created', data: { conversation } });
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
        res.json({
            success: true,
            data: messages.reverse(),
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
        res.status(201).json({ success: true, message: 'Message sent', data: { message } });
    }
    catch (error) {
        logger_1.logger.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.sendMessage = sendMessage;
