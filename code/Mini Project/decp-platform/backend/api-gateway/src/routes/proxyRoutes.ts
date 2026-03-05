import { Router, Request, Response, NextFunction } from 'express';
import * as http from 'http';
import * as https from 'https';
import { config } from '../config';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import axios from 'axios';

const router = Router();

/**
 * Creates a proxy handler that forwards requests to a target service.
 * - Injects x-user-id and x-user-role headers for authenticated requests
 * - Strips the API prefix and optional service prefix from the URL path
 * - Handles multipart/form-data by streaming the raw request body
 */
const createProxyHandler = (targetService: string, servicePrefix?: string) => {
  return async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Path transformation ----
    let pathWithoutPrefix = req.originalUrl;

    // Remove /api/v1/auth prefix (auth service) or /api/v1 for everyone else
    if (req.originalUrl.startsWith('/api/v1/auth/')) {
      pathWithoutPrefix = req.originalUrl.replace('/api/v1/auth', '');
    } else if (req.originalUrl.startsWith('/api/v1/')) {
      pathWithoutPrefix = req.originalUrl.replace('/api/v1', '');
    }

    // Strip optional service prefix (e.g. /users/me -> /me when servicePrefix='users')
    // Must handle query strings: /notifications?page=1 -> /?page=1
    if (servicePrefix) {
      const prefixPath = `/${servicePrefix}`;
      if (pathWithoutPrefix.startsWith(`${prefixPath}/`)) {
        pathWithoutPrefix = pathWithoutPrefix.slice(prefixPath.length);
      } else if (pathWithoutPrefix === prefixPath || pathWithoutPrefix.startsWith(`${prefixPath}?`)) {
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
    logger.info(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

    // ---- Header construction ----
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers['authorization'] = req.headers.authorization;
    }

    // Inject user identity so downstream services don't need to re-verify JWT
    const user = (req as any).user;
    if (user?.id) {
      headers['x-user-id'] = String(user.id);
      headers['x-user-role'] = String(user.role || 'student');
      headers['x-user-email'] = String(user.email || '');
      if (user.firstName) headers['x-user-firstname'] = String(user.firstName);
      if (user.lastName) headers['x-user-lastname'] = String(user.lastName);
    }

    // SEC-002: Internal service token — proves request originated from the trusted gateway
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (internalToken) headers['x-internal-token'] = internalToken;

    // OBS-001: Propagate correlation ID for end-to-end request tracing
    const correlationId = req.headers['x-correlation-id'] as string | undefined;
    if (correlationId) headers['x-correlation-id'] = correlationId;

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

        // Preserve multipart boundary and body size for Multer in downstream services
        const contentLength = req.headers['content-length'];
        const proxyHeaders: Record<string, string> = {
          host: targetUrlObj.host,
          ...headers,
          'content-type': contentType,
        };
        if (typeof contentLength === 'string' && contentLength.length > 0) {
          proxyHeaders['content-length'] = contentLength;
        }
        if (typeof req.headers.accept === 'string' && req.headers.accept.length > 0) {
          proxyHeaders['accept'] = req.headers.accept;
        }
        if (typeof req.headers['transfer-encoding'] === 'string' && req.headers['transfer-encoding'].length > 0) {
          proxyHeaders['transfer-encoding'] = req.headers['transfer-encoding'];
        }

        const proxyReq = transport.request(
          {
            hostname: targetUrlObj.hostname,
            port,
            path: targetUrlObj.pathname + targetUrlObj.search,
            method: req.method,
            headers: proxyHeaders,
          },
          (proxyRes) => {
            let body = '';
            proxyRes.on('data', (chunk) => { body += chunk; });
            proxyRes.on('end', () => {
              try {
                res.status(proxyRes.statusCode || 500).json(JSON.parse(body));
              } catch {
                res.status(proxyRes.statusCode || 500).send(body);
              }
            });
          }
        );

        proxyReq.on('error', (err) => {
          logger.error(`[Proxy Stream Error] ${err.message}`);
          if (!res.headersSent) {
            res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
          }
        });

        req.pipe(proxyReq);
      } catch (err) {
        logger.error(`[Proxy Multipart Error] ${(err as Error).message}`);
        res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
      }
      return;
    }

    // ---- Standard JSON / URL-encoded proxy via axios ----
    headers['content-type'] = contentType || 'application/json';

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers,
        timeout: 30000,
      });

      res.status(response.status).json(response.data);
    } catch (error) {
      const axiosError = error as { response?: { status: number; data: any }; message?: string };
      if (axiosError.response) {
        res.status(axiosError.response.status).json(axiosError.response.data);
      } else {
        logger.error(`[Proxy Error] ${axiosError.message}`);
        res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable',
        });
      }
    }
  };
};

