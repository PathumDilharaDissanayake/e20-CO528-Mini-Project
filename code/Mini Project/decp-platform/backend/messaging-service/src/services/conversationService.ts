/**
 * Conversation Service — Business logic layer for messaging-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */

import { Op } from 'sequelize';
import { Conversation, Message } from '../models';

export interface ConversationInput {
  type: 'direct' | 'group';
  title?: string;
  participants: string[];
}

export interface MessageInput {
  content: string;
  type?: 'text' | 'image' | 'file';
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getConversations = async (userId: string): Promise<Conversation[]> => {
  return Conversation.findAll({
    where: { participants: { [Op.contains]: [userId] } },
    order: [['updatedAt', 'DESC']]
  });
};

export const getConversationById = async (conversationId: string, userId: string): Promise<Conversation> => {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw Object.assign(new Error('Conversation not found'), { statusCode: 404 });
  if (!conversation.participants.includes(userId)) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  return conversation;
};

export const getMessages = async (
  conversationId: string,
  userId: string,
  page = 1,
  limit = 50
): Promise<{ messages: Message[]; total: number; page: number; limit: number }> => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const offset = (page - 1) * safeLimit;

  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }

  const { count, rows } = await Message.findAndCountAll({
    where: { conversationId, isDeleted: false },
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset
  });

  return { messages: rows.reverse(), total: count, page, limit: safeLimit };
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const createConversation = async (userId: string, data: ConversationInput): Promise<Conversation> => {
  const participants = [...new Set([...data.participants, userId])];

  // Idempotent: return existing direct conversation between the same 2 participants
  if (data.type === 'direct' && participants.length === 2) {
    const existing = await Conversation.findOne({
      where: { type: 'direct', participants: { [Op.contains]: participants } }
    });
    if (existing) return existing;
  }

  return Conversation.create({ ...data, participants, createdBy: userId });
};

export const sendMessage = async (
  conversationId: string,
  userId: string,
  data: MessageInput
): Promise<Message> => {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  const message = await Message.create({ ...data, conversationId, senderId: userId });
  // Touch conversation.updatedAt for ordering
  await conversation.update({ updatedAt: new Date() } as any);
  return message;
};
