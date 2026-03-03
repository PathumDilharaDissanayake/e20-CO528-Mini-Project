"use strict";
/**
 * Research Service — Business logic layer for research-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveProject = exports.joinAsCollaborator = exports.deleteDocument = exports.addDocument = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.listProjects = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
// ─── Read ─────────────────────────────────────────────────────────────────────
const listProjects = async (filters) => {
    const { q, status, visibility, tag, leadResearcher, collaborator, requestingUserId, page = 1, limit = 10 } = filters;
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const offset = (page - 1) * safeLimit;
    const where = {};
    if (status)
        where.status = status;
    if (visibility)
        where.visibility = visibility;
    if (tag)
        where.tags = { [sequelize_1.Op.contains]: [tag] };
    if (leadResearcher === 'me' && requestingUserId) {
        where.leadResearcherId = requestingUserId;
    }
    else if (leadResearcher) {
        where.leadResearcherId = leadResearcher;
    }
    if (collaborator === 'me' && requestingUserId) {
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
    const { count, rows } = await models_1.ResearchProject.findAndCountAll({
        where, order: [['createdAt', 'DESC']], limit: safeLimit, offset
    });
    return { projects: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};
exports.listProjects = listProjects;
const getProjectById = async (projectId) => {
    const project = await models_1.ResearchProject.findByPk(projectId);
    if (!project)
        throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    return project;
};
exports.getProjectById = getProjectById;
// ─── Write ────────────────────────────────────────────────────────────────────
const createProject = async (leadResearcherId, data) => {
    return models_1.ResearchProject.create({ ...data, leadResearcherId });
};
exports.createProject = createProject;
const updateProject = async (projectId, userId, data) => {
    const project = await models_1.ResearchProject.findByPk(projectId);
    if (!project)
        throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    if (project.leadResearcherId !== userId && !project.collaborators?.includes(userId)) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    return project.update(data);
};
exports.updateProject = updateProject;
const deleteProject = async (projectId, userId, userRole) => {
    const project = await models_1.ResearchProject.findByPk(projectId);
    if (!project)
        throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    if (project.leadResearcherId !== userId && userRole !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    await project.destroy();
};
exports.deleteProject = deleteProject;
const addDocument = async (projectId, userId, fileUrl) => {
    const project = await models_1.ResearchProject.findByPk(projectId);
    if (!project)
        throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    if (project.leadResearcherId !== userId && !project.collaborators?.includes(userId)) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    const documents = [...(project.documents || []), fileUrl];
    await project.update({ documents });
    return documents;
};
exports.addDocument = addDocument;
const deleteDocument = async (projectId, userId, documentId) => {
    const project = await models_1.ResearchProject.findByPk(projectId);
    if (!project)
        throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    if (project.leadResearcherId !== userId && !project.collaborators?.includes(userId)) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    const documents = (project.documents || []).filter((doc) => !doc.includes(documentId));
    await project.update({ documents });
    return documents;
};
exports.deleteDocument = deleteDocument;
const joinAsCollaborator = async (projectId, userId) => {
    const project = await models_1.ResearchProject.findByPk(projectId);
    if (!project)
        throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    const collaborators = new Set(project.collaborators || []);
    collaborators.add(userId);
    return project.update({ collaborators: Array.from(collaborators) });
};
exports.joinAsCollaborator = joinAsCollaborator;
const leaveProject = async (projectId, userId) => {
    const project = await models_1.ResearchProject.findByPk(projectId);
    if (!project)
        throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    if (project.leadResearcherId === userId) {
        throw Object.assign(new Error('Lead researcher cannot leave the project'), { statusCode: 400 });
    }
    const collaborators = (project.collaborators || []).filter((id) => id !== userId);
    return project.update({ collaborators });
};
exports.leaveProject = leaveProject;
