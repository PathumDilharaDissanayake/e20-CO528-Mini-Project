"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.leaveProject = exports.collaborateProject = exports.addDocument = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProject = exports.getProjects = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
const projectSchema = joi_1.default.object({
    title: joi_1.default.string().min(5).max(300).required(),
    abstract: joi_1.default.string().min(10).required(),
    description: joi_1.default.string().allow(''),
    status: joi_1.default.string().valid('planning', 'active', 'completed', 'on_hold').default('planning'),
    startDate: joi_1.default.date().iso().allow(null),
    endDate: joi_1.default.date().iso().allow(null),
    collaborators: joi_1.default.array().items(joi_1.default.string().uuid()),
    tags: joi_1.default.array().items(joi_1.default.string()),
    visibility: joi_1.default.string().valid('public', 'private', 'department').default('department')
});
const getProjects = async (req, res) => {
    try {
        const { q, status, visibility, tag, leadResearcher, collaborator, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const requestingUserId = req.headers['x-user-id'];
        const where = {};
        if (status)
            where.status = status;
        if (visibility)
            where.visibility = visibility;
        if (tag)
            where.tags = { [sequelize_1.Op.contains]: [tag] };
        if (leadResearcher === 'me') {
            if (requestingUserId)
                where.leadResearcherId = requestingUserId;
        }
        else if (leadResearcher) {
            where.leadResearcherId = leadResearcher;
        }
        if (collaborator === 'me') {
            if (requestingUserId)
                where.collaborators = { [sequelize_1.Op.contains]: [requestingUserId] };
        }
        else if (collaborator) {
            where.collaborators = { [sequelize_1.Op.contains]: [collaborator] };
        }
        if (q) {
            where[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${q}%` } },
                { abstract: { [sequelize_1.Op.iLike]: `%${q}%` } }
            ];
        }
        const { count, rows: projects } = await models_1.ResearchProject.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        res.json({
            success: true,
            data: projects,
            meta: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)) }
        });
    }
    catch (error) {
        logger_1.logger.error('Get projects error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getProjects = getProjects;
const getProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await models_1.ResearchProject.findByPk(projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        res.json({ success: true, data: { project } });
    }
    catch (error) {
        logger_1.logger.error('Get project error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getProject = getProject;
const createProject = async (req, res) => {
    try {
        const leadResearcherId = req.headers['x-user-id'];
        const { error, value } = projectSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const project = await models_1.ResearchProject.create({ ...value, leadResearcherId });
        res.status(201).json({ success: true, message: 'Project created successfully', data: { project } });
    }
    catch (error) {
        logger_1.logger.error('Create project error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createProject = createProject;
const updateProject = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { projectId } = req.params;
        const project = await models_1.ResearchProject.findByPk(projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        if (project.leadResearcherId !== userId && !project.collaborators?.includes(userId)) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        await project.update(req.body);
        res.json({ success: true, message: 'Project updated successfully', data: { project } });
    }
    catch (error) {
        logger_1.logger.error('Update project error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const { projectId } = req.params;
        const project = await models_1.ResearchProject.findByPk(projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        if (project.leadResearcherId !== userId && userRole !== 'admin') {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        await project.destroy();
        res.json({ success: true, message: 'Project deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Delete project error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.deleteProject = deleteProject;
const addDocument = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { projectId } = req.params;
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
        if (!fileUrl) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }
        const project = await models_1.ResearchProject.findByPk(projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        if (project.leadResearcherId !== userId && !project.collaborators?.includes(userId)) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const documents = [...(project.documents || []), fileUrl];
        await project.update({ documents });
        res.json({ success: true, message: 'Document added successfully', data: { documents } });
    }
    catch (error) {
        logger_1.logger.error('Add document error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.addDocument = addDocument;
const collaborateProject = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { projectId } = req.params;
        const project = await models_1.ResearchProject.findByPk(projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        const collaborators = new Set(project.collaborators || []);
        collaborators.add(userId);
        await project.update({ collaborators: Array.from(collaborators) });
        res.json({
            success: true,
            message: 'Added as collaborator',
            data: { project }
        });
    }
    catch (error) {
        logger_1.logger.error('Collaborate project error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.collaborateProject = collaborateProject;
const leaveProject = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { projectId } = req.params;
        const project = await models_1.ResearchProject.findByPk(projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        if (project.leadResearcherId === userId) {
            res.status(400).json({ success: false, message: 'Lead researcher cannot leave the project' });
            return;
        }
        const collaborators = (project.collaborators || []).filter((id) => id !== userId);
        await project.update({ collaborators });
        res.json({
            success: true,
            message: 'Removed from collaborators',
            data: { project }
        });
    }
    catch (error) {
        logger_1.logger.error('Leave project error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.leaveProject = leaveProject;
const deleteDocument = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { projectId, documentId } = req.params;
        const project = await models_1.ResearchProject.findByPk(projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        if (project.leadResearcherId !== userId && !project.collaborators?.includes(userId)) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const documents = (project.documents || []).filter((doc) => !doc.includes(documentId));
        await project.update({ documents });
        res.json({
            success: true,
            message: 'Document deleted successfully',
            data: { documents }
        });
    }
    catch (error) {
        logger_1.logger.error('Delete document error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.deleteDocument = deleteDocument;
