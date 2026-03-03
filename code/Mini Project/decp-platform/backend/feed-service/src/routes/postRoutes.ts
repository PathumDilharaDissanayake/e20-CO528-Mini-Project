import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import {
  getFeed,
  createPost,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
  getComments,
  sharePost
} from '../controllers/postController';

const router = Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.get('/', getFeed);
router.get('/feed', getFeed);
router.post('/', upload.array('media', 5), createPost);
router.get('/:postId', getPost);
router.put('/:postId', updatePost);
router.delete('/:postId', deletePost);
router.post('/:postId/like', likePost);
router.delete('/:postId/like', unlikePost);
router.post('/:postId/share', sharePost);
router.post('/:postId/comments', addComment);
router.get('/:postId/comments', getComments);
router.delete('/:postId/comments/:commentId', deleteComment);

export default router;
