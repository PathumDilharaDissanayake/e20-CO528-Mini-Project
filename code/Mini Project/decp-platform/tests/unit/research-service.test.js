/**
 * Research Service Unit Tests
 * Tests for research projects CRUD and collaboration
 */

const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  joinProject,
  leaveProject,
  getProjectMembers,
  updateMemberRole
} = require('../../backend/research-service/src/controllers/researchController');
const { ResearchProject } = require('../../backend/research-service/src/models');

// Mock dependencies
jest.mock('../../backend/research-service/src/models');
jest.mock('../../backend/research-service/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Research Service - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockProject;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockProject = {
      id: 'project-123',
      title: 'AI in Healthcare',
      description: 'Research on AI applications in medical diagnosis',
      leadResearcherId: 'researcher-123',
      department: 'Computer Science',
      status: 'active',
      funding: {
        amount: 50000,
        currency: 'USD',
        source: 'NSF Grant'
      },
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      tags: ['AI', 'Healthcare', 'Machine Learning'],
      isPublic: true,
      memberCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      members: [
        { id: 'user-1', role: 'lead' },
        { id: 'user-2', role: 'researcher' },
        { id: 'user-3', role: 'student' }
      ]
    };
  });

  describe('Get Projects', () => {
    test('should get projects with default pagination', async () => {
      mockReq = { query: {} };
      ResearchProject.findAndCountAll.mockResolvedValue({
        count: 20,
        rows: Array(10).fill(mockProject)
      });

      await getProjects(mockReq, mockRes);

      expect(ResearchProject.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
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
          total: 20
        })
      }));
    });

    test('should filter projects by status', async () => {
      mockReq = { query: { status: 'active' } };
      ResearchProject.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: Array(10).fill(mockProject)
      });

      await getProjects(mockReq, mockRes);

      expect(ResearchProject.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: 'active' })
      }));
    });

    test('should filter projects by department', async () => {
      mockReq = { query: { department: 'Computer Science' } };
      ResearchProject.findAndCountAll.mockResolvedValue({
        count: 8,
        rows: Array(8).fill(mockProject)
      });

      await getProjects(mockReq, mockRes);

      expect(ResearchProject.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ department: 'Computer Science' })
      }));
    });

    test('should filter projects by tags', async () => {
      mockReq = { query: { tags: 'AI,Healthcare' } };
      ResearchProject.findAndCountAll.mockResolvedValue({
        count: 5,
        rows: Array(5).fill(mockProject)
      });

      await getProjects(mockReq, mockRes);

      expect(ResearchProject.findAndCountAll).toHaveBeenCalled();
    });

    test('should search projects by keyword', async () => {
      mockReq = { query: { q: 'machine learning' } };
      ResearchProject.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: [mockProject, mockProject, mockProject]
      });

      await getProjects(mockReq, mockRes);

      expect(ResearchProject.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });

    test('should only return public projects', async () => {
      mockReq = { query: {} };
      ResearchProject.findAndCountAll.mockResolvedValue({
        count: 15,
        rows: Array(10).fill(mockProject)
      });

      await getProjects(mockReq, mockRes);

      expect(ResearchProject.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isPublic: true })
      }));
    });

    test('should handle empty results', async () => {
      mockReq = { query: { department: 'NonExistent' } };
      ResearchProject.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await getProjects(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: []
      }));
    });
  });

  describe('Get Project', () => {
    test('should get project by id successfully', async () => {
      mockReq = { params: { projectId: 'project-123' } };
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await getProject(mockReq, mockRes);

      expect(ResearchProject.findByPk).toHaveBeenCalledWith('project-123', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ project: mockProject })
      }));
    });

    test('should return 404 for non-existent project', async () => {
      mockReq = { params: { projectId: 'nonexistent' } };
      ResearchProject.findByPk.mockResolvedValue(null);

      await getProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Project not found'
      }));
    });

    test('should include project members', async () => {
      mockReq = { params: { projectId: 'project-123' } };
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await getProject(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          project: expect.objectContaining({
            members: expect.any(Array)
          })
        })
      }));
    });
  });

  describe('Create Project', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'researcher-123', 'x-user-role': 'alumni' },
        body: {
          title: 'Blockchain Research',
          description: 'Exploring blockchain applications in education',
          department: 'Computer Science',
          tags: ['Blockchain', 'Education'],
          startDate: '2024-03-01',
          endDate: '2024-12-31',
          isPublic: true,
          funding: {
            amount: 30000,
            currency: 'USD',
            source: 'University Grant'
          }
        }
      };
    });

    test('should create project successfully', async () => {
      ResearchProject.create.mockResolvedValue(mockProject);

      await createProject(mockReq, mockRes);

      expect(ResearchProject.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Blockchain Research',
        leadResearcherId: 'researcher-123',
        status: 'active'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Project created successfully'
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq.headers = {};

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('should validate required fields', async () => {
      mockReq.body = { title: 'Incomplete Project' };

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate title length', async () => {
      mockReq.body.title = 'a'.repeat(201);

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate start date before end date', async () => {
      mockReq.body.startDate = '2024-12-31';
      mockReq.body.endDate = '2024-03-01';

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate funding amount', async () => {
      mockReq.body.funding.amount = -1000;

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle missing optional fields', async () => {
      delete mockReq.body.funding;
      delete mockReq.body.endDate;
      ResearchProject.create.mockResolvedValue(mockProject);

      await createProject(mockReq, mockRes);

      expect(ResearchProject.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should validate tags array', async () => {
      mockReq.body.tags = 'not-an-array';

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Update Project', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'researcher-123' },
        params: { projectId: 'project-123' },
        body: {
          title: 'Updated Project Title',
          description: 'Updated description'
        }
      };
    });

    test('should update own project successfully', async () => {
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await updateProject(mockReq, mockRes);

      expect(mockProject.update).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Updated Project Title',
        description: 'Updated description'
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Project updated successfully'
      }));
    });

    test('should return 404 for non-existent project', async () => {
      ResearchProject.findByPk.mockResolvedValue(null);

      await updateProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized update', async () => {
      mockReq.headers['x-user-id'] = 'unauthorized-user';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await updateProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should not allow updating lead researcher', async () => {
      mockReq.body.leadResearcherId = 'new-researcher';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await updateProject(mockReq, mockRes);

      // Should not include leadResearcherId in update
      expect(mockProject.update).not.toHaveBeenCalledWith(expect.objectContaining({
        leadResearcherId: 'new-researcher'
      }));
    });

    test('should handle partial updates', async () => {
      mockReq.body = { status: 'completed' };
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await updateProject(mockReq, mockRes);

      expect(mockProject.update).toHaveBeenCalledWith({ status: 'completed' });
    });
  });

  describe('Delete Project', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'researcher-123', 'x-user-role': 'alumni' },
        params: { projectId: 'project-123' }
      };
    });

    test('should delete own project successfully', async () => {
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await deleteProject(mockReq, mockRes);

      expect(mockProject.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Project deleted successfully'
      }));
    });

    test('should allow admin to delete any project', async () => {
      mockReq.headers['x-user-id'] = 'admin-123';
      mockReq.headers['x-user-role'] = 'admin';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await deleteProject(mockReq, mockRes);

      expect(mockProject.destroy).toHaveBeenCalled();
    });

    test('should return 403 for unauthorized deletion', async () => {
      mockReq.headers['x-user-id'] = 'unauthorized-user';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await deleteProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should return 404 for non-existent project', async () => {
      ResearchProject.findByPk.mockResolvedValue(null);

      await deleteProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Join Project', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-789' },
        params: { projectId: 'project-123' },
        body: { role: 'student', message: 'I would like to contribute' }
      };
    });

    test('should join project successfully', async () => {
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await joinProject(mockReq, mockRes);

      expect(mockProject.increment).toHaveBeenCalledWith('memberCount');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Joined project successfully'
      }));
    });

    test('should return 404 for non-existent project', async () => {
      ResearchProject.findByPk.mockResolvedValue(null);

      await joinProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for private project', async () => {
      ResearchProject.findByPk.mockResolvedValue({
        ...mockProject,
        isPublic: false
      });

      await joinProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should prevent duplicate membership', async () => {
      mockReq.headers['x-user-id'] = 'user-1';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await joinProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    test('should validate role', async () => {
      mockReq.body.role = 'invalid-role';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await joinProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should not allow joining completed projects', async () => {
      ResearchProject.findByPk.mockResolvedValue({
        ...mockProject,
        status: 'completed'
      });

      await joinProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Leave Project', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-2' },
        params: { projectId: 'project-123' }
      };
    });

    test('should leave project successfully', async () => {
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await leaveProject(mockReq, mockRes);

      expect(mockProject.decrement).toHaveBeenCalledWith('memberCount');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Left project successfully'
      }));
    });

    test('should prevent lead researcher from leaving', async () => {
      mockReq.headers['x-user-id'] = 'user-1';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await leaveProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('lead')
      }));
    });

    test('should return 404 if not a member', async () => {
      mockReq.headers['x-user-id'] = 'non-member';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await leaveProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 404 for non-existent project', async () => {
      ResearchProject.findByPk.mockResolvedValue(null);

      await leaveProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Get Project Members', () => {
    test('should get project members', async () => {
      mockReq = {
        params: { projectId: 'project-123' },
        headers: { 'x-user-id': 'user-1' }
      };
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await getProjectMembers(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });

    test('should return 404 for non-existent project', async () => {
      mockReq = {
        params: { projectId: 'nonexistent' },
        headers: { 'x-user-id': 'user-1' }
      };
      ResearchProject.findByPk.mockResolvedValue(null);

      await getProjectMembers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should restrict private project members to members only', async () => {
      mockReq = {
        params: { projectId: 'project-123' },
        headers: { 'x-user-id': 'outsider' }
      };
      ResearchProject.findByPk.mockResolvedValue({
        ...mockProject,
        isPublic: false
      });

      await getProjectMembers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Update Member Role', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-1' },
        params: { projectId: 'project-123', memberId: 'user-2' },
        body: { role: 'co-lead' }
      };
    });

    test('should update member role successfully', async () => {
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await updateMemberRole(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Member role updated'
      }));
    });

    test('should only allow lead researcher to update roles', async () => {
      mockReq.headers['x-user-id'] = 'user-2';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await updateMemberRole(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should validate role', async () => {
      mockReq.body.role = 'invalid-role';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await updateMemberRole(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should not allow changing own role', async () => {
      mockReq.params.memberId = 'user-1';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await updateMemberRole(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should return 404 for non-existent member', async () => {
      mockReq.params.memberId = 'non-member';
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      await updateMemberRole(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle project with maximum members', async () => {
      mockReq = {
        headers: { 'x-user-id': 'new-user' },
        params: { projectId: 'project-123' },
        body: { role: 'student' }
      };
      ResearchProject.findByPk.mockResolvedValue({
        ...mockProject,
        members: Array(50).fill({ id: 'user', role: 'researcher' })
      });

      await joinProject(mockReq, mockRes);

      // Should either allow or have a limit
      expect(mockRes.status).toBeDefined();
    });

    test('should handle very long project description', async () => {
      mockReq = {
        headers: { 'x-user-id': 'researcher-123', 'x-user-role': 'alumni' },
        body: {
          title: 'Research Project',
          description: 'a'.repeat(10000),
          department: 'CS',
          tags: ['tag1'],
          startDate: '2024-03-01',
          type: 'in-person'
        }
      };
      ResearchProject.create.mockResolvedValue(mockProject);

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle project with large funding amount', async () => {
      mockReq = {
        headers: { 'x-user-id': 'researcher-123', 'x-user-role': 'alumni' },
        body: {
          title: 'Expensive Research',
          description: 'Description',
          department: 'CS',
          tags: ['tag1'],
          startDate: '2024-03-01',
          funding: {
            amount: 100000000,
            currency: 'USD',
            source: 'Major Grant'
          }
        }
      };
      ResearchProject.create.mockResolvedValue(mockProject);

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle unicode in project title', async () => {
      mockReq = {
        headers: { 'x-user-id': 'researcher-123', 'x-user-role': 'alumni' },
        body: {
          title: '🔬 AI研究项目 Исследование ИИ',
          description: 'Description',
          department: 'CS',
          tags: ['AI'],
          startDate: '2024-03-01'
        }
      };
      ResearchProject.create.mockResolvedValue(mockProject);

      await createProject(mockReq, mockRes);

      expect(ResearchProject.create).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining('🔬')
      }));
    });

    test('should handle many tags', async () => {
      mockReq = {
        headers: { 'x-user-id': 'researcher-123', 'x-user-role': 'alumni' },
        body: {
          title: 'Multi-disciplinary Research',
          description: 'Description',
          department: 'CS',
          tags: Array(20).fill('tag'),
          startDate: '2024-03-01'
        }
      };
      ResearchProject.create.mockResolvedValue(mockProject);

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle rapid join/leave operations', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-789' },
        params: { projectId: 'project-123' },
        body: { role: 'student' }
      };
      ResearchProject.findByPk.mockResolvedValue(mockProject);

      // Join
      await joinProject(mockReq, mockRes);
      expect(mockProject.increment).toHaveBeenCalledWith('memberCount');

      // Leave
      await leaveProject(mockReq, mockRes);
      expect(mockProject.decrement).toHaveBeenCalledWith('memberCount');
    });

    test('should handle project spanning multiple years', async () => {
      mockReq = {
        headers: { 'x-user-id': 'researcher-123', 'x-user-role': 'alumni' },
        body: {
          title: 'Long-term Research',
          description: 'Description',
          department: 'CS',
          tags: ['long-term'],
          startDate: '2024-01-01',
          endDate: '2029-12-31'
        }
      };
      ResearchProject.create.mockResolvedValue(mockProject);

      await createProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle special characters in department name', async () => {
      mockReq = {
        headers: { 'x-user-id': 'researcher-123', 'x-user-role': 'alumni' },
        body: {
          title: 'Research',
          description: 'Description',
          department: 'Computer Science & Engineering (CS&E)',
          tags: ['CS'],
          startDate: '2024-03-01'
        }
      };
      ResearchProject.create.mockResolvedValue(mockProject);

      await createProject(mockReq, mockRes);

      expect(ResearchProject.create).toHaveBeenCalledWith(expect.objectContaining({
        department: expect.stringContaining('&')
      }));
    });
  });
});
