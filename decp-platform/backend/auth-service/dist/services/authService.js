"use strict";
/**
 * Auth Service — Business logic layer for auth-service.
 * Extracted from authController.ts for testability and SRP compliance.
 *
 * Agent: A-06 (Backend Implementation Agent)
 * Date: 2026-03-03
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.logout = exports.refreshTokens = exports.login = exports.register = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const logger_1 = require("../utils/logger");
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const REFRESH_TOKEN_TTL_DAYS = 7;
const createRefreshTokenExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + REFRESH_TOKEN_TTL_DAYS);
    return d;
};
const toAuthResult = (user, tokens) => ({
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
const register = async (input) => {
    const { email, password, firstName, lastName, role, department, graduationYear } = input;
    const existing = await models_1.User.findOne({ where: { email } });
    if (existing)
        throw Object.assign(new Error('User with this email already exists'), { statusCode: 409 });
    const verificationToken = (0, uuid_1.v4)();
    const t = await database_1.default.transaction();
    let user;
    let tokens;
    try {
        user = await models_1.User.create({ email, password, firstName, lastName, role, department, graduationYear, isEmailVerified: false, emailVerificationToken: verificationToken }, { transaction: t });
        tokens = (0, jwt_1.generateTokens)({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
        await models_1.RefreshToken.create({ token: tokens.refreshToken, userId: user.id, expiresAt: createRefreshTokenExpiry() }, { transaction: t });
        await t.commit();
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
    // Non-critical — email send outside transaction
    try {
        await (0, email_1.sendVerificationEmail)(email, verificationToken);
    }
    catch (err) {
        logger_1.logger.error('Failed to send verification email', { email, error: err });
    }
    logger_1.logger.info('User registered', { userId: user.id, email });
    return toAuthResult(user, tokens);
};
exports.register = register;
// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────
const login = async (email, password) => {
    const user = await models_1.User.findOne({ where: { email, isActive: true } });
    if (!user)
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    const valid = await user.comparePassword(password);
    if (!valid)
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    const t = await database_1.default.transaction();
    let tokens;
    try {
        user.lastLogin = new Date();
        await user.save({ transaction: t });
        tokens = (0, jwt_1.generateTokens)({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
        await models_1.RefreshToken.create({ token: tokens.refreshToken, userId: user.id, expiresAt: createRefreshTokenExpiry() }, { transaction: t });
        await t.commit();
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
    logger_1.logger.info('User logged in', { userId: user.id });
    return toAuthResult(user, tokens);
};
exports.login = login;
// ─────────────────────────────────────────────────────────────────────────────
// Token refresh
// ─────────────────────────────────────────────────────────────────────────────
const refreshTokens = async (token) => {
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }
    const storedToken = await models_1.RefreshToken.findOne({ where: { token, userId: payload.userId, isRevoked: false } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
        throw Object.assign(new Error('Refresh token expired or revoked'), { statusCode: 401 });
    }
    const user = await models_1.User.findByPk(payload.userId, { attributes: ['id', 'email', 'role', 'firstName', 'lastName', 'isActive'] });
    if (!user || !user.isActive) {
        throw Object.assign(new Error('User account is inactive'), { statusCode: 401 });
    }
    const t = await database_1.default.transaction();
    let tokens;
    try {
        await storedToken.update({ isRevoked: true }, { transaction: t });
        tokens = (0, jwt_1.generateTokens)({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
        await models_1.RefreshToken.create({ token: tokens.refreshToken, userId: user.id, expiresAt: createRefreshTokenExpiry() }, { transaction: t });
        await t.commit();
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
    return tokens;
};
exports.refreshTokens = refreshTokens;
// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (token) => {
    if (token) {
        await models_1.RefreshToken.update({ isRevoked: true }, { where: { token } });
    }
};
exports.logout = logout;
// ─────────────────────────────────────────────────────────────────────────────
// Email verification
// ─────────────────────────────────────────────────────────────────────────────
const verifyEmail = async (token) => {
    const user = await models_1.User.findOne({ where: { emailVerificationToken: token, isEmailVerified: false } });
    if (!user)
        throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 });
    await user.update({ isEmailVerified: true, emailVerificationToken: null });
    logger_1.logger.info('Email verified', { userId: user.id });
};
exports.verifyEmail = verifyEmail;
// ─────────────────────────────────────────────────────────────────────────────
// Password reset
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
    const user = await models_1.User.findOne({ where: { email, isActive: true } });
    if (!user)
        return; // Security: don't reveal if user exists
    const resetToken = (0, uuid_1.v4)();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);
    await user.update({ passwordResetToken: resetToken, passwordResetExpires: resetExpires });
    try {
        await (0, email_1.sendPasswordResetEmail)(email, resetToken);
    }
    catch (err) {
        logger_1.logger.error('Failed to send password reset email', { email, error: err });
    }
    logger_1.logger.info('Password reset requested', { email });
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (token, newPassword) => {
    const user = await models_1.User.findOne({
        where: { passwordResetToken: token, passwordResetExpires: { [sequelize_1.Op.gt]: new Date() } }
    });
    if (!user)
        throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
    await user.update({ password: newPassword, passwordResetToken: null, passwordResetExpires: null });
    await models_1.RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });
    logger_1.logger.info('Password reset completed', { userId: user.id });
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authService.js.map