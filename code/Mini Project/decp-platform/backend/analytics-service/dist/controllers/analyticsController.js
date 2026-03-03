"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPopularContent = exports.getUserActivity = exports.getDashboardMetrics = exports.trackActivity = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
const trackActivitySchema = joi_1.default.object({
    action: joi_1.default.string().required(),
    entityType: joi_1.default.string().valid('user', 'post', 'job', 'event', 'research', 'message').required(),
    entityId: joi_1.default.string().uuid().optional(),
    metadata: joi_1.default.object().optional()
});
const trackActivity = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { error, value } = trackActivitySchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const activity = await models_1.Activity.create({
            ...value,
            userId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        res.status(201).json({ success: true, message: 'Activity tracked', data: { activity } });
    }
    catch (error) {
        logger_1.logger.error('Track activity error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.trackActivity = trackActivity;
const getDashboardMetrics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.createdAt = { [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)] };
        }
        const [totalActivities, uniqueUsers, activitiesByType, activitiesByDay] = await Promise.all([
            models_1.Activity.count({ where }),
            models_1.Activity.count({ where, distinct: true, col: 'userId' }),
            models_1.Activity.findAll({
                where,
                attributes: ['entityType', [sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('*')), 'count']],
                group: ['entityType'],
                raw: true
            }),
            models_1.Activity.findAll({
                where,
                attributes: [
                    [sequelize_1.Sequelize.fn('DATE_TRUNC', 'day', sequelize_1.Sequelize.col('createdAt')), 'date'],
                    [sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('*')), 'count']
                ],
                group: [sequelize_1.Sequelize.fn('DATE_TRUNC', 'day', sequelize_1.Sequelize.col('createdAt'))],
                order: [[sequelize_1.Sequelize.fn('DATE_TRUNC', 'day', sequelize_1.Sequelize.col('createdAt')), 'ASC']],
                raw: true
            })
        ]);
        res.json({
            success: true,
            data: {
                totalActivities,
                uniqueUsers,
                activitiesByType,
                activitiesByDay
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get dashboard metrics error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
const getUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows: activities } = await models_1.Activity.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        res.json({
            success: true,
            data: activities,
            meta: { page: parseInt(page), limit: parseInt(limit), total: count }
        });
    }
    catch (error) {
        logger_1.logger.error('Get user activity error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getUserActivity = getUserActivity;
const getPopularContent = async (req, res) => {
    try {
        const { entityType, limit = 10 } = req.query;
        const where = {};
        if (entityType)
            where.entityType = entityType;
        const popularContent = await models_1.Activity.findAll({
            where: { ...where, action: 'view' },
            attributes: ['entityId', [sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('*')), 'views']],
            group: ['entityId'],
            order: [[sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('*')), 'DESC']],
            limit: parseInt(limit),
            raw: true
        });
        res.json({ success: true, data: { popularContent } });
    }
    catch (error) {
        logger_1.logger.error('Get popular content error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getPopularContent = getPopularContent;
