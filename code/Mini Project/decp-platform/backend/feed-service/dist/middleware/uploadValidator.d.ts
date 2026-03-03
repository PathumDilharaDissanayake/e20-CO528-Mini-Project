/**
 * File upload magic-byte validation middleware (SEC-001).
 * Switches Multer to memoryStorage, validates actual file content before writing to disk.
 * Agent: A-08 (Security Agent) | 2026-03-03
 */
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
export declare const memoryUpload: multer.Multer;
/**
 * After memoryUpload, validate magic bytes then persist the file to disk.
 * Populates req.file.filename so downstream handlers keep working unchanged.
 */
export declare const validateAndSaveFiles: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=uploadValidator.d.ts.map