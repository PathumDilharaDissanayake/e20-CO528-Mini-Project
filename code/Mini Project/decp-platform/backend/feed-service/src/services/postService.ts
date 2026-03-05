/**
 * Post Service — Business logic layer for the feed-service.
 * Controllers delegate all domain logic here; this layer is fully unit-testable
 * without an HTTP layer or live database connection.
 *
 * Agent: A-06 (Backend Implementation Agent)
 * Fixes: FLAW-003, FLAW-004, FLAW-012 (transactions + idempotency)
 */

import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import { Post, Like, Comment, Share } from '../models';
import { AuthorInfo } from '../models/Post';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FeedOptions {
  page?: number;
  limit?: number;
  cursor?: string;         // ISO timestamp for cursor-based pagination
  userId?: string;         // filter by author
  requestingUserId?: string;
}

export interface FeedResult {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor: string | null;
}

export interface CreatePostInput {
  userId: string;
  author?: AuthorInfo;
  content: string;
  type?: 'text' | 'image' | 'video' | 'document' | 'poll';
  isPublic?: boolean;
  mediaUrls?: string[];
  pollOptions?: Array<{ text: string; votes: string[] }>;
  pollEndsAt?: Date;
}

export interface CommentInput {
  userId: string;
  author?: AuthorInfo;
  postId: string;
  content: string;
  parentId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed / Read
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieve paginated feed. Supports both offset (legacy) and cursor-based pagination.
 * When `cursor` is provided, it overrides `page` and uses createdAt-based cursor.
 */
export const getFeed = async (options: FeedOptions): Promise<FeedResult> => {
  const { page = 1, limit = 10, cursor, userId } = options;
  const safeLimit = Math.min(Math.max(1, limit), 50); // clamp 1–50

  const where: Record<string, unknown> = { isPublic: true };
  if (userId) where.userId = userId;

  // Cursor-based: more efficient at scale
  if (cursor) {
    where.createdAt = { [Op.lt]: new Date(cursor) };
    const posts = await Post.findAll({
      where,
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: safeLimit + 1, // +1 to detect hasNext
      raw: false,  // Get full objects with getters
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
  const { count, rows: posts } = await Post.findAndCountAll({
    where,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit: safeLimit,
    offset,
    raw: false,  // Get full objects with getters
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

export const getPostById = async (postId: string): Promise<Post | null> => {
  return Post.findByPk(postId, {
    include: [{ model: Comment, as: 'postComments', limit: 10 }]
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Create / Update / Delete
// ─────────────────────────────────────────────────────────────────────────────

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  const { userId, author, content, type = 'text', isPublic = true, mediaUrls = [], pollOptions, pollEndsAt } = input;
  let effectiveType: 'text' | 'image' | 'video' | 'document' | 'poll' = type;
  if (pollOptions && pollOptions.length > 0) {
    effectiveType = 'poll';
  } else if (mediaUrls.length > 0 && type === 'text') {
    const hasVideo = mediaUrls.some(url => /\.(mp4|webm|ogg)$/i.test(url));
    effectiveType = hasVideo ? 'video' : 'image';
  }
  return Post.create({ userId, author, content, type: effectiveType, isPublic, mediaUrls, pollOptions: pollOptions || null, pollEndsAt: pollEndsAt || null });
};

export const updatePost = async (
  postId: string,
  userId: string,
  updates: { content?: string; isPublic?: boolean }
): Promise<Post> => {
  const post = await Post.findByPk(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if (post.userId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  return post.update(updates);
};

export const deletePost = async (postId: string, userId: string, userRole: string): Promise<void> => {
  const post = await Post.findByPk(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if (post.userId !== userId && userRole !== 'admin') {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  await post.destroy();
};

// ─────────────────────────────────────────────────────────────────────────────
// Likes — atomic toggle with transaction (FLAW-003 fix)
// ─────────────────────────────────────────────────────────────────────────────

export interface LikeResult {
  liked: boolean;
  likesCount: number;
}

/**
 * Toggle like on a post. Uses a Sequelize transaction to ensure the Like record
 * and the Post.likes counter are always in sync (FLAW-003 fix).
 * Uses findOrCreate so the result is idempotent from the caller's perspective.
 */
export const toggleLike = async (postId: string, userId: string): Promise<LikeResult> => {
  const t: Transaction = await sequelize.transaction();
  try {
    const post = await Post.findByPk(postId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!post) {
      await t.rollback();
      throw Object.assign(new Error('Post not found'), { statusCode: 404 });
    }

    const [like, created] = await Like.findOrCreate({
      where: { postId, userId },
      defaults: { postId, userId },
      transaction: t
    });

    if (!created) {
      // Already liked — remove like
      await like.destroy({ transaction: t });
      await post.decrement('likes', { by: 1, transaction: t });
      await t.commit();
      const refreshed = await Post.findByPk(postId, { attributes: ['likes'] });
      return { liked: false, likesCount: refreshed?.likes ?? Math.max(0, post.likes - 1) };
    }

    await post.increment('likes', { by: 1, transaction: t });
    await t.commit();
    const refreshed = await Post.findByPk(postId, { attributes: ['likes'] });
    return { liked: true, likesCount: refreshed?.likes ?? post.likes + 1 };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Comments — transactional create (FLAW-012 fix)
// ─────────────────────────────────────────────────────────────────────────────

export const getComments = async (
  postId: string,
  page = 1,
  limit = 20
): Promise<{ comments: Comment[]; total: number }> => {
  const offset = (page - 1) * Math.min(limit, 100);
  const { count, rows: comments } = await Comment.findAndCountAll({
    where: { postId },
    order: [['createdAt', 'ASC']],
    limit: Math.min(limit, 100),
    offset
  });
  return { comments, total: count };
};

export const addComment = async (input: CommentInput): Promise<Comment> => {
  const { userId, author, postId, content, parentId } = input;
  const t: Transaction = await sequelize.transaction();
  try {
    const post = await Post.findByPk(postId, { transaction: t });
    if (!post) {
      await t.rollback();
      throw Object.assign(new Error('Post not found'), { statusCode: 404 });
    }
    const comment = await Comment.create({ postId, userId, author, content, parentId }, { transaction: t });
    await post.increment('comments', { by: 1, transaction: t });
    await t.commit();
    return comment;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

export const deleteComment = async (
  postId: string,
  commentId: string,
  userId: string,
  userRole: string
): Promise<void> => {
  const t: Transaction = await sequelize.transaction();
  try {
    const post = await Post.findByPk(postId, { transaction: t });
    if (!post) {
      await t.rollback();
      throw Object.assign(new Error('Post not found'), { statusCode: 404 });
    }
    const comment = await Comment.findOne({ where: { id: commentId, postId }, transaction: t });
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
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Shares — idempotent toggle (FLAW-004 fix)
// ─────────────────────────────────────────────────────────────────────────────

export interface ShareResult {
  shared: boolean;
  sharesCount: number;
}

/**
 * Toggle share on a post. Uses findOrCreate so a user cannot inflate the share count
 * by calling this endpoint multiple times (FLAW-004 fix).
 */
export const toggleShare = async (postId: string, userId: string): Promise<ShareResult> => {
  const t: Transaction = await sequelize.transaction();
  try {
    const post = await Post.findByPk(postId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!post) {
      await t.rollback();
      throw Object.assign(new Error('Post not found'), { statusCode: 404 });
    }

    const [, created] = await Share.findOrCreate({
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
    const refreshed = await Post.findByPk(postId, { attributes: ['shares'] });
    return { shared: true, sharesCount: refreshed?.shares ?? post.shares + 1 };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
