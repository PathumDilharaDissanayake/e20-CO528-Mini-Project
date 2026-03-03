"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getMyApplications = exports.applyForJob = exports.deleteJob = exports.updateJob = exports.createJob = exports.getJob = exports.getJobs = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
const createJobSchema = joi_1.default.object({
    title: joi_1.default.string().min(3).max(200).required(),
    description: joi_1.default.string().min(10).required(),
    company: joi_1.default.string().min(2).max(200).required(),
    location: joi_1.default.string().min(2).max(200).required(),
    type: joi_1.default.string().valid('full-time', 'part-time', 'contract', 'internship', 'remote').required(),
    salary: joi_1.default.object({
        min: joi_1.default.number().min(0),
        max: joi_1.default.number().min(0),
        currency: joi_1.default.string().max(3),
        period: joi_1.default.string().valid('hourly', 'monthly', 'yearly')
    }),
    requirements: joi_1.default.array().items(joi_1.default.string()),
    skills: joi_1.default.array().items(joi_1.default.string()),
    expiresAt: joi_1.default.date().iso()
});
const createApplicationSchema = joi_1.default.object({
    resumeUrl: joi_1.default.string().uri().allow(''),
    coverLetter: joi_1.default.string().max(5000).allow(''),
    answers: joi_1.default.object()
});
const getJobs = async (req, res) => {
    try {
        const { q, type, location, skill, postedBy, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = { status: 'active' };
        if (postedBy === 'me') {
            const requestingUserId = req.headers['x-user-id'];
            if (requestingUserId) {
                where.postedBy = requestingUserId;
                delete where.status; // Show all statuses for own jobs
            }
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
        const { count, rows: jobs } = await models_1.Job.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        res.json({
            success: true,
            message: 'Jobs retrieved successfully',
            data: jobs,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get jobs error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getJobs = getJobs;
const getJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await models_1.Job.findByPk(jobId);
        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }
        res.json({ success: true, data: { job } });
    }
    catch (error) {
        logger_1.logger.error('Get job error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getJob = getJob;
const createJob = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { error, value } = createJobSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const job = await models_1.Job.create({ ...value, postedBy: userId });
        res.status(201).json({ success: true, message: 'Job created successfully', data: { job } });
    }
    catch (error) {
        logger_1.logger.error('Create job error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createJob = createJob;
const updateJob = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { jobId } = req.params;
        const job = await models_1.Job.findByPk(jobId);
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
    }
    catch (error) {
        logger_1.logger.error('Update job error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.updateJob = updateJob;
const deleteJob = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const { jobId } = req.params;
        const job = await models_1.Job.findByPk(jobId);
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
    }
    catch (error) {
        logger_1.logger.error('Delete job error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.deleteJob = deleteJob;
const applyForJob = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { jobId } = req.params;
        const { error, value } = createApplicationSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const job = await models_1.Job.findByPk(jobId);
        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }
        const [application, created] = await models_1.Application.findOrCreate({
            where: { jobId, userId },
            defaults: { ...value, jobId, userId }
        });
        if (!created) {
            res.status(409).json({ success: false, message: 'Already applied for this job' });
            return;
        }
        res.status(201).json({ success: true, message: 'Application submitted successfully', data: { application } });
    }
    catch (error) {
        logger_1.logger.error('Apply for job error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.applyForJob = applyForJob;
const getMyApplications = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const applications = await models_1.Application.findAll({
            where: { userId },
            include: [{ model: models_1.Job, as: 'Job' }]
        });
        res.json({ success: true, data: { applications } });
    }
    catch (error) {
        logger_1.logger.error('Get applications error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getMyApplications = getMyApplications;
const updateApplicationStatus = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { applicationId } = req.params;
        const { status } = req.body;
        const application = await models_1.Application.findByPk(applicationId, { include: [{ model: models_1.Job, as: 'Job' }] });
        if (!application) {
            res.status(404).json({ success: false, message: 'Application not found' });
            return;
        }
        // Verify the user owns the job
        if (application.Job.postedBy !== userId) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        await application.update({ status });
        res.json({ success: true, message: 'Application status updated', data: { application } });
    }
    catch (error) {
        logger_1.logger.error('Update application status error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
//# sourceMappingURL=jobController.js.map