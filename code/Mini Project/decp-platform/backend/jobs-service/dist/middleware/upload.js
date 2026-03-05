"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = exports.memoryUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPLOAD_DIR = path_1.default.join(__dirname, '..', '..', 'uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const ALLOWED_MIMETYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
};
exports.memoryUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});
const saveFile = (req, res, next) => {
    if (!req.file) {
        return next();
    }
    const file = req.file;
    const filename = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
    const filepath = path_1.default.join(UPLOAD_DIR, filename);
    fs_1.default.writeFileSync(filepath, file.buffer);
    file.filename = filename;
    file.path = filepath;
    next();
};
exports.saveFile = saveFile;
//# sourceMappingURL=upload.js.map