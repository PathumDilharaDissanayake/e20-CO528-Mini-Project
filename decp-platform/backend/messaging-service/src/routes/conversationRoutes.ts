import { Router } from 'express';
import {
  getConversations,
  getConversationById,
  createConversation,
  getMessages,
  sendMessage
} from '../controllers/conversationController';

const router = Router();

router.get('/', getConversations);
router.post('/', createConversation);
// Specific sub-routes BEFORE parameterized /:conversationId
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);
router.get('/:conversationId', getConversationById);

export default router;
