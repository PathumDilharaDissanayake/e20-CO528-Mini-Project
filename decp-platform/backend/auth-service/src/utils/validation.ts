import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 6 characters'
    }),
  firstName: Joi.string().min(1).max(100).required().trim(),
  lastName: Joi.string().min(1).max(100).required().trim(),
  role: Joi.string().valid('student', 'alumni', 'faculty', 'admin').default('student'),
  department: Joi.string().allow('', null),
  graduationYear: Joi.number().allow(null)
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
});
