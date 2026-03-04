"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postController_1 = require("../controllers/postController");
const uploadValidator_1 = require("../middleware/uploadValidator");
const router = (0, express_1.Router)();
router.get('/', postController_1.getFeed);
router.get('/feed', postController_1.getFeed);
// Bookmarks — must be BEFORE /:postId so it doesn't match as a postId
router.get('/bookmarks/me', postController_1.getBookmarkedPosts);
// Dedicated file upload endpoint — returns URL without creating a post
router.post('/upload', uploadValidator_1.memoryUpload.single('file'), uploadValidator_1.validateAndSaveFiles, postController_1.uploadFile);
router.post('/', uploadValidator_1.memoryUpload.array('media', 5), uploadValidator_1.validateAndSaveFiles, postController_1.createPost);
router.get('/:postId', postController_1.getPost);
router.put('/:postId', postController_1.updatePost);
router.delete('/:postId', postController_1.deletePost);
router.post('/:postId/like', postController_1.likePost);
router.delete('/:postId/like', postController_1.unlikePost);
router.get('/:postId/reactions', postController_1.getPostReactions);
router.post('/:postId/share', postController_1.sharePost);
router.post('/:postId/bookmark', postController_1.bookmarkPost);
router.post('/:postId/vote', postController_1.votePoll);
router.post('/:postId/comments', postController_1.addComment);
router.get('/:postId/comments', postController_1.getComments);
router.delete('/:postId/comments/:commentId', postController_1.deleteComment);
exports.default = router;
//# sourceMappingURL=postRoutes.js.map