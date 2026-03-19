/**
 * researchService unit tests — business logic layer, no HTTP.
 * Agent: A-11 (Testing Agent) | 2026-03-03
 */

jest.mock('../../backend/research-service/src/models', () => ({
  ResearchProject: {
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn()
  }
}));

const {
  listProjects, getProjectById, createProject, updateProject, deleteProject,
  addDocument, deleteDocument, joinAsCollaborator, leaveProject
} = require('../../backend/research-service/src/services/researchService');
const { ResearchProject } = require('../../backend/research-service/src/models');

const mockProject = (overrides = {}) => ({
  id: 'proj-1',
  title: 'AI Research',
  leadResearcherId: 'user-1',
  collaborators: [],
  documents: [],
  update: jest.fn().mockImplementation(function(data) { Object.assign(this, data); return this; }),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

beforeEach(() => jest.clearAllMocks());

// ─── listProjects ──────────────────────────────────────────────────────────────

describe('listProjects', () => {
  test('returns paginated projects', async () => {
    const p = mockProject();
    ResearchProject.findAndCountAll.mockResolvedValue({ count: 1, rows: [p] });
    const result = await listProjects({ page: 1, limit: 10 });
    expect(result.projects).toContain(p);
    expect(result.total).toBe(1);
  });

  test('filters by leadResearcher=me using requestingUserId', async () => {
    ResearchProject.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listProjects({ leadResearcher: 'me', requestingUserId: 'user-1' });
    const [args] = ResearchProject.findAndCountAll.mock.calls;
    expect(args[0].where.leadResearcherId).toBe('user-1');
  });

  test('clamps limit', async () => {
    ResearchProject.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listProjects({ limit: 200 });
    const [args] = ResearchProject.findAndCountAll.mock.calls;
    expect(args[0].limit).toBe(50);
  });
});

// ─── getProjectById ────────────────────────────────────────────────────────────

describe('getProjectById', () => {
  test('returns project when found', async () => {
    const p = mockProject();
    ResearchProject.findByPk.mockResolvedValue(p);
    expect(await getProjectById('proj-1')).toBe(p);
  });

  test('throws 404 when not found', async () => {
    ResearchProject.findByPk.mockResolvedValue(null);
    await expect(getProjectById('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── createProject ─────────────────────────────────────────────────────────────

describe('createProject', () => {
  test('creates project with leadResearcherId', async () => {
    const p = mockProject();
    ResearchProject.create.mockResolvedValue(p);
    await createProject('user-1', { title: 'AI Research', abstract: 'Testing AI systems in production.' });
    expect(ResearchProject.create).toHaveBeenCalledWith(expect.objectContaining({ leadResearcherId: 'user-1' }));
  });
});

// ─── updateProject ─────────────────────────────────────────────────────────────

describe('updateProject', () => {
  test('lead researcher can update', async () => {
    const p = mockProject();
    p.update.mockResolvedValue(p);
    ResearchProject.findByPk.mockResolvedValue(p);
    await updateProject('proj-1', 'user-1', { title: 'Updated' });
    expect(p.update).toHaveBeenCalledWith({ title: 'Updated' });
  });

  test('collaborator can update', async () => {
    const p = mockProject({ collaborators: ['user-2'] });
    p.update.mockResolvedValue(p);
    ResearchProject.findByPk.mockResolvedValue(p);
    await updateProject('proj-1', 'user-2', { status: 'completed' });
    expect(p.update).toHaveBeenCalled();
  });

  test('throws 403 for non-member', async () => {
    ResearchProject.findByPk.mockResolvedValue(mockProject({ collaborators: [] }));
    await expect(updateProject('proj-1', 'user-9', {})).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── deleteProject ─────────────────────────────────────────────────────────────

describe('deleteProject', () => {
  test('lead researcher can delete', async () => {
    const p = mockProject();
    ResearchProject.findByPk.mockResolvedValue(p);
    await deleteProject('proj-1', 'user-1', 'student');
    expect(p.destroy).toHaveBeenCalled();
  });

  test('admin can delete', async () => {
    const p = mockProject({ leadResearcherId: 'user-9' });
    ResearchProject.findByPk.mockResolvedValue(p);
    await deleteProject('proj-1', 'admin-1', 'admin');
    expect(p.destroy).toHaveBeenCalled();
  });

  test('throws 403 for unauthorized user', async () => {
    ResearchProject.findByPk.mockResolvedValue(mockProject({ leadResearcherId: 'user-9' }));
    await expect(deleteProject('proj-1', 'user-1', 'faculty')).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── addDocument ───────────────────────────────────────────────────────────────

describe('addDocument', () => {
  test('adds document URL to project documents array', async () => {
    const p = mockProject({ documents: ['existing.pdf'] });
    p.update.mockResolvedValue(p);
    ResearchProject.findByPk.mockResolvedValue(p);
    const docs = await addDocument('proj-1', 'user-1', '/uploads/new.pdf');
    expect(docs).toContain('/uploads/new.pdf');
    expect(docs).toContain('existing.pdf');
  });

  test('throws 403 for non-member', async () => {
    ResearchProject.findByPk.mockResolvedValue(mockProject({ collaborators: [] }));
    await expect(addDocument('proj-1', 'user-9', 'file.pdf')).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── deleteDocument ────────────────────────────────────────────────────────────

describe('deleteDocument', () => {
  test('removes document matching documentId', async () => {
    const p = mockProject({ documents: ['/uploads/abc-doc.pdf', '/uploads/xyz-other.pdf'] });
    p.update.mockResolvedValue(p);
    ResearchProject.findByPk.mockResolvedValue(p);
    const docs = await deleteDocument('proj-1', 'user-1', 'abc-doc');
    expect(docs).not.toContain('/uploads/abc-doc.pdf');
    expect(docs).toContain('/uploads/xyz-other.pdf');
  });
});

// ─── joinAsCollaborator ────────────────────────────────────────────────────────

describe('joinAsCollaborator', () => {
  test('adds user to collaborators', async () => {
    const p = mockProject({ collaborators: ['user-3'] });
    p.update.mockResolvedValue(p);
    ResearchProject.findByPk.mockResolvedValue(p);
    await joinAsCollaborator('proj-1', 'user-2');
    expect(p.update).toHaveBeenCalledWith(
      expect.objectContaining({ collaborators: expect.arrayContaining(['user-2', 'user-3']) })
    );
  });

  test('is idempotent — does not duplicate collaborator', async () => {
    const p = mockProject({ collaborators: ['user-2'] });
    p.update.mockResolvedValue(p);
    ResearchProject.findByPk.mockResolvedValue(p);
    await joinAsCollaborator('proj-1', 'user-2');
    const [args] = p.update.mock.calls;
    expect(args[0].collaborators.filter((id) => id === 'user-2')).toHaveLength(1);
  });
});

// ─── leaveProject ──────────────────────────────────────────────────────────────

describe('leaveProject', () => {
  test('removes user from collaborators', async () => {
    const p = mockProject({ collaborators: ['user-2', 'user-3'] });
    p.update.mockResolvedValue(p);
    ResearchProject.findByPk.mockResolvedValue(p);
    await leaveProject('proj-1', 'user-2');
    expect(p.update).toHaveBeenCalledWith(
      expect.objectContaining({ collaborators: ['user-3'] })
    );
  });

  test('throws 400 when lead researcher tries to leave', async () => {
    ResearchProject.findByPk.mockResolvedValue(mockProject({ leadResearcherId: 'user-1' }));
    await expect(leaveProject('proj-1', 'user-1')).rejects.toMatchObject({ statusCode: 400 });
  });
});
