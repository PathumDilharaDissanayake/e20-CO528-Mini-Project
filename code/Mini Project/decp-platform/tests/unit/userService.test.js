/**
 * userService unit tests — business logic layer, no HTTP.
 * Agent: A-11 (Testing Agent) | 2026-03-03
 */

jest.mock('../../backend/user-service/src/models', () => ({
  Profile: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    findOrCreate: jest.fn(),
    create: jest.fn()
  }
}));
jest.mock('../../backend/user-service/src/utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));

const { listUsers, getUserById, getOrSyncMyProfile, searchUsers, updateProfile, deleteProfile } =
  require('../../backend/user-service/src/services/userService');
const { Profile } = require('../../backend/user-service/src/models');

const mockProfile = (overrides = {}) => ({
  userId: 'user-1',
  email: 'alice@decp.edu',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'student',
  skills: ['JavaScript'],
  update: jest.fn().mockImplementation(function(data) { Object.assign(this, data); return this; }),
  destroy: jest.fn(),
  ...overrides
});

beforeEach(() => jest.clearAllMocks());

// ─── listUsers ─────────────────────────────────────────────────────────────────

describe('listUsers', () => {
  test('returns paginated result', async () => {
    const p = mockProfile();
    Profile.findAndCountAll.mockResolvedValue({ count: 5, rows: [p] });
    const result = await listUsers(undefined, 1, 10);
    expect(result.items).toContain(p);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(1);
  });

  test('clamps limit to 100 max', async () => {
    Profile.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listUsers(undefined, 1, 999);
    const [callArgs] = Profile.findAndCountAll.mock.calls;
    expect(callArgs[0].limit).toBe(100);
  });

  test('clamps limit to 1 min', async () => {
    Profile.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listUsers(undefined, 1, 0);
    const [callArgs] = Profile.findAndCountAll.mock.calls;
    expect(callArgs[0].limit).toBe(1);
  });

  test('applies search term to query', async () => {
    Profile.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listUsers('Alice', 1, 10);
    const [callArgs] = Profile.findAndCountAll.mock.calls;
    expect(callArgs[0].where).toBeDefined();
  });
});

// ─── getUserById ───────────────────────────────────────────────────────────────

describe('getUserById', () => {
  test('returns profile when found', async () => {
    const p = mockProfile();
    Profile.findOne.mockResolvedValue(p);
    const result = await getUserById('user-1');
    expect(result).toBe(p);
  });

  test('returns null when not found', async () => {
    Profile.findOne.mockResolvedValue(null);
    const result = await getUserById('ghost');
    expect(result).toBeNull();
  });
});

// ─── getOrSyncMyProfile ────────────────────────────────────────────────────────

describe('getOrSyncMyProfile', () => {
  test('creates profile when not found', async () => {
    Profile.findOne.mockResolvedValue(null);
    const newProfile = mockProfile();
    Profile.create.mockResolvedValue(newProfile);

    const result = await getOrSyncMyProfile({ userId: 'user-new', email: 'new@decp.edu', role: 'student', firstName: 'New', lastName: 'User' });
    expect(Profile.create).toHaveBeenCalled();
    expect(result).toBe(newProfile);
  });

  test('updates stale fields when profile exists', async () => {
    const p = mockProfile({ email: 'old@decp.edu' });
    Profile.findOne.mockResolvedValue(p);

    await getOrSyncMyProfile({ userId: 'user-1', email: 'new@decp.edu' });
    expect(p.update).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@decp.edu' }));
  });

  test('does not update when fields are unchanged', async () => {
    const p = mockProfile({ email: 'alice@decp.edu', role: 'student' });
    Profile.findOne.mockResolvedValue(p);

    await getOrSyncMyProfile({ userId: 'user-1', email: 'alice@decp.edu', role: 'student' });
    expect(p.update).not.toHaveBeenCalled();
  });
});

// ─── searchUsers ───────────────────────────────────────────────────────────────

describe('searchUsers', () => {
  test('filters by role', async () => {
    Profile.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await searchUsers({ role: 'faculty' });
    const [callArgs] = Profile.findAndCountAll.mock.calls;
    expect(callArgs[0].where).toMatchObject({ role: 'faculty' });
  });

  test('filters by skill using Op.contains', async () => {
    Profile.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await searchUsers({ skill: 'Python' });
    const [callArgs] = Profile.findAndCountAll.mock.calls;
    // skills filter should be in where clause
    expect(callArgs[0].where.skills).toBeDefined();
  });

  test('paginates correctly', async () => {
    Profile.findAndCountAll.mockResolvedValue({ count: 30, rows: [] });
    const result = await searchUsers({ page: 2, limit: 10 });
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });
});

// ─── updateProfile ─────────────────────────────────────────────────────────────

describe('updateProfile', () => {
  test('creates profile if it does not exist, then updates', async () => {
    const p = mockProfile();
    Profile.findOrCreate.mockResolvedValue([p, true]);
    await updateProfile('user-1', { bio: 'Hello' });
    expect(p.update).toHaveBeenCalledWith({ bio: 'Hello' });
  });

  test('updates existing profile', async () => {
    const p = mockProfile();
    Profile.findOrCreate.mockResolvedValue([p, false]);
    await updateProfile('user-1', { headline: 'Engineer' });
    expect(p.update).toHaveBeenCalledWith({ headline: 'Engineer' });
  });
});

// ─── deleteProfile ─────────────────────────────────────────────────────────────

describe('deleteProfile', () => {
  test('allows user to delete their own profile', async () => {
    const p = mockProfile();
    Profile.findOne.mockResolvedValue(p);
    await deleteProfile('user-1', 'user-1', 'student');
    expect(p.destroy).toHaveBeenCalled();
  });

  test('allows admin to delete another profile', async () => {
    const p = mockProfile({ userId: 'user-2' });
    Profile.findOne.mockResolvedValue(p);
    await deleteProfile('admin-1', 'user-2', 'admin');
    expect(p.destroy).toHaveBeenCalled();
  });

  test('throws 403 when non-admin tries to delete another user', async () => {
    Profile.findOne.mockResolvedValue(mockProfile({ userId: 'user-2' }));
    await expect(deleteProfile('user-1', 'user-2', 'student')).rejects.toMatchObject({ statusCode: 403 });
  });

  test('does not throw when profile does not exist (soft-success)', async () => {
    Profile.findOne.mockResolvedValue(null);
    await expect(deleteProfile('user-1', 'user-1', 'student')).resolves.toBeUndefined();
  });
});
