import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResearchProject } from '../models';
import { ResearchProjectAttributes } from '../models/ResearchProject';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { sendNotification } from '../utils/notify';

const projectSchema = Joi.object({
  title: Joi.string().min(5).max(300).required(),
  abstract: Joi.string().min(10).optional(),
  description: Joi.string().allow('').optional(),
  status: Joi.string().valid('planning', 'active', 'completed', 'on_hold').default('planning'),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
  collaborators: Joi.array().items(Joi.string().uuid()),
  tags: Joi.array().items(Joi.string()),
  visibility: Joi.string().valid('public', 'private', 'department').default('department'),
  field: Joi.string().max(100).allow('').optional(),
  progress: Joi.number().integer().min(0).max(100).default(0),
  coverImage: Joi.string().max(500).allow('').optional(),
  funding: Joi.string().allow('').optional()
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
    // description is an alias for abstract
    if (!value.abstract && value.description) {
      value.abstract = value.description;
    }
    if (!value.abstract) {
      value.abstract = 'No abstract provided';
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

    // Explicitly extract and sanitize updatable fields to prevent mass-assignment
    const {
      title,
      abstract,
      description,  // frontend may send 'description' as alias for 'abstract'
      status,
      startDate,
      endDate,
      collaborators,
      tags,
      visibility,
      field,
      progress,
      coverImage,
    } = req.body;

    const updateData: Partial<ResearchProjectAttributes> = {};
    if (title !== undefined) updateData.title = title;
    // Map description → abstract (frontend uses 'description', model uses 'abstract')
    if (abstract !== undefined) updateData.abstract = abstract;
    else if (description !== undefined) updateData.abstract = description;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (collaborators !== undefined) updateData.collaborators = collaborators;
    if (tags !== undefined) updateData.tags = tags;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (field !== undefined) updateData.field = field;
    if (progress !== undefined) updateData.progress = progress;
    if (coverImage !== undefined) updateData.coverImage = coverImage;

    await project.update(updateData);
    // Reload so the response reflects the persisted values
    await project.reload();
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

    const collaboratorsSet = new Set<string>(project.collaborators || []);
    const wasAlreadyCollaborator = collaboratorsSet.has(userId);
    collaboratorsSet.add(userId);

    await project.update({ collaborators: Array.from(collaboratorsSet) });

    // Fire-and-forget: notify the lead researcher (only on new collaboration, not re-join)
    if (!wasAlreadyCollaborator && project.leadResearcherId !== userId) {
      const firstName = (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || '') as string;
      const lastName = (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || '') as string;
      const userName = `${firstName} ${lastName}`.trim() || 'Someone';
      sendNotification(
        project.leadResearcherId,
        'system',
        'New Collaboration Request',
        `${userName} wants to collaborate on "${project.title}"`,
        { projectId }
      );
    }

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
