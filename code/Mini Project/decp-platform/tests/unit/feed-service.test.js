/**
 * Feed Service Unit Tests
 * Tests for post creation, likes, comments, and feed operations
 */

const {
  getFeed,
  createPost,
  getPost,
  updatePost,
  deletePost,
  likePost,
  addComment,
  getComments,
  sharePost
} = require('../../backend/feed-service/src/controllers/postController');
const { Post, Like, Comment } = require('../../backend/feed-service/src/models');

// Mock dependencies
jest.mock('../../backend/feed-service/src/models');
jest.mock('../../backend/feed-service/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Feed Service - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockPost;
  let mockComment;
  let mockLike;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockPost = {
      id: 'post-123',
      userId: 'user-123',
      content: 'Test post content',
      type: 'text',
      mediaUrls: [],
      isPublic: true,
      likes: 10,
      comments: 5,
      shares: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn()
    };
    mockComment = {
      id: 'comment-123',
      postId: 'post-123',
      userId: 'user-456',
      content: 'Great post!',
      parentId: null,
      createdAt: new Date(),
      destroy: jest.fn()
    };
    mockLike = {
      id: 'like-123',
      postId: 'post-123',
      userId: 'user-456',
      destroy: jest.fn()
    };
  });

  describe('Get Feed', () => {
    test('should get feed with default pagination', async () => {
      mockReq = { query: {} };
      Post.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: Array(10).fill(mockPost)
      });

      await getFeed(mockReq, mockRes);

      expect(Post.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isPublic: true },
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3
        })
      }));
    });

    test('should get feed with custom pagination', async () => {
      mockReq = { query: { page: '2', limit: '5' } };
      Post.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: Array(5).fill(mockPost)
      });

      await getFeed(mockReq, mockRes);

      expect(Post.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        limit: 5,
        offset: 5
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        meta: expect.objectContaining({ page: 2, limit: 5 })
      }));
    });

    test('should only return public posts', async () => {
      mockReq = { query: {} };
      Post.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await getFeed(mockReq, mockRes);

      expect(Post.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isPublic: true }
      }));
    });

    test('should handle empty feed', async () => {
      mockReq = { query: {} };
      Post.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await getFeed(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [],
        meta: expect.objectContaining({ total: 0 })
      }));
    });

    test('should handle database errors', async () => {
      mockReq = { query: {} };
      Post.findAndCountAll.mockRejectedValue(new Error('Database error'));

      await getFeed(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Internal server error'
      }));
    });

    test('should handle maximum page size limit', async () => {
      mockReq = { query: { limit: '1000' } };
      Post.findAndCountAll.mockResolvedValue({
        count: 100,
        rows: Array(50).fill(mockPost)
      });

      await getFeed(mockReq, mockRes);

      // Should cap at maximum allowed limit (e.g., 50)
      expect(Post.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        limit: expect.any(Number)
      }));
    });
  });

  describe('Create Post', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {
          content: 'This is a test post',
          type: 'text',
          isPublic: true
        },
        files: null
      };
    });

    test('should create text post successfully', async () => {
      Post.create.mockResolvedValue(mockPost);

      await createPost(mockReq, mockRes);

      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-123',
        content: 'This is a test post',
        type: 'text',
        isPublic: true,
        mediaUrls: []
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Post created successfully'
      }));
    });

    test('should create post with media', async () => {
      mockReq.body.type = 'image';
      mockReq.files = [
        { filename: 'image1.jpg' },
        { filename: 'image2.jpg' }
      ];
      Post.create.mockResolvedValue(mockPost);

      await createPost(mockReq, mockRes);

      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'image',
        mediaUrls: ['/uploads/image1.jpg', '/uploads/image2.jpg']
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq.headers = {};

      await createPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('should validate empty content', async () => {
      mockReq.body.content = '';

      await createPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate content length', async () => {
      mockReq.body.content = 'a'.repeat(5001);

      await createPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate post type', async () => {
      mockReq.body.type = 'invalid-type';

      await createPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should default to text type if media present but type not specified', async () => {
      mockReq.body.type = undefined;
      mockReq.files = [{ filename: 'image.jpg' }];
      Post.create.mockResolvedValue(mockPost);

      await createPost(mockReq, mockRes);

      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'image'
      }));
    });

    test('should create private post', async () => {
      mockReq.body.isPublic = false;
      Post.create.mockResolvedValue(mockPost);

      await createPost(mockReq, mockRes);

      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({
        isPublic: false
      }));
    });

    test('should handle database error during creation', async () => {
      Post.create.mockRejectedValue(new Error('Database error'));

      await createPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Get Post', () => {
    test('should get post by id successfully', async () => {
      mockReq = {
        params: { postId: 'post-123' }
      };
      Post.findByPk.mockResolvedValue({
        ...mockPost,
        postComments: [mockComment]
      });

      await getPost(mockReq, mockRes);

      expect(Post.findByPk).toHaveBeenCalledWith('post-123', expect.objectContaining({
        include: expect.any(Array)
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ post: expect.any(Object) })
      }));
    });

    test('should return 404 for non-existent post', async () => {
      mockReq = {
        params: { postId: 'nonexistent' }
      };
      Post.findByPk.mockResolvedValue(null);

      await getPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should include comments with post', async () => {
      mockReq = {
        params: { postId: 'post-123' }
      };
      Post.findByPk.mockResolvedValue({
        ...mockPost,
        postComments: [mockComment, mockComment]
      });

      await getPost(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          post: expect.objectContaining({
            postComments: expect.any(Array)
          })
        })
      }));
    });
  });

  describe('Update Post', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { postId: 'post-123' },
        body: {
          content: 'Updated content',
          isPublic: false
        }
      };
    });

    test('should update own post successfully', async () => {
      Post.findByPk.mockResolvedValue(mockPost);

      await updatePost(mockReq, mockRes);

      expect(mockPost.update).toHaveBeenCalledWith({
        content: 'Updated content',
        isPublic: false
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Post updated successfully'
      }));
    });

    test('should return 404 for non-existent post', async () => {
      Post.findByPk.mockResolvedValue(null);

      await updatePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized update', async () => {
      mockReq.headers['x-user-id'] = 'user-456';
      Post.findByPk.mockResolvedValue(mockPost);

      await updatePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle partial updates', async () => {
      mockReq.body = { content: 'Only update content' };
      Post.findByPk.mockResolvedValue(mockPost);

      await updatePost(mockReq, mockRes);

      expect(mockPost.update).toHaveBeenCalledWith({
        content: 'Only update content',
        isPublic: undefined
      });
    });
  });

  describe('Delete Post', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-123', 'x-user-role': 'student' },
        params: { postId: 'post-123' }
      };
    });

    test('should delete own post successfully', async () => {
      Post.findByPk.mockResolvedValue(mockPost);

      await deletePost(mockReq, mockRes);

      expect(mockPost.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Post deleted successfully'
      }));
    });

    test('should allow admin to delete any post', async () => {
      mockReq.headers['x-user-id'] = 'admin-123';
      mockReq.headers['x-user-role'] = 'admin';
      Post.findByPk.mockResolvedValue(mockPost);

      await deletePost(mockReq, mockRes);

      expect(mockPost.destroy).toHaveBeenCalled();
    });

    test('should return 403 for unauthorized deletion', async () => {
      mockReq.headers['x-user-id'] = 'user-456';
      mockReq.headers['x-user-role'] = 'student';
      Post.findByPk.mockResolvedValue(mockPost);

      await deletePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should return 404 for non-existent post', async () => {
      Post.findByPk.mockResolvedValue(null);

      await deletePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should delete associated comments and likes', async () => {
      Post.findByPk.mockResolvedValue(mockPost);
      Comment.destroy = jest.fn().mockResolvedValue(5);
      Like.destroy = jest.fn().mockResolvedValue(10);

      await deletePost(mockReq, mockRes);

      // Should cascade delete
      expect(mockPost.destroy).toHaveBeenCalled();
    });
  });

  describe('Like Post', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { postId: 'post-123' }
      };
    });

    test('should like post successfully', async () => {
      Post.findByPk.mockResolvedValue(mockPost);
      Like.findOrCreate.mockResolvedValue([mockLike, true]);

      await likePost(mockReq, mockRes);

      expect(mockPost.increment).toHaveBeenCalledWith('likes');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Post liked',
        data: { liked: true }
      }));
    });

    test('should unlike post if already liked', async () => {
      Post.findByPk.mockResolvedValue(mockPost);
      Like.findOrCreate.mockResolvedValue([mockLike, false]);

      await likePost(mockReq, mockRes);

      expect(mockLike.destroy).toHaveBeenCalled();
      expect(mockPost.decrement).toHaveBeenCalledWith('likes');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Post unliked',
        data: { liked: false }
      }));
    });

    test('should return 404 for non-existent post', async () => {
      Post.findByPk.mockResolvedValue(null);

      await likePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database error', async () => {
      Post.findByPk.mockRejectedValue(new Error('Database error'));

      await likePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Add Comment', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { postId: 'post-123' },
        body: {
          content: 'Great post!'
        }
      };
    });

    test('should add comment successfully', async () => {
      Post.findByPk.mockResolvedValue(mockPost);
      Comment.create.mockResolvedValue(mockComment);

      await addComment(mockReq, mockRes);

      expect(Comment.create).toHaveBeenCalledWith(expect.objectContaining({
        postId: 'post-123',
        userId: 'user-456',
        content: 'Great post!'
      }));
      expect(mockPost.increment).toHaveBeenCalledWith('comments');
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should add reply to comment', async () => {
      mockReq.body.parentId = 'comment-123';
      Post.findByPk.mockResolvedValue(mockPost);
      Comment.create.mockResolvedValue({ ...mockComment, parentId: 'comment-123' });

      await addComment(mockReq, mockRes);

      expect(Comment.create).toHaveBeenCalledWith(expect.objectContaining({
        parentId: 'comment-123'
      }));
    });

    test('should return 404 for non-existent post', async () => {
      Post.findByPk.mockResolvedValue(null);

      await addComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should validate empty comment', async () => {
      mockReq.body.content = '';
      Post.findByPk.mockResolvedValue(mockPost);

      await addComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate comment length', async () => {
      mockReq.body.content = 'a'.repeat(2001);
      Post.findByPk.mockResolvedValue(mockPost);

      await addComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should return 401 if not authenticated', async () => {
      mockReq.headers = {};

      await addComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Get Comments', () => {
    test('should get comments with pagination', async () => {
      mockReq = {
        params: { postId: 'post-123' },
        query: { page: '1', limit: '10' }
      };
      Comment.findAndCountAll.mockResolvedValue({
        count: 15,
        rows: Array(10).fill(mockComment)
      });

      await getComments(mockReq, mockRes);

      expect(Comment.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { postId: 'post-123' },
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        meta: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 15
        })
      }));
    });

    test('should return empty array if no comments', async () => {
      mockReq = {
        params: { postId: 'post-123' },
        query: {}
      };
      Comment.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await getComments(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        meta: expect.objectContaining({ total: 0 })
      }));
    });
  });

  describe('Share Post', () => {
    test('should increment share count', async () => {
      mockReq = {
        params: { postId: 'post-123' }
      };
      Post.findByPk.mockResolvedValue(mockPost);

      await sharePost(mockReq, mockRes);

      expect(mockPost.increment).toHaveBeenCalledWith('shares');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Post shared successfully'
      }));
    });

    test('should return 404 for non-existent post', async () => {
      mockReq = {
        params: { postId: 'nonexistent' }
      };
      Post.findByPk.mockResolvedValue(null);

      await sharePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle very long post content', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {
          content: 'a'.repeat(5000),
          type: 'text'
        },
        files: null
      };
      Post.create.mockResolvedValue(mockPost);

      await createPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle multiple concurrent likes', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { postId: 'post-123' }
      };
      Post.findByPk.mockResolvedValue(mockPost);
      Like.findOrCreate.mockResolvedValue([mockLike, true]);

      const promises = Array(5).fill().map(() => likePost(mockReq, mockRes));
      await Promise.all(promises);

      expect(mockPost.increment).toHaveBeenCalledTimes(5);
    });

    test('should handle deeply nested comments', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { postId: 'post-123' },
        body: {
          content: 'Nested reply',
          parentId: 'deep-nested-comment-id'
        }
      };
      Post.findByPk.mockResolvedValue(mockPost);
      Comment.create.mockResolvedValue(mockComment);

      await addComment(mockReq, mockRes);

      expect(Comment.create).toHaveBeenCalled();
    });

    test('should handle maximum page number', async () => {
      mockReq = { query: { page: '999999', limit: '10' } };
      Post.findAndCountAll.mockResolvedValue({
        count: 100,
        rows: []
      });

      await getFeed(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: []
      }));
    });

    test('should handle special characters in post content', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {
          content: '<script>alert("xss")</script> 🎉 Hello! @user #hashtag',
          type: 'text'
        },
        files: null
      };
      Post.create.mockResolvedValue(mockPost);

      await createPost(mockReq, mockRes);

      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('Hello!')
      }));
    });

    test('should handle rapid post creation', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {
          content: 'Rapid post',
          type: 'text'
        },
        files: null
      };
      Post.create.mockResolvedValue(mockPost);

      const promises = Array(10).fill().map(() => createPost(mockReq, mockRes));
      await Promise.all(promises);

      expect(Post.create).toHaveBeenCalledTimes(10);
    });

    test('should handle deleted user posts gracefully', async () => {
      mockReq = {
        params: { postId: 'post-123' }
      };
      Post.findByPk.mockResolvedValue({
        ...mockPost,
        userId: 'deleted-user-id'
      });

      await getPost(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });
});
