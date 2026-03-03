/**
 * Post Service Unit Tests — Service Layer
 * Tests business logic in postService.ts with DB mocked.
 *
 * Agent: A-11 (Regression Testing Agent)
 * Coverage target: ≥ 80% on postService.ts
 */

jest.mock('../../backend/feed-service/src/models', () => ({
  Post: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn()
  },
  Like: {
    findOrCreate: jest.fn()
  },
  Comment: {
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn()
  },
  Share: {
    findOrCreate: jest.fn()
  }
}));

jest.mock('../../backend/feed-service/src/config/database', () => ({
  transaction: jest.fn()
}));

jest.mock('../../backend/feed-service/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const { Post, Like, Comment, Share } = require('../../backend/feed-service/src/models');
const sequelize = require('../../backend/feed-service/src/config/database');

// ─────────────────────────────────────────────────────────────────────────────
// Shared mock factories
// ─────────────────────────────────────────────────────────────────────────────

const makeMockTransaction = (shouldCommit = true) => {
  const t = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    LOCK: { UPDATE: 'UPDATE' }
  };
  sequelize.transaction.mockResolvedValue(t);
  return t;
};

const makePost = (overrides = {}) => ({
  id: 'post-uuid-001',
  userId: 'user-uuid-001',
  content: 'Hello world',
  type: 'text',
  mediaUrls: [],
  isPublic: true,
  likes: 5,
  comments: 3,
  shares: 1,
  createdAt: new Date('2026-01-15T10:00:00Z'),
  updatedAt: new Date('2026-01-15T10:00:00Z'),
  update: jest.fn().mockImplementation(function(updates) { Object.assign(this, updates); return Promise.resolve(this); }),
  destroy: jest.fn().mockResolvedValue(1),
  increment: jest.fn().mockResolvedValue(undefined),
  decrement: jest.fn().mockResolvedValue(undefined),
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

const makeComment = (overrides = {}) => ({
  id: 'comment-uuid-001',
  postId: 'post-uuid-001',
  userId: 'user-uuid-002',
  content: 'Nice post!',
  parentId: null,
  createdAt: new Date(),
  destroy: jest.fn().mockResolvedValue(1),
  ...overrides
});

const makeLike = (overrides = {}) => ({
  id: 'like-uuid-001',
  postId: 'post-uuid-001',
  userId: 'user-uuid-002',
  destroy: jest.fn().mockResolvedValue(1),
  ...overrides
});

const makeShare = (overrides = {}) => ({
  id: 'share-uuid-001',
  postId: 'post-uuid-001',
  userId: 'user-uuid-002',
  ...overrides
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('postService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getFeed ───────────────────────────────────────────────────────────────

  describe('getFeed', () => {
    let postService;
    beforeAll(() => {
      postService = require('../../backend/feed-service/src/services/postService');
    });

    it('returns paginated feed with offset pagination', async () => {
      const posts = [makePost(), makePost({ id: 'post-uuid-002' })];
      Post.findAndCountAll.mockResolvedValue({ count: 2, rows: posts });

      const result = await postService.getFeed({ page: 1, limit: 10 });

      expect(Post.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isPublic: true },
        limit: 10,
        offset: 0
      }));
      expect(result.posts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.hasPrev).toBe(false);
    });

    it('clamps limit to maximum of 50', async () => {
      Post.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await postService.getFeed({ page: 1, limit: 500 });

      expect(Post.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
    });

    it('clamps limit minimum to 1', async () => {
      Post.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await postService.getFeed({ page: 1, limit: 0 });

      expect(Post.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }));
    });

    it('filters by userId when provided', async () => {
      Post.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await postService.getFeed({ userId: 'user-xyz' });

      expect(Post.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isPublic: true, userId: 'user-xyz' }
      }));
    });

    it('uses cursor-based pagination when cursor provided', async () => {
      const cursor = '2026-01-10T00:00:00.000Z';
      Post.findAll.mockResolvedValue([makePost(), makePost({ id: '2' })]);

      const result = await postService.getFeed({ cursor, limit: 5 });

      expect(Post.findAll).toHaveBeenCalled();
      // Cursor mode returns -1 for unknown total
      expect(result.total).toBe(-1);
    });

    it('correctly detects hasNext in cursor mode', async () => {
      const cursor = '2026-01-10T00:00:00.000Z';
      // Return limit+1 to indicate there are more
      const posts = Array(6).fill(null).map((_, i) => makePost({ id: `p${i}`, createdAt: new Date() }));
      Post.findAll.mockResolvedValue(posts);

      const result = await postService.getFeed({ cursor, limit: 5 });

      expect(result.hasNext).toBe(true);
      expect(result.posts).toHaveLength(5); // sliced to limit
    });

    it('hasPrev is false on page 1', async () => {
      Post.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      const result = await postService.getFeed({ page: 1, limit: 10 });
      expect(result.hasPrev).toBe(false);
    });

    it('hasPrev is true on page 2+', async () => {
      Post.findAndCountAll.mockResolvedValue({ count: 25, rows: [] });
      const result = await postService.getFeed({ page: 2, limit: 10 });
      expect(result.hasPrev).toBe(true);
    });
  });

  // ─── createPost ───────────────────────────────────────────────────────────

  describe('createPost', () => {
    let postService;
    beforeAll(() => {
      postService = require('../../backend/feed-service/src/services/postService');
    });

    it('creates a text post', async () => {
      const post = makePost();
      Post.create.mockResolvedValue(post);

      const result = await postService.createPost({
        userId: 'user-uuid-001',
        content: 'Hello world',
        type: 'text',
        isPublic: true
      });

      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-uuid-001',
        content: 'Hello world',
        type: 'text',
        isPublic: true
      }));
      expect(result).toEqual(post);
    });

    it('upgrades type to image when mediaUrls present and type is text', async () => {
      Post.create.mockResolvedValue(makePost({ type: 'image' }));

      await postService.createPost({
        userId: 'user-uuid-001',
        content: 'Photo post',
        type: 'text',
        mediaUrls: ['/uploads/photo.jpg']
      });

      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'image' }));
    });

    it('preserves explicit video type even with media', async () => {
      Post.create.mockResolvedValue(makePost({ type: 'video' }));

      await postService.createPost({
        userId: 'user-uuid-001',
        content: 'Video post',
        type: 'video',
        mediaUrls: ['/uploads/video.mp4']
      });

      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'video' }));
    });

    it('defaults isPublic to true', async () => {
      Post.create.mockResolvedValue(makePost());

      await postService.createPost({ userId: 'user-uuid-001', content: 'Public by default' });

      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({ isPublic: true }));
    });
  });

  // ─── updatePost ───────────────────────────────────────────────────────────

  describe('updatePost', () => {
    let postService;
    beforeAll(() => {
      postService = require('../../backend/feed-service/src/services/postService');
    });

    it('updates own post content', async () => {
      const post = makePost();
      Post.findByPk.mockResolvedValue(post);

      await postService.updatePost('post-uuid-001', 'user-uuid-001', { content: 'Updated' });

      expect(post.update).toHaveBeenCalledWith({ content: 'Updated', isPublic: undefined });
    });

    it('throws 404 when post not found', async () => {
      Post.findByPk.mockResolvedValue(null);

      await expect(
        postService.updatePost('nonexistent', 'user-uuid-001', {})
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when non-owner tries to update', async () => {
      Post.findByPk.mockResolvedValue(makePost({ userId: 'owner-user' }));

      await expect(
        postService.updatePost('post-uuid-001', 'different-user', {})
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ─── deletePost ───────────────────────────────────────────────────────────

  describe('deletePost', () => {
    let postService;
    beforeAll(() => {
      postService = require('../../backend/feed-service/src/services/postService');
    });

    it('owner can delete their post', async () => {
      const post = makePost();
      Post.findByPk.mockResolvedValue(post);

      await postService.deletePost('post-uuid-001', 'user-uuid-001', 'student');

      expect(post.destroy).toHaveBeenCalled();
    });

    it('admin can delete any post', async () => {
      const post = makePost({ userId: 'someone-else' });
      Post.findByPk.mockResolvedValue(post);

      await expect(
        postService.deletePost('post-uuid-001', 'admin-uuid', 'admin')
      ).resolves.toBeUndefined();

      expect(post.destroy).toHaveBeenCalled();
    });

    it('non-owner student cannot delete', async () => {
      const post = makePost({ userId: 'owner' });
      Post.findByPk.mockResolvedValue(post);

      await expect(
        postService.deletePost('post-uuid-001', 'not-owner', 'student')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 404 when post not found', async () => {
      Post.findByPk.mockResolvedValue(null);

      await expect(
        postService.deletePost('ghost', 'user', 'student')
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── toggleLike ───────────────────────────────────────────────────────────

  describe('toggleLike (FLAW-003 fix)', () => {
    let postService;
    beforeAll(() => {
      postService = require('../../backend/feed-service/src/services/postService');
    });

    it('likes a post that is not yet liked', async () => {
      const mockTx = makeMockTransaction();
      const post = makePost({ likes: 5 });
      const likedPost = makePost({ likes: 6 });

      Post.findByPk
        .mockResolvedValueOnce(post)    // initial lock
        .mockResolvedValueOnce(likedPost); // refresh after increment

      Like.findOrCreate.mockResolvedValue([makeLike(), true]);

      const result = await postService.toggleLike('post-uuid-001', 'user-uuid-002');

      expect(Like.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
        where: { postId: 'post-uuid-001', userId: 'user-uuid-002' },
        transaction: mockTx
      }));
      expect(post.increment).toHaveBeenCalledWith('likes', expect.objectContaining({ by: 1 }));
      expect(mockTx.commit).toHaveBeenCalled();
      expect(result.liked).toBe(true);
    });

    it('unlikes a post that is already liked', async () => {
      const mockTx = makeMockTransaction();
      const like = makeLike();
      const post = makePost({ likes: 5 });
      const unlikedPost = makePost({ likes: 4 });

      Post.findByPk
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(unlikedPost);

      Like.findOrCreate.mockResolvedValue([like, false]);

      const result = await postService.toggleLike('post-uuid-001', 'user-uuid-002');

      expect(like.destroy).toHaveBeenCalledWith(expect.objectContaining({ transaction: mockTx }));
      expect(post.decrement).toHaveBeenCalledWith('likes', expect.objectContaining({ by: 1 }));
      expect(result.liked).toBe(false);
    });

    it('rolls back transaction on error', async () => {
      const mockTx = makeMockTransaction();
      Post.findByPk.mockRejectedValue(new Error('DB error'));

      await expect(
        postService.toggleLike('post-uuid-001', 'user-uuid-002')
      ).rejects.toThrow('DB error');

      expect(mockTx.rollback).toHaveBeenCalled();
      expect(mockTx.commit).not.toHaveBeenCalled();
    });

    it('throws 404 when post not found', async () => {
      const mockTx = makeMockTransaction();
      Post.findByPk.mockResolvedValue(null);

      await expect(
        postService.toggleLike('ghost-post', 'user-uuid-001')
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(mockTx.rollback).toHaveBeenCalled();
    });
  });

  // ─── addComment ───────────────────────────────────────────────────────────

  describe('addComment (FLAW-012 fix)', () => {
    let postService;
    beforeAll(() => {
      postService = require('../../backend/feed-service/src/services/postService');
    });

    it('creates comment and increments post comment count', async () => {
      const mockTx = makeMockTransaction();
      const post = makePost({ comments: 3 });
      const comment = makeComment();

      Post.findByPk.mockResolvedValue(post);
      Comment.create.mockResolvedValue(comment);

      const result = await postService.addComment({
        userId: 'user-uuid-002',
        postId: 'post-uuid-001',
        content: 'Great post!'
      });

      expect(Comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: 'post-uuid-001',
          userId: 'user-uuid-002',
          content: 'Great post!'
        }),
        expect.objectContaining({ transaction: mockTx })
      );
      expect(post.increment).toHaveBeenCalledWith('comments', expect.objectContaining({ by: 1 }));
      expect(mockTx.commit).toHaveBeenCalled();
      expect(result).toEqual(comment);
    });

    it('rolls back if Comment.create fails, leaving post.comments unchanged', async () => {
      const mockTx = makeMockTransaction();
      const post = makePost();

      Post.findByPk.mockResolvedValue(post);
      Comment.create.mockRejectedValue(new Error('DB constraint violation'));

      await expect(
        postService.addComment({ userId: 'u', postId: 'p', content: 'x' })
      ).rejects.toThrow();

      expect(post.increment).not.toHaveBeenCalled();
      expect(mockTx.rollback).toHaveBeenCalled();
    });

    it('throws 404 when post not found', async () => {
      const mockTx = makeMockTransaction();
      Post.findByPk.mockResolvedValue(null);

      await expect(
        postService.addComment({ userId: 'u', postId: 'ghost', content: 'hi' })
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(mockTx.rollback).toHaveBeenCalled();
    });

    it('supports threaded replies via parentId', async () => {
      const mockTx = makeMockTransaction();
      Post.findByPk.mockResolvedValue(makePost());
      Comment.create.mockResolvedValue(makeComment({ parentId: 'parent-comment-001' }));

      await postService.addComment({
        userId: 'user-uuid-002',
        postId: 'post-uuid-001',
        content: 'Reply',
        parentId: 'parent-comment-001'
      });

      expect(Comment.create).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: 'parent-comment-001' }),
        expect.anything()
      );
    });
  });

  // ─── toggleShare (FLAW-004 fix) ───────────────────────────────────────────

  describe('toggleShare (FLAW-004 fix — idempotent share)', () => {
    let postService;
    beforeAll(() => {
      postService = require('../../backend/feed-service/src/services/postService');
    });

    it('increments share count on first share', async () => {
      const mockTx = makeMockTransaction();
      const post = makePost({ shares: 1 });
      const sharedPost = makePost({ shares: 2 });

      Post.findByPk
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(sharedPost);

      Share.findOrCreate.mockResolvedValue([makeShare(), true]);

      const result = await postService.toggleShare('post-uuid-001', 'user-uuid-002');

      expect(post.increment).toHaveBeenCalledWith('shares', expect.objectContaining({ by: 1 }));
      expect(result.shared).toBe(true);
      expect(result.sharesCount).toBe(2);
    });

    it('does NOT double-count on repeated share (idempotent)', async () => {
      const mockTx = makeMockTransaction();
      const post = makePost({ shares: 2 });

      Post.findByPk.mockResolvedValue(post);
      Share.findOrCreate.mockResolvedValue([makeShare(), false]); // already shared

      const result = await postService.toggleShare('post-uuid-001', 'user-uuid-002');

      expect(post.increment).not.toHaveBeenCalled();
      expect(result.shared).toBe(true);
      expect(result.sharesCount).toBe(2); // unchanged
    });

    it('rolls back on DB error', async () => {
      const mockTx = makeMockTransaction();
      Post.findByPk.mockRejectedValue(new Error('DB error'));

      await expect(
        postService.toggleShare('post-uuid-001', 'user-uuid-002')
      ).rejects.toThrow();

      expect(mockTx.rollback).toHaveBeenCalled();
    });
  });

  // ─── getComments ──────────────────────────────────────────────────────────

  describe('getComments', () => {
    let postService;
    beforeAll(() => {
      postService = require('../../backend/feed-service/src/services/postService');
    });

    it('returns paginated comments for a post', async () => {
      const comments = [makeComment(), makeComment({ id: 'c2' })];
      Comment.findAndCountAll.mockResolvedValue({ count: 15, rows: comments });

      const result = await postService.getComments('post-uuid-001', 1, 20);

      expect(Comment.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { postId: 'post-uuid-001' },
        limit: 20,
        offset: 0
      }));
      expect(result.comments).toHaveLength(2);
      expect(result.total).toBe(15);
    });

    it('clamps limit to maximum 100', async () => {
      Comment.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await postService.getComments('p', 1, 9999);

      expect(Comment.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    });

    it('returns empty array when post has no comments', async () => {
      Comment.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      const result = await postService.getComments('post-uuid-001');

      expect(result.comments).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
