/**
 * Research Service — Business logic layer for research-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */

import { Op } from 'sequelize';
import { ResearchProject } from '../models';

export interface ProjectFilters {
  q?: string;
  status?: string;
  visibility?: string;
  tag?: string;
  leadResearcher?: string;
  collaborator?: string;
  requestingUserId?: string;
  page?: number;
  limit?: number;
}

export interface ProjectInput {
  title: string;
  abstract: string;
  description?: string;
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  collaborators?: string[];
  tags?: string[];
  visibility?: string;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const listProjects = async (filters: ProjectFilters) => {
  const { q, status, visibility, tag, leadResearcher, collaborator, requestingUserId, page = 1, limit = 10 } = filters;
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const offset = (page - 1) * safeLimit;

  const where: Record<string, unknown> = {};
  if (status)     where.status     = status;
  if (visibility) where.visibility = visibility;
  if (tag)        where.tags       = { [Op.contains]: [tag] };

  if (leadResearcher === 'me' && requestingUserId) {
    where.leadResearcherId = requestingUserId;
  } else if (leadResearcher) {
    where.leadResearcherId = leadResearcher;
  }

  if (collaborator === 'me' && requestingUserId) {
    where.collaborators = { [Op.contains]: [requestingUserId] };
  } else if (collaborator) {
    where.collaborators = { [Op.contains]: [collaborator] };
  }

  if (q) {
    (where as any)[Op.or] = [
      { title:    { [Op.iLike]: `%${q}%` } },
      { abstract: { [Op.iLike]: `%${q}%` } }
    ];
  }

  const { count, rows } = await ResearchProject.findAndCountAll({
    where, order: [['createdAt', 'DESC']], limit: safeLimit, offset
  });
  return { projects: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};

export const getProjectById = async (projectId: string): Promise<ResearchProject> => {
  const project = await ResearchProject.findByPk(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  return project;
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const createProject = async (leadResearcherId: string, data: ProjectInput): Promise<ResearchProject> => {
  return ResearchProject.create({ ...data, leadResearcherId } as any);
};

export const updateProject = async (
  projectId: string,
  userId: string,
  data: Partial<ProjectInput>
): Promise<ResearchProject> => {
  const project = await ResearchProject.findByPk(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  if (project.leadResearcherId !== userId && !project.collaborators?.includes(userId)) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  return project.update(data as any);
};

export const deleteProject = async (projectId: string, userId: string, userRole: string): Promise<void> => {
  const project = await ResearchProject.findByPk(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  if (project.leadResearcherId !== userId && userRole !== 'admin') {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  await project.destroy();
};

export const addDocument = async (projectId: string, userId: string, fileUrl: string): Promise<string[]> => {
  const project = await ResearchProject.findByPk(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  if (project.leadResearcherId !== userId && !project.collaborators?.includes(userId)) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  const documents = [...(project.documents || []), fileUrl];
  await project.update({ documents });
  return documents;
};

export const deleteDocument = async (projectId: string, userId: string, documentId: string): Promise<string[]> => {
  const project = await ResearchProject.findByPk(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  if (project.leadResearcherId !== userId && !project.collaborators?.includes(userId)) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  const documents = (project.documents || []).filter((doc) => !doc.includes(documentId));
  await project.update({ documents });
  return documents;
};

export const joinAsCollaborator = async (projectId: string, userId: string): Promise<ResearchProject> => {
  const project = await ResearchProject.findByPk(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  const collaborators = new Set<string>(project.collaborators || []);
  collaborators.add(userId);
  return project.update({ collaborators: Array.from(collaborators) });
};

export const leaveProject = async (projectId: string, userId: string): Promise<ResearchProject> => {
  const project = await ResearchProject.findByPk(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  if (project.leadResearcherId === userId) {
    throw Object.assign(new Error('Lead researcher cannot leave the project'), { statusCode: 400 });
  }
  const collaborators = (project.collaborators || []).filter((id) => id !== userId);
  return project.update({ collaborators });
};
