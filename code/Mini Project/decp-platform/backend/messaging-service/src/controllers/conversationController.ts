import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Conversation, Message } from '../models';
import { logger } from '../utils/logger';
import Joi from 'joi';

const createConversationSchema = Joi.object({
  type: Joi.string().valid('direct', 'group').required(),
  title: Joi.string().max(200).when('type', { is: 'group', then: Joi.required(), otherwise: Joi.optional() }),
  participants: Joi.array().items(Joi.string().uuid()).min(1).required()
});

const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  type: Joi.string().valid('text', 'image', 'file').default('text')
});

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const conversations = await Conversation.findAll({
      where: { participants: { [Op.contains]: [userId] } },
      order: [['updatedAt', 'DESC']]
    });
    res.json({ success: true, data: { conversations } });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getConversationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { conversationId } = req.params;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }
    if (!conversation.participants.includes(userId)) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    res.json({ success: true, data: { conversation } });
  } catch (error) {
    logger.error('Get conversation by id error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { error, value } = createConversationSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }

    const participants = [...new Set([...value.participants, userId])];

    // Check for existing direct conversation
    if (value.type === 'direct' && participants.length === 2) {
      const existing = await Conversation.findOne({
        where: {
          type: 'direct',
          participants: { [Op.contains]: participants }
        }
      });
      if (existing) {
        res.json({ success: true, message: 'Conversation already exists', data: { conversation: existing } });
        return;
      }
    }

    const conversation = await Conversation.create({
      ...value,
      participants,
      createdBy: userId
    });

    res.status(201).json({ success: true, message: 'Conversation created', data: { conversation } });
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { conversationId, isDeleted: false },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: messages.reverse(),
      meta: { page: parseInt(page as string), limit: parseInt(limit as string), total: count }
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { conversationId } = req.params;

    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const message = await Message.create({
      ...value,
      conversationId,
      senderId: userId
    });

    res.status(201).json({ success: true, message: 'Message sent', data: { message } });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
