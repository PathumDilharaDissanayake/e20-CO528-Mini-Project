"use strict";
/**
 * Notification Service — Business logic layer for notification-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePushSubscription = exports.savePushSubscription = exports.markAllAsRead = exports.markAsRead = exports.createNotification = exports.listNotifications = void 0;
const models_1 = require("../models");
// ─── Read ─────────────────────────────────────────────────────────────────────
const listNotifications = async (userId, unreadOnly, page = 1, limit = 20) => {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (page - 1) * safeLimit;
    const where = { userId };
    if (unreadOnly)
        where.isRead = false;
    const { count, rows } = await models_1.Notification.findAndCountAll({
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
exports.listNotifications = listNotifications;
// ─── Write ────────────────────────────────────────────────────────────────────
const createNotification = async (data) => {
    const { userId, ...rest } = data;
    return models_1.Notification.create({ ...rest, userId });
};
exports.createNotification = createNotification;
const markAsRead = async (notificationId, userId) => {
    const notification = await models_1.Notification.findOne({ where: { id: notificationId, userId } });
    if (!notification)
        throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
    return notification.update({ isRead: true, readAt: new Date() });
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (userId) => {
    await models_1.Notification.update({ isRead: true, readAt: new Date() }, { where: { userId, isRead: false } });
};
exports.markAllAsRead = markAllAsRead;
// ─── Push Subscriptions ───────────────────────────────────────────────────────
const savePushSubscription = async (userId, data) => {
    const [subscription] = await models_1.PushSubscription.findOrCreate({
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
exports.savePushSubscription = savePushSubscription;
const removePushSubscription = async (endpoint) => {
    await models_1.PushSubscription.destroy({ where: { endpoint } });
};
exports.removePushSubscription = removePushSubscription;
