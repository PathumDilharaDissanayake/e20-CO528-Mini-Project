"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.get('/search', userController_1.searchUsers);
router.get('/', userController_1.getUsers);
router.get('/me', userController_1.getMyProfile);
router.get('/:userId', userController_1.getUserById);
router.put('/me', userController_1.updateProfile);
router.delete('/:userId', userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map