import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Job, Application } from '../models';
import { logger } from '../utils/logger';
import Joi from 'joi';

const createJobSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  company: Joi.string().min(2).max(200).required(),
  location: Joi.string().min(2).max(200).required(),
  type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'remote').required(),
  salary: Joi.object({
    min: Joi.number().min(0),
    max: Joi.number().min(0),
    currency: Joi.string().max(3),
    period: Joi.string().valid('hourly', 'monthly', 'yearly')
  }),
  requirements: Joi.array().items(Joi.string()),
  skills: Joi.array().items(Joi.string()),
  expiresAt: Joi.date().iso()
});

const createApplicationSchema = Joi.object({
  resumeUrl: Joi.string().uri().allow(''),
  coverLetter: Joi.string().max(5000).allow(''),
  answers: Joi.object()
});

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, type, location, skill, postedBy, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { status: 'active' };

    if (postedBy === 'me') {
      const requestingUserId = req.headers['x-user-id'] as string;
      if (requestingUserId) {
        where.postedBy = requestingUserId;
        delete where.status; // Show all statuses for own jobs
      }
    } else if (postedBy) {
      where.postedBy = postedBy;
    }

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { company: { [Op.iLike]: `%${q}%` } }
      ];
    }
    if (type) where.type = type;
    if (location) where.location = { [Op.iLike]: `%${location}%` };
    if (skill) where.skills = { [Op.contains]: [skill] };

    const { count, rows: jobs } = await Job.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: jobs,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = await Job.findByPk(jobId);

    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    res.json({ success: true, data: { job } });
  } catch (error) {
    logger.error('Get job error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    if (!['alumni', 'admin', 'faculty'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { error, value } = createJobSchema.validate(req.body);

    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }

    const job = await Job.create({ ...value, postedBy: userId });
    res.status(201).json({ success: true, message: 'Job created successfully', data: { job } });
  } catch (error) {
    logger.error('Create job error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    if (job.postedBy !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    await job.update(req.body);
    res.json({ success: true, message: 'Job updated successfully', data: { job } });
  } catch (error) {
    logger.error('Update job error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    if (job.postedBy !== userId && userRole !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    await job.destroy();
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    logger.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const applyForJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { jobId } = req.params;

    const { error, value } = createApplicationSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }

    const job = await Job.findByPk(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    const resumeUrl = req.file ? `/uploads/resumes/${(req.file as any).filename}` : value.resumeUrl;

    const [application, created] = await Application.findOrCreate({
      where: { jobId, userId },
      defaults: { ...value, jobId, userId, resumeUrl }
    });

    if (!created) {
      res.status(409).json({ success: false, message: 'Already applied for this job' });
      return;
    }

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: { application } });
  } catch (error) {
    logger.error('Apply for job error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMyApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const applications = await Application.findAll({
      where: { userId },
      include: [{ model: Job, as: 'Job' }]
    });

    res.json({ success: true, data: { applications } });
  } catch (error) {
    logger.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { applicationId } = req.params;
    const { status } = req.body;

    const application = await Application.findByPk(applicationId, { include: [{ model: Job, as: 'Job' }] });
    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    // Verify the user owns the job
    if ((application as any).Job.postedBy !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    await application.update({ status });
    res.json({ success: true, message: 'Application status updated', data: { application } });
  } catch (error) {
    logger.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
