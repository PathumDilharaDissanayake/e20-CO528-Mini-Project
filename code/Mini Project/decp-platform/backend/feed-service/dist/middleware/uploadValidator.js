"use strict";
/**
 * File upload magic-byte validation middleware (SEC-001).
 * Switches Multer to memoryStorage, validates actual file content before writing to disk.
 * Agent: A-08 (Security Agent) | 2026-03-03
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndSaveFiles = exports.memoryUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
// Magic byte signatures per MIME type
const SIGNATURES = {
    'image/jpeg': [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
    'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
    'image/gif': [
        { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
        { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] } // GIF89a
    ],
    'video/mp4': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }], // "ftyp" box
    'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }] // %PDF
};
function matchesMagicBytes(buffer, mimetype) {
    const sigs = SIGNATURES[mimetype];
    if (!sigs)
        return false; // unknown type — reject
    return sigs.some(({ offset, bytes }) => {
        if (buffer.length < offset + bytes.length)
            return false;
        return bytes.every((b, i) => buffer[offset + i] === b);
    });
}
// Use memory storage so we can inspect bytes before touching disk
exports.memoryUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
    }
});
/**
 * After memoryUpload, validate magic bytes then persist the file to disk.
 * Populates req.file.filename so downstream handlers keep working unchanged.
 */
const validateAndSaveFiles = (req, res, next) => {
    const files = req.files;
    const single = req.file;
    const allFiles = files ?? (single ? [single] : []);
    for (const file of allFiles) {
        if (!matchesMagicBytes(file.buffer, file.mimetype)) {
            res.status(400).json({
                success: false,
                message: `File "${file.originalname}" failed magic-byte validation. Claimed type: ${file.mimetype}`
            });
            return;
        }
        // Write buffer to disk
        const uploadDir = process.env.UPLOAD_DIR || 'uploads';
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
        const filename = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        const filepath = path_1.default.join(uploadDir, filename);
        fs_1.default.writeFileSync(filepath, file.buffer);
        // Patch file object so existing controller code works without change
        file.filename = filename;
        file.path = filepath;
    }
    next();
};
exports.validateAndSaveFiles = validateAndSaveFiles;
//# sourceMappingURL=uploadValidator.js.map