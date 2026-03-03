import { Router } from 'express';
import userRoutes from './userRoutes';
import connectionRoutes from './connectionRoutes';

const router = Router();

router.use('/', userRoutes);
router.use('/connections', connectionRoutes);

export default router;
