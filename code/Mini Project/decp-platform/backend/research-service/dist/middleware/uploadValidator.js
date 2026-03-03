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
exports.validateAndSaveFile = exports.memoryUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
// Magic byte signatures per MIME type
const SIGNATURES = {
    'image/jpeg': [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
    'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
    'image/gif': [
        { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
        { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }
    ],
    'video/mp4': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
    'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
    // Common document formats
    'application/msword': [{ offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0] }], // OLE2
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [{ offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] }] // ZIP (docx)
};
function matchesMagicBytes(buffer, mimetype) {
    const sigs = SIGNATURES[mimetype];
    if (!sigs)
        return false;
    return sigs.some(({ offset, bytes }) => {
        if (buffer.length < offset + bytes.length)
            return false;
        return bytes.every((b, i) => buffer[offset + i] === b);
    });
}
exports.memoryUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB for research docs
});
const validateAndSaveFile = (req, res, next) => {
    const file = req.file;
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
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
    const filename = `${(0, crypto_1.randomUUID)()}${path_1.default.extname(file.originalname)}`;
    const filepath = path_1.default.join(uploadDir, filename);
    fs_1.default.writeFileSync(filepath, file.buffer);
    file.filename = filename;
    file.path = filepath;
    next();
};
exports.validateAndSaveFile = validateAndSaveFile;
