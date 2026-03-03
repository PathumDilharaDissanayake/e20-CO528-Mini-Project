"use strict";
/**
 * Internal service authentication middleware (SEC-002).
 * Validates that incoming requests originated from the trusted API gateway.
 * Agent: A-08 (Security Agent) | 2026-03-03
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalAuthMiddleware = void 0;
const internalAuthMiddleware = (req, res, next) => {
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;
    // If token not configured, skip (log warning in non-dev envs)
    if (!expectedToken) {
        if (process.env.NODE_ENV !== 'development') {
            console.warn('[SEC-002] INTERNAL_SERVICE_TOKEN not set — internal auth disabled');
        }
        return next();
    }
    // Health check endpoints are exempt (used by Docker / load balancers)
    if (req.path === '/health')
        return next();
    const receivedToken = req.headers['x-internal-token'];
    if (!receivedToken || receivedToken !== expectedToken) {
        res.status(401).json({ success: false, message: 'Unauthorized: missing or invalid internal service token' });
        return;
    }
    next();
};
exports.internalAuthMiddleware = internalAuthMiddleware;
