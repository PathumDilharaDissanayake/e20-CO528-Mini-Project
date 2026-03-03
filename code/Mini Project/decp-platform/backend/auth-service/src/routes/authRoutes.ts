import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe
} from '../controllers/authController';
import { googleAuth, googleCallback } from '../controllers/oauthController';

const router = Router();

// Local auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', getMe);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', ...googleCallback);

export default router;
