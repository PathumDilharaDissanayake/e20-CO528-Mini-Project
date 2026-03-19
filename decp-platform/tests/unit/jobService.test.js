/**
 * jobService unit tests — business logic layer, no HTTP.
 * Agent: A-11 (Testing Agent) | 2026-03-03
 */

jest.mock('../../backend/jobs-service/src/models', () => ({
  Job: {
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn()
  },
  Application: {
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn()
  }
}));
jest.mock('sequelize', () => {
  const actual = jest.requireActual('sequelize');
  return { ...actual, Op: actual.Op };
});

const {
  listJobs, getJobById, createJob, updateJob, deleteJob,
  applyForJob, updateApplicationStatus, getMyApplications
} = require('../../backend/jobs-service/src/services/jobService');
const { Job, Application } = require('../../backend/jobs-service/src/models');

const mockJob = (overrides = {}) => ({
  id: 'job-1',
  title: 'SWE Intern',
  company: 'Tech Corp',
  location: 'Remote',
  type: 'internship',
  postedBy: 'user-1',
  status: 'active',
  update: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

const mockApplication = (overrides = {}) => ({
  id: 'app-1',
  jobId: 'job-1',
  userId: 'user-2',
  status: 'applied',
  update: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

beforeEach(() => jest.clearAllMocks());

// ─── listJobs ──────────────────────────────────────────────────────────────────

describe('listJobs', () => {
  test('returns paginated jobs', async () => {
    Job.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockJob()] });
    const result = await listJobs({ page: 1, limit: 10 });
    expect(result.jobs).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  test('clamps limit to 50 max', async () => {
    Job.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listJobs({ limit: 200 });
    const [args] = Job.findAndCountAll.mock.calls;
    expect(args[0].limit).toBe(50);
  });

  test('filters by type', async () => {
    Job.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listJobs({ type: 'full-time' });
    const [args] = Job.findAndCountAll.mock.calls;
    expect(args[0].where.type).toBe('full-time');
  });

  test('strips status filter when postedBy=me', async () => {
    Job.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listJobs({ postedBy: 'me', requestingUserId: 'user-1' });
    const [args] = Job.findAndCountAll.mock.calls;
    // status should be removed so owner sees all their jobs
    expect(args[0].where.status).toBeUndefined();
    expect(args[0].where.postedBy).toBe('user-1');
  });
});

// ─── getJobById ────────────────────────────────────────────────────────────────

describe('getJobById', () => {
  test('returns job when found', async () => {
    const j = mockJob();
    Job.findByPk.mockResolvedValue(j);
    const result = await getJobById('job-1');
    expect(result).toBe(j);
  });

  test('throws 404 when not found', async () => {
    Job.findByPk.mockResolvedValue(null);
    await expect(getJobById('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── createJob ─────────────────────────────────────────────────────────────────

describe('createJob', () => {
  test('creates job with correct postedBy', async () => {
    const j = mockJob();
    Job.create.mockResolvedValue(j);
    const result = await createJob('user-1', { title: 'SWE Intern', company: 'TC', location: 'Remote', type: 'internship' });
    expect(Job.create).toHaveBeenCalledWith(expect.objectContaining({ postedBy: 'user-1' }));
    expect(result).toBe(j);
  });
});

// ─── updateJob ─────────────────────────────────────────────────────────────────

describe('updateJob', () => {
  test('updates job when authorized', async () => {
    const j = mockJob();
    j.update.mockResolvedValue(j);
    Job.findByPk.mockResolvedValue(j);
    await updateJob('job-1', 'user-1', { title: 'Senior SWE' });
    expect(j.update).toHaveBeenCalledWith({ title: 'Senior SWE' });
  });

  test('throws 404 when job does not exist', async () => {
    Job.findByPk.mockResolvedValue(null);
    await expect(updateJob('ghost', 'user-1', {})).rejects.toMatchObject({ statusCode: 404 });
  });

  test('throws 403 when user is not the poster', async () => {
    Job.findByPk.mockResolvedValue(mockJob({ postedBy: 'user-9' }));
    await expect(updateJob('job-1', 'user-1', {})).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── deleteJob ─────────────────────────────────────────────────────────────────

describe('deleteJob', () => {
  test('deletes job when user is poster', async () => {
    const j = mockJob();
    Job.findByPk.mockResolvedValue(j);
    await deleteJob('job-1', 'user-1', 'student');
    expect(j.destroy).toHaveBeenCalled();
  });

  test('deletes job when user is admin', async () => {
    const j = mockJob({ postedBy: 'user-9' });
    Job.findByPk.mockResolvedValue(j);
    await deleteJob('job-1', 'admin-1', 'admin');
    expect(j.destroy).toHaveBeenCalled();
  });

  test('throws 403 when non-poster, non-admin tries to delete', async () => {
    Job.findByPk.mockResolvedValue(mockJob({ postedBy: 'user-9' }));
    await expect(deleteJob('job-1', 'user-1', 'student')).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── applyForJob ──────────────────────────────────────────────────────────────

describe('applyForJob', () => {
  test('creates application on first apply', async () => {
    Job.findByPk.mockResolvedValue(mockJob());
    const app = mockApplication();
    Application.findOrCreate.mockResolvedValue([app, true]);
    const result = await applyForJob('job-1', 'user-2', {});
    expect(result).toBe(app);
  });

  test('throws 409 if already applied (idempotency check)', async () => {
    Job.findByPk.mockResolvedValue(mockJob());
    Application.findOrCreate.mockResolvedValue([mockApplication(), false]); // created=false
    await expect(applyForJob('job-1', 'user-2', {})).rejects.toMatchObject({ statusCode: 409 });
  });

  test('throws 404 when job does not exist', async () => {
    Job.findByPk.mockResolvedValue(null);
    await expect(applyForJob('ghost', 'user-2', {})).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── updateApplicationStatus ───────────────────────────────────────────────────

describe('updateApplicationStatus', () => {
  test('updates status when authorized job poster', async () => {
    const app = mockApplication();
    app.Job = { postedBy: 'user-1' };
    app.update.mockResolvedValue(app);
    Application.findByPk.mockResolvedValue(app);
    const result = await updateApplicationStatus('app-1', 'user-1', 'shortlisted');
    expect(app.update).toHaveBeenCalledWith({ status: 'shortlisted' });
    expect(result).toBe(app);
  });

  test('throws 403 when not the job poster', async () => {
    const app = mockApplication();
    app.Job = { postedBy: 'user-9' };
    Application.findByPk.mockResolvedValue(app);
    await expect(updateApplicationStatus('app-1', 'user-1', 'rejected')).rejects.toMatchObject({ statusCode: 403 });
  });

  test('throws 404 when application not found', async () => {
    Application.findByPk.mockResolvedValue(null);
    await expect(updateApplicationStatus('ghost', 'user-1', 'rejected')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getMyApplications ─────────────────────────────────────────────────────────

describe('getMyApplications', () => {
  test('returns all applications for user', async () => {
    const apps = [mockApplication()];
    Application.findAll.mockResolvedValue(apps);
    const result = await getMyApplications('user-2');
    expect(result).toBe(apps);
    expect(Application.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-2' }
    }));
  });
});
