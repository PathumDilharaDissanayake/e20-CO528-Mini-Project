"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestedUsers = exports.getConnectionStatus = exports.endorseSkill = exports.unfollowUser = exports.getConnectionRequests = exports.declineConnection = exports.acceptConnection = exports.followUser = exports.getConnections = exports.searchUsers = exports.deleteUser = exports.updateProfile = exports.getMyProfile = exports.getUserById = exports.getUsers = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const notify_1 = require("../utils/notify");
const getUsers = async (req, res) => {
    try {
        const { error, value } = validation_1.paginationSchema.validate(req.query);
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
        const q = req.query.q;
        const where = {};
        if (q) {
            where[sequelize_1.Op.or] = [
                { firstName: { [sequelize_1.Op.iLike]: `%${q}%` } },
                { lastName: { [sequelize_1.Op.iLike]: `%${q}%` } },
                { email: { [sequelize_1.Op.iLike]: `%${q}%` } },
                { headline: { [sequelize_1.Op.iLike]: `%${q}%` } }
            ];
        }
        const { count, rows: profiles } = await models_1.Profile.findAndCountAll({
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
    }
    catch (error) {
        logger_1.logger.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await models_1.Profile.findOne({
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
    }
    catch (error) {
        logger_1.logger.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getUserById = getUserById;
const getMyProfile = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        let profile = await models_1.Profile.findOne({
            where: { userId }
        });
        const email = req.headers['x-user-email'];
        const role = req.headers['x-user-role'];
        const firstName = req.headers['x-user-firstname'];
        const lastName = req.headers['x-user-lastname'];
        if (!profile) {
            // Create profile for new user, populate basic info from headers
            profile = await models_1.Profile.create({
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
        }
        else {
            // Keep basic info in sync with auth service data from headers
            const updates = {};
            if (email && profile.email !== email)
                updates.email = email;
            if (role && profile.role !== role)
                updates.role = role;
            if (firstName && profile.firstName !== firstName)
                updates.firstName = firstName;
            if (lastName && profile.lastName !== lastName)
                updates.lastName = lastName;
            if (Object.keys(updates).length > 0)
                await profile.update(updates);
        }
        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: { profile }
        });
    }
    catch (error) {
        logger_1.logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getMyProfile = getMyProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const { error, value } = validation_1.updateProfileSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
            return;
        }
        const [profile, created] = await models_1.Profile.findOrCreate({
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
    }
    catch (error) {
        logger_1.logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateProfile = updateProfile;
const deleteUser = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const targetUserId = req.params.userId;
        const userRole = req.headers['x-user-role'];
        // Only allow users to delete their own account or admin
        if (userId !== targetUserId && userRole !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
            return;
        }
        const profile = await models_1.Profile.findOne({ where: { userId: targetUserId } });
        if (profile) {
            await profile.destroy();
        }
        res.json({
            success: true,
            message: 'User profile deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteUser = deleteUser;
const searchUsers = async (req, res) => {
    try {
        const { q, skill, role } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const where = {};
        if (role)
            where.role = role;
        if (skill)
            where.skills = { [sequelize_1.Op.contains]: [skill] };
        if (q) {
            where[sequelize_1.Op.or] = [
                { firstName: { [sequelize_1.Op.iLike]: `%${q}%` } },
                { lastName: { [sequelize_1.Op.iLike]: `%${q}%` } },
                { email: { [sequelize_1.Op.iLike]: `%${q}%` } },
                { headline: { [sequelize_1.Op.iLike]: `%${q}%` } },
                { bio: { [sequelize_1.Op.iLike]: `%${q}%` } }
            ];
        }
        const { count, rows: profiles } = await models_1.Profile.findAndCountAll({
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
    }
    catch (error) {
        logger_1.logger.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.searchUsers = searchUsers;
const getConnections = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const type = req.query.type || 'following';
        const where = type === 'followers'
            ? { followingId: userId, status: 'accepted' }
            : { followerId: userId, status: 'accepted' };
        const connections = await models_1.Connection.findAll({ where });
        res.json({
            success: true,
            message: 'Connections retrieved',
            data: { connections, type },
            meta: { total: connections.length }
        });
    }
    catch (error) {
        logger_1.logger.error('Get connections error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getConnections = getConnections;
const followUser = async (req, res) => {
    try {
        const followerId = req.headers['x-user-id'];
        if (!followerId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { userId: followingId } = req.params;
        if (followerId === followingId) {
            res.status(400).json({ success: false, message: 'Cannot connect with yourself' });
            return;
        }
        const targetProfile = await models_1.Profile.findOne({ where: { userId: followingId } });
        if (!targetProfile) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const [connection, created] = await models_1.Connection.findOrCreate({
            where: { followerId, followingId },
            defaults: { followerId, followingId, status: 'pending' }
        });
        // Fire-and-forget: notify the target user about the connection request
        if (created) {
            const requesterProfile = await models_1.Profile.findOne({ where: { userId: followerId } });
            const requesterName = requesterProfile
                ? `${requesterProfile.firstName} ${requesterProfile.lastName}`.trim()
                : 'A user';
            (0, notify_1.sendNotification)(followingId, 'connection', 'New Connection Request', `${requesterName} wants to connect with you.`, { fromUserId: followerId, fromUserName: requesterName });
        }
        res.json({
            success: true,
            message: created ? 'Connection request sent' : 'Request already sent',
            data: { connection }
        });
    }
    catch (error) {
        logger_1.logger.error('Follow user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.followUser = followUser;
const acceptConnection = async (req, res) => {
    try {
        const currentUserId = req.headers['x-user-id'];
        if (!currentUserId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { userId: requesterId } = req.params;
        // The requester sent a request to currentUser — followerId=requesterId, followingId=currentUserId
        const connection = await models_1.Connection.findOne({ where: { followerId: requesterId, followingId: currentUserId, status: 'pending' } });
        if (!connection) {
            res.status(404).json({ success: false, message: 'No pending request found' });
            return;
        }
        await connection.update({ status: 'accepted' });
        // Fire-and-forget: notify the original requester that their request was accepted
        const accepterProfile = await models_1.Profile.findOne({ where: { userId: currentUserId } });
        const accepterName = accepterProfile
            ? `${accepterProfile.firstName} ${accepterProfile.lastName}`.trim()
            : 'Someone';
        (0, notify_1.sendNotification)(requesterId, 'connection', 'Connection Accepted', `${accepterName} accepted your connection request`, { userId: currentUserId, userName: accepterName });
        res.json({ success: true, message: 'Connection accepted', data: { connection } });
    }
    catch (error) {
        logger_1.logger.error('Accept connection error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.acceptConnection = acceptConnection;
const declineConnection = async (req, res) => {
    try {
        const currentUserId = req.headers['x-user-id'];
        if (!currentUserId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { userId: requesterId } = req.params;
        const connection = await models_1.Connection.findOne({ where: { followerId: requesterId, followingId: currentUserId, status: 'pending' } });
        if (!connection) {
            res.status(404).json({ success: false, message: 'No pending request found' });
            return;
        }
        await connection.destroy();
        res.json({ success: true, message: 'Connection request declined' });
    }
    catch (error) {
        logger_1.logger.error('Decline connection error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.declineConnection = declineConnection;
const getConnectionRequests = async (req, res) => {
    try {
        const currentUserId = req.headers['x-user-id'];
        if (!currentUserId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const pendingRequests = await models_1.Connection.findAll({
            where: { followingId: currentUserId, status: 'pending' }
        });
        // Enrich with requester profile info
        const requesterIds = pendingRequests.map(r => r.followerId);
        const profiles = await models_1.Profile.findAll({ where: { userId: requesterIds } });
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.userId] = p; });
        const requests = pendingRequests.map(req => ({
            connectionId: req.id,
            userId: req.followerId,
            requestedAt: req.createdAt,
            profile: profileMap[req.followerId] || { userId: req.followerId, firstName: 'User', lastName: '' }
        }));
        res.json({ success: true, data: requests, total: requests.length });
    }
    catch (error) {
        logger_1.logger.error('Get connection requests error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getConnectionRequests = getConnectionRequests;
const unfollowUser = async (req, res) => {
    try {
        const followerId = req.headers['x-user-id'];
        if (!followerId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { userId: followingId } = req.params;
        const connection = await models_1.Connection.findOne({ where: { followerId, followingId } });
        if (!connection) {
            res.status(404).json({ success: false, message: 'Not following this user' });
            return;
        }
        await connection.destroy();
        res.json({ success: true, message: 'Unfollowed user' });
    }
    catch (error) {
        logger_1.logger.error('Unfollow user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.unfollowUser = unfollowUser;
const endorseSkill = async (req, res) => {
    try {
        const { userId } = req.params;
        const { skill } = req.body;
        const endorserId = req.headers['x-user-id'];
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
        const profile = await models_1.Profile.findOne({ where: { userId } });
        if (!profile) {
            res.status(404).json({ success: false, message: 'Profile not found' });
            return;
        }
        const endorsements = profile.endorsements || {};
        const existing = endorsements[skill] || [];
        if (existing.includes(endorserId)) {
            // Remove endorsement (toggle off)
            endorsements[skill] = existing.filter((id) => id !== endorserId);
        }
        else {
            endorsements[skill] = [...existing, endorserId];
        }
        await profile.update({ endorsements });
        res.json({ success: true, data: { endorsements } });
    }
    catch (error) {
        logger_1.logger.error('Endorse skill error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.endorseSkill = endorseSkill;
const getConnectionStatus = async (req, res) => {
    try {
        const currentUserId = req.headers['x-user-id'];
        if (!currentUserId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { userId: targetUserId } = req.params;
        const [sentByMe, receivedFromThem, followerCount, followingCount] = await Promise.all([
            models_1.Connection.findOne({ where: { followerId: currentUserId, followingId: targetUserId } }),
            models_1.Connection.findOne({ where: { followerId: targetUserId, followingId: currentUserId } }),
            models_1.Connection.count({ where: { followingId: targetUserId, status: 'accepted' } }),
            models_1.Connection.count({ where: { followerId: targetUserId, status: 'accepted' } })
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
    }
    catch (error) {
        logger_1.logger.error('Get connection status error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getConnectionStatus = getConnectionStatus;
const getSuggestedUsers = async (req, res) => {
    try {
        const currentUserId = req.headers['x-user-id'];
        if (!currentUserId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const limit = parseInt(req.query.limit) || 5;
        // Get current user's connections
        const connections = await models_1.Connection.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { followerId: currentUserId },
                    { followingId: currentUserId }
                ],
                status: 'accepted'
            }
        });
        // Get IDs of connected users
        const connectedUserIds = new Set();
        connections.forEach(conn => {
            connectedUserIds.add(conn.followerId);
            connectedUserIds.add(conn.followingId);
        });
        connectedUserIds.add(currentUserId); // Exclude self
        // Get users who are not connected (excluding self and existing connections)
        const suggestedProfiles = await models_1.Profile.findAll({
            where: {
                userId: { [sequelize_1.Op.notIn]: Array.from(connectedUserIds) }
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
    }
    catch (error) {
        logger_1.logger.error('Get suggested users error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getSuggestedUsers = getSuggestedUsers;
//# sourceMappingURL=userController.js.map