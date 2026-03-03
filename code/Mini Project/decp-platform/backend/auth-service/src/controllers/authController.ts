import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { User, RefreshToken } from '../models';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { logger } from '../utils/logger';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from '../utils/validation';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
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
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Generate verification token
    const verificationToken = uuidv4();

    // Create user
    const userData: any = {
      email,
      password,
      firstName,
      lastName,
      role,
      isEmailVerified: false,
      emailVerificationToken: verificationToken
    };
    
    // Add optional fields if provided
    if (department) userData.department = department;
    if (graduationYear) userData.graduationYear = graduationYear;
    
    const user = await User.create(userData);

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });

    // Save refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await RefreshToken.create({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: refreshTokenExpiry
    });

    logger.info(`User registered: ${email}`);

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
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
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
    const user = await User.findOne({ where: { email, isActive: true } });
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

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });

    // Save refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await RefreshToken.create({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: refreshTokenExpiry
    });

    logger.info(`User logged in: ${email}`);

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
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);
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
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
      return;
    }

    // Check if token exists in database
    const storedToken = await RefreshToken.findOne({
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

    // Generate new tokens
    const tokens = generateTokens({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });

    // Save new refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await RefreshToken.create({
      token: tokens.refreshToken,
      userId: payload.userId,
      expiresAt: refreshTokenExpiry
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke refresh token
      await RefreshToken.update(
        { isRevoked: true },
        { where: { token: refreshToken } }
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = verifyEmailSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
      return;
    }

    const { token } = value;

    const user = await User.findOne({
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

    logger.info(`Email verified: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
      return;
    }

    const { email } = value;

    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) {
      // Don't reveal if user exists
      res.json({
        success: true,
        message: 'If an account exists, a password reset email has been sent'
      });
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await user.update({
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
    }

    logger.info(`Password reset requested: ${email}`);

    res.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
      return;
    }

    const { token, password } = value;

    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [Op.gt]: new Date()
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
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: user.id } }
    );

    logger.info(`Password reset completed: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await User.findByPk(userId, {
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
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
