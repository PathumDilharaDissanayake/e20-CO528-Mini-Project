import { Router } from 'express';
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
import { memoryUpload, validateAndSaveFiles } from '../middleware/uploadValidator';

const router = Router();

router.get('/', getFeed);
router.get('/feed', getFeed);
router.post('/', memoryUpload.array('media', 5), validateAndSaveFiles, createPost);
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
