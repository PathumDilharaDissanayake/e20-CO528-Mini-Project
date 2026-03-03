"use strict";
/**
 * Post Service — Business logic layer for the feed-service.
 * Controllers delegate all domain logic here; this layer is fully unit-testable
 * without an HTTP layer or live database connection.
 *
 * Agent: A-06 (Backend Implementation Agent)
 * Fixes: FLAW-003, FLAW-004, FLAW-012 (transactions + idempotency)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleShare = exports.deleteComment = exports.addComment = exports.getComments = exports.toggleLike = exports.deletePost = exports.updatePost = exports.createPost = exports.getPostById = exports.getFeed = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const models_1 = require("../models");
// ─────────────────────────────────────────────────────────────────────────────
// Feed / Read
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Retrieve paginated feed. Supports both offset (legacy) and cursor-based pagination.
 * When `cursor` is provided, it overrides `page` and uses createdAt-based cursor.
 */
const getFeed = async (options) => {
    const { page = 1, limit = 10, cursor, userId } = options;
    const safeLimit = Math.min(Math.max(1, limit), 50); // clamp 1–50
    const where = { isPublic: true };
    if (userId)
        where.userId = userId;
    // Cursor-based: more efficient at scale
    if (cursor) {
        where.createdAt = { [sequelize_1.Op.lt]: new Date(cursor) };
        const posts = await models_1.Post.findAll({
            where,
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            limit: safeLimit + 1 // +1 to detect hasNext
        });
        const hasNext = posts.length > safeLimit;
        const result = hasNext ? posts.slice(0, safeLimit) : posts;
        const nextCursor = hasNext ? result[result.length - 1].createdAt.toISOString() : null;
        return {
            posts: result,
            total: -1, // unknown in cursor mode (avoid COUNT query)
            page: -1,
            limit: safeLimit,
            totalPages: -1,
            hasNext,
            hasPrev: true, // cursor mode always has previous
            nextCursor
        };
    }
    // Offset-based (legacy compatibility)
    const offset = (page - 1) * safeLimit;
    const { count, rows: posts } = await models_1.Post.findAndCountAll({
        where,
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit: safeLimit,
        offset
    });
    const totalPages = Math.ceil(count / safeLimit);
    const nextCursor = posts.length > 0
        ? posts[posts.length - 1].createdAt.toISOString()
        : null;
    return {
        posts,
        total: count,
        page,
        limit: safeLimit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextCursor
    };
};
exports.getFeed = getFeed;
const getPostById = async (postId) => {
    return models_1.Post.findByPk(postId, {
        include: [{ model: models_1.Comment, as: 'postComments', limit: 10 }]
    });
};
exports.getPostById = getPostById;
// ─────────────────────────────────────────────────────────────────────────────
// Create / Update / Delete
// ─────────────────────────────────────────────────────────────────────────────
const createPost = async (input) => {
    const { userId, content, type = 'text', isPublic = true, mediaUrls = [] } = input;
    const effectiveType = mediaUrls.length > 0 ? (type === 'text' ? 'image' : type) : 'text';
    return models_1.Post.create({ userId, content, type: effectiveType, isPublic, mediaUrls });
};
exports.createPost = createPost;
const updatePost = async (postId, userId, updates) => {
    const post = await models_1.Post.findByPk(postId);
    if (!post)
        throw Object.assign(new Error('Post not found'), { statusCode: 404 });
    if (post.userId !== userId)
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    return post.update(updates);
};
exports.updatePost = updatePost;
const deletePost = async (postId, userId, userRole) => {
    const post = await models_1.Post.findByPk(postId);
    if (!post)
        throw Object.assign(new Error('Post not found'), { statusCode: 404 });
    if (post.userId !== userId && userRole !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    await post.destroy();
};
exports.deletePost = deletePost;
/**
 * Toggle like on a post. Uses a Sequelize transaction to ensure the Like record
 * and the Post.likes counter are always in sync (FLAW-003 fix).
 * Uses findOrCreate so the result is idempotent from the caller's perspective.
 */
const toggleLike = async (postId, userId) => {
    const t = await database_1.default.transaction();
    try {
        const post = await models_1.Post.findByPk(postId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!post) {
            await t.rollback();
            throw Object.assign(new Error('Post not found'), { statusCode: 404 });
        }
        const [like, created] = await models_1.Like.findOrCreate({
            where: { postId, userId },
            defaults: { postId, userId },
            transaction: t
        });
        if (!created) {
            // Already liked — remove like
            await like.destroy({ transaction: t });
            await post.decrement('likes', { by: 1, transaction: t });
            await t.commit();
            const refreshed = await models_1.Post.findByPk(postId, { attributes: ['likes'] });
            return { liked: false, likesCount: refreshed?.likes ?? Math.max(0, post.likes - 1) };
        }
        await post.increment('likes', { by: 1, transaction: t });
        await t.commit();
        const refreshed = await models_1.Post.findByPk(postId, { attributes: ['likes'] });
        return { liked: true, likesCount: refreshed?.likes ?? post.likes + 1 };
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
};
exports.toggleLike = toggleLike;
// ─────────────────────────────────────────────────────────────────────────────
// Comments — transactional create (FLAW-012 fix)
// ─────────────────────────────────────────────────────────────────────────────
const getComments = async (postId, page = 1, limit = 20) => {
    const offset = (page - 1) * Math.min(limit, 100);
    const { count, rows: comments } = await models_1.Comment.findAndCountAll({
        where: { postId },
        order: [['createdAt', 'ASC']],
        limit: Math.min(limit, 100),
        offset
    });
    return { comments, total: count };
};
exports.getComments = getComments;
const addComment = async (input) => {
    const { userId, postId, content, parentId } = input;
    const t = await database_1.default.transaction();
    try {
        const post = await models_1.Post.findByPk(postId, { transaction: t });
        if (!post) {
            await t.rollback();
            throw Object.assign(new Error('Post not found'), { statusCode: 404 });
        }
        const comment = await models_1.Comment.create({ postId, userId, content, parentId }, { transaction: t });
        await post.increment('comments', { by: 1, transaction: t });
        await t.commit();
        return comment;
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
};
exports.addComment = addComment;
const deleteComment = async (postId, commentId, userId, userRole) => {
    const t = await database_1.default.transaction();
    try {
        const post = await models_1.Post.findByPk(postId, { transaction: t });
        if (!post) {
            await t.rollback();
            throw Object.assign(new Error('Post not found'), { statusCode: 404 });
        }
        const comment = await models_1.Comment.findOne({ where: { id: commentId, postId }, transaction: t });
        if (!comment) {
            await t.rollback();
            throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
        }
        if (comment.userId !== userId && post.userId !== userId && userRole !== 'admin') {
            await t.rollback();
            throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
        }
        await comment.destroy({ transaction: t });
        await post.decrement('comments', { by: 1, transaction: t });
        await t.commit();
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
};
exports.deleteComment = deleteComment;
/**
 * Toggle share on a post. Uses findOrCreate so a user cannot inflate the share count
 * by calling this endpoint multiple times (FLAW-004 fix).
 */
const toggleShare = async (postId, userId) => {
    const t = await database_1.default.transaction();
    try {
        const post = await models_1.Post.findByPk(postId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!post) {
            await t.rollback();
            throw Object.assign(new Error('Post not found'), { statusCode: 404 });
        }
        const [, created] = await models_1.Share.findOrCreate({
            where: { postId, userId },
            defaults: { postId, userId },
            transaction: t
        });
        if (!created) {
            // Already shared — idempotent response (don't decrement)
            await t.commit();
            return { shared: true, sharesCount: post.shares };
        }
        await post.increment('shares', { by: 1, transaction: t });
        await t.commit();
        const refreshed = await models_1.Post.findByPk(postId, { attributes: ['shares'] });
        return { shared: true, sharesCount: refreshed?.shares ?? post.shares + 1 };
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
};
exports.toggleShare = toggleShare;
//# sourceMappingURL=postService.js.map