"use strict";
/**
 * Correlation ID middleware (OBS-001).
 * Generates a unique request ID at the gateway edge and propagates it to all
 * downstream services via x-correlation-id header. Clients receive it back in
 * the response header for end-to-end request tracing.
 * Agent: A-09 (DevOps Agent) | 2026-03-03
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationIdMiddleware = void 0;
const crypto_1 = require("crypto");
const correlationIdMiddleware = (req, res, next) => {
    // Honour an id injected by a parent system (e.g. load balancer), otherwise generate one
    const correlationId = req.headers['x-correlation-id'] || (0, crypto_1.randomUUID)();
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
};
exports.correlationIdMiddleware = correlationIdMiddleware;
//# sourceMappingURL=correlationId.js.map