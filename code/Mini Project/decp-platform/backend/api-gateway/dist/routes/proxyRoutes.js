"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
/**
 * Creates a proxy handler that forwards requests to a target service.
 * - Injects x-user-id and x-user-role headers for authenticated requests
 * - Strips the API prefix and optional service prefix from the URL path
 * - Handles multipart/form-data by streaming the raw request body
 */
const createProxyHandler = (targetService, servicePrefix) => {
    return async (req, res, _next) => {
        // ---- Path transformation ----
        let pathWithoutPrefix = req.originalUrl;
        // Remove /api/v1/auth prefix (auth service) or /api/v1 for everyone else
        if (req.originalUrl.startsWith('/api/v1/auth/')) {
            pathWithoutPrefix = req.originalUrl.replace('/api/v1/auth', '');
        }
        else if (req.originalUrl.startsWith('/api/v1/')) {
            pathWithoutPrefix = req.originalUrl.replace('/api/v1', '');
        }
        // Strip optional service prefix (e.g. /users/me -> /me when servicePrefix='users')
        // Must handle query strings: /notifications?page=1 -> /?page=1
        if (servicePrefix) {
            const prefixPath = `/${servicePrefix}`;
            if (pathWithoutPrefix.startsWith(`${prefixPath}/`)) {
                pathWithoutPrefix = pathWithoutPrefix.slice(prefixPath.length);
            }
            else if (pathWithoutPrefix === prefixPath || pathWithoutPrefix.startsWith(`${prefixPath}?`)) {
                pathWithoutPrefix = pathWithoutPrefix.slice(prefixPath.length) || '/';
                if (!pathWithoutPrefix.startsWith('/') && !pathWithoutPrefix.startsWith('?')) {
                    pathWithoutPrefix = '/' + pathWithoutPrefix;
                }
                if (pathWithoutPrefix.startsWith('?')) {
                    pathWithoutPrefix = '/' + pathWithoutPrefix;
                }
            }
        }
        if (!pathWithoutPrefix) {
            pathWithoutPrefix = '/';
        }
        const targetUrl = `${targetService}${pathWithoutPrefix}`;
        logger_1.logger.info(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl}`);
        // ---- Header construction ----
        const headers = {};
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }
        // Inject user identity so downstream services don't need to re-verify JWT
        const user = req.user;
        if (user?.id) {
            headers['x-user-id'] = String(user.id);
            headers['x-user-role'] = String(user.role || 'student');
            headers['x-user-email'] = String(user.email || '');
            if (user.firstName)
                headers['x-user-firstname'] = String(user.firstName);
            if (user.lastName)
                headers['x-user-lastname'] = String(user.lastName);
        }
        const contentType = req.headers['content-type'] || '';
        // ---- Multipart: stream the raw body through (files) ----
        if (contentType.includes('multipart/form-data')) {
            try {
                const targetUrlObj = new URL(targetUrl);
                const isHttps = targetUrlObj.protocol === 'https:';
                const transport = isHttps ? https : http;
                const port = targetUrlObj.port
                    ? parseInt(targetUrlObj.port)
                    : isHttps ? 443 : 80;
                const proxyReq = transport.request({
                    hostname: targetUrlObj.hostname,
                    port,
                    path: targetUrlObj.pathname + targetUrlObj.search,
                    method: req.method,
                    headers: {
                        ...req.headers,
                        host: targetUrlObj.host,
                        ...headers,
                    },
                }, (proxyRes) => {
                    let body = '';
                    proxyRes.on('data', (chunk) => { body += chunk; });
                    proxyRes.on('end', () => {
                        try {
                            res.status(proxyRes.statusCode || 500).json(JSON.parse(body));
                        }
                        catch {
                            res.status(proxyRes.statusCode || 500).send(body);
                        }
                    });
                });
                proxyReq.on('error', (err) => {
                    logger_1.logger.error(`[Proxy Stream Error] ${err.message}`);
                    if (!res.headersSent) {
                        res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
                    }
                });
                req.pipe(proxyReq);
            }
            catch (err) {
                logger_1.logger.error(`[Proxy Multipart Error] ${err.message}`);
                res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
            }
            return;
        }
        // ---- Standard JSON / URL-encoded proxy via axios ----
        headers['Content-Type'] = contentType || 'application/json';
        try {
            const response = await (0, axios_1.default)({
                method: req.method,
                url: targetUrl,
                data: req.body,
                headers,
                timeout: 30000,
            });
            res.status(response.status).json(response.data);
        }
        catch (error) {
            const axiosError = error;
            if (axiosError.response) {
                res.status(axiosError.response.status).json(axiosError.response.data);
            }
            else {
                logger_1.logger.error(`[Proxy Error] ${axiosError.message}`);
                res.status(503).json({
                    success: false,
                    message: 'Service temporarily unavailable',
                });
            }
        }
    };
};
// ============================================================
// AUTH SERVICE (port 3001)
// Gateway strips /api/v1/auth → service receives /login, /register, etc.
// ============================================================
router.post('/api/v1/auth/register', createProxyHandler(config_1.config.services.auth));
router.post('/api/v1/auth/login', createProxyHandler(config_1.config.services.auth));
router.post('/api/v1/auth/refresh', createProxyHandler(config_1.config.services.auth));
router.post('/api/v1/auth/logout', createProxyHandler(config_1.config.services.auth));
router.get('/api/v1/auth/me', auth_1.authMiddleware, createProxyHandler(config_1.config.services.auth));
router.get('/api/v1/auth/health', createProxyHandler(config_1.config.services.auth));
router.post('/api/v1/auth/verify-email', createProxyHandler(config_1.config.services.auth));
router.post('/api/v1/auth/forgot-password', createProxyHandler(config_1.config.services.auth));
router.post('/api/v1/auth/reset-password', createProxyHandler(config_1.config.services.auth));
// ============================================================
// USER SERVICE (port 3002)
// Gateway strips /api/v1 then /users → service receives /me, /:userId, /connections/...
// IMPORTANT: specific routes MUST come before parameterized /:userId
// ============================================================
router.get('/api/v1/users/me', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
router.put('/api/v1/users/me', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
router.get('/api/v1/users/search', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
router.get('/api/v1/users/connections', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
router.get('/api/v1/users/connections/:userId/status', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
router.post('/api/v1/users/connections/:userId/follow', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
router.delete('/api/v1/users/connections/:userId/unfollow', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
router.get('/api/v1/users', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
router.get('/api/v1/users/:userId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
router.delete('/api/v1/users/:userId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.user, 'users'));
// ============================================================
// FEED SERVICE (port 3003)
// Service mounts at /posts so gateway strips /api/v1 only → /posts/... goes to service
// ============================================================
router.get('/api/v1/posts/feed', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.feed));
router.get('/api/v1/posts', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.feed));
router.post('/api/v1/posts', auth_1.authMiddleware, createProxyHandler(config_1.config.services.feed));
router.get('/api/v1/posts/:postId/comments', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.feed));
router.post('/api/v1/posts/:postId/comments', auth_1.authMiddleware, createProxyHandler(config_1.config.services.feed));
router.delete('/api/v1/posts/:postId/comments/:commentId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.feed));
router.post('/api/v1/posts/:postId/like', auth_1.authMiddleware, createProxyHandler(config_1.config.services.feed));
router.delete('/api/v1/posts/:postId/like', auth_1.authMiddleware, createProxyHandler(config_1.config.services.feed));
router.post('/api/v1/posts/:postId/share', auth_1.authMiddleware, createProxyHandler(config_1.config.services.feed));
router.get('/api/v1/posts/:postId', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.feed));
router.put('/api/v1/posts/:postId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.feed));
router.delete('/api/v1/posts/:postId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.feed));
// Legacy /feed aliases
router.get('/api/v1/feed', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.feed));
router.post('/api/v1/feed', auth_1.authMiddleware, createProxyHandler(config_1.config.services.feed));
router.get('/api/v1/feed/health', createProxyHandler(config_1.config.services.feed));
// ============================================================
// JOBS SERVICE (port 3004)
// IMPORTANT: /applications and /health MUST come before /:jobId
// ============================================================
router.get('/api/v1/jobs/health', createProxyHandler(config_1.config.services.jobs, 'jobs'));
router.get('/api/v1/jobs/applications', auth_1.authMiddleware, createProxyHandler(config_1.config.services.jobs, 'jobs'));
router.put('/api/v1/jobs/applications/:applicationId/status', auth_1.authMiddleware, createProxyHandler(config_1.config.services.jobs, 'jobs'));
router.get('/api/v1/jobs', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.jobs, 'jobs'));
router.post('/api/v1/jobs', auth_1.authMiddleware, createProxyHandler(config_1.config.services.jobs, 'jobs'));
router.get('/api/v1/jobs/:jobId', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.jobs, 'jobs'));
router.put('/api/v1/jobs/:jobId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.jobs, 'jobs'));
router.delete('/api/v1/jobs/:jobId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.jobs, 'jobs'));
router.post('/api/v1/jobs/:jobId/apply', auth_1.authMiddleware, createProxyHandler(config_1.config.services.jobs, 'jobs'));
// ============================================================
// EVENTS SERVICE (port 3005)
// IMPORTANT: /my-rsvps and /health MUST come before /:eventId
// ============================================================
router.get('/api/v1/events/health', createProxyHandler(config_1.config.services.events, 'events'));
router.get('/api/v1/events/my-rsvps', auth_1.authMiddleware, createProxyHandler(config_1.config.services.events, 'events'));
router.get('/api/v1/events', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.events, 'events'));
router.post('/api/v1/events', auth_1.authMiddleware, createProxyHandler(config_1.config.services.events, 'events'));
router.get('/api/v1/events/:eventId', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.events, 'events'));
router.put('/api/v1/events/:eventId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.events, 'events'));
router.delete('/api/v1/events/:eventId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.events, 'events'));
router.post('/api/v1/events/:eventId/rsvp', auth_1.authMiddleware, createProxyHandler(config_1.config.services.events, 'events'));
// ============================================================
// RESEARCH SERVICE (port 3006)
// ============================================================
router.get('/api/v1/research/health', createProxyHandler(config_1.config.services.research, 'research'));
router.get('/api/v1/research', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.research, 'research'));
router.post('/api/v1/research', auth_1.authMiddleware, createProxyHandler(config_1.config.services.research, 'research'));
router.get('/api/v1/research/:researchId', auth_1.optionalAuthMiddleware, createProxyHandler(config_1.config.services.research, 'research'));
router.put('/api/v1/research/:researchId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.research, 'research'));
router.delete('/api/v1/research/:researchId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.research, 'research'));
router.post('/api/v1/research/:researchId/collaborate', auth_1.authMiddleware, createProxyHandler(config_1.config.services.research, 'research'));
router.delete('/api/v1/research/:researchId/collaborate', auth_1.authMiddleware, createProxyHandler(config_1.config.services.research, 'research'));
router.post('/api/v1/research/:researchId/documents', auth_1.authMiddleware, createProxyHandler(config_1.config.services.research, 'research'));
router.delete('/api/v1/research/:researchId/documents/:documentId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.research, 'research'));
// ============================================================
// MESSAGING SERVICE (port 3007)
// IMPORTANT: /messages sub-routes MUST come before /:conversationId
// ============================================================
router.get('/api/v1/messaging/health', createProxyHandler(config_1.config.services.messaging, 'messaging'));
router.get('/api/v1/conversations', auth_1.authMiddleware, createProxyHandler(config_1.config.services.messaging, 'conversations'));
router.post('/api/v1/conversations', auth_1.authMiddleware, createProxyHandler(config_1.config.services.messaging, 'conversations'));
router.get('/api/v1/conversations/:conversationId/messages', auth_1.authMiddleware, createProxyHandler(config_1.config.services.messaging, 'conversations'));
router.post('/api/v1/conversations/:conversationId/messages', auth_1.authMiddleware, createProxyHandler(config_1.config.services.messaging, 'conversations'));
router.get('/api/v1/conversations/:conversationId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.messaging, 'conversations'));
// ============================================================
// NOTIFICATION SERVICE (port 3008)
// IMPORTANT: /health, /read-all, /push/* MUST come before /:notificationId
// ============================================================
router.get('/api/v1/notifications/health', createProxyHandler(config_1.config.services.notification, 'notifications'));
router.put('/api/v1/notifications/read-all', auth_1.authMiddleware, createProxyHandler(config_1.config.services.notification, 'notifications'));
router.post('/api/v1/notifications/push/subscribe', auth_1.authMiddleware, createProxyHandler(config_1.config.services.notification, 'notifications'));
router.post('/api/v1/notifications/push/unsubscribe', auth_1.authMiddleware, createProxyHandler(config_1.config.services.notification, 'notifications'));
router.get('/api/v1/notifications', auth_1.authMiddleware, createProxyHandler(config_1.config.services.notification, 'notifications'));
router.post('/api/v1/notifications', auth_1.authMiddleware, createProxyHandler(config_1.config.services.notification, 'notifications'));
router.put('/api/v1/notifications/:notificationId/read', auth_1.authMiddleware, createProxyHandler(config_1.config.services.notification, 'notifications'));
router.delete('/api/v1/notifications/:notificationId', auth_1.authMiddleware, createProxyHandler(config_1.config.services.notification, 'notifications'));
// ============================================================
// ANALYTICS SERVICE (port 3009)
// IMPORTANT: /health, /dashboard, /popular MUST come before /:userId
// ============================================================
router.get('/api/v1/analytics/health', createProxyHandler(config_1.config.services.analytics, 'analytics'));
router.get('/api/v1/analytics/dashboard', auth_1.authMiddleware, createProxyHandler(config_1.config.services.analytics, 'analytics'));
router.get('/api/v1/analytics/popular', auth_1.authMiddleware, createProxyHandler(config_1.config.services.analytics, 'analytics'));
router.post('/api/v1/analytics/track', createProxyHandler(config_1.config.services.analytics, 'analytics'));
router.get('/api/v1/analytics/users/:userId/activity', auth_1.authMiddleware, createProxyHandler(config_1.config.services.analytics, 'analytics'));
exports.default = router;
//# sourceMappingURL=proxyRoutes.js.map