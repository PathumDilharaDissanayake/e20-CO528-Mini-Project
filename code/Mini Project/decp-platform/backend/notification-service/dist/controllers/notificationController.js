"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsubscribePush = exports.subscribePush = exports.createNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
const createNotificationSchema = joi_1.default.object({
    type: joi_1.default.string().valid('message', 'connection', 'job', 'event', 'mention', 'system').required(),
    title: joi_1.default.string().max(200).required(),
    body: joi_1.default.string().required(),
    data: joi_1.default.object()
});
const subscriptionSchema = joi_1.default.object({
    endpoint: joi_1.default.string().uri().required(),
    keys: joi_1.default.object({
        p256dh: joi_1.default.string().required(),
        auth: joi_1.default.string().required()
    }).required()
});
const getNotifications = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = { userId };
        if (unreadOnly === 'true')
            where.isRead = false;
        const { count, rows: notifications } = await models_1.Notification.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        res.json({
            success: true,
            data: notifications,
            meta: { page: parseInt(page), limit: parseInt(limit), total: count, unread: unreadOnly ? count : undefined }
        });
    }
    catch (error) {
        logger_1.logger.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { notificationId } = req.params;
        const notification = await models_1.Notification.findOne({ where: { id: notificationId, userId } });
        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }
        await notification.update({ isRead: true, readAt: new Date() });
        res.json({ success: true, message: 'Notification marked as read' });
    }
    catch (error) {
        logger_1.logger.error('Mark as read error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        await models_1.Notification.update({ isRead: true, readAt: new Date() }, { where: { userId, isRead: false } });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        logger_1.logger.error('Mark all as read error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.markAllAsRead = markAllAsRead;
const createNotification = async (req, res) => {
    try {
        const { error, value } = createNotificationSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const { userId, ...notificationData } = req.body;
        const notification = await models_1.Notification.create({ ...notificationData, userId });
        // Send push notification if subscription exists
        // Implementation depends on push service setup
        res.status(201).json({ success: true, message: 'Notification created', data: { notification } });
    }
    catch (error) {
        logger_1.logger.error('Create notification error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createNotification = createNotification;
const subscribePush = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { error, value } = subscriptionSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const [subscription] = await models_1.PushSubscription.findOrCreate({
            where: { endpoint: value.endpoint },
            defaults: {
                userId,
                endpoint: value.endpoint,
                p256dh: value.keys.p256dh,
                auth: value.keys.auth
            }
        });
        res.json({ success: true, message: 'Push subscription saved', data: { subscription } });
    }
    catch (error) {
        logger_1.logger.error('Subscribe push error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.subscribePush = subscribePush;
const unsubscribePush = async (req, res) => {
    try {
        const { endpoint } = req.body;
        await models_1.PushSubscription.destroy({ where: { endpoint } });
        res.json({ success: true, message: 'Push subscription removed' });
    }
    catch (error) {
        logger_1.logger.error('Unsubscribe push error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.unsubscribePush = unsubscribePush;
