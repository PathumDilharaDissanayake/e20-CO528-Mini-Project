/**
 * Internal service authentication middleware (SEC-002).
 * Validates that incoming requests originated from the trusted API gateway.
 * Agent: A-08 (Security Agent) | 2026-03-03
 */
import { Request, Response, NextFunction } from 'express';
export declare const internalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=internalAuth.d.ts.map