"use strict";
/**
 * Job Service — Business logic layer for jobs-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.applyForJob = exports.deleteJob = exports.updateJob = exports.createJob = exports.getMyApplications = exports.getJobById = exports.listJobs = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
// ─── Read ─────────────────────────────────────────────────────────────────────
const listJobs = async (filters) => {
    const { q, type, location, skill, postedBy, requestingUserId, page = 1, limit = 10 } = filters;
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const offset = (page - 1) * safeLimit;
    const where = { status: 'active' };
    if (postedBy === 'me' && requestingUserId) {
        where.postedBy = requestingUserId;
        delete where.status;
    }
    else if (postedBy) {
        where.postedBy = postedBy;
    }
    if (q) {
        where[sequelize_1.Op.or] = [
            { title: { [sequelize_1.Op.iLike]: `%${q}%` } },
            { description: { [sequelize_1.Op.iLike]: `%${q}%` } },
            { company: { [sequelize_1.Op.iLike]: `%${q}%` } }
        ];
    }
    if (type)
        where.type = type;
    if (location)
        where.location = { [sequelize_1.Op.iLike]: `%${location}%` };
    if (skill)
        where.skills = { [sequelize_1.Op.contains]: [skill] };
    const { count, rows } = await models_1.Job.findAndCountAll({
        where, order: [['createdAt', 'DESC']], limit: safeLimit, offset
    });
    return { jobs: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};
exports.listJobs = listJobs;
const getJobById = async (jobId) => {
    const job = await models_1.Job.findByPk(jobId);
    if (!job)
        throw Object.assign(new Error('Job not found'), { statusCode: 404 });
    return job;
};
exports.getJobById = getJobById;
const getMyApplications = async (userId) => {
    return models_1.Application.findAll({
        where: { userId },
        include: [{ model: models_1.Job, as: 'Job' }],
        order: [['createdAt', 'DESC']]
    });
};
exports.getMyApplications = getMyApplications;
// ─── Write ────────────────────────────────────────────────────────────────────
const createJob = async (userId, data) => {
    return models_1.Job.create({ ...data, postedBy: userId });
};
exports.createJob = createJob;
const updateJob = async (jobId, userId, data) => {
    const job = await models_1.Job.findByPk(jobId);
    if (!job)
        throw Object.assign(new Error('Job not found'), { statusCode: 404 });
    if (job.postedBy !== userId)
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    return job.update(data);
};
exports.updateJob = updateJob;
const deleteJob = async (jobId, userId, userRole) => {
    const job = await models_1.Job.findByPk(jobId);
    if (!job)
        throw Object.assign(new Error('Job not found'), { statusCode: 404 });
    if (job.postedBy !== userId && userRole !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    await job.destroy();
};
exports.deleteJob = deleteJob;
const applyForJob = async (jobId, userId, applicationData) => {
    const job = await models_1.Job.findByPk(jobId);
    if (!job)
        throw Object.assign(new Error('Job not found'), { statusCode: 404 });
    const [application, created] = await models_1.Application.findOrCreate({
        where: { jobId, userId },
        defaults: { ...applicationData, jobId, userId }
    });
    if (!created)
        throw Object.assign(new Error('Already applied for this job'), { statusCode: 409 });
    return application;
};
exports.applyForJob = applyForJob;
const updateApplicationStatus = async (applicationId, userId, status) => {
    const application = await models_1.Application.findByPk(applicationId, { include: [{ model: models_1.Job, as: 'Job' }] });
    if (!application)
        throw Object.assign(new Error('Application not found'), { statusCode: 404 });
    if (application.Job.postedBy !== userId) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    const appStatus = status;
    return application.update({ status: appStatus });
};
exports.updateApplicationStatus = updateApplicationStatus;
//# sourceMappingURL=jobService.js.map