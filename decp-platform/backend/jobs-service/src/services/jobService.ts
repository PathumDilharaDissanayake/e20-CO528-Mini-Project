/**
 * Job Service — Business logic layer for jobs-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */

import { Op } from 'sequelize';
import { Job, Application } from '../models';

export interface JobFilters {
  q?: string;
  type?: string;
  location?: string;
  skill?: string;
  postedBy?: string;
  requestingUserId?: string;
  page?: number;
  limit?: number;
}

export interface JobInput {
  title: string;
  description: string;
  company: string;
  location: string;
  type: string;
  salary?: object;
  requirements?: string[];
  skills?: string[];
  expiresAt?: Date;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const listJobs = async (filters: JobFilters) => {
  const { q, type, location, skill, postedBy, requestingUserId, page = 1, limit = 10 } = filters;
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const offset = (page - 1) * safeLimit;

  const where: Record<string, unknown> = { status: 'active' };
  if (postedBy === 'me' && requestingUserId) {
    where.postedBy = requestingUserId;
    delete where.status;
  } else if (postedBy) {
    where.postedBy = postedBy;
  }
  if (q) {
    (where as any)[Op.or] = [
      { title:       { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } },
      { company:     { [Op.iLike]: `%${q}%` } }
    ];
  }
  if (type)     where.type     = type;
  if (location) where.location = { [Op.iLike]: `%${location}%` };
  if (skill)    where.skills   = { [Op.contains]: [skill] };

  const { count, rows } = await Job.findAndCountAll({
    where, order: [['createdAt', 'DESC']], limit: safeLimit, offset
  });
  return { jobs: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};

export const getJobById = async (jobId: string): Promise<Job> => {
  const job = await Job.findByPk(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  return job;
};

export const getMyApplications = async (userId: string) => {
  return Application.findAll({
    where: { userId },
    include: [{ model: Job, as: 'Job' }],
    order: [['createdAt', 'DESC']]
  });
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const createJob = async (userId: string, data: JobInput): Promise<Job> => {
  return Job.create({ ...data, postedBy: userId } as any);
};

export const updateJob = async (jobId: string, userId: string, data: Partial<JobInput>): Promise<Job> => {
  const job = await Job.findByPk(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (job.postedBy !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  return job.update(data as any);
};

export const deleteJob = async (jobId: string, userId: string, userRole: string): Promise<void> => {
  const job = await Job.findByPk(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (job.postedBy !== userId && userRole !== 'admin') {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  await job.destroy();
};

export const applyForJob = async (
  jobId: string,
  userId: string,
  applicationData: { resumeUrl?: string; coverLetter?: string; answers?: object }
): Promise<Application> => {
  const job = await Job.findByPk(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

  const [application, created] = await Application.findOrCreate({
    where: { jobId, userId },
    defaults: { ...applicationData, jobId, userId } as any
  });
  if (!created) throw Object.assign(new Error('Already applied for this job'), { statusCode: 409 });
  return application;
};

export const updateApplicationStatus = async (
  applicationId: string,
  userId: string,
  status: string
): Promise<Application> => {
  const application = await Application.findByPk(applicationId, { include: [{ model: Job, as: 'Job' }] });
  if (!application) throw Object.assign(new Error('Application not found'), { statusCode: 404 });
  if ((application as any).Job.postedBy !== userId) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  const appStatus = status as 'pending' | 'reviewing' | 'interview' | 'offered' | 'rejected' | 'withdrawn';
  return application.update({ status: appStatus });
};
