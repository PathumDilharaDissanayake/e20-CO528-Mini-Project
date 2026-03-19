import { Router } from 'express';
import {
  getConnections,
  followUser,
  unfollowUser,
  getConnectionStatus
} from '../controllers/connectionController';

const router = Router();

router.get('/', getConnections);
router.get('/:userId/status', getConnectionStatus);
router.post('/:userId/follow', followUser);
router.delete('/:userId/unfollow', unfollowUser);

export default router;
