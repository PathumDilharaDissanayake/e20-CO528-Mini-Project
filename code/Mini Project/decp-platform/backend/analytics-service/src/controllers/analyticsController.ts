import { Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { Activity } from '../models';
import { logger } from '../utils/logger';
import Joi from 'joi';

const trackActivitySchema = Joi.object({
  action: Joi.string().required(),
  entityType: Joi.string().valid('user', 'post', 'job', 'event', 'research', 'message').required(),
  entityId: Joi.string().uuid().optional(),
  metadata: Joi.object().optional()
});

export const trackActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { error, value } = trackActivitySchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }

    const activity = await Activity.create({
      ...value,
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Activity tracked', data: { activity } });
  } catch (error) {
    logger.error('Track activity error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate as string), new Date(endDate as string)] };
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

    res.json({
      success: true,
      data: {
        totalActivities,
        uniqueUsers,
        activitiesByType,
        activitiesByDay
      }
    });
  } catch (error) {
    logger.error('Get dashboard metrics error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUserActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows: activities } = await Activity.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: activities,
      meta: { page: parseInt(page as string), limit: parseInt(limit as string), total: count }
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPopularContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, limit = 10 } = req.query;
    
    const where: any = {};
    if (entityType) where.entityType = entityType;

    const popularContent = await Activity.findAll({
      where: { ...where, action: 'view' },
      attributes: ['entityId', [Sequelize.fn('COUNT', Sequelize.col('*')), 'views']],
      group: ['entityId'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('*')), 'DESC']],
      limit: parseInt(limit as string),
      raw: true
    });

    res.json({ success: true, data: { popularContent } });
  } catch (error) {
    logger.error('Get popular content error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
