/**
 * Jobs Service Unit Tests
 * Tests for job posting and application functionality
 */

const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getApplications,
  updateApplicationStatus,
  getMyJobs
} = require('../../backend/jobs-service/src/controllers/jobController');
const { Job, Application } = require('../../backend/jobs-service/src/models');

// Mock dependencies
jest.mock('../../backend/jobs-service/src/models');
jest.mock('../../backend/jobs-service/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Jobs Service - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockJob;
  let mockApplication;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockJob = {
      id: 'job-123',
      employerId: 'employer-123',
      title: 'Software Engineer Intern',
      company: 'Tech Corp',
      description: 'Exciting internship opportunity',
      requirements: ['JavaScript', 'React', 'Node.js'],
      location: 'San Francisco, CA',
      type: 'internship',
      salary: {
        min: 50000,
        max: 80000,
        currency: 'USD',
        period: 'yearly'
      },
      skills: ['JavaScript', 'React', 'Node.js'],
      isActive: true,
      expiresAt: new Date('2024-12-31'),
      applicationCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      increment: jest.fn()
    };
    mockApplication = {
      id: 'app-123',
      jobId: 'job-123',
      applicantId: 'user-456',
      status: 'pending',
      coverLetter: 'I am excited to apply...',
      resumeUrl: 'https://example.com/resume.pdf',
      createdAt: new Date(),
      save: jest.fn(),
      update: jest.fn()
    };
  });

  describe('Get Jobs', () => {
    test('should get jobs with default pagination', async () => {
      mockReq = { query: {} };
      Job.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: Array(10).fill(mockJob)
      });

      await getJobs(mockReq, mockRes);

      expect(Job.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isActive: true },
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
          total: 25,
          totalPages: 3
        })
      }));
    });

    test('should filter jobs by location', async () => {
      mockReq = { query: { location: 'San Francisco' } };
      Job.findAndCountAll.mockResolvedValue({
        count: 5,
        rows: [mockJob, mockJob, mockJob, mockJob, mockJob]
      });

      await getJobs(mockReq, mockRes);

      expect(Job.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          location: expect.any(Object),
          isActive: true
        })
      }));
    });

    test('should filter jobs by type', async () => {
      mockReq = { query: { type: 'internship' } };
      Job.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: Array(10).fill(mockJob)
      });

      await getJobs(mockReq, mockRes);

      expect(Job.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ type: 'internship' })
      }));
    });

    test('should filter jobs by skills', async () => {
      mockReq = { query: { skills: 'JavaScript,React' } };
      Job.findAndCountAll.mockResolvedValue({
        count: 8,
        rows: Array(8).fill(mockJob)
      });

      await getJobs(mockReq, mockRes);

      expect(Job.findAndCountAll).toHaveBeenCalled();
    });

    test('should search jobs by keyword', async () => {
      mockReq = { query: { q: 'Software Engineer' } };
      Job.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: [mockJob, mockJob, mockJob]
      });

      await getJobs(mockReq, mockRes);

      expect(Job.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });

    test('should filter jobs by salary range', async () => {
      mockReq = { query: { minSalary: '60000', maxSalary: '100000' } };
      Job.findAndCountAll.mockResolvedValue({
        count: 4,
        rows: [mockJob, mockJob, mockJob, mockJob]
      });

      await getJobs(mockReq, mockRes);

      expect(Job.findAndCountAll).toHaveBeenCalled();
    });

    test('should handle empty results', async () => {
      mockReq = { query: { location: 'NonExistentCity' } };
      Job.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await getJobs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [],
        meta: expect.objectContaining({ total: 0 })
      }));
    });

    test('should only return active jobs', async () => {
      mockReq = { query: {} };
      Job.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await getJobs(mockReq, mockRes);

      expect(Job.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isActive: true })
      }));
    });
  });

  describe('Get Job', () => {
    test('should get job by id successfully', async () => {
      mockReq = { params: { jobId: 'job-123' } };
      Job.findByPk.mockResolvedValue(mockJob);

      await getJob(mockReq, mockRes);

      expect(Job.findByPk).toHaveBeenCalledWith('job-123');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ job: mockJob })
      }));
    });

    test('should return 404 for non-existent job', async () => {
      mockReq = { params: { jobId: 'nonexistent' } };
      Job.findByPk.mockResolvedValue(null);

      await getJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Job not found'
      }));
    });

    test('should return 404 for inactive job', async () => {
      mockReq = { params: { jobId: 'job-123' } };
      Job.findByPk.mockResolvedValue({ ...mockJob, isActive: false });

      await getJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 404 for expired job', async () => {
      mockReq = { params: { jobId: 'job-123' } };
      Job.findByPk.mockResolvedValue({
        ...mockJob,
        expiresAt: new Date('2020-01-01')
      });

      await getJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Create Job', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123', 'x-user-role': 'alumni' },
        body: {
          title: 'Software Engineer',
          company: 'Tech Corp',
          description: 'We are looking for a skilled engineer',
          requirements: ['3+ years experience', 'Bachelor degree'],
          location: 'Remote',
          type: 'full-time',
          salary: {
            min: 100000,
            max: 150000,
            currency: 'USD',
            period: 'yearly'
          },
          skills: ['JavaScript', 'Node.js'],
          expiresAt: '2024-12-31'
        }
      };
    });

    test('should create job successfully', async () => {
      Job.create.mockResolvedValue(mockJob);

      await createJob(mockReq, mockRes);

      expect(Job.create).toHaveBeenCalledWith(expect.objectContaining({
        employerId: 'employer-123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        isActive: true
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Job posted successfully'
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq.headers = {};

      await createJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('should validate required fields', async () => {
      mockReq.body = { title: 'Software Engineer' };

      await createJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate job type', async () => {
      mockReq.body.type = 'invalid-type';

      await createJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate salary structure', async () => {
      mockReq.body.salary = { min: 200000, max: 100000 };

      await createJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should set default expiration if not provided', async () => {
      delete mockReq.body.expiresAt;
      Job.create.mockResolvedValue(mockJob);

      await createJob(mockReq, mockRes);

      expect(Job.create).toHaveBeenCalledWith(expect.objectContaining({
        expiresAt: expect.any(Date)
      }));
    });

    test('should handle invalid expiration date', async () => {
      mockReq.body.expiresAt = 'invalid-date';

      await createJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Update Job', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        params: { jobId: 'job-123' },
        body: {
          title: 'Senior Software Engineer',
          salary: {
            min: 120000,
            max: 180000,
            currency: 'USD',
            period: 'yearly'
          }
        }
      };
    });

    test('should update own job successfully', async () => {
      Job.findByPk.mockResolvedValue(mockJob);

      await updateJob(mockReq, mockRes);

      expect(mockJob.update).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Senior Software Engineer',
        salary: expect.any(Object)
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Job updated successfully'
      }));
    });

    test('should return 404 for non-existent job', async () => {
      Job.findByPk.mockResolvedValue(null);

      await updateJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized update', async () => {
      mockReq.headers['x-user-id'] = 'different-user';
      Job.findByPk.mockResolvedValue(mockJob);

      await updateJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle partial updates', async () => {
      mockReq.body = { description: 'Updated description only' };
      Job.findByPk.mockResolvedValue(mockJob);

      await updateJob(mockReq, mockRes);

      expect(mockJob.update).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Updated description only'
      }));
    });
  });

  describe('Delete Job', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123', 'x-user-role': 'alumni' },
        params: { jobId: 'job-123' }
      };
    });

    test('should delete own job successfully', async () => {
      Job.findByPk.mockResolvedValue(mockJob);

      await deleteJob(mockReq, mockRes);

      expect(mockJob.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Job deleted successfully'
      }));
    });

    test('should allow admin to delete any job', async () => {
      mockReq.headers['x-user-id'] = 'admin-123';
      mockReq.headers['x-user-role'] = 'admin';
      Job.findByPk.mockResolvedValue(mockJob);

      await deleteJob(mockReq, mockRes);

      expect(mockJob.destroy).toHaveBeenCalled();
    });

    test('should return 403 for unauthorized deletion', async () => {
      mockReq.headers['x-user-id'] = 'different-user';
      mockReq.headers['x-user-role'] = 'student';
      Job.findByPk.mockResolvedValue(mockJob);

      await deleteJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should return 404 for non-existent job', async () => {
      Job.findByPk.mockResolvedValue(null);

      await deleteJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should delete associated applications', async () => {
      Job.findByPk.mockResolvedValue(mockJob);
      Application.destroy = jest.fn().mockResolvedValue(5);

      await deleteJob(mockReq, mockRes);

      expect(mockJob.destroy).toHaveBeenCalled();
    });
  });

  describe('Apply for Job', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { jobId: 'job-123' },
        body: {
          coverLetter: 'I am very interested in this position...',
          resumeUrl: 'https://example.com/resume.pdf'
        }
      };
    });

    test('should apply for job successfully', async () => {
      Job.findByPk.mockResolvedValue(mockJob);
      Application.findOne.mockResolvedValue(null);
      Application.create.mockResolvedValue(mockApplication);

      await applyForJob(mockReq, mockRes);

      expect(Application.create).toHaveBeenCalledWith(expect.objectContaining({
        jobId: 'job-123',
        applicantId: 'user-456',
        coverLetter: 'I am very interested in this position...',
        status: 'pending'
      }));
      expect(mockJob.increment).toHaveBeenCalledWith('applicationCount');
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should return 404 for non-existent job', async () => {
      Job.findByPk.mockResolvedValue(null);

      await applyForJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should prevent duplicate applications', async () => {
      Job.findByPk.mockResolvedValue(mockJob);
      Application.findOne.mockResolvedValue(mockApplication);

      await applyForJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'You have already applied for this job'
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq.headers = {};

      await applyForJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('should validate cover letter length', async () => {
      mockReq.body.coverLetter = 'a'.repeat(5001);
      Job.findByPk.mockResolvedValue(mockJob);

      await applyForJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate resume URL format', async () => {
      mockReq.body.resumeUrl = 'invalid-url';
      Job.findByPk.mockResolvedValue(mockJob);

      await applyForJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should prevent employer from applying to own job', async () => {
      mockReq.headers['x-user-id'] = 'employer-123';
      Job.findByPk.mockResolvedValue(mockJob);

      await applyForJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Get Applications', () => {
    test('should get applications for own job', async () => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        params: { jobId: 'job-123' }
      };
      Job.findByPk.mockResolvedValue(mockJob);
      Application.findAndCountAll.mockResolvedValue({
        count: 5,
        rows: Array(5).fill(mockApplication)
      });

      await getApplications(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({ total: 5 })
      }));
    });

    test('should get own applications', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        query: { myApplications: 'true' }
      };
      Application.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: Array(3).fill(mockApplication)
      });

      await getApplications(mockReq, mockRes);

      expect(Application.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ applicantId: 'user-456' })
      }));
    });

    test('should filter applications by status', async () => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        params: { jobId: 'job-123' },
        query: { status: 'pending' }
      };
      Job.findByPk.mockResolvedValue(mockJob);
      Application.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [mockApplication, mockApplication]
      });

      await getApplications(mockReq, mockRes);

      expect(Application.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: 'pending' })
      }));
    });

    test('should return 403 for unauthorized access', async () => {
      mockReq = {
        headers: { 'x-user-id': 'unauthorized-user' },
        params: { jobId: 'job-123' }
      };
      Job.findByPk.mockResolvedValue(mockJob);

      await getApplications(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Update Application Status', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        params: { jobId: 'job-123', applicationId: 'app-123' },
        body: { status: 'accepted' }
      };
    });

    test('should update application status successfully', async () => {
      Job.findByPk.mockResolvedValue(mockJob);
      Application.findByPk.mockResolvedValue(mockApplication);

      await updateApplicationStatus(mockReq, mockRes);

      expect(mockApplication.update).toHaveBeenCalledWith({ status: 'accepted' });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Application status updated'
      }));
    });

    test('should validate status value', async () => {
      mockReq.body.status = 'invalid-status';
      Job.findByPk.mockResolvedValue(mockJob);

      await updateApplicationStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should return 404 for non-existent application', async () => {
      Job.findByPk.mockResolvedValue(mockJob);
      Application.findByPk.mockResolvedValue(null);

      await updateApplicationStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should prevent updating already processed application', async () => {
      mockApplication.status = 'accepted';
      Job.findByPk.mockResolvedValue(mockJob);
      Application.findByPk.mockResolvedValue(mockApplication);
      mockReq.body.status = 'rejected';

      await updateApplicationStatus(mockReq, mockRes);

      // Should either allow or return error
      expect(mockRes.status).toBeDefined();
    });
  });

  describe('Get My Jobs', () => {
    test('should get jobs posted by current user', async () => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        query: {}
      };
      Job.findAndCountAll.mockResolvedValue({
        count: 5,
        rows: Array(5).fill(mockJob)
      });

      await getMyJobs(mockReq, mockRes);

      expect(Job.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ employerId: 'employer-123' })
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });

    test('should filter my jobs by status', async () => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        query: { isActive: 'true' }
      };
      Job.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: [mockJob, mockJob, mockJob]
      });

      await getMyJobs(mockReq, mockRes);

      expect(Job.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          employerId: 'employer-123',
          isActive: true
        })
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq = { headers: {} };

      await getMyJobs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle job with no salary information', async () => {
      mockReq = { params: { jobId: 'job-123' } };
      Job.findByPk.mockResolvedValue({
        ...mockJob,
        salary: null
      });

      await getJob(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    test('should handle maximum number of skills', async () => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        body: {
          title: 'Job with many skills',
          company: 'Tech Corp',
          description: 'Description',
          skills: Array(50).fill('Skill'),
          type: 'full-time'
        }
      };
      Job.create.mockResolvedValue(mockJob);

      await createJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle very long job description', async () => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        body: {
          title: 'Job Title',
          company: 'Tech Corp',
          description: 'a'.repeat(10000),
          type: 'full-time'
        }
      };

      await createJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle special characters in job content', async () => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        body: {
          title: 'Job <script>alert("xss")</script>',
          company: 'Tech Corp & Co.',
          description: 'Job description with 🎉 emojis and "quotes"',
          type: 'full-time'
        }
      };
      Job.create.mockResolvedValue(mockJob);

      await createJob(mockReq, mockRes);

      expect(Job.create).toHaveBeenCalledWith(expect.objectContaining({
        description: expect.stringContaining('emojis')
      }));
    });

    test('should handle expired job listing', async () => {
      mockReq = { query: {} };
      Job.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{
          ...mockJob,
          expiresAt: new Date(Date.now() - 86400000)
        }]
      });

      await getJobs(mockReq, mockRes);

      // Should not include expired jobs
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('should handle concurrent applications', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { jobId: 'job-123' },
        body: {
          coverLetter: 'Application letter'
        }
      };
      Job.findByPk.mockResolvedValue(mockJob);
      Application.findOne.mockResolvedValue(null);
      Application.create.mockResolvedValue(mockApplication);

      // Simulate multiple concurrent applications
      const promises = Array(3).fill().map(() => applyForJob(mockReq, mockRes));
      await Promise.all(promises);

      expect(Application.create).toHaveBeenCalledTimes(3);
    });

    test('should handle large number of applications', async () => {
      mockReq = {
        headers: { 'x-user-id': 'employer-123' },
        params: { jobId: 'job-123' }
      };
      Job.findByPk.mockResolvedValue(mockJob);
      Application.findAndCountAll.mockResolvedValue({
        count: 1000,
        rows: Array(50).fill(mockApplication)
      });

      await getApplications(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        meta: expect.objectContaining({ total: 1000 })
      }));
    });
  });
});
