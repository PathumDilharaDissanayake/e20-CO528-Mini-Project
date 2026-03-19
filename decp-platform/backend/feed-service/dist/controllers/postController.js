"use strict";
/**
 * Post Controller — HTTP layer only. All business logic delegated to postService.
 * Max responsibility: parse request → call service → format response.
 *
 * Agent: A-06 (Backend Implementation Agent)
 * Refactored: 2026-03-03 — Extracted service layer, fixed FLAW-003/004/011/012
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.votePoll = exports.getBookmarkedPosts = exports.bookmarkPost = exports.uploadFile = exports.sharePost = exports.deleteComment = exports.addComment = exports.getComments = exports.getPostReactions = exports.unlikePost = exports.likePost = exports.deletePost = exports.updatePost = exports.createPost = exports.getPost = exports.getFeed = void 0;
const joi_1 = __importDefault(require("joi"));
const path_1 = __importDefault(require("path"));
const postService = __importStar(require("../services/postService"));
const logger_1 = require("../utils/logger");
const notify_1 = require("../utils/notify");
const models_1 = require("../models");
// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────
const createPostSchema = joi_1.default.object({
    content: joi_1.default.string().min(0).max(5000).allow('').default(''),
    type: joi_1.default.string().valid('text', 'image', 'video', 'document', 'poll').default('text'),
    isPublic: joi_1.default.boolean().default(true),
    pollOptions: joi_1.default.array().items(joi_1.default.object({ text: joi_1.default.string().required(), votes: joi_1.default.array().items(joi_1.default.string()).default([]) })).optional(),
    pollEndsAt: joi_1.default.date().optional(),
});
const createCommentSchema = joi_1.default.object({
    content: joi_1.default.string().min(1).max(2000).required(),
    parentId: joi_1.default.string().uuid().optional()
});
// ─────────────────────────────────────────────────────────────────────────────
// Helper: uniform error response
// ─────────────────────────────────────────────────────────────────────────────
const handleError = (res, err, context) => {
    const error = err;
    const status = error.statusCode || 500;
    if (status >= 500)
        logger_1.logger.error(`[${context}] ${error.message}`, { stack: error.stack });
    res.status(status).json({
        success: false,
        message: error.message || 'Internal server error'
    });
};
// ─────────────────────────────────────────────────────────────────────────────
// Feed
// ─────────────────────────────────────────────────────────────────────────────
const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const cursor = req.query.cursor;
        const userId = req.query.userId;
        const result = await postService.getFeed({ page, limit, cursor, userId });
        res.json({
            success: true,
            message: 'Feed retrieved successfully',
            data: result.posts,
            meta: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.hasNext,
                hasPrev: result.hasPrev,
                nextCursor: result.nextCursor
            }
        });
    }
    catch (err) {
        handleError(res, err, 'getFeed');
    }
};
exports.getFeed = getFeed;
const getPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await postService.getPostById(postId);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        res.json({ success: true, message: 'Post retrieved successfully', data: { post } });
    }
    catch (err) {
        handleError(res, err, 'getPost');
    }
};
exports.getPost = getPost;
// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────
const createPost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        // Parse pollOptions from FormData (sent as JSON string)
        let bodyWithParsedPoll = { ...req.body };
        if (typeof req.body.pollOptions === 'string') {
            try {
                bodyWithParsedPoll.pollOptions = JSON.parse(req.body.pollOptions);
            }
            catch {
                bodyWithParsedPoll.pollOptions = undefined;
            }
        }
        const { error, value } = createPostSchema.validate(bodyWithParsedPoll);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [{ field: error.details[0].path.join('.'), message: error.details[0].message }]
            });
            return;
        }
        // Build author object from gateway-injected headers
        const author = {
            _id: userId,
            firstName: (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || ''),
            lastName: (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || ''),
            role: (req.headers['x-user-role'] || ''),
            avatar: (req.headers['x-user-avatar'] || '')
        };
        const mediaUrls = req.files?.map(f => `/uploads/${f.filename}`) || [];
        const hasPoll = Array.isArray(value.pollOptions) && value.pollOptions.length > 0;
        const hasText = typeof value.content === 'string' && value.content.trim().length > 0;
        if (!hasText && mediaUrls.length === 0 && !hasPoll) {
            res.status(400).json({
                success: false,
                message: 'Post must contain text, media, or poll options'
            });
            return;
        }
        const post = await postService.createPost({ userId, author, ...value, mediaUrls });
        res.status(201).json({ success: true, message: 'Post created successfully', data: { post } });
    }
    catch (err) {
        handleError(res, err, 'createPost');
    }
};
exports.createPost = createPost;
const updatePost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { postId } = req.params;
        const { content, isPublic } = req.body;
        const post = await postService.updatePost(postId, userId, { content, isPublic });
        res.json({ success: true, message: 'Post updated successfully', data: { post } });
    }
    catch (err) {
        handleError(res, err, 'updatePost');
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const { postId } = req.params;
        await postService.deletePost(postId, userId, userRole);
        res.status(204).send();
    }
    catch (err) {
        handleError(res, err, 'deletePost');
    }
};
exports.deletePost = deletePost;
// ─────────────────────────────────────────────────────────────────────────────
// Likes / Reactions
// ─────────────────────────────────────────────────────────────────────────────
const likePost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { postId } = req.params;
        const reactionType = req.body?.reactionType || 'like';
        const existingLike = await models_1.Like.findOne({ where: { postId, userId } });
        if (existingLike) {
            if (existingLike.reactionType === reactionType) {
                // Same reaction — toggle off
                await existingLike.destroy();
                await models_1.Post.findByPk(postId).then(p => p && p.decrement('likes', { by: 1 })).catch(() => { });
                const count = await models_1.Like.count({ where: { postId } });
                res.json({ success: true, data: { liked: false, likesCount: count, reactionType: null } });
                return;
            }
            else {
                // Different reaction — update it
                await existingLike.update({ reactionType });
                const count = await models_1.Like.count({ where: { postId } });
                res.json({ success: true, data: { liked: true, likesCount: count, reactionType } });
                return;
            }
        }
        await models_1.Like.create({ postId, userId, reactionType });
        await models_1.Post.findByPk(postId).then(p => p && p.increment('likes', { by: 1 })).catch(() => { });
        const count = await models_1.Like.count({ where: { postId } });
        // Fire-and-forget notification to post author (don't notify self)
        models_1.Post.findByPk(postId, { attributes: ['userId', 'author'] }).then((post) => {
            if (post && post.userId !== userId) {
                const firstName = (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || '');
                const lastName = (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || '');
                const likerName = `${firstName} ${lastName}`.trim() || 'Someone';
                (0, notify_1.sendNotification)(post.userId, 'mention', 'Someone reacted to your post', `${likerName} reacted to your post`, { postId });
            }
        }).catch(() => { });
        res.json({ success: true, data: { liked: true, likesCount: count, reactionType } });
    }
    catch (err) {
        handleError(res, err, 'likePost');
    }
};
exports.likePost = likePost;
// Kept for backward-compatibility — delegates to the same toggle
exports.unlikePost = exports.likePost;
const getPostReactions = async (req, res) => {
    try {
        const { postId } = req.params;
        const likes = await models_1.Like.findAll({ where: { postId }, attributes: ['userId', 'reactionType'] });
        const counts = {};
        likes.forEach((l) => { counts[l.reactionType] = (counts[l.reactionType] || 0) + 1; });
        res.json({ success: true, data: { reactions: counts, total: likes.length } });
    }
    catch (err) {
        handleError(res, err, 'getPostReactions');
    }
};
exports.getPostReactions = getPostReactions;
// ─────────────────────────────────────────────────────────────────────────────
// Comments
// ─────────────────────────────────────────────────────────────────────────────
const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { comments, total } = await postService.getComments(postId, page, limit);
        res.json({
            success: true,
            message: 'Comments retrieved successfully',
            data: comments,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    }
    catch (err) {
        handleError(res, err, 'getComments');
    }
};
exports.getComments = getComments;
const addComment = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { postId } = req.params;
        const { error, value } = createCommentSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [{ field: error.details[0].path.join('.'), message: error.details[0].message }]
            });
            return;
        }
        // Build author object from gateway-injected headers
        const author = {
            _id: userId,
            firstName: (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || ''),
            lastName: (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || ''),
            role: (req.headers['x-user-role'] || ''),
            avatar: (req.headers['x-user-avatar'] || '')
        };
        const comment = await postService.addComment({ userId, author, postId, ...value });
        // Fire-and-forget notification to post author (don't notify self-comments)
        models_1.Post.findByPk(postId, { attributes: ['userId'] }).then((post) => {
            if (post && post.userId !== userId) {
                const commenterName = `${author.firstName} ${author.lastName}`.trim() || 'Someone';
                (0, notify_1.sendNotification)(post.userId, 'mention', 'New comment on your post', `${commenterName} commented on your post`, { postId });
            }
        }).catch(() => { });
        res.status(201).json({ success: true, message: 'Comment added successfully', data: { comment } });
    }
    catch (err) {
        handleError(res, err, 'addComment');
    }
};
exports.addComment = addComment;
const deleteComment = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const { postId, commentId } = req.params;
        await postService.deleteComment(postId, commentId, userId, userRole);
        res.status(204).send();
    }
    catch (err) {
        handleError(res, err, 'deleteComment');
    }
};
exports.deleteComment = deleteComment;
// ─────────────────────────────────────────────────────────────────────────────
// Shares
// ─────────────────────────────────────────────────────────────────────────────
const sharePost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { postId } = req.params;
        const result = await postService.toggleShare(postId, userId);
        res.json({ success: true, message: 'Post shared successfully', data: result });
    }
    catch (err) {
        handleError(res, err, 'sharePost');
    }
};
exports.sharePost = sharePost;
// ─────────────────────────────────────────────────────────────────────────────
// File upload only — returns URL for use in events, research, profile pictures
// ─────────────────────────────────────────────────────────────────────────────
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file provided' });
            return;
        }
        const filename = req.file.filename || path_1.default.basename(req.file.path || '');
        const url = `/uploads/${filename}`;
        res.status(200).json({ success: true, data: { url } });
    }
    catch (err) {
        handleError(res, err, 'uploadFile');
    }
};
exports.uploadFile = uploadFile;
// ─────────────────────────────────────────────────────────────────────────────
// Bookmarks
// ─────────────────────────────────────────────────────────────────────────────
const bookmarkPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.headers['x-user-id'];
        const existing = await models_1.Bookmark.findOne({ where: { postId, userId } });
        if (existing) {
            await existing.destroy();
            res.json({ success: true, data: { bookmarked: false } });
            return;
        }
        await models_1.Bookmark.create({ userId, postId });
        res.json({ success: true, data: { bookmarked: true } });
    }
    catch (err) {
        handleError(res, err, 'bookmarkPost');
    }
};
exports.bookmarkPost = bookmarkPost;
const getBookmarkedPosts = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const bookmarks = await models_1.Bookmark.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
        const postIds = bookmarks.map((b) => b.postId);
        const posts = await models_1.Post.findAll({
            where: { id: postIds.length > 0 ? postIds : ['none'] },
            order: [['createdAt', 'DESC']],
            attributes: { include: ['id', 'userId', 'content', 'type', 'mediaUrls', 'likes', 'comments', 'shares', 'pollOptions', 'pollEndsAt', 'isPublic', 'author', 'createdAt', 'updatedAt'] }
        });
        res.json({ success: true, data: posts, total: posts.length });
    }
    catch (err) {
        handleError(res, err, 'getBookmarkedPosts');
    }
};
exports.getBookmarkedPosts = getBookmarkedPosts;
// ─────────────────────────────────────────────────────────────────────────────
// Poll voting
// ─────────────────────────────────────────────────────────────────────────────
const votePoll = async (req, res) => {
    try {
        const { postId } = req.params;
        const { optionIndex } = req.body;
        const userId = req.headers['x-user-id'];
        const post = await models_1.Post.findByPk(postId);
        if (!post || !post.pollOptions) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }
        const options = [...post.pollOptions];
        // Remove existing vote from all options
        options.forEach((opt) => { opt.votes = (opt.votes || []).filter((v) => v !== userId); });
        // Add new vote to selected option
        if (typeof optionIndex === 'number' && optionIndex >= 0 && optionIndex < options.length) {
            options[optionIndex].votes = [...(options[optionIndex].votes || []), userId];
        }
        await post.update({ pollOptions: options });
        res.json({ success: true, data: { pollOptions: options } });
    }
    catch (err) {
        handleError(res, err, 'votePoll');
    }
};
exports.votePoll = votePoll;
//# sourceMappingURL=postController.js.map