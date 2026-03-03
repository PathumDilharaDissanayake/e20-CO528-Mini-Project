import { Router } from 'express';
import {
  getUsers,
  getUserById,
  getMyProfile,
  updateProfile,
  deleteUser,
  searchUsers
} from '../controllers/userController';

const router = Router();

router.get('/search', searchUsers);
router.get('/', getUsers);
router.get('/me', getMyProfile);
router.get('/:userId', getUserById);
router.put('/me', updateProfile);
router.delete('/:userId', deleteUser);

export default router;
