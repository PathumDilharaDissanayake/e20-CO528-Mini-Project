import { Request, Response } from 'express';
import { Connection } from '../models';
import { logger } from '../utils/logger';

export const getConnections = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { type = 'following' } = req.query;

    const where = type === 'followers'
      ? { followingId: userId, status: 'accepted' }
      : { followerId: userId, status: 'accepted' };

    const connections = await Connection.findAll({ where });

    res.json({
      success: true,
      message: 'Connections retrieved successfully',
      data: { connections, type },
      meta: { total: connections.length }
    });
  } catch (error) {
    logger.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const followUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const followerId = req.headers['x-user-id'] as string;
    const { userId: followingId } = req.params;

    if (followerId === followingId) {
      res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
      return;
    }

    const [connection, created] = await Connection.findOrCreate({
      where: { followerId, followingId },
      defaults: {
        followerId,
        followingId,
        status: 'accepted' // Auto-accept for now
      }
    });

    if (!created) {
      res.status(409).json({
        success: false,
        message: 'Already following this user'
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Successfully followed user',
      data: { connection }
    });
  } catch (error) {
    logger.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const followerId = req.headers['x-user-id'] as string;
    const { userId: followingId } = req.params;

    const connection = await Connection.findOne({
      where: { followerId, followingId }
    });

    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
      return;
    }

    await connection.destroy();

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    logger.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getConnectionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const followerId = req.headers['x-user-id'] as string;
    const { userId: followingId } = req.params;

    const connection = await Connection.findOne({
      where: { followerId, followingId }
    });

    res.json({
      success: true,
      data: {
        isFollowing: !!connection,
        status: connection?.status || null
      }
    });
  } catch (error) {
    logger.error('Get connection status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
