import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addDocument,
  collaborateProject,
  leaveProject,
  deleteDocument
} from '../controllers/researchController';
import { memoryUpload, validateAndSaveFile } from '../middleware/uploadValidator';

const router = Router();

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:projectId', getProject);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);
router.post('/:projectId/collaborate', collaborateProject);
router.delete('/:projectId/collaborate', leaveProject);
router.post('/:projectId/documents', memoryUpload.single('document'), validateAndSaveFile, addDocument);
router.delete('/:projectId/documents/:documentId', deleteDocument);

export default router;
