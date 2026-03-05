import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Profile, Connection } from '../models';
import { updateProfileSchema, paginationSchema } from '../utils/validation';
import { logger } from '../utils/logger';
import { sendNotification } from '../utils/notify';

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

export const getConnections = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const type = (req.query.type as string) || 'following';
    const where: any = type === 'followers'
      ? { followingId: userId, status: 'accepted' }
      : { followerId: userId, status: 'accepted' };
    const connections = await Connection.findAll({ where });
    res.json({
      success: true,
      message: 'Connections retrieved',
      data: { connections, type },
      meta: { total: connections.length }
    });
  } catch (error) {
    logger.error('Get connections error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const followUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const followerId = req.headers['x-user-id'] as string;
    if (!followerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { userId: followingId } = req.params;
    if (followerId === followingId) {
      res.status(400).json({ success: false, message: 'Cannot connect with yourself' });
      return;
    }
    const targetProfile = await Profile.findOne({ where: { userId: followingId } });
    if (!targetProfile) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const [connection, created] = await Connection.findOrCreate({
      where: { followerId, followingId },
      defaults: { followerId, followingId, status: 'pending' }
    });

    // Fire-and-forget: notify the target user about the connection request
    if (created) {
      const requesterProfile = await Profile.findOne({ where: { userId: followerId } });
      const requesterName = requesterProfile
        ? `${requesterProfile.firstName} ${requesterProfile.lastName}`.trim()
        : 'A user';
      sendNotification(
        followingId,
        'connection',
        'New Connection Request',
        `${requesterName} wants to connect with you.`,
        { fromUserId: followerId, fromUserName: requesterName }
      );
    }

    res.json({
      success: true,
      message: created ? 'Connection request sent' : 'Request already sent',
      data: { connection }
    });
  } catch (error) {
    logger.error('Follow user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const acceptConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { userId: requesterId } = req.params;
    // The requester sent a request to currentUser — followerId=requesterId, followingId=currentUserId
    const connection = await Connection.findOne({ where: { followerId: requesterId, followingId: currentUserId, status: 'pending' } });
    if (!connection) {
      res.status(404).json({ success: false, message: 'No pending request found' });
      return;
    }
    await connection.update({ status: 'accepted' });

    // Fire-and-forget: notify the original requester that their request was accepted
    const accepterProfile = await Profile.findOne({ where: { userId: currentUserId } });
    const accepterName = accepterProfile
      ? `${accepterProfile.firstName} ${accepterProfile.lastName}`.trim()
      : 'Someone';
    sendNotification(
      requesterId,
      'connection',
      'Connection Accepted',
      `${accepterName} accepted your connection request`,
      { userId: currentUserId, userName: accepterName }
    );

    res.json({ success: true, message: 'Connection accepted', data: { connection } });
  } catch (error) {
    logger.error('Accept connection error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const declineConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { userId: requesterId } = req.params;
    const connection = await Connection.findOne({ where: { followerId: requesterId, followingId: currentUserId, status: 'pending' } });
    if (!connection) {
      res.status(404).json({ success: false, message: 'No pending request found' });
      return;
    }
    await connection.destroy();
    res.json({ success: true, message: 'Connection request declined' });
  } catch (error) {
    logger.error('Decline connection error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getConnectionRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const pendingRequests = await Connection.findAll({
      where: { followingId: currentUserId, status: 'pending' }
    });
    // Enrich with requester profile info
    const requesterIds = pendingRequests.map(r => r.followerId);
    const profiles = await Profile.findAll({ where: { userId: requesterIds } });
    const profileMap: Record<string, any> = {};
    profiles.forEach(p => { profileMap[p.userId] = p; });
    const requests = pendingRequests.map(req => ({
      connectionId: req.id,
      userId: req.followerId,
      requestedAt: req.createdAt,
      profile: profileMap[req.followerId] || { userId: req.followerId, firstName: 'User', lastName: '' }
    }));
    res.json({ success: true, data: requests, total: requests.length });
  } catch (error) {
    logger.error('Get connection requests error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const followerId = req.headers['x-user-id'] as string;
    if (!followerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { userId: followingId } = req.params;

    const connection = await Connection.findOne({ where: { followerId, followingId } });
    if (!connection) {
      res.status(404).json({ success: false, message: 'Not following this user' });
      return;
    }

    await connection.destroy();

    res.json({ success: true, message: 'Unfollowed user' });
  } catch (error) {
    logger.error('Unfollow user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const endorseSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { skill } = req.body;
    const endorserId = req.headers['x-user-id'] as string;

    if (!endorserId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!skill) {
      res.status(400).json({ success: false, message: 'skill is required' });
      return;
    }
    if (endorserId === userId) {
      res.status(400).json({ success: false, message: 'Cannot endorse your own skills' });
      return;
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    const endorsements: Record<string, string[]> = (profile.endorsements as Record<string, string[]>) || {};
    const existing = endorsements[skill] || [];

    if (existing.includes(endorserId)) {
      // Remove endorsement (toggle off)
      endorsements[skill] = existing.filter((id: string) => id !== endorserId);
    } else {
      endorsements[skill] = [...existing, endorserId];
    }

    await profile.update({ endorsements });
    res.json({ success: true, data: { endorsements } });
  } catch (error) {
    logger.error('Endorse skill error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getConnectionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { userId: targetUserId } = req.params;
    const [sentByMe, receivedFromThem, followerCount, followingCount] = await Promise.all([
      Connection.findOne({ where: { followerId: currentUserId, followingId: targetUserId } }),
      Connection.findOne({ where: { followerId: targetUserId, followingId: currentUserId } }),
      Connection.count({ where: { followingId: targetUserId, status: 'accepted' } }),
      Connection.count({ where: { followerId: targetUserId, status: 'accepted' } })
    ]);
    res.json({
      success: true,
      data: {
        status: sentByMe?.status || (receivedFromThem?.status === 'accepted' ? 'accepted' : receivedFromThem ? 'received_pending' : 'none'),
        sentByMe: sentByMe ? sentByMe.status : null,
        receivedFromThem: receivedFromThem ? receivedFromThem.status : null,
        followerCount,
        followingCount
      }
    });
  } catch (error) {
    logger.error('Get connection status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getSuggestedUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 5;

    // Get current user's connections
    const connections = await Connection.findAll({
      where: {
        [Op.or]: [
          { followerId: currentUserId },
          { followingId: currentUserId }
        ],
        status: 'accepted'
      }
    });

    // Get IDs of connected users
    const connectedUserIds = new Set<string>();
    connections.forEach(conn => {
      connectedUserIds.add(conn.followerId);
      connectedUserIds.add(conn.followingId);
    });
    connectedUserIds.add(currentUserId); // Exclude self

    // Get users who are not connected (excluding self and existing connections)
    const suggestedProfiles = await Profile.findAll({
      where: {
        userId: { [Op.notIn]: Array.from(connectedUserIds) }
      },
      limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      message: 'Suggested users retrieved',
      data: suggestedProfiles,
      meta: { total: suggestedProfiles.length }
    });
  } catch (error) {
    logger.error('Get suggested users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
