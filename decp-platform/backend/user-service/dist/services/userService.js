"use strict";
/**
 * User Service — Business logic layer for user-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfile = exports.updateProfile = exports.searchUsers = exports.getOrSyncMyProfile = exports.getUserById = exports.listUsers = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
// ─── Read ─────────────────────────────────────────────────────────────────────
const listUsers = async (q, page = 1, limit = 20) => {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (page - 1) * safeLimit;
    const where = {};
    if (q) {
        where[sequelize_1.Op.or] = [
            { firstName: { [sequelize_1.Op.iLike]: `%${q}%` } },
            { lastName: { [sequelize_1.Op.iLike]: `%${q}%` } },
            { email: { [sequelize_1.Op.iLike]: `%${q}%` } },
            { headline: { [sequelize_1.Op.iLike]: `%${q}%` } }
        ];
    }
    const { count, rows } = await models_1.Profile.findAndCountAll({
        where, order: [['createdAt', 'DESC']], limit: safeLimit, offset
    });
    return { items: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};
exports.listUsers = listUsers;
const getUserById = async (userId) => {
    return models_1.Profile.findOne({ where: { userId } });
};
exports.getUserById = getUserById;
/**
 * Get (or create) the requesting user's profile, keeping it in sync
 * with auth-service data injected via gateway headers.
 */
const getOrSyncMyProfile = async (headers) => {
    const { userId, email, role, firstName, lastName } = headers;
    let profile = await models_1.Profile.findOne({ where: { userId } });
    if (!profile) {
        profile = await models_1.Profile.create({
            userId,
            email: email || '',
            role: role || 'student',
            firstName: firstName || '',
            lastName: lastName || '',
            skills: [], interests: [], education: [], experience: [], socialLinks: {}
        });
    }
    else {
        const updates = {};
        if (email && profile.email !== email)
            updates.email = email;
        if (role && profile.role !== role)
            updates.role = role;
        if (firstName && profile.firstName !== firstName)
            updates.firstName = firstName;
        if (lastName && profile.lastName !== lastName)
            updates.lastName = lastName;
        if (Object.keys(updates).length)
            await profile.update(updates);
    }
    return profile;
};
exports.getOrSyncMyProfile = getOrSyncMyProfile;
const searchUsers = async (opts) => {
    const { q, role, skill, page = 1, limit = 20 } = opts;
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (page - 1) * safeLimit;
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
    const { count, rows } = await models_1.Profile.findAndCountAll({
        where, order: [['createdAt', 'DESC']], limit: safeLimit, offset
    });
    return { items: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};
exports.searchUsers = searchUsers;
// ─── Write ────────────────────────────────────────────────────────────────────
const updateProfile = async (userId, data) => {
    const [profile] = await models_1.Profile.findOrCreate({
        where: { userId },
        defaults: { userId, skills: [], interests: [], education: [], experience: [], socialLinks: {}, ...data }
    });
    if (Object.keys(data).length)
        await profile.update(data);
    return profile;
};
exports.updateProfile = updateProfile;
const deleteProfile = async (requestingUserId, targetUserId, userRole) => {
    if (requestingUserId !== targetUserId && userRole !== 'admin') {
        throw Object.assign(new Error('Insufficient permissions'), { statusCode: 403 });
    }
    const profile = await models_1.Profile.findOne({ where: { userId: targetUserId } });
    if (profile)
        await profile.destroy();
};
exports.deleteProfile = deleteProfile;
//# sourceMappingURL=userService.js.map