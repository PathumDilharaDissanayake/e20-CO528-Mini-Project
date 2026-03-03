/**
 * Post Controller — HTTP layer only. All business logic delegated to postService.
 * Max responsibility: parse request → call service → format response.
 *
 * Agent: A-06 (Backend Implementation Agent)
 * Refactored: 2026-03-03 — Extracted service layer, fixed FLAW-003/004/011/012
 */

import { Request, Response } from 'express';
import Joi from 'joi';
import * as postService from '../services/postService';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────

const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  type: Joi.string().valid('text', 'image', 'video', 'document').default('text'),
  isPublic: Joi.boolean().default(true)
});

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  parentId: Joi.string().uuid().optional()
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: uniform error response
// ─────────────────────────────────────────────────────────────────────────────

const handleError = (res: Response, err: unknown, context: string): void => {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode || 500;
  if (status >= 500) logger.error(`[${context}] ${error.message}`, { stack: error.stack });
  res.status(status).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Feed
// ─────────────────────────────────────────────────────────────────────────────

export const getFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string | undefined;
    const userId = req.query.userId as string | undefined;

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
  } catch (err) {
    handleError(res, err, 'getFeed');
  }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const post = await postService.getPostById(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }
    res.json({ success: true, message: 'Post retrieved successfully', data: { post } });
  } catch (err) {
    handleError(res, err, 'getPost');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
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

    const mediaUrls = (req.files as Express.Multer.File[])?.map(f => `/uploads/${f.filename}`) || [];
    const post = await postService.createPost({ userId, ...value, mediaUrls });

    res.status(201).json({ success: true, message: 'Post created successfully', data: { post } });
  } catch (err) {
    handleError(res, err, 'createPost');
  }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { postId } = req.params;
    const { content, isPublic } = req.body;

    const post = await postService.updatePost(postId, userId, { content, isPublic });
    res.json({ success: true, message: 'Post updated successfully', data: { post } });
  } catch (err) {
    handleError(res, err, 'updatePost');
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { postId } = req.params;

    await postService.deletePost(postId, userId, userRole);
    res.status(204).send();
  } catch (err) {
    handleError(res, err, 'deletePost');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Likes
// ─────────────────────────────────────────────────────────────────────────────

export const likePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { postId } = req.params;
    const result = await postService.toggleLike(postId, userId);
    res.json({
      success: true,
      message: result.liked ? 'Post liked' : 'Post unliked',
      data: result
    });
  } catch (err) {
    handleError(res, err, 'likePost');
  }
};

// Kept for backward-compatibility — delegates to the same toggle
export const unlikePost = likePost;

// ─────────────────────────────────────────────────────────────────────────────
// Comments
// ─────────────────────────────────────────────────────────────────────────────

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { comments, total } = await postService.getComments(postId, page, limit);
    res.json({
      success: true,
      message: 'Comments retrieved successfully',
      data: comments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    handleError(res, err, 'getComments');
  }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
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
  } catch (err) {
    handleError(res, err, 'addComment');
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { postId, commentId } = req.params;

    await postService.deleteComment(postId, commentId, userId, userRole);
    res.status(204).send();
  } catch (err) {
    handleError(res, err, 'deleteComment');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Shares
// ─────────────────────────────────────────────────────────────────────────────

export const sharePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { postId } = req.params;
    const result = await postService.toggleShare(postId, userId);
    res.json({ success: true, message: 'Post shared successfully', data: result });
  } catch (err) {
    handleError(res, err, 'sharePost');
  }
};
