"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectionStatus = exports.unfollowUser = exports.followUser = exports.getConnections = void 0;
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const getConnections = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { type = 'following' } = req.query;
        const where = type === 'followers'
            ? { followingId: userId, status: 'accepted' }
            : { followerId: userId, status: 'accepted' };
        const connections = await models_1.Connection.findAll({ where });
        res.json({
            success: true,
            message: 'Connections retrieved successfully',
            data: { connections, type },
            meta: { total: connections.length }
        });
    }
    catch (error) {
        logger_1.logger.error('Get connections error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getConnections = getConnections;
const followUser = async (req, res) => {
    try {
        const followerId = req.headers['x-user-id'];
        const { userId: followingId } = req.params;
        if (followerId === followingId) {
            res.status(400).json({
                success: false,
                message: 'Cannot follow yourself'
            });
            return;
        }
        const [connection, created] = await models_1.Connection.findOrCreate({
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
    }
    catch (error) {
        logger_1.logger.error('Follow user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.followUser = followUser;
const unfollowUser = async (req, res) => {
    try {
        const followerId = req.headers['x-user-id'];
        const { userId: followingId } = req.params;
        const connection = await models_1.Connection.findOne({
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
    }
    catch (error) {
        logger_1.logger.error('Unfollow user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.unfollowUser = unfollowUser;
const getConnectionStatus = async (req, res) => {
    try {
        const followerId = req.headers['x-user-id'];
        const { userId: followingId } = req.params;
        const connection = await models_1.Connection.findOne({
            where: { followerId, followingId }
        });
        res.json({
            success: true,
            data: {
                isFollowing: !!connection,
                status: connection?.status || null
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get connection status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getConnectionStatus = getConnectionStatus;
//# sourceMappingURL=connectionController.js.map