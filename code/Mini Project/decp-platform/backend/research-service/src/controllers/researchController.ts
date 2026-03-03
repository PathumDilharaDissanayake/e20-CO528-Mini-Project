import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResearchProject } from '../models';
import { logger } from '../utils/logger';
import Joi from 'joi';

const projectSchema = Joi.object({
  title: Joi.string().min(5).max(300).required(),
  abstract: Joi.string().min(10).required(),
  description: Joi.string().allow(''),
  status: Joi.string().valid('planning', 'active', 'completed', 'on_hold').default('planning'),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
  collaborators: Joi.array().items(Joi.string().uuid()),
  tags: Joi.array().items(Joi.string()),
  visibility: Joi.string().valid('public', 'private', 'department').default('department')
});

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, status, visibility, tag, leadResearcher, collaborator, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const requestingUserId = req.headers['x-user-id'] as string;

    const where: any = {};
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (tag) where.tags = { [Op.contains]: [tag] };
    if (leadResearcher === 'me') {
      if (requestingUserId) where.leadResearcherId = requestingUserId;
    } else if (leadResearcher) {
      where.leadResearcherId = leadResearcher;
    }
    if (collaborator === 'me') {
      if (requestingUserId) where.collaborators = { [Op.contains]: [requestingUserId] };
    } else if (collaborator) {
      where.collaborators = { [Op.contains]: [collaborator] };
    }
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { abstract: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { count, rows: projects } = await ResearchProject.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: projects,
      meta: { page: parseInt(page as string), limit: parseInt(limit as string), total: count, totalPages: Math.ceil(count / parseInt(limit as string)) }
    });
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const project = await ResearchProject.findByPk(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.json({ success: true, data: { project } });
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadResearcherId = req.headers['x-user-id'] as string;
    const { error, value } = projectSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }
    const project = await ResearchProject.create({ ...value, leadResearcherId });
    res.status(201).json({ success: true, message: 'Project created successfully', data: { project } });
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { projectId } = req.params;
    const project = await ResearchProject.findByPk(projectId);
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
  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { projectId } = req.params;
    const project = await ResearchProject.findByPk(projectId);
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
  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const addDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { projectId } = req.params;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!fileUrl) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const project = await ResearchProject.findByPk(projectId);
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
  } catch (error) {
    logger.error('Add document error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const collaborateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { projectId } = req.params;

    const project = await ResearchProject.findByPk(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const collaborators = new Set<string>(project.collaborators || []);
    collaborators.add(userId);

    await project.update({ collaborators: Array.from(collaborators) });

    res.json({
      success: true,
      message: 'Added as collaborator',
      data: { project }
    });
  } catch (error) {
    logger.error('Collaborate project error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const leaveProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { projectId } = req.params;

    const project = await ResearchProject.findByPk(projectId);
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
  } catch (error) {
    logger.error('Leave project error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { projectId, documentId } = req.params;

    const project = await ResearchProject.findByPk(projectId);
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
  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
