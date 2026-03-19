/**
 * notificationService unit tests — business logic layer, no HTTP.
 * Agent: A-11 (Testing Agent) | 2026-03-03
 */

jest.mock('../../backend/notification-service/src/models', () => ({
  Notification: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  PushSubscription: {
    findOrCreate: jest.fn(),
    destroy: jest.fn()
  }
}));

const {
  listNotifications, createNotification, markAsRead, markAllAsRead,
  savePushSubscription, removePushSubscription
} = require('../../backend/notification-service/src/services/notificationService');
const { Notification, PushSubscription } = require('../../backend/notification-service/src/models');

const mockNotification = (overrides = {}) => ({
  id: 'notif-1',
  userId: 'user-1',
  type: 'message',
  title: 'New message',
  body: 'You have a new message',
  isRead: false,
  update: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

beforeEach(() => jest.clearAllMocks());

// ─── listNotifications ─────────────────────────────────────────────────────────

describe('listNotifications', () => {
  test('returns paginated notifications for user', async () => {
    Notification.findAndCountAll.mockResolvedValue({ count: 3, rows: [mockNotification()] });
    const result = await listNotifications('user-1', false, 1, 20);
    expect(result.notifications).toHaveLength(1);
    expect(result.total).toBe(3);
  });

  test('filters by isRead=false when unreadOnly=true', async () => {
    Notification.findAndCountAll.mockResolvedValue({ count: 2, rows: [] });
    await listNotifications('user-1', true, 1, 20);
    const [args] = Notification.findAndCountAll.mock.calls;
    expect(args[0].where.isRead).toBe(false);
  });

  test('does not filter by isRead when unreadOnly=false', async () => {
    Notification.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listNotifications('user-1', false, 1, 20);
    const [args] = Notification.findAndCountAll.mock.calls;
    expect(args[0].where.isRead).toBeUndefined();
  });

  test('includes unread count in result when unreadOnly=true', async () => {
    Notification.findAndCountAll.mockResolvedValue({ count: 7, rows: [] });
    const result = await listNotifications('user-1', true);
    expect(result.unread).toBe(7);
  });

  test('clamps limit to 100 max', async () => {
    Notification.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listNotifications('user-1', false, 1, 500);
    const [args] = Notification.findAndCountAll.mock.calls;
    expect(args[0].limit).toBe(100);
  });
});

// ─── createNotification ────────────────────────────────────────────────────────

describe('createNotification', () => {
  test('creates notification with correct userId', async () => {
    const n = mockNotification();
    Notification.create.mockResolvedValue(n);
    const result = await createNotification({ userId: 'user-1', type: 'message', title: 'Hi', body: 'You got a msg' });
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
    expect(result).toBe(n);
  });
});

// ─── markAsRead ────────────────────────────────────────────────────────────────

describe('markAsRead', () => {
  test('marks notification as read with readAt timestamp', async () => {
    const n = mockNotification();
    Notification.findOne.mockResolvedValue(n);
    await markAsRead('notif-1', 'user-1');
    expect(n.update).toHaveBeenCalledWith(expect.objectContaining({ isRead: true, readAt: expect.any(Date) }));
  });

  test('throws 404 when notification not found', async () => {
    Notification.findOne.mockResolvedValue(null);
    await expect(markAsRead('ghost', 'user-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  test('scopes findOne to userId (cannot mark another user\'s notification)', async () => {
    Notification.findOne.mockResolvedValue(null);
    await expect(markAsRead('notif-1', 'user-9')).rejects.toMatchObject({ statusCode: 404 });
    expect(Notification.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'user-9' })
    }));
  });
});

// ─── markAllAsRead ─────────────────────────────────────────────────────────────

describe('markAllAsRead', () => {
  test('bulk-updates all unread notifications for user', async () => {
    Notification.update.mockResolvedValue([5]);
    await markAllAsRead('user-1');
    expect(Notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
      expect.objectContaining({ where: { userId: 'user-1', isRead: false } })
    );
  });
});

// ─── savePushSubscription ──────────────────────────────────────────────────────

describe('savePushSubscription', () => {
  test('upserts push subscription by endpoint', async () => {
    const sub = { id: 'sub-1', endpoint: 'https://push.example.com/sub1' };
    PushSubscription.findOrCreate.mockResolvedValue([sub, true]);
    const result = await savePushSubscription('user-1', {
      endpoint: 'https://push.example.com/sub1',
      keys: { p256dh: 'key', auth: 'auth' }
    });
    expect(result).toBe(sub);
    expect(PushSubscription.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { endpoint: 'https://push.example.com/sub1' } })
    );
  });

  test('returns existing subscription without creating duplicate', async () => {
    const sub = { id: 'sub-1' };
    PushSubscription.findOrCreate.mockResolvedValue([sub, false]); // found existing
    const result = await savePushSubscription('user-1', {
      endpoint: 'https://push.example.com/sub1',
      keys: { p256dh: 'key', auth: 'auth' }
    });
    expect(result).toBe(sub);
  });
});

// ─── removePushSubscription ────────────────────────────────────────────────────

describe('removePushSubscription', () => {
  test('destroys subscription by endpoint', async () => {
    PushSubscription.destroy.mockResolvedValue(1);
    await removePushSubscription('https://push.example.com/sub1');
    expect(PushSubscription.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { endpoint: 'https://push.example.com/sub1' } })
    );
  });
});
