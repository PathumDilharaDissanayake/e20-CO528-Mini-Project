/**
 * Auth Service — Business logic layer for auth-service.
 * Extracted from authController.ts for testability and SRP compliance.
 *
 * Agent: A-06 (Backend Implementation Agent)
 * Date: 2026-03-03
 */

import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database';
import { User, RefreshToken } from '../models';
import { generateTokens, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  graduationYear?: number;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
    profilePicture?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const REFRESH_TOKEN_TTL_DAYS = 7;

const createRefreshTokenExpiry = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return d;
};

const toAuthResult = (
  user: User,
  tokens: ReturnType<typeof generateTokens>
): AuthResult => ({
  user: {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    profilePicture: user.profilePicture
  },
  ...tokens
});

// ─────────────────────────────────────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────────────────────────────────────

export const register = async (input: RegisterInput): Promise<AuthResult> => {
  const { email, password, firstName, lastName, role, department, graduationYear } = input;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw Object.assign(new Error('User with this email already exists'), { statusCode: 409 });

  const verificationToken = uuidv4();
  const t = await sequelize.transaction();

  let user: User;
  let tokens: ReturnType<typeof generateTokens>;

  try {
    user = await User.create(
      { email, password, firstName, lastName, role, department, graduationYear, isEmailVerified: false, emailVerificationToken: verificationToken },
      { transaction: t }
    );

    tokens = generateTokens({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });

    await RefreshToken.create(
      { token: tokens.refreshToken, userId: user.id, expiresAt: createRefreshTokenExpiry() },
      { transaction: t }
    );

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  // Non-critical — email send outside transaction
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (err) {
    logger.error('Failed to send verification email', { email, error: err });
  }

  logger.info('User registered', { userId: user!.id, email });
  return toAuthResult(user!, tokens!);
};

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const user = await User.findOne({ where: { email, isActive: true } });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const valid = await user.comparePassword(password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const t = await sequelize.transaction();
  let tokens: ReturnType<typeof generateTokens>;

  try {
    user.lastLogin = new Date();
    await user.save({ transaction: t });
    tokens = generateTokens({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
    await RefreshToken.create({ token: tokens.refreshToken, userId: user.id, expiresAt: createRefreshTokenExpiry() }, { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  logger.info('User logged in', { userId: user.id });
  return toAuthResult(user, tokens!);
};

// ─────────────────────────────────────────────────────────────────────────────
// Token refresh
// ─────────────────────────────────────────────────────────────────────────────

export const refreshTokens = async (token: string): Promise<Omit<AuthResult, 'user'>> => {
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  }

  const storedToken = await RefreshToken.findOne({ where: { token, userId: payload.userId, isRevoked: false } });
  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token expired or revoked'), { statusCode: 401 });
  }

  const user = await User.findByPk(payload.userId, { attributes: ['id', 'email', 'role', 'firstName', 'lastName', 'isActive'] });
  if (!user || !user.isActive) {
    throw Object.assign(new Error('User account is inactive'), { statusCode: 401 });
  }

  const t = await sequelize.transaction();
  let tokens: ReturnType<typeof generateTokens>;

  try {
    await storedToken.update({ isRevoked: true }, { transaction: t });
    tokens = generateTokens({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
    await RefreshToken.create({ token: tokens.refreshToken, userId: user.id, expiresAt: createRefreshTokenExpiry() }, { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  return tokens!;
};

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────

export const logout = async (token?: string): Promise<void> => {
  if (token) {
    await RefreshToken.update({ isRevoked: true }, { where: { token } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Email verification
// ─────────────────────────────────────────────────────────────────────────────

export const verifyEmail = async (token: string): Promise<void> => {
  const user = await User.findOne({ where: { emailVerificationToken: token, isEmailVerified: false } });
  if (!user) throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 });
  await user.update({ isEmailVerified: true, emailVerificationToken: null } as any);
  logger.info('Email verified', { userId: user.id });
};

// ─────────────────────────────────────────────────────────────────────────────
// Password reset
// ─────────────────────────────────────────────────────────────────────────────

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ where: { email, isActive: true } });
  if (!user) return; // Security: don't reveal if user exists

  const resetToken = uuidv4();
  const resetExpires = new Date();
  resetExpires.setHours(resetExpires.getHours() + 1);

  await user.update({ passwordResetToken: resetToken, passwordResetExpires: resetExpires });

  try {
    await sendPasswordResetEmail(email, resetToken);
  } catch (err) {
    logger.error('Failed to send password reset email', { email, error: err });
  }

  logger.info('Password reset requested', { email });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const user = await User.findOne({
    where: { passwordResetToken: token, passwordResetExpires: { [Op.gt]: new Date() } }
  });
  if (!user) throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });

  await user.update({ password: newPassword, passwordResetToken: null, passwordResetExpires: null } as any);
  await RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });

  logger.info('Password reset completed', { userId: user.id });
};
