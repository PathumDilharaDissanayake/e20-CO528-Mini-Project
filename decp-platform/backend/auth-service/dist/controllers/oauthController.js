"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPassport = exports.googleCallback = exports.googleAuth = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Configure Google Strategy only if credentials are provided
if (config_1.config.google.clientId &&
    config_1.config.google.clientSecret &&
    config_1.config.google.clientId !== 'your-google-client-id' &&
    config_1.config.google.clientSecret !== 'your-google-client-secret') {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: config_1.config.google.clientId,
        clientSecret: config_1.config.google.clientSecret,
        callbackURL: config_1.config.google.callbackUrl
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0].value;
            if (!email) {
                return done(new Error('No email found in Google profile'), false);
            }
            let user = await models_1.User.findOne({ where: { email } });
            if (!user) {
                // Create new user
                user = await models_1.User.create({
                    email,
                    firstName: profile.name?.givenName || 'Unknown',
                    lastName: profile.name?.familyName || 'User',
                    googleId: profile.id,
                    profilePicture: profile.photos?.[0].value,
                    isEmailVerified: true,
                    role: 'student'
                });
                logger_1.logger.info(`New user created via Google OAuth: ${email}`);
            }
            else {
                // Update Google ID if not set
                if (!user.googleId) {
                    await user.update({ googleId: profile.id });
                }
            }
            return done(null, user);
        }
        catch (error) {
            return done(error, false);
        }
    }));
    logger_1.logger.info('Google OAuth strategy initialized');
}
else {
    logger_1.logger.warn('Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
}
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await models_1.User.findByPk(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
const googleAuth = (req, res) => {
    if (!config_1.config.google.clientId || config_1.config.google.clientId === 'your-google-client-id') {
        return res.status(503).json({
            success: false,
            message: 'Google OAuth is not configured on this server'
        });
    }
    return passport_1.default.authenticate('google', { scope: ['profile', 'email'] })(req, res);
};
exports.googleAuth = googleAuth;
exports.googleCallback = [
    (req, res, next) => {
        if (!config_1.config.google.clientId || config_1.config.google.clientId === 'your-google-client-id') {
            return res.status(503).json({
                success: false,
                message: 'Google OAuth is not configured on this server'
            });
        }
        return next();
    },
    passport_1.default.authenticate('google', { session: false, failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                res.redirect(`${config_1.config.frontendUrl}/login?error=oauth_failed`);
                return;
            }
            // Update last login
            await user.update({ lastLogin: new Date() });
            // Generate tokens
            const tokens = (0, jwt_1.generateTokens)({
                userId: user.id,
                email: user.email,
                role: user.role
            });
            logger_1.logger.info(`User logged in via Google: ${user.email}`);
            // Redirect to frontend with tokens
            res.redirect(`${config_1.config.frontendUrl}/oauth/callback?` +
                `accessToken=${tokens.accessToken}&` +
                `refreshToken=${tokens.refreshToken}&` +
                `expiresIn=${tokens.expiresIn}`);
        }
        catch (error) {
            logger_1.logger.error('Google OAuth callback error:', error);
            res.redirect(`${config_1.config.frontendUrl}/login?error=server_error`);
        }
    }
];
const initPassport = () => passport_1.default;
exports.initPassport = initPassport;
//# sourceMappingURL=oauthController.js.map