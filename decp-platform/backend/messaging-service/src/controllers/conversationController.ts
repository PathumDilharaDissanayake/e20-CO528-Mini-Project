import { Request, Response } from 'express';
import { Op } from 'sequelize';
import http from 'http';
import { Conversation, Message } from '../models';
import { logger } from '../utils/logger';
import Joi from 'joi';

/** Fetch participant profile data from user-service via internal endpoint */
async function enrichParticipants(userIds: string[]): Promise<Map<string, any>> {
  return new Promise((resolve) => {
    if (userIds.length === 0) { resolve(new Map()); return; }
    const qs = `userIds=${userIds.join(',')}`;
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: 3002,
      path: `/internal/batch?${qs}`,
      method: 'GET',
      headers: {
        'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || 'decp-internal-svc-token-change-in-production-2026'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const map = new Map<string, any>();
          (json?.data || []).forEach((p: any) => {
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
        } catch { resolve(new Map()); }
      });
    });
    req.on('error', () => resolve(new Map()));
    req.setTimeout(3000, () => { req.destroy(); resolve(new Map()); });
    req.end();
  });
}

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

    // Collect all unique participant IDs across all conversations
    const allParticipantIds = new Set<string>();
    conversations.forEach(c => (c.participants || []).forEach(id => allParticipantIds.add(id)));

    // Enrich participant IDs with profile data from user-service
    const profileMap = await enrichParticipants(Array.from(allParticipantIds));

    const enriched = conversations.map(c => ({
      ...c.toJSON(),
      participants: (c.participants || []).map(id =>
        profileMap.get(id) || { _id: id, id, firstName: 'User', lastName: '', role: 'student', avatar: null }
      )
    }));

    res.json({ success: true, data: { conversations: enriched } });
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

    const profileMap = await enrichParticipants(participants);
    const enriched = {
      ...conversation.toJSON(),
      participants: participants.map(id =>
        profileMap.get(id) || { _id: id, id, firstName: 'User', lastName: '', role: 'student', avatar: null }
      )
    };

    res.status(201).json({ success: true, message: 'Conversation created', data: { conversation: enriched } });
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
