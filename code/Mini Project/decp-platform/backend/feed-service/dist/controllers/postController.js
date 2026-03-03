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
exports.sharePost = exports.deleteComment = exports.addComment = exports.getComments = exports.unlikePost = exports.likePost = exports.deletePost = exports.updatePost = exports.createPost = exports.getPost = exports.getFeed = void 0;
const joi_1 = __importDefault(require("joi"));
const postService = __importStar(require("../services/postService"));
const logger_1 = require("../utils/logger");
// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────
const createPostSchema = joi_1.default.object({
    content: joi_1.default.string().min(1).max(5000).required(),
    type: joi_1.default.string().valid('text', 'image', 'video', 'document').default('text'),
    isPublic: joi_1.default.boolean().default(true)
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
        const { error, value } = createPostSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [{ field: error.details[0].path.join('.'), message: error.details[0].message }]
            });
            return;
        }
        const mediaUrls = req.files?.map(f => `/uploads/${f.filename}`) || [];
        const post = await postService.createPost({ userId, ...value, mediaUrls });
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
// Likes
// ─────────────────────────────────────────────────────────────────────────────
const likePost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { postId } = req.params;
        const result = await postService.toggleLike(postId, userId);
        res.json({
            success: true,
            message: result.liked ? 'Post liked' : 'Post unliked',
            data: result
        });
    }
    catch (err) {
        handleError(res, err, 'likePost');
    }
};
exports.likePost = likePost;
// Kept for backward-compatibility — delegates to the same toggle
exports.unlikePost = exports.likePost;
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
        const comment = await postService.addComment({ userId, postId, ...value });
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
//# sourceMappingURL=postController.js.map