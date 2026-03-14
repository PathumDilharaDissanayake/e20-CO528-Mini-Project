/**
 * File upload magic-byte validation middleware (SEC-001).
 * Switches Multer to memoryStorage, validates actual file content before writing to disk.
 * Agent: A-08 (Security Agent) | 2026-03-03
 */

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Request, Response, NextFunction } from 'express';

// Magic byte signatures per MIME type
const SIGNATURES: Record<string, { offset: number; bytes: number[] }[]> = {
  'image/jpeg': [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  'image/gif': [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }  // GIF89a
  ],
  // WebP: RIFF....WEBP
  'image/webp': [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }],
  'video/mp4': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }], // "ftyp" box
  'video/webm': [{ offset: 0, bytes: [0x1A, 0x45, 0xDF, 0xA3] }], // EBML header
  'video/ogg': [{ offset: 0, bytes: [0x4F, 0x67, 0x67, 0x53] }], // "OggS"
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }] // %PDF
};

function matchesMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const sigs = SIGNATURES[mimetype];
  if (!sigs) return false; // unknown type — reject
  return sigs.some(({ offset, bytes }) => {
    if (buffer.length < offset + bytes.length) return false;
    return bytes.every((b, i) => buffer[offset + i] === b);
  });
}

const uploadsBucket = process.env.UPLOADS_BUCKET_NAME;
const s3Client = uploadsBucket
  ? new S3Client({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1' })
  : null;

// Use memory storage so we can inspect bytes before touching disk
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '20971520', 10) }, // 20MB default
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg', 'application/pdf'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: jpeg, png, gif, webp, mp4, webm, ogg, pdf`));
  }
});

/**
 * After memoryUpload, validate magic bytes then persist the file to disk.
 * Populates req.file.filename so downstream handlers keep working unchanged.
 */
export const validateAndSaveFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const files = req.files as Express.Multer.File[] | undefined;
  const single = req.file as Express.Multer.File | undefined;
  const allFiles = files ?? (single ? [single] : []);

  try {
    for (const file of allFiles) {
      if (!matchesMagicBytes(file.buffer, file.mimetype)) {
        res.status(400).json({
          success: false,
          message: `File "${file.originalname}" failed magic-byte validation. Claimed type: ${file.mimetype}`
        });
        return;
      }

      const filename = `${uuidv4()}${path.extname(file.originalname)}`;

      if (uploadsBucket && s3Client) {
        await s3Client.send(new PutObjectCommand({
          Bucket: uploadsBucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            originalname: file.originalname
          }
        }));

        // Keep the same downstream contract: only filename is required to build /uploads/<filename> URL
        (file as any).filename = filename;
        (file as any).path = `s3://${uploadsBucket}/${filename}`;
        continue;
      }

      // Development fallback: write buffer to local disk
      const uploadDir = process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR)
        : path.join(__dirname, '..', '..', 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, file.buffer);

      (file as any).filename = filename;
      (file as any).path = filepath;
    }

    next();
  } catch (error) {
    next(error);
  }
};
