import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  subscribePush,
  unsubscribePush,
  internalCreateNotification,
} from '../controllers/notificationController';

const router = Router();

// Internal service-to-service endpoint (token auth handled by global internalAuthMiddleware)
router.post('/internal/notify', internalCreateNotification);

router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/read-all', markAllAsRead);
router.put('/:notificationId/read', markAsRead);
router.delete('/:notificationId', deleteNotification);
router.post('/push/subscribe', subscribePush);
router.post('/push/unsubscribe', unsubscribePush);

export default router;
