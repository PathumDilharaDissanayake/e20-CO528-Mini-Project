import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIMETYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
  }
};

export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});

export const saveFile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    return next();
  }

  const file = req.file;
  const filename = `${uuidv4()}${path.extname(file.originalname)}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, file.buffer);

  (file as any).filename = filename;
  (file as any).path = filepath;

  next();
};
