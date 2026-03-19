/**
 * API Integration Tests — Phase 2: Remaining Services
 * Tests user, jobs, events, research, messaging, notifications, analytics,
 * internal auth middleware, correlation IDs, and Swagger docs via the API
 * gateway against live services.
 *
 * Agent: A-11 (Testing Agent) | 2026-03-03
 *
 * PREREQUISITES:
 *   - All services running  (start.bat first)
 *   - Seed data loaded      (node seed.js)
 *   - Set TEST_GATEWAY_URL env var (default: http://localhost:3000)
 *
 * Run: npx jest tests/integration/services.integration.test.js --no-coverage --verbose --testTimeout=15000
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_GATEWAY_URL || 'http://localhost:3000';
const API = `${BASE_URL}/api/v1`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared state (populated in beforeAll)
// ─────────────────────────────────────────────────────────────────────────────

let adminToken;       // admin@decp.edu
let facultyToken;     // prof.james@decp.edu
let studentToken;     // alice.student@decp.edu
let student2Token;    // bob.student@decp.edu  (used for messaging)

let adminUserId;
let studentUserId;
let student2UserId;

// IDs created during tests — later describes depend on earlier ones
let createdJobId;
let createdEventId;
let createdResearchId;
let createdConversationId;
let createdNotificationId;

// ─────────────────────────────────────────────────────────────────────────────
// Axios client — never throws on non-2xx so we can assert status ourselves
// ─────────────────────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API,
  validateStatus: () => true,
  timeout: 12000
});

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// ─────────────────────────────────────────────────────────────────────────────
// Global setup — log in four seeded accounts in parallel
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const [adminRes, facultyRes, s1Res, s2Res] = await Promise.all([
    apiClient.post('/auth/login', { email: 'admin@decp.edu',          password: 'Admin1234x' }),
    apiClient.post('/auth/login', { email: 'prof.james@decp.edu',     password: 'Pass1234x'  }),
    apiClient.post('/auth/login', { email: 'alice.student@decp.edu',  password: 'Pass1234x'  }),
    apiClient.post('/auth/login', { email: 'bob.student@decp.edu',    password: 'Pass1234x'  })
  ]);

  adminToken    = adminRes.data?.data?.accessToken;
  facultyToken  = facultyRes.data?.data?.accessToken;
  studentToken  = s1Res.data?.data?.accessToken;
  student2Token = s2Res.data?.data?.accessToken;

  adminUserId   = adminRes.data?.data?.user?.id;
  studentUserId = s1Res.data?.data?.user?.id;
  student2UserId = s2Res.data?.data?.user?.id;

  // Smoke-check — if tokens are missing the suite cannot run
  if (!adminToken || !studentToken) {
    throw new Error(
      '[Integration] Login failed — are all services running and seed.js executed?'
    );
  }
}, 30000);

// ─────────────────────────────────────────────────────────────────────────────
// User Service  (/api/v1/users)
// ─────────────────────────────────────────────────────────────────────────────

describe('User Service — Integration Tests', () => {

  describe('GET /users', () => {
    it('returns list of users when authenticated', async () => {
      const res = await apiClient.get('/users', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('returns 401 without authentication', async () => {
      const res = await apiClient.get('/users');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/me', () => {
    it('returns authenticated user profile', async () => {
      const res = await apiClient.get('/users/me', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
    });

    it('returns 401 without token', async () => {
      const res = await apiClient.get('/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /users/me', () => {
    it('updates own profile bio', async () => {
      const res = await apiClient.put(
        '/users/me',
        { bio: `Integration test update ${Date.now()}` },
        auth(studentToken)
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('returns 401 without authentication', async () => {
      const res = await apiClient.put('/users/me', { bio: 'No auth' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/search', () => {
    it('returns matching users for search query', async () => {
      const res = await apiClient.get('/users/search?q=alice', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('returns empty array for no matches', async () => {
      const res = await apiClient.get('/users/search?q=zzznomatch999xyz', auth(studentToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBe(0);
    });
  });

  describe('GET /users/:userId', () => {
    it('returns a specific user profile by ID', async () => {
      if (!studentUserId) return;
      const res = await apiClient.get(`/users/${studentUserId}`, auth(adminToken));
      // 200 if profile exists, 404 if user has no profile row yet
      expect([200, 404]).toContain(res.status);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Jobs Service  (/api/v1/jobs)
// ─────────────────────────────────────────────────────────────────────────────

describe('Jobs Service — Integration Tests', () => {

  describe('GET /jobs', () => {
    it('returns paginated job listings when authenticated', async () => {
      const res = await apiClient.get('/jobs', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe('POST /jobs', () => {
    it('admin creates a new job posting', async () => {
      const res = await apiClient.post(
        '/jobs',
        {
          title: `Integration Test Job ${Date.now()}`,
          description: 'Automated integration-test job listing.',
          company: 'DECP University',
          location: 'Colombo, Sri Lanka',
          type: 'internship',
          deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
        },
        auth(adminToken)
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.job).toBeDefined();
      createdJobId = res.data.data.job.id;
    });

    it('returns 401 without authentication', async () => {
      const res = await apiClient.post('/jobs', { title: 'Unauthorized job' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /jobs/:jobId', () => {
    it('returns job details by ID', async () => {
      if (!createdJobId) return;
      const res = await apiClient.get(`/jobs/${createdJobId}`, auth(studentToken));
      expect(res.status).toBe(200);
      const job = res.data.data?.job ?? res.data.data;
      expect(job).toBeDefined();
    });

    it('returns 404 for non-existent job', async () => {
      const res = await apiClient.get(
        '/jobs/00000000-0000-0000-0000-000000000000',
        auth(studentToken)
      );
      expect(res.status).toBe(404);
    });
  });

  describe('POST /jobs/:jobId/apply', () => {
    it('student applies for a job successfully', async () => {
      if (!createdJobId) return;
      const res = await apiClient.post(
        `/jobs/${createdJobId}/apply`,
        { coverLetter: 'I am very interested in this position.' },
        auth(studentToken)
      );
      expect([200, 201]).toContain(res.status);
      expect(res.data.success).toBe(true);
    });

    it('returns 409 on duplicate application (FLAW-idempotency fix)', async () => {
      if (!createdJobId) return;
      const res = await apiClient.post(
        `/jobs/${createdJobId}/apply`,
        { coverLetter: 'Applying again' },
        auth(studentToken)
      );
      expect(res.status).toBe(409);
    });
  });

  describe('GET /jobs/applications', () => {
    it('returns the authenticated student\'s own applications', async () => {
      const res = await apiClient.get('/jobs/applications', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe('DELETE /jobs/:jobId', () => {
    it('non-owner receives 403 when trying to delete a job', async () => {
      if (!createdJobId) return;
      const res = await apiClient.delete(`/jobs/${createdJobId}`, auth(studentToken));
      expect(res.status).toBe(403);
    });

    it('owner can delete their own job posting', async () => {
      const createRes = await apiClient.post(
        '/jobs',
        { title: 'Job To Delete', description: 'Will be deleted.', company: 'Test Corp', type: 'full-time' },
        auth(adminToken)
      );
      if (createRes.status !== 201) return;
      const jobId = createRes.data.data.job.id;
      const deleteRes = await apiClient.delete(`/jobs/${jobId}`, auth(adminToken));
      expect([200, 204]).toContain(deleteRes.status);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Events Service  (/api/v1/events)
// ─────────────────────────────────────────────────────────────────────────────

describe('Events Service — Integration Tests', () => {

  describe('GET /events', () => {
    it('returns events list when authenticated', async () => {
      const res = await apiClient.get('/events', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe('POST /events', () => {
    it('admin creates a new event', async () => {
      const start = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      const end   = new Date(start.getTime() + 3600 * 1000);
      const res = await apiClient.post(
        '/events',
        {
          title: `Integration Test Event ${Date.now()}`,
          description: 'Automated integration-test event.',
          eventType: 'seminar',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          location: 'Department Hall A',
          capacity: 30
        },
        auth(adminToken)
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.event).toBeDefined();
      createdEventId = res.data.data.event.id;
    });

    it('returns 401 without authentication', async () => {
      const res = await apiClient.post('/events', { title: 'Unauthorized event' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /events/:eventId', () => {
    it('returns event details', async () => {
      if (!createdEventId) return;
      const res = await apiClient.get(`/events/${createdEventId}`, auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.data).toBeDefined();
    });

    it('returns 404 for non-existent event', async () => {
      const res = await apiClient.get(
        '/events/00000000-0000-0000-0000-000000000000',
        auth(studentToken)
      );
      expect(res.status).toBe(404);
    });
  });

  describe('POST /events/:eventId/rsvp', () => {
    it('student RSVPs to an event with status going', async () => {
      if (!createdEventId) return;
      const res = await apiClient.post(
        `/events/${createdEventId}/rsvp`,
        { status: 'going' },
        auth(studentToken)
      );
      expect([200, 201]).toContain(res.status);
      expect(res.data.success).toBe(true);
    });

    it('student can update their RSVP status (idempotent upsert)', async () => {
      if (!createdEventId) return;
      const res = await apiClient.post(
        `/events/${createdEventId}/rsvp`,
        { status: 'maybe' },
        auth(studentToken)
      );
      expect([200, 201]).toContain(res.status);
      expect(res.data.success).toBe(true);
    });

    it('returns 404 for RSVP to non-existent event', async () => {
      const res = await apiClient.post(
        '/events/00000000-0000-0000-0000-000000000000/rsvp',
        { status: 'going' },
        auth(studentToken)
      );
      expect(res.status).toBe(404);
    });
  });

  describe('GET /events/my-rsvps', () => {
    it('returns the authenticated user\'s RSVPs', async () => {
      const res = await apiClient.get('/events/my-rsvps', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Research Service  (/api/v1/research)
// ─────────────────────────────────────────────────────────────────────────────

describe('Research Service — Integration Tests', () => {

  describe('GET /research', () => {
    it('returns research projects list when authenticated', async () => {
      const res = await apiClient.get('/research', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe('POST /research', () => {
    it('faculty creates a research project', async () => {
      const res = await apiClient.post(
        '/research',
        {
          title: `Integration Research ${Date.now()}`,
          abstract: 'Automated integration-test research project.',
          status: 'active',
          tags: ['integration', 'testing']
        },
        auth(facultyToken)
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.project).toBeDefined();
      createdResearchId = res.data.data.project.id;
    });

    it('returns 401 without authentication', async () => {
      const res = await apiClient.post('/research', { title: 'Unauthorized' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /research/:projectId', () => {
    it('returns research project details', async () => {
      if (!createdResearchId) return;
      const res = await apiClient.get(`/research/${createdResearchId}`, auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.data).toBeDefined();
    });

    it('returns 404 for non-existent project', async () => {
      const res = await apiClient.get(
        '/research/00000000-0000-0000-0000-000000000000',
        auth(studentToken)
      );
      expect(res.status).toBe(404);
    });
  });

  describe('POST /research/:projectId/collaborate', () => {
    it('student joins a research project as collaborator', async () => {
      if (!createdResearchId) return;
      const res = await apiClient.post(
        `/research/${createdResearchId}/collaborate`,
        {},
        auth(studentToken)
      );
      expect([200, 201]).toContain(res.status);
      expect(res.data.success).toBe(true);
    });

    it('joining twice does not duplicate collaborator (Set dedup — FLAW fix)', async () => {
      if (!createdResearchId) return;
      // student2 joins twice
      await apiClient.post(`/research/${createdResearchId}/collaborate`, {}, auth(student2Token));
      await apiClient.post(`/research/${createdResearchId}/collaborate`, {}, auth(student2Token));

      const projectRes = await apiClient.get(`/research/${createdResearchId}`, auth(studentToken));
      const project = projectRes.data.data?.project ?? projectRes.data.data;
      const collaborators = project?.collaborators ?? [];
      const unique = [...new Set(collaborators)];
      expect(unique.length).toBe(collaborators.length);
    });
  });

  describe('DELETE /research/:projectId/collaborate', () => {
    it('collaborator (student2) can leave the project', async () => {
      if (!createdResearchId) return;
      const res = await apiClient.delete(
        `/research/${createdResearchId}/collaborate`,
        auth(student2Token)
      );
      expect([200, 204]).toContain(res.status);
    });

    it('lead researcher cannot leave their own project (400)', async () => {
      if (!createdResearchId) return;
      // facultyToken is the lead researcher who created the project
      const res = await apiClient.delete(
        `/research/${createdResearchId}/collaborate`,
        auth(facultyToken)
      );
      expect(res.status).toBe(400);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Messaging Service  (/api/v1/messaging)
// ─────────────────────────────────────────────────────────────────────────────

describe('Messaging Service — Integration Tests', () => {

  describe('POST /messaging', () => {
    it('creates a direct conversation between two users', async () => {
      if (!student2UserId) return;
      const res = await apiClient.post(
        '/messaging',
        { type: 'direct', participants: [student2UserId] },
        auth(studentToken)
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.conversation).toBeDefined();
      createdConversationId = res.data.data.conversation.id;
    });

    it('returns existing conversation on second attempt (idempotent direct conv)', async () => {
      if (!student2UserId || !createdConversationId) return;
      const res = await apiClient.post(
        '/messaging',
        { type: 'direct', participants: [student2UserId] },
        auth(studentToken)
      );
      expect([200, 201]).toContain(res.status);
      expect(res.data.data.conversation.id).toBe(createdConversationId);
    });

    it('returns 401 without authentication', async () => {
      const res = await apiClient.post('/messaging', { type: 'direct', participants: [] });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /messaging', () => {
    it('returns the user\'s conversation list', async () => {
      const res = await apiClient.get('/messaging', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe('GET /messaging/:conversationId', () => {
    it('participant can view conversation details', async () => {
      if (!createdConversationId) return;
      const res = await apiClient.get(`/messaging/${createdConversationId}`, auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.data).toBeDefined();
    });

    it('non-participant receives 403', async () => {
      if (!createdConversationId) return;
      const res = await apiClient.get(`/messaging/${createdConversationId}`, auth(adminToken));
      expect(res.status).toBe(403);
    });
  });

  describe('POST /messaging/:conversationId/messages', () => {
    it('participant sends a message', async () => {
      if (!createdConversationId) return;
      const res = await apiClient.post(
        `/messaging/${createdConversationId}/messages`,
        { content: 'Hello from integration test!' },
        auth(studentToken)
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.message).toBeDefined();
    });

    it('non-participant cannot send messages (403)', async () => {
      if (!createdConversationId) return;
      const res = await apiClient.post(
        `/messaging/${createdConversationId}/messages`,
        { content: 'Unauthorized message' },
        auth(adminToken)
      );
      expect(res.status).toBe(403);
    });
  });

  describe('GET /messaging/:conversationId/messages', () => {
    it('participant retrieves message history', async () => {
      if (!createdConversationId) return;
      const res = await apiClient.get(
        `/messaging/${createdConversationId}/messages`,
        auth(studentToken)
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('non-participant cannot read messages (403)', async () => {
      if (!createdConversationId) return;
      const res = await apiClient.get(
        `/messaging/${createdConversationId}/messages`,
        auth(adminToken)
      );
      expect(res.status).toBe(403);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Notification Service  (/api/v1/notifications)
// ─────────────────────────────────────────────────────────────────────────────

describe('Notification Service — Integration Tests', () => {

  describe('GET /notifications', () => {
    it('returns notifications list when authenticated', async () => {
      const res = await apiClient.get('/notifications', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('returns 401 without authentication', async () => {
      const res = await apiClient.get('/notifications');
      expect(res.status).toBe(401);
    });

    it('supports unreadOnly=true filter', async () => {
      const res = await apiClient.get('/notifications?unreadOnly=true', auth(studentToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });
  });

  describe('POST /notifications', () => {
    it('creates a notification for a specific user', async () => {
      if (!studentUserId) return;
      const res = await apiClient.post(
        '/notifications',
        {
          userId: studentUserId,
          type: 'mention',
          title: 'Integration Test Notification',
          body: 'You were mentioned in an integration test.'
        },
        auth(adminToken)
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.notification).toBeDefined();
      createdNotificationId = res.data.data.notification.id;
    });
  });

  describe('PUT /notifications/:notificationId/read', () => {
    it('marks own notification as read', async () => {
      if (!createdNotificationId) return;
      const res = await apiClient.put(
        `/notifications/${createdNotificationId}/read`,
        {},
        auth(studentToken)
      );
      expect([200, 204]).toContain(res.status);
    });

    it('cannot mark another user\'s notification (userId scoping → 404)', async () => {
      if (!createdNotificationId) return;
      // admin tries to mark the student's notification
      const res = await apiClient.put(
        `/notifications/${createdNotificationId}/read`,
        {},
        auth(adminToken)
      );
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /notifications/read-all', () => {
    it('bulk-marks all own notifications as read', async () => {
      const res = await apiClient.put('/notifications/read-all', {}, auth(studentToken));
      expect([200, 204]).toContain(res.status);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Analytics Service  (/api/v1/analytics)
// ─────────────────────────────────────────────────────────────────────────────

describe('Analytics Service — Integration Tests', () => {

  describe('POST /analytics/track', () => {
    it('tracks a view activity event', async () => {
      const res = await apiClient.post(
        '/analytics/track',
        { action: 'view', entityType: 'post', entityId: '00000000-0000-0000-0000-000000000001' },
        auth(studentToken)
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
    });

    it('tracks apply activity with optional metadata', async () => {
      const res = await apiClient.post(
        '/analytics/track',
        {
          action: 'apply',
          entityType: 'job',
          entityId: createdJobId || '00000000-0000-0000-0000-000000000002',
          metadata: { source: 'integration_test' }
        },
        auth(studentToken)
      );
      expect(res.status).toBe(201);
    });

    it('returns 401 without authentication', async () => {
      const res = await apiClient.post('/analytics/track', {
        action: 'view', entityType: 'post', entityId: 'x'
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /analytics/dashboard', () => {
    it('returns all four metric groups', async () => {
      const res = await apiClient.get('/analytics/dashboard', auth(adminToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      const data = res.data.data;
      expect(data).toHaveProperty('totalActivities');
      expect(data).toHaveProperty('uniqueUsers');
      expect(data).toHaveProperty('activitiesByType');
      expect(data).toHaveProperty('activitiesByDay');
    });

    it('applies date-range filter without error', async () => {
      const res = await apiClient.get(
        '/analytics/dashboard?startDate=2026-01-01&endDate=2026-12-31',
        auth(adminToken)
      );
      expect(res.status).toBe(200);
    });
  });

  describe('GET /analytics/users/:userId/activity', () => {
    it('returns paginated activity for a specific user', async () => {
      if (!studentUserId) return;
      const res = await apiClient.get(
        `/analytics/users/${studentUserId}/activity`,
        auth(adminToken)
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('activities');
      expect(res.data.data).toHaveProperty('total');
    });
  });

  describe('GET /analytics/popular', () => {
    it('returns popular content list', async () => {
      const res = await apiClient.get('/analytics/popular', auth(adminToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('filters by entityType when provided', async () => {
      const res = await apiClient.get('/analytics/popular?entityType=post', auth(adminToken));
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal Auth Middleware — SEC-002 cross-cutting validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Internal Auth Middleware — SEC-002', () => {
  it('gateway injects x-internal-token correctly — downstream services accept gateway requests', async () => {
    // Any authenticated gateway request exercises the full internal token flow.
    // If the token is missing/wrong the downstream service returns 401.
    const res = await apiClient.get('/users/me', auth(studentToken));
    expect(res.status).toBe(200);
  });

  it('/health endpoints bypass internal auth and return 200', async () => {
    // Health routes are exempt from internalAuthMiddleware
    const res = await apiClient.get('/jobs/health');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('status');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Correlation ID Middleware — OBS-001
// ─────────────────────────────────────────────────────────────────────────────

describe('Correlation ID Middleware — OBS-001', () => {
  it('every response includes an x-correlation-id header', async () => {
    const res = await apiClient.get('/posts');
    expect(res.headers['x-correlation-id']).toBeDefined();
    expect(typeof res.headers['x-correlation-id']).toBe('string');
    expect(res.headers['x-correlation-id'].length).toBeGreaterThan(0);
  });

  it('honours a client-supplied x-correlation-id value', async () => {
    const myId = 'integration-test-correlation-id-42';
    const res = await apiClient.get('/posts', {
      headers: { 'x-correlation-id': myId }
    });
    expect(res.headers['x-correlation-id']).toBe(myId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Swagger / OpenAPI Documentation
// ─────────────────────────────────────────────────────────────────────────────

describe('API Documentation — Swagger UI', () => {
  it('GET /api/docs serves Swagger UI HTML page', async () => {
    const res = await axios.get(`${BASE_URL}/api/docs`, { validateStatus: () => true });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.data).toMatch(/swagger-ui/i);
  });

  it('GET /api/docs/openapi.yaml serves the raw YAML spec', async () => {
    const res = await axios.get(`${BASE_URL}/api/docs/openapi.yaml`, { validateStatus: () => true });
    expect(res.status).toBe(200);
    expect(res.data).toMatch(/openapi:/);
    expect(res.data).toMatch(/paths:/);
  });
});
