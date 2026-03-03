/**
 * eventService unit tests — business logic layer, no HTTP.
 * Agent: A-11 (Testing Agent) | 2026-03-03
 */

jest.mock('../../backend/events-service/src/models', () => ({
  Event: {
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn()
  },
  RSVP: {
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  }
}));

const { listEvents, getEventById, createEvent, updateEvent, deleteEvent, rsvpEvent, getMyRSVPs } =
  require('../../backend/events-service/src/services/eventService');
const { Event, RSVP } = require('../../backend/events-service/src/models');

const mockEvent = (overrides = {}) => ({
  id: 'evt-1',
  title: 'Tech Summit',
  type: 'conference',
  status: 'published',
  organizerId: 'user-1',
  capacity: null,
  update: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

const mockRsvp = (overrides = {}) => ({
  id: 'rsvp-1',
  eventId: 'evt-1',
  userId: 'user-2',
  status: 'going',
  update: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

beforeEach(() => jest.clearAllMocks());

// ─── listEvents ────────────────────────────────────────────────────────────────

describe('listEvents', () => {
  test('returns paginated published events by default', async () => {
    Event.findAndCountAll.mockResolvedValue({ count: 2, rows: [mockEvent(), mockEvent()] });
    const result = await listEvents();
    const [args] = Event.findAndCountAll.mock.calls;
    expect(args[0].where.status).toBe('published');
    expect(result.total).toBe(2);
  });

  test('filters by type', async () => {
    Event.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listEvents('workshop');
    const [args] = Event.findAndCountAll.mock.calls;
    expect(args[0].where.type).toBe('workshop');
  });

  test('clamps limit to 50 max', async () => {
    Event.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listEvents(undefined, 'published', 1, 100);
    const [args] = Event.findAndCountAll.mock.calls;
    expect(args[0].limit).toBe(50);
  });
});

// ─── getEventById ──────────────────────────────────────────────────────────────

describe('getEventById', () => {
  test('returns event with RSVPs when found', async () => {
    const e = mockEvent();
    Event.findByPk.mockResolvedValue(e);
    const result = await getEventById('evt-1');
    expect(result).toBe(e);
    expect(Event.findByPk).toHaveBeenCalledWith('evt-1', expect.objectContaining({ include: expect.any(Array) }));
  });

  test('throws 404 when event not found', async () => {
    Event.findByPk.mockResolvedValue(null);
    await expect(getEventById('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── createEvent ───────────────────────────────────────────────────────────────

describe('createEvent', () => {
  test('creates event with organizerId', async () => {
    const e = mockEvent();
    Event.create.mockResolvedValue(e);
    const result = await createEvent('user-1', { title: 'Tech Summit', type: 'conference', startDate: new Date(), endDate: new Date(), description: 'A conference' });
    expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({ organizerId: 'user-1' }));
    expect(result).toBe(e);
  });
});

// ─── updateEvent ───────────────────────────────────────────────────────────────

describe('updateEvent', () => {
  test('updates event when organizer', async () => {
    const e = mockEvent();
    e.update.mockResolvedValue(e);
    Event.findByPk.mockResolvedValue(e);
    await updateEvent('evt-1', 'user-1', { title: 'Updated' });
    expect(e.update).toHaveBeenCalledWith({ title: 'Updated' });
  });

  test('throws 403 when not organizer', async () => {
    Event.findByPk.mockResolvedValue(mockEvent({ organizerId: 'user-9' }));
    await expect(updateEvent('evt-1', 'user-1', {})).rejects.toMatchObject({ statusCode: 403 });
  });

  test('throws 404 when event not found', async () => {
    Event.findByPk.mockResolvedValue(null);
    await expect(updateEvent('ghost', 'user-1', {})).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── deleteEvent ───────────────────────────────────────────────────────────────

describe('deleteEvent', () => {
  test('organizer can delete their event', async () => {
    const e = mockEvent();
    Event.findByPk.mockResolvedValue(e);
    await deleteEvent('evt-1', 'user-1', 'student');
    expect(e.destroy).toHaveBeenCalled();
  });

  test('admin can delete any event', async () => {
    const e = mockEvent({ organizerId: 'user-9' });
    Event.findByPk.mockResolvedValue(e);
    await deleteEvent('evt-1', 'admin-1', 'admin');
    expect(e.destroy).toHaveBeenCalled();
  });

  test('throws 403 for non-organizer, non-admin', async () => {
    Event.findByPk.mockResolvedValue(mockEvent({ organizerId: 'user-9' }));
    await expect(deleteEvent('evt-1', 'user-1', 'student')).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── rsvpEvent ─────────────────────────────────────────────────────────────────

describe('rsvpEvent', () => {
  test('creates new RSVP on first call', async () => {
    Event.findByPk.mockResolvedValue(mockEvent());
    const rsvp = mockRsvp();
    RSVP.findOrCreate.mockResolvedValue([rsvp, true]);
    const result = await rsvpEvent('evt-1', 'user-2', 'going');
    expect(result).toBe(rsvp);
  });

  test('updates existing RSVP status on repeat call', async () => {
    Event.findByPk.mockResolvedValue(mockEvent());
    const rsvp = mockRsvp({ status: 'going' });
    RSVP.findOrCreate.mockResolvedValue([rsvp, false]);
    await rsvpEvent('evt-1', 'user-2', 'not_going');
    expect(rsvp.update).toHaveBeenCalledWith({ status: 'not_going' });
  });

  test('throws 400 when event is at capacity', async () => {
    Event.findByPk.mockResolvedValue(mockEvent({ capacity: 10 }));
    RSVP.count.mockResolvedValue(10); // full
    await expect(rsvpEvent('evt-1', 'user-2', 'going')).rejects.toMatchObject({ statusCode: 400 });
  });

  test('allows RSVP when capacity not yet reached', async () => {
    Event.findByPk.mockResolvedValue(mockEvent({ capacity: 10 }));
    RSVP.count.mockResolvedValue(9); // one slot left
    RSVP.findOrCreate.mockResolvedValue([mockRsvp(), true]);
    await expect(rsvpEvent('evt-1', 'user-2', 'going')).resolves.not.toThrow();
  });

  test('skips capacity check for non-going status', async () => {
    Event.findByPk.mockResolvedValue(mockEvent({ capacity: 1 }));
    RSVP.findOrCreate.mockResolvedValue([mockRsvp({ status: 'interested' }), true]);
    await rsvpEvent('evt-1', 'user-2', 'interested');
    expect(RSVP.count).not.toHaveBeenCalled();
  });

  test('throws 404 when event not found', async () => {
    Event.findByPk.mockResolvedValue(null);
    await expect(rsvpEvent('ghost', 'user-2', 'going')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getMyRSVPs ────────────────────────────────────────────────────────────────

describe('getMyRSVPs', () => {
  test('returns all RSVPs for user', async () => {
    const rsvps = [mockRsvp()];
    RSVP.findAll.mockResolvedValue(rsvps);
    const result = await getMyRSVPs('user-2');
    expect(result).toBe(rsvps);
    expect(RSVP.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-2' } }));
  });
});
