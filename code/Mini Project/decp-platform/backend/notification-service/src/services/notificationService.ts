/**
 * Notification Service — Business logic layer for notification-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */

import { Notification, PushSubscription } from '../models';

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: object;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const listNotifications = async (
  userId: string,
  unreadOnly: boolean,
  page = 1,
  limit = 20
): Promise<{ notifications: Notification[]; total: number; page: number; limit: number; unread?: number }> => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const offset = (page - 1) * safeLimit;

  const where: Record<string, unknown> = { userId };
  if (unreadOnly) where.isRead = false;

  const { count, rows } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset
  });

  return {
    notifications: rows,
    total: count,
    page,
    limit: safeLimit,
    ...(unreadOnly ? { unread: count } : {})
  };
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const createNotification = async (data: NotificationInput): Promise<Notification> => {
  const { userId, ...rest } = data;
  return Notification.create({ ...rest, userId } as any);
};

export const markAsRead = async (notificationId: string, userId: string): Promise<Notification> => {
  const notification = await Notification.findOne({ where: { id: notificationId, userId } });
  if (!notification) throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  return notification.update({ isRead: true, readAt: new Date() });
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } }
  );
};

// ─── Push Subscriptions ───────────────────────────────────────────────────────

export const savePushSubscription = async (
  userId: string,
  data: PushSubscriptionInput
): Promise<PushSubscription> => {
  const [subscription] = await PushSubscription.findOrCreate({
    where: { endpoint: data.endpoint },
    defaults: {
      userId,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth
    }
  });
  return subscription;
};

export const removePushSubscription = async (endpoint: string): Promise<void> => {
  await PushSubscription.destroy({ where: { endpoint } });
};
