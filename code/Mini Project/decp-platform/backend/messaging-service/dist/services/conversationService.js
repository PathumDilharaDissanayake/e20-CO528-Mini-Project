"use strict";
/**
 * Conversation Service — Business logic layer for messaging-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.createConversation = exports.getMessages = exports.getConversationById = exports.getConversations = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
// ─── Read ─────────────────────────────────────────────────────────────────────
const getConversations = async (userId) => {
    return models_1.Conversation.findAll({
        where: { participants: { [sequelize_1.Op.contains]: [userId] } },
        order: [['updatedAt', 'DESC']]
    });
};
exports.getConversations = getConversations;
const getConversationById = async (conversationId, userId) => {
    const conversation = await models_1.Conversation.findByPk(conversationId);
    if (!conversation)
        throw Object.assign(new Error('Conversation not found'), { statusCode: 404 });
    if (!conversation.participants.includes(userId)) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    return conversation;
};
exports.getConversationById = getConversationById;
const getMessages = async (conversationId, userId, page = 1, limit = 50) => {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (page - 1) * safeLimit;
    const conversation = await models_1.Conversation.findByPk(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    const { count, rows } = await models_1.Message.findAndCountAll({
        where: { conversationId, isDeleted: false },
        order: [['createdAt', 'DESC']],
        limit: safeLimit,
        offset
    });
    return { messages: rows.reverse(), total: count, page, limit: safeLimit };
};
exports.getMessages = getMessages;
// ─── Write ────────────────────────────────────────────────────────────────────
const createConversation = async (userId, data) => {
    const participants = [...new Set([...data.participants, userId])];
    // Idempotent: return existing direct conversation between the same 2 participants
    if (data.type === 'direct' && participants.length === 2) {
        const existing = await models_1.Conversation.findOne({
            where: { type: 'direct', participants: { [sequelize_1.Op.contains]: participants } }
        });
        if (existing)
            return existing;
    }
    return models_1.Conversation.create({ ...data, participants, createdBy: userId });
};
exports.createConversation = createConversation;
const sendMessage = async (conversationId, userId, data) => {
    const conversation = await models_1.Conversation.findByPk(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    const message = await models_1.Message.create({ ...data, conversationId, senderId: userId });
    // Touch conversation.updatedAt for ordering
    await conversation.update({ updatedAt: new Date() });
    return message;
};
exports.sendMessage = sendMessage;
