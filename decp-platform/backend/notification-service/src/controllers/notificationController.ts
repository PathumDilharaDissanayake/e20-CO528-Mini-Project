import { Request, Response } from 'express';
import { Notification, PushSubscription } from '../models';
import { logger } from '../utils/logger';
import Joi from 'joi';

const createNotificationSchema = Joi.object({
  type: Joi.string().valid('message', 'connection', 'job', 'event', 'mention', 'system').required(),
  title: Joi.string().max(200).required(),
  body: Joi.string().required(),
  data: Joi.object()
});

const subscriptionSchema = Joi.object({
  endpoint: Joi.string().uri().required(),
  keys: Joi.object({
    p256dh: Joi.string().required(),
    auth: Joi.string().required()
  }).required()
});

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { userId };
    if (unreadOnly === 'true') where.isRead = false;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: notifications,
      meta: { page: parseInt(page as string), limit: parseInt(limit as string), total: count, unread: unreadOnly ? count : undefined }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({ where: { id: notificationId, userId } });
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    await notification.update({ isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = createNotificationSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }

    const { userId, ...notificationData } = req.body;
    const notification = await Notification.create({ ...notificationData, userId });

    // Send push notification if subscription exists
    // Implementation depends on push service setup

    res.status(201).json({ success: true, message: 'Notification created', data: { notification } });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const subscribePush = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { error, value } = subscriptionSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }

    const [subscription] = await PushSubscription.findOrCreate({
      where: { endpoint: value.endpoint },
      defaults: {
        userId,
        endpoint: value.endpoint,
        p256dh: value.keys.p256dh,
        auth: value.keys.auth
      }
    });

    res.json({ success: true, message: 'Push subscription saved', data: { subscription } });
  } catch (error) {
    logger.error('Subscribe push error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const unsubscribePush = async (req: Request, res: Response): Promise<void> => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.destroy({ where: { endpoint } });
    res.json({ success: true, message: 'Push subscription removed' });
  } catch (error) {
    logger.error('Unsubscribe push error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({ where: { id: notificationId, userId } });
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    await notification.destroy();
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Internal endpoint — called service-to-service (no user auth required).
 * Token already validated by internalAuthMiddleware at the server level.
 * POST /internal/notify
 */
export const internalCreateNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, type, title, body, data } = req.body;
    if (!userId || !type || !title || !body) {
      res.status(400).json({ success: false, message: 'Missing required fields: userId, type, title, body' });
      return;
    }
    // Validate type against the allowed enum values
    const allowedTypes = ['message', 'connection', 'job', 'event', 'mention', 'system'];
    const safeType = allowedTypes.includes(type) ? type : 'system';

    await Notification.create({
      userId,
      type: safeType as any,
      title,
      body,
      data: data || {},
      isRead: false,
    });
    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Internal create notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
