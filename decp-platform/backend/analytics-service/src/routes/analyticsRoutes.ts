import { Router } from 'express';
import {
  trackActivity,
  getDashboardMetrics,
  getUserActivity,
  getPopularContent
} from '../controllers/analyticsController';

const router = Router();

router.post('/track', trackActivity);
router.get('/dashboard', getDashboardMetrics);
router.get('/users/:userId/activity', getUserActivity);
router.get('/popular', getPopularContent);

export default router;
