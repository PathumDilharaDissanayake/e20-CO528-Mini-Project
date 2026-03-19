"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
const register = async (req, res) => {
    try {
        const { error, value } = validation_1.registerSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
            return;
        }
        const { email, password, firstName, lastName, role, department, graduationYear } = value;
        // Check if user exists
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
            return;
        }
        // Generate verification token
        const verificationToken = (0, uuid_1.v4)();
        // Wrap user creation + refresh token in a transaction (FLAW-012 fix)
        const t = await database_1.default.transaction();
        let user;
        let tokens;
        try {
            const userData = {
                email,
                password,
                firstName,
                lastName,
                role,
                isEmailVerified: false,
                emailVerificationToken: verificationToken
            };
            if (department)
                userData.department = department;
            if (graduationYear)
                userData.graduationYear = graduationYear;
            user = await models_1.User.create(userData, { transaction: t });
            tokens = (0, jwt_1.generateTokens)({
                userId: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            });
            const refreshTokenExpiry = new Date();
            refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
            await models_1.RefreshToken.create({
                token: tokens.refreshToken,
                userId: user.id,
                expiresAt: refreshTokenExpiry
            }, { transaction: t });
            await t.commit();
        }
        catch (txError) {
            await t.rollback();
            throw txError;
        }
        // Send verification email outside transaction (non-critical path)
        try {
            await (0, email_1.sendVerificationEmail)(email, verificationToken);
        }
        catch (emailError) {
            logger_1.logger.error('Failed to send verification email:', emailError);
        }
        logger_1.logger.info(`User registered: ${email}`);
        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified
                },
                ...tokens
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { error, value } = validation_1.loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
            return;
        }
        const { email, password } = value;
        // Find user
        const user = await models_1.User.findOne({ where: { email, isActive: true } });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }
        // Generate tokens + save refresh token atomically (FLAW-012 fix)
        const loginTx = await database_1.default.transaction();
        let loginTokens;
        try {
            user.lastLogin = new Date();
            await user.save({ transaction: loginTx });
            loginTokens = (0, jwt_1.generateTokens)({
                userId: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            });
            const refreshTokenExpiry = new Date();
            refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
            await models_1.RefreshToken.create({
                token: loginTokens.refreshToken,
                userId: user.id,
                expiresAt: refreshTokenExpiry
            }, { transaction: loginTx });
            await loginTx.commit();
        }
        catch (txError) {
            await loginTx.rollback();
            throw txError;
        }
        const tokens = loginTokens;
        logger_1.logger.info(`User logged in: ${email}`);
        res.json({
            success: true,
            message: 'Login successful',
            data: {
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
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { error, value } = validation_1.refreshTokenSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
            return;
        }
        const { refreshToken: token } = value;
        // Verify token
        let payload;
        try {
            payload = (0, jwt_1.verifyRefreshToken)(token);
        }
        catch {
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
            return;
        }
        // Check if token exists in database
        const storedToken = await models_1.RefreshToken.findOne({
            where: {
                token,
                userId: payload.userId,
                isRevoked: false
            }
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            res.status(401).json({
                success: false,
                message: 'Refresh token expired or revoked'
            });
            return;
        }
        // Revoke old token
        await storedToken.update({ isRevoked: true });
        // Fetch user to ensure firstName/lastName are always included in new tokens (FLAW-005 fix)
        const user = await models_1.User.findByPk(payload.userId, {
            attributes: ['id', 'email', 'role', 'firstName', 'lastName', 'isActive']
        });
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'User account is inactive' });
            return;
        }
        // Generate new tokens with complete payload
        const tokens = (0, jwt_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        });
        // Save new refresh token
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
        await models_1.RefreshToken.create({
            token: tokens.refreshToken,
            userId: payload.userId,
            expiresAt: refreshTokenExpiry
        });
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: tokens
        });
    }
    catch (error) {
        logger_1.logger.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            // Revoke refresh token
            await models_1.RefreshToken.update({ isRevoked: true }, { where: { token: refreshToken } });
        }
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.logout = logout;
const verifyEmail = async (req, res) => {
    try {
        const { error, value } = validation_1.verifyEmailSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
            return;
        }
        const { token } = value;
        const user = await models_1.User.findOne({
            where: {
                emailVerificationToken: token,
                isEmailVerified: false
            }
        });
        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
            return;
        }
        await user.update({
            isEmailVerified: true
        });
        logger_1.logger.info(`Email verified: ${user.email}`);
        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.verifyEmail = verifyEmail;
const forgotPassword = async (req, res) => {
    try {
        const { error, value } = validation_1.forgotPasswordSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
            return;
        }
        const { email } = value;
        const user = await models_1.User.findOne({ where: { email, isActive: true } });
        if (!user) {
            // Don't reveal if user exists
            res.json({
                success: true,
                message: 'If an account exists, a password reset email has been sent'
            });
            return;
        }
        // Generate reset token
        const resetToken = (0, uuid_1.v4)();
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1);
        await user.update({
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires
        });
        // Send reset email
        try {
            await (0, email_1.sendPasswordResetEmail)(email, resetToken);
        }
        catch (emailError) {
            logger_1.logger.error('Failed to send password reset email:', emailError);
        }
        logger_1.logger.info(`Password reset requested: ${email}`);
        res.json({
            success: true,
            message: 'If an account exists, a password reset email has been sent'
        });
    }
    catch (error) {
        logger_1.logger.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { error, value } = validation_1.resetPasswordSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
            return;
        }
        const { token, password } = value;
        const user = await models_1.User.findOne({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    [sequelize_1.Op.gt]: new Date()
                }
            }
        });
        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
            return;
        }
        await user.update({
            password
        });
        // Revoke all refresh tokens
        await models_1.RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });
        logger_1.logger.info(`Password reset completed: ${user.email}`);
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.resetPassword = resetPassword;
const getMe = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const user = await models_1.User.findByPk(userId, {
            attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isEmailVerified', 'profilePicture', 'lastLogin']
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        logger_1.logger.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=authController.js.map