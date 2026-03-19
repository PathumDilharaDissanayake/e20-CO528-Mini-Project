"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversationController_1 = require("../controllers/conversationController");
const router = (0, express_1.Router)();
router.get('/', conversationController_1.getConversations);
router.post('/', conversationController_1.createConversation);
// Specific sub-routes BEFORE parameterized /:conversationId
router.get('/:conversationId/messages', conversationController_1.getMessages);
router.post('/:conversationId/messages', conversationController_1.sendMessage);
router.get('/:conversationId', conversationController_1.getConversationById);
exports.default = router;
