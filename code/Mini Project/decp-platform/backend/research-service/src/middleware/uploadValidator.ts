/**
 * File upload magic-byte validation middleware (SEC-001).
 * Switches Multer to memoryStorage, validates actual file content before writing to disk.
 * Agent: A-08 (Security Agent) | 2026-03-03
 */

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Magic byte signatures per MIME type
const SIGNATURES: Record<string, { offset: number; bytes: number[] }[]> = {
  'image/jpeg':      [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  'image/png':       [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  'image/gif':       [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }
  ],
  'video/mp4':       [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  // Common document formats
  'application/msword':                                                    [{ offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0] }], // OLE2
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [{ offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] }]  // ZIP (docx)
};

function matchesMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const sigs = SIGNATURES[mimetype];
  if (!sigs) return false;
  return sigs.some(({ offset, bytes }) => {
    if (buffer.length < offset + bytes.length) return false;
    return bytes.every((b, i) => buffer[offset + i] === b);
  });
}

export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB for research docs
});

export const validateAndSaveFile = (req: Request, res: Response, next: NextFunction): void => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    next();
    return;
  }

  if (!matchesMagicBytes(file.buffer, file.mimetype)) {
    res.status(400).json({
      success: false,
      message: `File "${file.originalname}" failed magic-byte validation. Claimed type: ${file.mimetype}`
    });
    return;
  }

  // Use absolute path so it works regardless of CWD
  // __dirname in dist/middleware/ → go up two levels to reach service root
  const uploadDir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(__dirname, '..', '..', 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `${randomUUID()}${path.extname(file.originalname)}`;
  const filepath = path.join(uploadDir, filename);
  fs.writeFileSync(filepath, file.buffer);

  (file as any).filename = filename;
  (file as any).path = filepath;

  next();
};