// ============================================================
// STATIC FILES — FEED SERVICE (port 3003)
// Uploaded images/files are served directly by the feed-service at /uploads/*
// The gateway proxies these WITHOUT the /api/v1 prefix.
// ============================================================
router.get('/uploads/*', async (req: Request, res: Response) => {
  const targetUrl = `${config.services.feed}${req.originalUrl}`;
  logger.info(`[Proxy Static] GET ${req.originalUrl} -> ${targetUrl}`);
  try {
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      timeout: 30000,
    });
    res.status(response.status);
    if (response.headers['content-type']) {
      res.setHeader('content-type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('content-length', response.headers['content-length']);
    }
    (response.data as NodeJS.ReadableStream).pipe(res);
  } catch (error) {
    const axiosError = error as { response?: { status: number; data: any }; message?: string };
    if (axiosError.response) {
      res.status(axiosError.response.status).json(axiosError.response.data);
    } else {
      logger.error(`[Proxy Static Error] ${axiosError.message}`);
      res.status(404).json({ success: false, message: 'File not found' });
    }
  }
});

// ============================================================
// AUTH SERVICE (port 3001)
// Gateway strips /api/v1/auth → service receives /login, /register, etc.
// ============================================================
// SEC-006: Sensitive auth endpoints get a tighter rate limit (5 req per 15 min per IP)
router.post('/api/v1/auth/register', strictRateLimiter, createProxyHandler(config.services.auth));
router.post('/api/v1/auth/login', strictRateLimiter, createProxyHandler(config.services.auth));
router.post('/api/v1/auth/refresh', createProxyHandler(config.services.auth));
router.post('/api/v1/auth/logout', createProxyHandler(config.services.auth));
router.get('/api/v1/auth/me', authMiddleware, createProxyHandler(config.services.auth));
router.get('/api/v1/auth/health', createProxyHandler(config.services.auth));
router.post('/api/v1/auth/verify-email', createProxyHandler(config.services.auth));
router.post('/api/v1/auth/forgot-password', strictRateLimiter, createProxyHandler(config.services.auth));
router.post('/api/v1/auth/reset-password', strictRateLimiter, createProxyHandler(config.services.auth));

