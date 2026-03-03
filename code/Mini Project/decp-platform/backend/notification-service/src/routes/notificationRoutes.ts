import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  subscribePush,
  unsubscribePush
} from '../controllers/notificationController';

const router = Router();

router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/read-all', markAllAsRead);
router.put('/:notificationId/read', markAsRead);
router.post('/push/subscribe', subscribePush);
router.post('/push/unsubscribe', unsubscribePush);

export default router;
