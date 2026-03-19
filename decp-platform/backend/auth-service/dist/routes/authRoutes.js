"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const oauthController_1 = require("../controllers/oauthController");
const router = (0, express_1.Router)();
// Local auth routes
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/refresh', authController_1.refreshToken);
router.post('/logout', authController_1.logout);
router.post('/verify-email', authController_1.verifyEmail);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
router.get('/me', authController_1.getMe);
// OAuth routes
router.get('/google', oauthController_1.googleAuth);
router.get('/google/callback', ...oauthController_1.googleCallback);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map