// ============================================================
// USER SERVICE (port 3002)
// Gateway strips /api/v1 then /users → service receives /me, /:userId, /connections/...
// IMPORTANT: specific routes MUST come before parameterized /:userId
// ============================================================
router.get('/api/v1/users/me', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.put('/api/v1/users/me', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.get('/api/v1/users/search', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.get('/api/v1/users/connections', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.get('/api/v1/users/connections/requests', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.get('/api/v1/users/connections/:userId/status', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.post('/api/v1/users/connections/:userId/follow', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.delete('/api/v1/users/connections/:userId/unfollow', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.put('/api/v1/users/connections/:userId/accept', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.delete('/api/v1/users/connections/:userId/decline', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.get('/api/v1/users', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.post('/api/v1/users/:userId/endorse', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.get('/api/v1/users/:userId', authMiddleware, createProxyHandler(config.services.user, 'users'));
router.delete('/api/v1/users/:userId', authMiddleware, createProxyHandler(config.services.user, 'users'));

// ============================================================
// FEED SERVICE (port 3003)
// Service mounts at /posts so gateway strips /api/v1 only → /posts/... goes to service
// ============================================================
router.get('/api/v1/posts/feed', optionalAuthMiddleware, createProxyHandler(config.services.feed));
// Bookmarks — MUST come before /:postId
router.get('/api/v1/posts/bookmarks/me', authMiddleware, createProxyHandler(config.services.feed));
router.post('/api/v1/posts/upload', authMiddleware, createProxyHandler(config.services.feed));
router.get('/api/v1/posts', optionalAuthMiddleware, createProxyHandler(config.services.feed));
router.post('/api/v1/posts', authMiddleware, createProxyHandler(config.services.feed));
router.get('/api/v1/posts/:postId/comments', optionalAuthMiddleware, createProxyHandler(config.services.feed));
router.post('/api/v1/posts/:postId/comments', authMiddleware, createProxyHandler(config.services.feed));
router.delete('/api/v1/posts/:postId/comments/:commentId', authMiddleware, createProxyHandler(config.services.feed));
router.post('/api/v1/posts/:postId/like', authMiddleware, createProxyHandler(config.services.feed));
router.delete('/api/v1/posts/:postId/like', authMiddleware, createProxyHandler(config.services.feed));
router.post('/api/v1/posts/:postId/share', authMiddleware, createProxyHandler(config.services.feed));
router.post('/api/v1/posts/:postId/bookmark', authMiddleware, createProxyHandler(config.services.feed));
router.post('/api/v1/posts/:postId/vote', authMiddleware, createProxyHandler(config.services.feed));
router.get('/api/v1/posts/:postId/reactions', optionalAuthMiddleware, createProxyHandler(config.services.feed));
router.get('/api/v1/posts/:postId', optionalAuthMiddleware, createProxyHandler(config.services.feed));
router.put('/api/v1/posts/:postId', authMiddleware, createProxyHandler(config.services.feed));
router.delete('/api/v1/posts/:postId', authMiddleware, createProxyHandler(config.services.feed));
// Legacy /feed aliases
router.get('/api/v1/feed', optionalAuthMiddleware, createProxyHandler(config.services.feed));
router.post('/api/v1/feed', authMiddleware, createProxyHandler(config.services.feed));
router.get('/api/v1/feed/health', createProxyHandler(config.services.feed));

// ============================================================
// JOBS SERVICE (port 3004)
// IMPORTANT: /applications and /health MUST come before /:jobId
// ============================================================
router.get('/api/v1/jobs/health', createProxyHandler(config.services.jobs, 'jobs'));
router.get('/api/v1/jobs/applications', authMiddleware, createProxyHandler(config.services.jobs, 'jobs'));
router.put('/api/v1/jobs/applications/:applicationId/status', authMiddleware, createProxyHandler(config.services.jobs, 'jobs'));
router.get('/api/v1/jobs', optionalAuthMiddleware, createProxyHandler(config.services.jobs, 'jobs'));
router.post('/api/v1/jobs', authMiddleware, createProxyHandler(config.services.jobs, 'jobs'));
router.get('/api/v1/jobs/:jobId', optionalAuthMiddleware, createProxyHandler(config.services.jobs, 'jobs'));
router.put('/api/v1/jobs/:jobId', authMiddleware, createProxyHandler(config.services.jobs, 'jobs'));
router.delete('/api/v1/jobs/:jobId', authMiddleware, createProxyHandler(config.services.jobs, 'jobs'));
router.post('/api/v1/jobs/:jobId/apply', authMiddleware, createProxyHandler(config.services.jobs, 'jobs'));

// ============================================================
// EVENTS SERVICE (port 3005)
// IMPORTANT: /my-rsvps and /health MUST come before /:eventId
// ============================================================
router.get('/api/v1/events/health', createProxyHandler(config.services.events, 'events'));
router.get('/api/v1/events/my-rsvps', authMiddleware, createProxyHandler(config.services.events, 'events'));
router.get('/api/v1/events', optionalAuthMiddleware, createProxyHandler(config.services.events, 'events'));
router.post('/api/v1/events', authMiddleware, createProxyHandler(config.services.events, 'events'));
router.get('/api/v1/events/:eventId', optionalAuthMiddleware, createProxyHandler(config.services.events, 'events'));
router.put('/api/v1/events/:eventId', authMiddleware, createProxyHandler(config.services.events, 'events'));
router.delete('/api/v1/events/:eventId', authMiddleware, createProxyHandler(config.services.events, 'events'));
router.post('/api/v1/events/:eventId/rsvp', authMiddleware, createProxyHandler(config.services.events, 'events'));

// ============================================================
// RESEARCH SERVICE (port 3006)
// ============================================================
router.get('/api/v1/research/health', createProxyHandler(config.services.research, 'research'));
router.get('/api/v1/research', optionalAuthMiddleware, createProxyHandler(config.services.research, 'research'));
router.post('/api/v1/research', authMiddleware, createProxyHandler(config.services.research, 'research'));
router.get('/api/v1/research/:researchId', optionalAuthMiddleware, createProxyHandler(config.services.research, 'research'));
router.put('/api/v1/research/:researchId', authMiddleware, createProxyHandler(config.services.research, 'research'));
router.delete('/api/v1/research/:researchId', authMiddleware, createProxyHandler(config.services.research, 'research'));
router.post('/api/v1/research/:researchId/collaborate', authMiddleware, createProxyHandler(config.services.research, 'research'));
router.delete('/api/v1/research/:researchId/collaborate', authMiddleware, createProxyHandler(config.services.research, 'research'));
router.post('/api/v1/research/:researchId/documents', authMiddleware, createProxyHandler(config.services.research, 'research'));
router.delete('/api/v1/research/:researchId/documents/:documentId', authMiddleware, createProxyHandler(config.services.research, 'research'));

// ============================================================
// MESSAGING SERVICE (port 3007)
// IMPORTANT: /messages sub-routes MUST come before /:conversationId
// ============================================================
router.get('/api/v1/messaging/health', createProxyHandler(config.services.messaging, 'messaging'));
router.get('/api/v1/conversations', authMiddleware, createProxyHandler(config.services.messaging, 'conversations'));
router.post('/api/v1/conversations', authMiddleware, createProxyHandler(config.services.messaging, 'conversations'));
router.get('/api/v1/conversations/:conversationId/messages', authMiddleware, createProxyHandler(config.services.messaging, 'conversations'));
router.post('/api/v1/conversations/:conversationId/messages', authMiddleware, createProxyHandler(config.services.messaging, 'conversations'));
router.get('/api/v1/conversations/:conversationId', authMiddleware, createProxyHandler(config.services.messaging, 'conversations'));

// ============================================================
// NOTIFICATION SERVICE (port 3008)
// IMPORTANT: /health, /read-all, /push/* MUST come before /:notificationId
// ============================================================
router.get('/api/v1/notifications/health', createProxyHandler(config.services.notification, 'notifications'));
router.put('/api/v1/notifications/read-all', authMiddleware, createProxyHandler(config.services.notification, 'notifications'));
router.post('/api/v1/notifications/push/subscribe', authMiddleware, createProxyHandler(config.services.notification, 'notifications'));
router.post('/api/v1/notifications/push/unsubscribe', authMiddleware, createProxyHandler(config.services.notification, 'notifications'));
router.get('/api/v1/notifications', authMiddleware, createProxyHandler(config.services.notification, 'notifications'));
router.post('/api/v1/notifications', authMiddleware, createProxyHandler(config.services.notification, 'notifications'));
router.put('/api/v1/notifications/:notificationId/read', authMiddleware, createProxyHandler(config.services.notification, 'notifications'));
router.delete('/api/v1/notifications/:notificationId', authMiddleware, createProxyHandler(config.services.notification, 'notifications'));

// ============================================================
// ANALYTICS SERVICE (port 3009)
// IMPORTANT: /health, /dashboard, /popular MUST come before /:userId
// ============================================================
router.get('/api/v1/analytics/health', createProxyHandler(config.services.analytics, 'analytics'));
router.get('/api/v1/analytics/dashboard', authMiddleware, createProxyHandler(config.services.analytics, 'analytics'));
router.get('/api/v1/analytics/popular', authMiddleware, createProxyHandler(config.services.analytics, 'analytics'));
router.post('/api/v1/analytics/track', createProxyHandler(config.services.analytics, 'analytics'));
router.get('/api/v1/analytics/users/:userId/activity', authMiddleware, createProxyHandler(config.services.analytics, 'analytics'));

export default router;
