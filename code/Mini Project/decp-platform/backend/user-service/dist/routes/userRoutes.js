"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.get('/search', userController_1.searchUsers);
router.get('/suggested', userController_1.getSuggestedUsers);
router.get('/', userController_1.getUsers);
router.get('/me', userController_1.getMyProfile);
router.put('/me', userController_1.updateProfile);
// Connection/follow routes — must be before /:userId to avoid param collision
router.get('/connections', userController_1.getConnections);
router.get('/connections/requests', userController_1.getConnectionRequests);
router.post('/connections/:userId/follow', userController_1.followUser);
router.delete('/connections/:userId/unfollow', userController_1.unfollowUser);
router.get('/connections/:userId/status', userController_1.getConnectionStatus);
router.put('/connections/:userId/accept', userController_1.acceptConnection);
router.delete('/connections/:userId/decline', userController_1.declineConnection);
router.post('/:userId/endorse', userController_1.endorseSkill);
router.get('/:userId', userController_1.getUserById);
router.delete('/:userId', userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map