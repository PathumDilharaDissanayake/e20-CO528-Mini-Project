"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
const researchController_1 = require("../controllers/researchController");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
    filename: (req, file, cb) => cb(null, `${(0, crypto_1.randomUUID)()}${path_1.default.extname(file.originalname)}`)
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
router.get('/', researchController_1.getProjects);
router.post('/', researchController_1.createProject);
router.get('/:projectId', researchController_1.getProject);
router.put('/:projectId', researchController_1.updateProject);
router.delete('/:projectId', researchController_1.deleteProject);
router.post('/:projectId/collaborate', researchController_1.collaborateProject);
router.delete('/:projectId/collaborate', researchController_1.leaveProject);
router.post('/:projectId/documents', upload.single('document'), researchController_1.addDocument);
router.delete('/:projectId/documents/:documentId', researchController_1.deleteDocument);
exports.default = router;
