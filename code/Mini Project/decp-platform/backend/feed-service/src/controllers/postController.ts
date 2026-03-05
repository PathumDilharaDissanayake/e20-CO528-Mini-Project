/**
 * Post Controller — HTTP layer only. All business logic delegated to postService.
 * Max responsibility: parse request → call service → format response.
 *
 * Agent: A-06 (Backend Implementation Agent)
 * Refactored: 2026-03-03 — Extracted service layer, fixed FLAW-003/004/011/012
 */

import { Request, Response } from 'express';
import Joi from 'joi';
import path from 'path';
import * as postService from '../services/postService';
import { logger } from '../utils/logger';
import { sendNotification } from '../utils/notify';
import { Post, Like, Bookmark } from '../models';

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────

const createPostSchema = Joi.object({
  content: Joi.string().min(0).max(5000).allow('').default(''),
  type: Joi.string().valid('text', 'image', 'video', 'document', 'poll').default('text'),
  isPublic: Joi.boolean().default(true),
  pollOptions: Joi.array().items(Joi.object({ text: Joi.string().required(), votes: Joi.array().items(Joi.string()).default([]) })).optional(),
  pollEndsAt: Joi.date().optional(),
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

    // Parse pollOptions from FormData (sent as JSON string)
    let bodyWithParsedPoll = { ...req.body };
    if (typeof req.body.pollOptions === 'string') {
      try {
        bodyWithParsedPoll.pollOptions = JSON.parse(req.body.pollOptions);
      } catch {
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
      firstName: (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || '') as string,
      lastName: (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || '') as string,
      role: (req.headers['x-user-role'] || '') as string,
      avatar: (req.headers['x-user-avatar'] || '') as string
    };

    const mediaUrls = (req.files as Express.Multer.File[])?.map(f => `/uploads/${f.filename}`) || [];
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
// Likes / Reactions
// ─────────────────────────────────────────────────────────────────────────────

export const likePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { postId } = req.params;
    const reactionType: string = req.body?.reactionType || 'like';

    const existingLike = await Like.findOne({ where: { postId, userId } });

    if (existingLike) {
      if ((existingLike as any).reactionType === reactionType) {
        // Same reaction — toggle off
        await existingLike.destroy();
        await Post.findByPk(postId).then(p => p && p.decrement('likes', { by: 1 })).catch(() => { });
        const count = await Like.count({ where: { postId } });
        res.json({ success: true, data: { liked: false, likesCount: count, reactionType: null } });
        return;
      } else {
        // Different reaction — update it
        await existingLike.update({ reactionType } as any);
        const count = await Like.count({ where: { postId } });
        res.json({ success: true, data: { liked: true, likesCount: count, reactionType } });
        return;
      }
    }

    await Like.create({ postId, userId, reactionType } as any);
    await Post.findByPk(postId).then(p => p && p.increment('likes', { by: 1 })).catch(() => { });
    const count = await Like.count({ where: { postId } });

    // Fire-and-forget notification to post author (don't notify self)
    Post.findByPk(postId, { attributes: ['userId', 'author'] }).then((post) => {
      if (post && post.userId !== userId) {
        const firstName = (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || '') as string;
        const lastName = (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || '') as string;
        const likerName = `${firstName} ${lastName}`.trim() || 'Someone';
        sendNotification(
          post.userId,
          'mention',
          'Someone reacted to your post',
          `${likerName} reacted to your post`,
          { postId }
        );
      }
    }).catch(() => { });

    res.json({ success: true, data: { liked: true, likesCount: count, reactionType } });
  } catch (err) {
    handleError(res, err, 'likePost');
  }
};

// Kept for backward-compatibility — delegates to the same toggle
export const unlikePost = likePost;

export const getPostReactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const likes = await Like.findAll({ where: { postId }, attributes: ['userId', 'reactionType'] });
    const counts: Record<string, number> = {};
    likes.forEach((l: any) => { counts[l.reactionType] = (counts[l.reactionType] || 0) + 1; });
    res.json({ success: true, data: { reactions: counts, total: likes.length } });
  } catch (err) {
    handleError(res, err, 'getPostReactions');
  }
};

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

    // Build author object from gateway-injected headers
    const author = {
      _id: userId,
      firstName: (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || '') as string,
      lastName: (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || '') as string,
      role: (req.headers['x-user-role'] || '') as string,
      avatar: (req.headers['x-user-avatar'] || '') as string
    };

    const comment = await postService.addComment({ userId, author, postId, ...value });

    // Fire-and-forget notification to post author (don't notify self-comments)
    Post.findByPk(postId, { attributes: ['userId'] }).then((post) => {
      if (post && post.userId !== userId) {
        const commenterName = `${author.firstName} ${author.lastName}`.trim() || 'Someone';
        sendNotification(
          post.userId,
          'mention',
          'New comment on your post',
          `${commenterName} commented on your post`,
          { postId }
        );
      }
    }).catch(() => { });

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

// ─────────────────────────────────────────────────────────────────────────────
// File upload only — returns URL for use in events, research, profile pictures
// ─────────────────────────────────────────────────────────────────────────────

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }
    const filename = (req.file as any).filename || path.basename((req.file as any).path || '');
    const url = `/uploads/${filename}`;
    res.status(200).json({ success: true, data: { url } });
  } catch (err) {
    handleError(res, err, 'uploadFile');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bookmarks
// ─────────────────────────────────────────────────────────────────────────────

export const bookmarkPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const existing = await Bookmark.findOne({ where: { postId, userId } });
    if (existing) {
      await existing.destroy();
      res.json({ success: true, data: { bookmarked: false } });
      return;
    }
    await Bookmark.create({ userId, postId });
    res.json({ success: true, data: { bookmarked: true } });
  } catch (err) {
    handleError(res, err, 'bookmarkPost');
  }
};

export const getBookmarkedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const bookmarks = await Bookmark.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    const postIds = bookmarks.map((b: any) => b.postId);
    const posts = await Post.findAll({
      where: { id: postIds.length > 0 ? postIds : ['none'] },
      order: [['createdAt', 'DESC']],
      attributes: { include: ['id', 'userId', 'content', 'type', 'mediaUrls', 'likes', 'comments', 'shares', 'pollOptions', 'pollEndsAt', 'isPublic', 'author', 'createdAt', 'updatedAt'] }
    });
    res.json({ success: true, data: posts, total: posts.length });
  } catch (err) {
    handleError(res, err, 'getBookmarkedPosts');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Poll voting
// ─────────────────────────────────────────────────────────────────────────────

export const votePoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.headers['x-user-id'] as string;

    const post = await Post.findByPk(postId);
    if (!post || !post.pollOptions) {
      res.status(404).json({ success: false, message: 'Poll not found' });
      return;
    }

    const options = [...(post.pollOptions as any[])];
    // Remove existing vote from all options
    options.forEach((opt: any) => { opt.votes = (opt.votes || []).filter((v: string) => v !== userId); });
    // Add new vote to selected option
    if (typeof optionIndex === 'number' && optionIndex >= 0 && optionIndex < options.length) {
      options[optionIndex].votes = [...(options[optionIndex].votes || []), userId];
    }

    await post.update({ pollOptions: options });
    res.json({ success: true, data: { pollOptions: options } });
  } catch (err) {
    handleError(res, err, 'votePoll');
  }
};
