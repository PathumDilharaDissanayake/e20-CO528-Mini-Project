import { Router } from 'express';
import {
  getUsers,
  getUserById,
  getMyProfile,
  updateProfile,
  deleteUser,
  searchUsers,
  followUser,
  unfollowUser,
  getConnectionStatus,
  acceptConnection,
  declineConnection,
  getConnectionRequests,
  getConnections,
  endorseSkill
} from '../controllers/userController';

const router = Router();

router.get('/search', searchUsers);
router.get('/', getUsers);
router.get('/me', getMyProfile);
router.put('/me', updateProfile);
// Connection/follow routes — must be before /:userId to avoid param collision
router.get('/connections', getConnections);
router.get('/connections/requests', getConnectionRequests);
router.post('/connections/:userId/follow', followUser);
router.delete('/connections/:userId/unfollow', unfollowUser);
router.get('/connections/:userId/status', getConnectionStatus);
router.put('/connections/:userId/accept', acceptConnection);
router.delete('/connections/:userId/decline', declineConnection);
router.post('/:userId/endorse', endorseSkill);
router.get('/:userId', getUserById);
router.delete('/:userId', deleteUser);

export default router;
