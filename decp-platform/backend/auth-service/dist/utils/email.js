"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendVerificationEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
const logger_1 = require("./logger");
const transporter = nodemailer_1.default.createTransport({
    host: config_1.config.smtp.host,
    port: config_1.config.smtp.port,
    secure: config_1.config.smtp.port === 465,
    auth: {
        user: config_1.config.smtp.user,
        pass: config_1.config.smtp.pass
    }
});
const sendEmail = async (options) => {
    if (!config_1.config.smtp.user || !config_1.config.smtp.pass) {
        logger_1.logger.warn('SMTP not configured — skipping email to ' + options.to);
        return;
    }
    try {
        await transporter.sendMail({
            from: config_1.config.smtp.from,
            to: options.to,
            subject: options.subject,
            html: options.html
        });
        logger_1.logger.info(`Email sent to ${options.to}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to send email:', error);
    }
};
exports.sendEmail = sendEmail;
const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${config_1.config.frontendUrl}/verify-email?token=${token}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to DECP Platform!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
        Verify Email
      </a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    </div>
  `;
    await (0, exports.sendEmail)({
        to: email,
        subject: 'Verify Your Email - DECP Platform',
        html
    });
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${config_1.config.frontendUrl}/reset-password?token=${token}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px;">
        Reset Password
      </a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email and ensure your account is secure.</p>
    </div>
  `;
    await (0, exports.sendEmail)({
        to: email,
        subject: 'Password Reset - DECP Platform',
        html
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
//# sourceMappingURL=email.js.map