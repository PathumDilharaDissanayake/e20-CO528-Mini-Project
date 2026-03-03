"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const postController_1 = require("../controllers/postController");
const router = (0, express_1.Router)();
// Multer configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR || 'uploads');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    }
});
router.get('/', postController_1.getFeed);
router.get('/feed', postController_1.getFeed);
router.post('/', upload.array('media', 5), postController_1.createPost);
router.get('/:postId', postController_1.getPost);
router.put('/:postId', postController_1.updatePost);
router.delete('/:postId', postController_1.deletePost);
router.post('/:postId/like', postController_1.likePost);
router.delete('/:postId/like', postController_1.unlikePost);
router.post('/:postId/share', postController_1.sharePost);
router.post('/:postId/comments', postController_1.addComment);
router.get('/:postId/comments', postController_1.getComments);
router.delete('/:postId/comments/:commentId', postController_1.deleteComment);
exports.default = router;
//# sourceMappingURL=postRoutes.js.map