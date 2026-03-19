"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.verifyEmailSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase().trim(),
    password: joi_1.default.string()
        .min(6)
        .max(128)
        .required()
        .messages({
        'string.pattern.base': 'Password must be at least 6 characters'
    }),
    firstName: joi_1.default.string().min(1).max(100).required().trim(),
    lastName: joi_1.default.string().min(1).max(100).required().trim(),
    role: joi_1.default.string().valid('student', 'alumni', 'faculty', 'admin').default('student'),
    department: joi_1.default.string().allow('', null),
    graduationYear: joi_1.default.number().allow(null)
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase().trim(),
    password: joi_1.default.string().required()
});
exports.refreshTokenSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().required()
});
exports.forgotPasswordSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase().trim()
});
exports.resetPasswordSchema = joi_1.default.object({
    token: joi_1.default.string().required(),
    password: joi_1.default.string()
        .min(6)
        .max(128)
        .required()
});
exports.verifyEmailSchema = joi_1.default.object({
    token: joi_1.default.string().required()
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string()
        .min(6)
        .max(128)
        .required()
});
//# sourceMappingURL=validation.js.map