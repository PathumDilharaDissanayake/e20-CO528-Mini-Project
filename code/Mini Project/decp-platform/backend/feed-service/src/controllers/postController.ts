import { Request, Response } from 'express';
import { Post, Like, Comment } from '../models';
import { logger } from '../utils/logger';
import Joi from 'joi';

const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  type: Joi.string().valid('text', 'image', 'video', 'document').default('text'),
  isPublic: Joi.boolean().default(true)
});

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  parentId: Joi.string().uuid().optional()
});

export const getFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const userId = req.query.userId as string | undefined;

    const where: any = { isPublic: true };
    if (userId) where.userId = userId;

    const { count, rows: posts } = await Post.findAndCountAll({
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
  } catch (error) {
    logger.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

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
        error: error.details[0].message
      });
      return;
    }

    const mediaUrls = (req.files as Express.Multer.File[])?.map(f => `/uploads/${f.filename}`) || [];

    const post = await Post.create({
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
  } catch (error) {
    logger.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;

    const post = await Post.findByPk(postId, {
      include: [
        { model: Comment, as: 'postComments' }
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
  } catch (error) {
    logger.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
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
  } catch (error) {
    logger.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
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
  } catch (error) {
    logger.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const likePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const [like, created] = await Like.findOrCreate({
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
  } catch (error) {
    logger.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const unlikePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const like = await Like.findOne({ where: { postId, userId } });
    if (!like) {
      res.status(200).json({ success: true, message: 'Post already unliked', data: { liked: false } });
      return;
    }

    await like.destroy();
    await post.decrement('likes');

    res.json({ success: true, message: 'Post unliked', data: { liked: false } });
  } catch (error) {
    logger.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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
        error: error.details[0].message
      });
      return;
    }

    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const comment = await Comment.create({
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
  } catch (error) {
    logger.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: comments } = await Comment.findAndCountAll({
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
  } catch (error) {
    logger.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { postId, commentId } = req.params;

    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const comment = await Comment.findOne({ where: { id: commentId, postId } });
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
  } catch (error) {
    logger.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const sharePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
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
  } catch (error) {
    logger.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
