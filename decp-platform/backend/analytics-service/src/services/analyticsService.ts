/**
 * Analytics Service — Business logic layer for analytics-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */

import { Op, Sequelize } from 'sequelize';
import { Activity } from '../models';

export interface ActivityInput {
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: object;
  ipAddress?: string;
  userAgent?: string;
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// ─── Write ────────────────────────────────────────────────────────────────────

export const trackActivity = async (userId: string, data: ActivityInput): Promise<Activity> => {
  return Activity.create({ ...data, userId } as any);
};

// ─── Read / Aggregates ────────────────────────────────────────────────────────

export const getDashboardMetrics = async (filter: DateRangeFilter) => {
  const where: Record<string, unknown> = {};
  if (filter.startDate && filter.endDate) {
    where.createdAt = {
      [Op.between]: [new Date(filter.startDate), new Date(filter.endDate)]
    };
  }

  const [totalActivities, uniqueUsers, activitiesByType, activitiesByDay] = await Promise.all([
    Activity.count({ where }),
    Activity.count({ where, distinct: true, col: 'userId' }),
    Activity.findAll({
      where,
      attributes: ['entityType', [Sequelize.fn('COUNT', Sequelize.col('*')), 'count']],
      group: ['entityType'],
      raw: true
    }),
    Activity.findAll({
      where,
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'day', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('*')), 'count']
      ],
      group: [Sequelize.fn('DATE_TRUNC', 'day', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'day', Sequelize.col('createdAt')), 'ASC']],
      raw: true
    })
  ]);

  return { totalActivities, uniqueUsers, activitiesByType, activitiesByDay };
};

export const getUserActivity = async (
  userId: string,
  page = 1,
  limit = 20
): Promise<{ activities: Activity[]; total: number; page: number; limit: number }> => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const offset = (page - 1) * safeLimit;

  const { count, rows } = await Activity.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset
  });

  return { activities: rows, total: count, page, limit: safeLimit };
};

export const getPopularContent = async (
  entityType: string | undefined,
  limit = 10
): Promise<{ entityId: string; views: number }[]> => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const where: Record<string, unknown> = { action: 'view' };
  if (entityType) where.entityType = entityType;

  return Activity.findAll({
    where,
    attributes: ['entityId', [Sequelize.fn('COUNT', Sequelize.col('*')), 'views']],
    group: ['entityId'],
    order: [[Sequelize.fn('COUNT', Sequelize.col('*')), 'DESC']],
    limit: safeLimit,
    raw: true
  }) as unknown as { entityId: string; views: number }[];
};
