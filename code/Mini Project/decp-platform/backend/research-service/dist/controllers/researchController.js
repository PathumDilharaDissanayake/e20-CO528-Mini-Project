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
const notify_1 = require("../utils/notify");
const projectSchema = joi_1.default.object({
    title: joi_1.default.string().min(5).max(300).required(),
    abstract: joi_1.default.string().min(10).optional(),
    description: joi_1.default.string().allow('').optional(),
    status: joi_1.default.string().valid('planning', 'active', 'completed', 'on_hold').default('planning'),
    startDate: joi_1.default.date().iso().allow(null),
    endDate: joi_1.default.date().iso().allow(null),
    collaborators: joi_1.default.array().items(joi_1.default.string().uuid()),
    tags: joi_1.default.array().items(joi_1.default.string()),
    visibility: joi_1.default.string().valid('public', 'private', 'department').default('department'),
    field: joi_1.default.string().max(100).allow('').optional(),
    progress: joi_1.default.number().integer().min(0).max(100).default(0),
    coverImage: joi_1.default.string().max(500).allow('').optional(),
    funding: joi_1.default.string().allow('').optional()
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
        // description is an alias for abstract
        if (!value.abstract && value.description) {
            value.abstract = value.description;
        }
        if (!value.abstract) {
            value.abstract = 'No abstract provided';
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
        // Explicitly extract and sanitize updatable fields to prevent mass-assignment
        const { title, abstract, description, // frontend may send 'description' as alias for 'abstract'
        status, startDate, endDate, collaborators, tags, visibility, field, progress, coverImage, } = req.body;
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        // Map description → abstract (frontend uses 'description', model uses 'abstract')
        if (abstract !== undefined)
            updateData.abstract = abstract;
        else if (description !== undefined)
            updateData.abstract = description;
        if (status !== undefined)
            updateData.status = status;
        if (startDate !== undefined)
            updateData.startDate = startDate;
        if (endDate !== undefined)
            updateData.endDate = endDate;
        if (collaborators !== undefined)
            updateData.collaborators = collaborators;
        if (tags !== undefined)
            updateData.tags = tags;
        if (visibility !== undefined)
            updateData.visibility = visibility;
        if (field !== undefined)
            updateData.field = field;
        if (progress !== undefined)
            updateData.progress = progress;
        if (coverImage !== undefined)
            updateData.coverImage = coverImage;
        await project.update(updateData);
        // Reload so the response reflects the persisted values
        await project.reload();
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
        const collaboratorsSet = new Set(project.collaborators || []);
        const wasAlreadyCollaborator = collaboratorsSet.has(userId);
        collaboratorsSet.add(userId);
        await project.update({ collaborators: Array.from(collaboratorsSet) });
        // Fire-and-forget: notify the lead researcher (only on new collaboration, not re-join)
        if (!wasAlreadyCollaborator && project.leadResearcherId !== userId) {
            const firstName = (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || '');
            const lastName = (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || '');
            const userName = `${firstName} ${lastName}`.trim() || 'Someone';
            (0, notify_1.sendNotification)(project.leadResearcherId, 'system', 'New Collaboration Request', `${userName} wants to collaborate on "${project.title}"`, { projectId });
        }
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
