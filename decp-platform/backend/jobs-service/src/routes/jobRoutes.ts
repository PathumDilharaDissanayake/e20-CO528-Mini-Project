import { Router } from 'express';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getMyApplications,
  updateApplicationStatus
} from '../controllers/jobController';

import { memoryUpload, saveFile } from '../middleware/upload';

const router = Router();

router.get('/', getJobs);
router.post('/', createJob);
router.get('/applications', getMyApplications);
router.get('/:jobId', getJob);
router.put('/:jobId', updateJob);
router.delete('/:jobId', deleteJob);
router.post('/:jobId/apply', memoryUpload.single('resume'), saveFile, applyForJob);
router.put('/applications/:applicationId/status', updateApplicationStatus);

export default router;
