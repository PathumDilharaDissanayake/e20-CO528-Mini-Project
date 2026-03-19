"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connectionController_1 = require("../controllers/connectionController");
const router = (0, express_1.Router)();
router.get('/', connectionController_1.getConnections);
router.get('/:userId/status', connectionController_1.getConnectionStatus);
router.post('/:userId/follow', connectionController_1.followUser);
router.delete('/:userId/unfollow', connectionController_1.unfollowUser);
exports.default = router;
//# sourceMappingURL=connectionRoutes.js.map