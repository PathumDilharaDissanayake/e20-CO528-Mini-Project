import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import path from 'path';
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

const router = Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename: (req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:projectId', getProject);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);
router.post('/:projectId/collaborate', collaborateProject);
router.delete('/:projectId/collaborate', leaveProject);
router.post('/:projectId/documents', upload.single('document'), addDocument);
router.delete('/:projectId/documents/:documentId', deleteDocument);

export default router;
