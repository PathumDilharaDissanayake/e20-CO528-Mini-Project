/**
 * Correlation ID middleware (OBS-001).
 * Generates a unique request ID at the gateway edge and propagates it to all
 * downstream services via x-correlation-id header. Clients receive it back in
 * the response header for end-to-end request tracing.
 * Agent: A-09 (DevOps Agent) | 2026-03-03
 */

import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Honour an id injected by a parent system (e.g. load balancer), otherwise generate one
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
};
