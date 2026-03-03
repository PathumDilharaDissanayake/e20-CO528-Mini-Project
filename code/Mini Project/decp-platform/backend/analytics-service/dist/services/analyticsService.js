"use strict";
/**
 * Analytics Service — Business logic layer for analytics-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPopularContent = exports.getUserActivity = exports.getDashboardMetrics = exports.trackActivity = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
// ─── Write ────────────────────────────────────────────────────────────────────
const trackActivity = async (userId, data) => {
    return models_1.Activity.create({ ...data, userId });
};
exports.trackActivity = trackActivity;
// ─── Read / Aggregates ────────────────────────────────────────────────────────
const getDashboardMetrics = async (filter) => {
    const where = {};
    if (filter.startDate && filter.endDate) {
        where.createdAt = {
            [sequelize_1.Op.between]: [new Date(filter.startDate), new Date(filter.endDate)]
        };
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
    return { totalActivities, uniqueUsers, activitiesByType, activitiesByDay };
};
exports.getDashboardMetrics = getDashboardMetrics;
const getUserActivity = async (userId, page = 1, limit = 20) => {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (page - 1) * safeLimit;
    const { count, rows } = await models_1.Activity.findAndCountAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: safeLimit,
        offset
    });
    return { activities: rows, total: count, page, limit: safeLimit };
};
exports.getUserActivity = getUserActivity;
const getPopularContent = async (entityType, limit = 10) => {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const where = { action: 'view' };
    if (entityType)
        where.entityType = entityType;
    return models_1.Activity.findAll({
        where,
        attributes: ['entityId', [sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('*')), 'views']],
        group: ['entityId'],
        order: [[sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('*')), 'DESC']],
        limit: safeLimit,
        raw: true
    });
};
exports.getPopularContent = getPopularContent;
