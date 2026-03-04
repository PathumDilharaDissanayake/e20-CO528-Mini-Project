import { Router } from 'express';
import {
  getFeed,
  createPost,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getPostReactions,
  addComment,
  deleteComment,
  getComments,
  sharePost,
  uploadFile,
  bookmarkPost,
  getBookmarkedPosts,
  votePoll,
} from '../controllers/postController';
import { memoryUpload, validateAndSaveFiles } from '../middleware/uploadValidator';

const router = Router();

router.get('/', getFeed);
router.get('/feed', getFeed);
// Bookmarks — must be BEFORE /:postId so it doesn't match as a postId
router.get('/bookmarks/me', getBookmarkedPosts);
// Dedicated file upload endpoint — returns URL without creating a post
router.post('/upload', memoryUpload.single('file'), validateAndSaveFiles, uploadFile);
router.post('/', memoryUpload.array('media', 5), validateAndSaveFiles, createPost);
router.get('/:postId', getPost);
router.put('/:postId', updatePost);
router.delete('/:postId', deletePost);
router.post('/:postId/like', likePost);
router.delete('/:postId/like', unlikePost);
router.get('/:postId/reactions', getPostReactions);
router.post('/:postId/share', sharePost);
router.post('/:postId/bookmark', bookmarkPost);
router.post('/:postId/vote', votePoll);
router.post('/:postId/comments', addComment);
router.get('/:postId/comments', getComments);
router.delete('/:postId/comments/:commentId', deleteComment);

export default router;
