"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharePost = exports.deleteComment = exports.getComments = exports.addComment = exports.unlikePost = exports.likePost = exports.deletePost = exports.updatePost = exports.getPost = exports.createPost = exports.getFeed = void 0;
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
const createPostSchema = joi_1.default.object({
    content: joi_1.default.string().min(1).max(5000).required(),
    type: joi_1.default.string().valid('text', 'image', 'video', 'document').default('text'),
    isPublic: joi_1.default.boolean().default(true)
});
const createCommentSchema = joi_1.default.object({
    content: joi_1.default.string().min(1).max(2000).required(),
    parentId: joi_1.default.string().uuid().optional()
});
const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const userId = req.query.userId;
        const where = { isPublic: true };
        if (userId)
            where.userId = userId;
        const { count, rows: posts } = await models_1.Post.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        res.json({
            success: true,
            message: 'Feed retrieved successfully',
            data: posts,
            meta: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get feed error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFeed = getFeed;
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
                error: error.details[0].message
            });
            return;
        }
        const mediaUrls = req.files?.map(f => `/uploads/${f.filename}`) || [];
        const post = await models_1.Post.create({
            userId,
            content: value.content,
            type: mediaUrls.length > 0 ? (value.type || 'image') : 'text',
            mediaUrls,
            isPublic: value.isPublic
        });
        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: { post }
        });
    }
    catch (error) {
        logger_1.logger.error('Create post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createPost = createPost;
const getPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await models_1.Post.findByPk(postId, {
            include: [
                { model: models_1.Comment, as: 'postComments' }
            ]
        });
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        res.json({
            success: true,
            message: 'Post retrieved successfully',
            data: { post }
        });
    }
    catch (error) {
        logger_1.logger.error('Get post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getPost = getPost;
const updatePost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { postId } = req.params;
        const post = await models_1.Post.findByPk(postId);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        if (post.userId !== userId) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const { content, isPublic } = req.body;
        await post.update({ content, isPublic });
        res.json({
            success: true,
            message: 'Post updated successfully',
            data: { post }
        });
    }
    catch (error) {
        logger_1.logger.error('Update post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const { postId } = req.params;
        const post = await models_1.Post.findByPk(postId);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        if (post.userId !== userId && userRole !== 'admin') {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        await post.destroy();
        res.json({
            success: true,
            message: 'Post deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deletePost = deletePost;
const likePost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { postId } = req.params;
        const post = await models_1.Post.findByPk(postId);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        const [like, created] = await models_1.Like.findOrCreate({
            where: { postId, userId }
        });
        if (!created) {
            await like.destroy();
            await post.decrement('likes');
            res.json({ success: true, message: 'Post unliked', data: { liked: false } });
            return;
        }
        await post.increment('likes');
        res.json({ success: true, message: 'Post liked', data: { liked: true } });
    }
    catch (error) {
        logger_1.logger.error('Like post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.likePost = likePost;
const unlikePost = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { postId } = req.params;
        const post = await models_1.Post.findByPk(postId);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        const like = await models_1.Like.findOne({ where: { postId, userId } });
        if (!like) {
            res.status(200).json({ success: true, message: 'Post already unliked', data: { liked: false } });
            return;
        }
        await like.destroy();
        await post.decrement('likes');
        res.json({ success: true, message: 'Post unliked', data: { liked: false } });
    }
    catch (error) {
        logger_1.logger.error('Unlike post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.unlikePost = unlikePost;
const addComment = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { postId } = req.params;
        const { error, value } = createCommentSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
            return;
        }
        const post = await models_1.Post.findByPk(postId);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        const comment = await models_1.Comment.create({
            postId,
            userId,
            content: value.content,
            parentId: value.parentId
        });
        await post.increment('comments');
        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: { comment }
        });
    }
    catch (error) {
        logger_1.logger.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.addComment = addComment;
const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows: comments } = await models_1.Comment.findAndCountAll({
            where: { postId },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        res.json({
            success: true,
            message: 'Comments retrieved successfully',
            data: comments,
            meta: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getComments = getComments;
const deleteComment = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const { postId, commentId } = req.params;
        const post = await models_1.Post.findByPk(postId);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        const comment = await models_1.Comment.findOne({ where: { id: commentId, postId } });
        if (!comment) {
            res.status(404).json({ success: false, message: 'Comment not found' });
            return;
        }
        if (comment.userId !== userId && post.userId !== userId && userRole !== 'admin') {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        await comment.destroy();
        await post.decrement('comments');
        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteComment = deleteComment;
const sharePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await models_1.Post.findByPk(postId);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        await post.increment('shares');
        res.json({
            success: true,
            message: 'Post shared successfully',
            data: { shares: post.shares + 1 }
        });
    }
    catch (error) {
        logger_1.logger.error('Share post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.sharePost = sharePost;
//# sourceMappingURL=postController.js.map