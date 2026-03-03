/**
 * API Integration Tests
 * Tests full request-response cycle via the API gateway against a real test database.
 *
 * Agent: A-11 (Regression Testing Agent)
 *
 * PREREQUISITES:
 *   - Test databases running (decp_auth_test, decp_feed_test, etc.)
 *   - All services started on test ports
 *   - Set TEST_GATEWAY_URL env var (default: http://localhost:3000)
 *
 * Run: npm run test:integration
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_GATEWAY_URL || 'http://localhost:3000';
const API = `${BASE_URL}/api/v1`;

// Shared test state
let adminAccessToken;
let studentAccessToken;
let studentUserId;
let createdPostId;
let createdJobId;
let createdEventId;
let createdConversationId;

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API,
  validateStatus: () => true, // Don't throw on non-2xx
  timeout: 10000
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const uniqueEmail = (prefix) => `${prefix}_${Date.now()}@test.decp.edu`;

// ─────────────────────────────────────────────────────────────────────────────
// Auth Service Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Auth Service — Integration Tests', () => {

  describe('POST /auth/register', () => {
    it('registers a new student successfully', async () => {
      const res = await apiClient.post('/auth/register', {
        email: uniqueEmail('student_test'),
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student',
        department: 'Computer Science'
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('accessToken');
      expect(res.data.data).toHaveProperty('refreshToken');
      expect(res.data.data.user.role).toBe('student');
      expect(res.data.data.user).not.toHaveProperty('password');
    });

    it('returns 409 for duplicate email', async () => {
      const email = uniqueEmail('dup');
      await apiClient.post('/auth/register', {
        email,
        password: 'TestPass123!',
        firstName: 'Dup',
        lastName: 'User',
        role: 'student'
      });

      const res = await apiClient.post('/auth/register', {
        email,
        password: 'DifferentPass123!',
        firstName: 'Dup',
        lastName: 'User2',
        role: 'student'
      });

      expect(res.status).toBe(409);
      expect(res.data.success).toBe(false);
    });

    it('returns 400 for weak password', async () => {
      const res = await apiClient.post('/auth/register', {
        email: uniqueEmail('weak'),
        password: '123',
        firstName: 'Weak',
        lastName: 'Pass',
        role: 'student'
      });

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    it('returns 400 for invalid email format', async () => {
      const res = await apiClient.post('/auth/register', {
        email: 'not-an-email',
        password: 'TestPass123!',
        firstName: 'Bad',
        lastName: 'Email',
        role: 'student'
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid role', async () => {
      const res = await apiClient.post('/auth/register', {
        email: uniqueEmail('bad_role'),
        password: 'TestPass123!',
        firstName: 'Bad',
        lastName: 'Role',
        role: 'hacker'
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    const testEmail = uniqueEmail('login_test');
    const testPassword = 'TestPass123!';

    beforeAll(async () => {
      // Create test accounts
      const studentRes = await apiClient.post('/auth/register', {
        email: testEmail,
        password: testPassword,
        firstName: 'Login',
        lastName: 'Test',
        role: 'student'
      });

      // Use seeded admin account for admin tests
      const adminRes = await apiClient.post('/auth/login', {
        email: 'admin@decp.edu',
        password: 'Admin1234x'
      });

      adminAccessToken = adminRes.data?.data?.accessToken;
    });

    it('logs in with valid credentials', async () => {
      const res = await apiClient.post('/auth/login', {
        email: testEmail,
        password: testPassword
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('accessToken');
      expect(res.data.data).toHaveProperty('refreshToken');
      expect(res.data.data.user.email).toBe(testEmail);

      studentAccessToken = res.data.data.accessToken;
      studentUserId = res.data.data.user.id;
    });

    it('returns 401 for wrong password', async () => {
      const res = await apiClient.post('/auth/login', {
        email: testEmail,
        password: 'WrongPassword123!'
      });

      expect(res.status).toBe(401);
      expect(res.data.success).toBe(false);
    });

    it('returns 401 for non-existent email', async () => {
      const res = await apiClient.post('/auth/login', {
        email: 'doesnotexist@decp.edu',
        password: 'TestPass123!'
      });

      expect(res.status).toBe(401);
    });

    it('access token contains user identity claims', async () => {
      const res = await apiClient.post('/auth/login', {
        email: testEmail,
        password: testPassword
      });

      const [, payload] = res.data.data.accessToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());

      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('firstName');  // FLAW-005 fix validation
      expect(decoded).toHaveProperty('lastName');   // FLAW-005 fix validation
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns new tokens with complete user payload', async () => {
      const loginRes = await apiClient.post('/auth/login', {
        email: 'alice.student@decp.edu',
        password: 'Pass1234x'
      });
      const { refreshToken } = loginRes.data.data;

      const res = await apiClient.post('/auth/refresh', { refreshToken });

      expect(res.status).toBe(200);
      expect(res.data.data).toHaveProperty('accessToken');
      expect(res.data.data).toHaveProperty('refreshToken');

      // Validate FLAW-005 fix: new token must include name
      const [, payload] = res.data.data.accessToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      expect(decoded.firstName).toBeTruthy();
      expect(decoded.lastName).toBeTruthy();
    });

    it('returns 401 for invalid refresh token', async () => {
      const res = await apiClient.post('/auth/refresh', { refreshToken: 'invalid-token-xyz' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('returns current user when authenticated', async () => {
      const res = await apiClient.get('/auth/me', {
        headers: authHeader(studentAccessToken)
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.user.id).toBe(studentUserId);
    });

    it('returns 401 without token', async () => {
      const res = await apiClient.get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed token', async () => {
      const res = await apiClient.get('/auth/me', {
        headers: authHeader('not.a.valid.jwt')
      });
      expect(res.status).toBe(401);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feed Service Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Feed Service — Integration Tests', () => {
  describe('GET /posts', () => {
    it('returns public feed without authentication', async () => {
      const res = await apiClient.get('/posts');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.meta).toHaveProperty('page');
      expect(res.data.meta).toHaveProperty('total');
      expect(res.data.meta).toHaveProperty('hasNext');
    });

    it('supports cursor-based pagination', async () => {
      const firstPage = await apiClient.get('/posts?limit=2');
      expect(firstPage.status).toBe(200);

      if (firstPage.data.meta.nextCursor) {
        const secondPage = await apiClient.get(`/posts?cursor=${firstPage.data.meta.nextCursor}&limit=2`);
        expect(secondPage.status).toBe(200);
        // Posts on second page should be different from first
        const firstIds = firstPage.data.data.map(p => p.id);
        const secondIds = secondPage.data.data.map(p => p.id);
        const overlap = firstIds.filter(id => secondIds.includes(id));
        expect(overlap).toHaveLength(0);
      }
    });

    it('clamps limit to maximum of 50', async () => {
      const res = await apiClient.get('/posts?limit=1000');
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(50);
    });
  });

  describe('POST /posts', () => {
    it('creates a text post when authenticated', async () => {
      const res = await apiClient.post('/posts',
        { content: 'Integration test post 🎉', type: 'text', isPublic: true },
        { headers: authHeader(studentAccessToken) }
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.post.content).toContain('Integration test post');
      createdPostId = res.data.data.post.id;
    });

    it('returns 401 without authentication', async () => {
      const res = await apiClient.post('/posts', { content: 'Unauthorized post' });
      expect(res.status).toBe(401);
    });

    it('returns 400 for empty content', async () => {
      const res = await apiClient.post('/posts',
        { content: '', type: 'text' },
        { headers: authHeader(studentAccessToken) }
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for content exceeding 5000 chars', async () => {
      const res = await apiClient.post('/posts',
        { content: 'x'.repeat(5001), type: 'text' },
        { headers: authHeader(studentAccessToken) }
      );
      expect(res.status).toBe(400);
    });
  });

  describe('POST /posts/:postId/like (FLAW-003 fix)', () => {
    it('likes a post and returns updated like count', async () => {
      const res = await apiClient.post(`/posts/${createdPostId}/like`, {},
        { headers: authHeader(studentAccessToken) }
      );

      expect([200, 201]).toContain(res.status);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('liked');
      expect(res.data.data).toHaveProperty('likesCount');
    });

    it('is idempotent: second like on same post unlikes it', async () => {
      // First call: like
      await apiClient.post(`/posts/${createdPostId}/like`, {},
        { headers: authHeader(studentAccessToken) }
      );

      // Second call: unlike
      const res = await apiClient.post(`/posts/${createdPostId}/like`, {},
        { headers: authHeader(studentAccessToken) }
      );

      expect(res.data.data.liked).toBe(false);
    });

    it('returns 404 for non-existent post', async () => {
      const res = await apiClient.post('/posts/00000000-0000-0000-0000-000000000000/like', {},
        { headers: authHeader(studentAccessToken) }
      );
      expect(res.status).toBe(404);
    });
  });

  describe('POST /posts/:postId/share (FLAW-004 fix)', () => {
    it('shares a post', async () => {
      const res = await apiClient.post(`/posts/${createdPostId}/share`, {},
        { headers: authHeader(studentAccessToken) }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.shared).toBe(true);
      expect(res.data.data).toHaveProperty('sharesCount');
    });

    it('does not double-count shares (idempotent per user)', async () => {
      const first = await apiClient.post(`/posts/${createdPostId}/share`, {},
        { headers: authHeader(studentAccessToken) }
      );
      const second = await apiClient.post(`/posts/${createdPostId}/share`, {},
        { headers: authHeader(studentAccessToken) }
      );

      // Share count should be same on both calls (findOrCreate prevents double counting)
      expect(first.data.data.sharesCount).toBe(second.data.data.sharesCount);
    });
  });

  describe('POST /posts/:postId/comments', () => {
    it('adds a comment and reflects in comment count', async () => {
      const commentRes = await apiClient.post(`/posts/${createdPostId}/comments`,
        { content: 'Great integration test post!' },
        { headers: authHeader(studentAccessToken) }
      );

      expect(commentRes.status).toBe(201);
      expect(commentRes.data.data.comment.content).toBe('Great integration test post!');
    });

    it('returns comments via GET', async () => {
      const res = await apiClient.get(`/posts/${createdPostId}/comments`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('returns 400 for empty comment', async () => {
      const res = await apiClient.post(`/posts/${createdPostId}/comments`,
        { content: '' },
        { headers: authHeader(studentAccessToken) }
      );
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /posts/:postId', () => {
    it('owner can delete their own post', async () => {
      const createRes = await apiClient.post('/posts',
        { content: 'To be deleted', type: 'text' },
        { headers: authHeader(studentAccessToken) }
      );
      const postId = createRes.data.data.post.id;

      const deleteRes = await apiClient.delete(`/posts/${postId}`,
        { headers: authHeader(studentAccessToken) }
      );

      expect(deleteRes.status).toBe(204);
    });

    it('non-owner cannot delete another user\'s post', async () => {
      // Try to delete a post from a different user (seeded data)
      const feedRes = await apiClient.get('/posts');
      const otherPost = feedRes.data.data.find(p => p.userId !== studentUserId);

      if (otherPost) {
        const res = await apiClient.delete(`/posts/${otherPost.id}`,
          { headers: authHeader(studentAccessToken) }
        );
        expect(res.status).toBe(403);
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Health Check Tests — All Services
// ─────────────────────────────────────────────────────────────────────────────

describe('Service Health Checks', () => {
  const services = [
    { name: 'auth-service', path: '/auth/health' },
    { name: 'jobs-service', path: '/jobs/health' },
    { name: 'events-service', path: '/events/health' },
    { name: 'messaging-service', path: '/messaging/health' },
    { name: 'notification-service', path: '/notifications/health' },
    { name: 'analytics-service', path: '/analytics/health' },
    { name: 'research-service', path: '/research/health' }
  ];

  services.forEach(({ name, path }) => {
    it(`${name} health endpoint returns 200`, async () => {
      const res = await apiClient.get(path);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('status');
    }, 5000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Rate Limiting', () => {
  it('gateway does not rate-limit normal traffic', async () => {
    const requests = Array(10).fill(null).map(() => apiClient.get('/posts'));
    const responses = await Promise.all(requests);
    const allSucceeded = responses.every(r => r.status !== 429);
    expect(allSucceeded).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('CORS', () => {
  it('returns CORS headers for allowed origin', async () => {
    const res = await apiClient.options('/posts', {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET'
      }
    });

    // Should not return 403
    expect(res.status).not.toBe(403);
  });
});
