/**
 * analyticsService unit tests — business logic layer, no HTTP.
 * Agent: A-11 (Testing Agent) | 2026-03-03
 */

jest.mock('../../backend/analytics-service/src/models', () => ({
  Activity: {
    create: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn()
  }
}));

const { trackActivity, getDashboardMetrics, getUserActivity, getPopularContent } =
  require('../../backend/analytics-service/src/services/analyticsService');
const { Activity } = require('../../backend/analytics-service/src/models');

const mockActivity = (overrides = {}) => ({
  id: 'act-1',
  userId: 'user-1',
  action: 'view',
  entityType: 'post',
  entityId: 'post-1',
  ...overrides
});

beforeEach(() => jest.clearAllMocks());

// ─── trackActivity ─────────────────────────────────────────────────────────────

describe('trackActivity', () => {
  test('creates activity record with userId', async () => {
    const act = mockActivity();
    Activity.create.mockResolvedValue(act);
    const result = await trackActivity('user-1', { action: 'view', entityType: 'post', entityId: 'post-1' });
    expect(Activity.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', action: 'view' }));
    expect(result).toBe(act);
  });

  test('creates activity with optional metadata', async () => {
    Activity.create.mockResolvedValue(mockActivity());
    await trackActivity('user-1', {
      action: 'apply',
      entityType: 'job',
      entityId: 'job-1',
      metadata: { source: 'search' }
    });
    expect(Activity.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { source: 'search' }
    }));
  });
});

// ─── getDashboardMetrics ───────────────────────────────────────────────────────

describe('getDashboardMetrics', () => {
  test('returns all four metric groups', async () => {
    Activity.count.mockResolvedValueOnce(100).mockResolvedValueOnce(42); // totalActivities, uniqueUsers
    Activity.findAll.mockResolvedValueOnce([{ entityType: 'post', count: 60 }]) // activitiesByType
               .mockResolvedValueOnce([{ date: '2026-03-01', count: 25 }]); // activitiesByDay

    const result = await getDashboardMetrics({});
    expect(result.totalActivities).toBe(100);
    expect(result.uniqueUsers).toBe(42);
    expect(result.activitiesByType).toBeDefined();
    expect(result.activitiesByDay).toBeDefined();
  });

  test('applies date range filter when provided', async () => {
    Activity.count.mockResolvedValue(0);
    Activity.findAll.mockResolvedValue([]);
    await getDashboardMetrics({ startDate: '2026-03-01', endDate: '2026-03-31' });
    // Both count calls should include a where with createdAt Op.between
    const [[firstCountArgs]] = Activity.count.mock.calls;
    expect(firstCountArgs.where.createdAt).toBeDefined();
  });

  test('no where filter when date range not provided', async () => {
    Activity.count.mockResolvedValue(0);
    Activity.findAll.mockResolvedValue([]);
    await getDashboardMetrics({});
    const [[firstCountArgs]] = Activity.count.mock.calls;
    expect(firstCountArgs.where.createdAt).toBeUndefined();
  });
});

// ─── getUserActivity ───────────────────────────────────────────────────────────

describe('getUserActivity', () => {
  test('returns paginated activities for user', async () => {
    const acts = [mockActivity()];
    Activity.findAndCountAll.mockResolvedValue({ count: 1, rows: acts });
    const result = await getUserActivity('user-1', 1, 20);
    expect(result.activities).toBe(acts);
    expect(result.total).toBe(1);
    expect(Activity.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1' }
    }));
  });

  test('clamps limit to 100 max', async () => {
    Activity.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await getUserActivity('user-1', 1, 500);
    const [args] = Activity.findAndCountAll.mock.calls;
    expect(args[0].limit).toBe(100);
  });

  test('computes pagination metadata', async () => {
    Activity.findAndCountAll.mockResolvedValue({ count: 55, rows: [] });
    const result = await getUserActivity('user-1', 2, 10);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });
});

// ─── getPopularContent ─────────────────────────────────────────────────────────

describe('getPopularContent', () => {
  test('returns top viewed entities', async () => {
    const data = [{ entityId: 'post-1', views: 42 }];
    Activity.findAll.mockResolvedValue(data);
    const result = await getPopularContent(undefined, 10);
    expect(result).toBe(data);
    expect(Activity.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ action: 'view' })
    }));
  });

  test('filters by entityType when provided', async () => {
    Activity.findAll.mockResolvedValue([]);
    await getPopularContent('post', 5);
    const [args] = Activity.findAll.mock.calls;
    expect(args[0].where.entityType).toBe('post');
  });

  test('clamps limit to 100 max', async () => {
    Activity.findAll.mockResolvedValue([]);
    await getPopularContent(undefined, 9999);
    const [args] = Activity.findAll.mock.calls;
    expect(args[0].limit).toBe(100);
  });

  test('does not filter entityType when undefined', async () => {
    Activity.findAll.mockResolvedValue([]);
    await getPopularContent(undefined, 10);
    const [args] = Activity.findAll.mock.calls;
    expect(args[0].where.entityType).toBeUndefined();
  });
});
