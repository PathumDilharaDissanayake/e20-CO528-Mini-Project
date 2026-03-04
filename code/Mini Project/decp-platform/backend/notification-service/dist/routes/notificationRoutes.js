"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
// Internal service-to-service endpoint (token auth handled by global internalAuthMiddleware)
router.post('/internal/notify', notificationController_1.internalCreateNotification);
router.get('/', notificationController_1.getNotifications);
router.post('/', notificationController_1.createNotification);
router.put('/read-all', notificationController_1.markAllAsRead);
router.put('/:notificationId/read', notificationController_1.markAsRead);
router.delete('/:notificationId', notificationController_1.deleteNotification);
router.post('/push/subscribe', notificationController_1.subscribePush);
router.post('/push/unsubscribe', notificationController_1.unsubscribePush);
exports.default = router;
