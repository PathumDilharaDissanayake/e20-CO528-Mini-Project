"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.deleteUser = exports.updateProfile = exports.getMyProfile = exports.getUserById = exports.getUsers = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
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
//# sourceMappingURL=userController.js.map