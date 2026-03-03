import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Profile } from '../models';
import { updateProfileSchema, paginationSchema } from '../utils/validation';
import { logger } from '../utils/logger';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
      return;
    }

    const { page, limit } = value;
    const offset = (page - 1) * limit;
    const q = req.query.q as string | undefined;

    const where: any = {};
    if (q) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { headline: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { count, rows: profiles } = await Profile.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: profiles,
      meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOne({
      where: { userId }
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { profile }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    let profile = await Profile.findOne({
      where: { userId }
    });

    const email = req.headers['x-user-email'] as string | undefined;
    const role = req.headers['x-user-role'] as string | undefined;
    const firstName = req.headers['x-user-firstname'] as string | undefined;
    const lastName = req.headers['x-user-lastname'] as string | undefined;

    if (!profile) {
      // Create profile for new user, populate basic info from headers
      profile = await Profile.create({
        userId,
        email: email || '',
        role: role || 'student',
        firstName: firstName || '',
        lastName: lastName || '',
        skills: [],
        interests: [],
        education: [],
        experience: [],
        socialLinks: {}
      });
    } else {
      // Keep basic info in sync with auth service data from headers
      const updates: any = {};
      if (email && profile.email !== email) updates.email = email;
      if (role && profile.role !== role) updates.role = role;
      if (firstName && profile.firstName !== firstName) updates.firstName = firstName;
      if (lastName && profile.lastName !== lastName) updates.lastName = lastName;
      if (Object.keys(updates).length > 0) await profile.update(updates);
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { profile }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
      return;
    }

    const [profile, created] = await Profile.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        ...value,
        skills: value.skills || [],
        interests: value.interests || [],
        education: value.education || [],
        experience: value.experience || [],
        socialLinks: value.socialLinks || {}
      }
    });

    if (!created) {
      await profile.update(value);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const targetUserId = req.params.userId;
    const userRole = req.headers['x-user-role'] as string;

    // Only allow users to delete their own account or admin
    if (userId !== targetUserId && userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    const profile = await Profile.findOne({ where: { userId: targetUserId } });
    if (profile) {
      await profile.destroy();
    }

    res.json({
      success: true,
      message: 'User profile deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, skill, role } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (skill) where.skills = { [Op.contains]: [skill] };
    if (q) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { headline: { [Op.iLike]: `%${q}%` } },
        { bio: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { count, rows: profiles } = await Profile.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      message: 'Search results',
      data: profiles,
      meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
