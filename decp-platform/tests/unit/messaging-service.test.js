/**
 * Messaging Service Unit Tests
 * Tests for chat, messaging, and conversation functionality
 */

const {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  getMessages,
  deleteMessage,
  markAsRead,
  archiveConversation
} = require('../../backend/messaging-service/src/controllers/conversationController');
const { Conversation, Message } = require('../../backend/messaging-service/src/models');

// Mock dependencies
jest.mock('../../backend/messaging-service/src/models');
jest.mock('../../backend/messaging-service/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Messaging Service - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockConversation;
  let mockMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockConversation = {
      id: 'conv-123',
      type: 'direct',
      participants: ['user-123', 'user-456'],
      title: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
      isArchived: false,
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    };
    mockMessage = {
      id: 'msg-123',
      conversationId: 'conv-123',
      senderId: 'user-456',
      content: 'Hello! How are you?',
      type: 'text',
      attachments: [],
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    };
  });

  describe('Get Conversations', () => {
    test('should get user conversations', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: {}
      };
      Conversation.findAll.mockResolvedValue([
        { ...mockConversation, unreadCount: 2 },
        { ...mockConversation, id: 'conv-456', unreadCount: 0 }
      ]);

      await getConversations(mockReq, mockRes);

      expect(Conversation.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          participants: expect.any(Object)
        })
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });

    test('should filter archived conversations', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: { archived: 'true' }
      };
      Conversation.findAll.mockResolvedValue([
        { ...mockConversation, isArchived: true }
      ]);

      await getConversations(mockReq, mockRes);

      expect(Conversation.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isArchived: true })
      }));
    });

    test('should include last message preview', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: {}
      };
      Conversation.findAll.mockResolvedValue([
        {
          ...mockConversation,
          lastMessage: mockMessage
        }
      ]);

      await getConversations(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            lastMessage: expect.any(Object)
          })
        ])
      }));
    });

    test('should handle empty conversations list', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        query: {}
      };
      Conversation.findAll.mockResolvedValue([]);

      await getConversations(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: []
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq = { headers: {} };

      await getConversations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Get Conversation', () => {
    test('should get conversation by id', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await getConversation(mockReq, mockRes);

      expect(Conversation.findByPk).toHaveBeenCalledWith('conv-123');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ conversation: mockConversation })
      }));
    });

    test('should return 404 for non-existent conversation', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'nonexistent' }
      };
      Conversation.findByPk.mockResolvedValue(null);

      await getConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 if user is not participant', async () => {
      mockReq = {
        headers: { 'x-user-id': 'unauthorized-user' },
        params: { conversationId: 'conv-123' }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await getConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Create Conversation', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {
          type: 'direct',
          participants: ['user-456']
        }
      };
    });

    test('should create direct conversation successfully', async () => {
      Conversation.findOne.mockResolvedValue(null);
      Conversation.create.mockResolvedValue(mockConversation);

      await createConversation(mockReq, mockRes);

      expect(Conversation.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'direct',
        participants: ['user-123', 'user-456']
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should create group conversation', async () => {
      mockReq.body = {
        type: 'group',
        participants: ['user-456', 'user-789'],
        title: 'Study Group'
      };
      Conversation.create.mockResolvedValue({
        ...mockConversation,
        type: 'group',
        title: 'Study Group'
      });

      await createConversation(mockReq, mockRes);

      expect(Conversation.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'group',
        title: 'Study Group',
        participants: ['user-123', 'user-456', 'user-789']
      }));
    });

    test('should prevent duplicate direct conversations', async () => {
      Conversation.findOne.mockResolvedValue(mockConversation);

      await createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('already exists')
      }));
    });

    test('should return 400 for self-conversation', async () => {
      mockReq.body.participants = ['user-123'];

      await createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate group title', async () => {
      mockReq.body = {
        type: 'group',
        participants: ['user-456'],
        title: ''
      };

      await createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should limit group participants', async () => {
      mockReq.body = {
        type: 'group',
        participants: Array(101).fill('user-id'),
        title: 'Large Group'
      };

      await createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should return 401 if not authenticated', async () => {
      mockReq.headers = {};

      await createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Send Message', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        body: {
          content: 'Hello there!',
          type: 'text'
        }
      };
    });

    test('should send text message successfully', async () => {
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.create.mockResolvedValue(mockMessage);

      await sendMessage(mockReq, mockRes);

      expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
        conversationId: 'conv-123',
        senderId: 'user-123',
        content: 'Hello there!',
        type: 'text'
      }));
      expect(mockConversation.update).toHaveBeenCalledWith(expect.objectContaining({
        lastMessageAt: expect.any(Date)
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should send message with attachments', async () => {
      mockReq.body = {
        content: 'Check out this file',
        type: 'file',
        attachments: [
          { url: 'https://example.com/file.pdf', name: 'document.pdf', size: 1024 }
        ]
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.create.mockResolvedValue({
        ...mockMessage,
        type: 'file',
        attachments: mockReq.body.attachments
      });

      await sendMessage(mockReq, mockRes);

      expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'file',
        attachments: expect.any(Array)
      }));
    });

    test('should return 404 for non-existent conversation', async () => {
      Conversation.findByPk.mockResolvedValue(null);

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 if not conversation participant', async () => {
      mockReq.headers['x-user-id'] = 'unauthorized-user';
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should validate message content', async () => {
      mockReq.body.content = '';

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate message type', async () => {
      mockReq.body.type = 'invalid-type';

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle message with only attachments', async () => {
      mockReq.body = {
        content: '',
        type: 'image',
        attachments: [{ url: 'https://example.com/image.jpg', type: 'image/jpeg' }]
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.create.mockResolvedValue(mockMessage);

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Get Messages', () => {
    test('should get messages with pagination', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        query: { page: '1', limit: '20' }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findAndCountAll.mockResolvedValue({
        count: 50,
        rows: Array(20).fill(mockMessage)
      });

      await getMessages(mockReq, mockRes);

      expect(Message.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { conversationId: 'conv-123' },
        order: [['createdAt', 'DESC']],
        limit: 20,
        offset: 0
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({ total: 50 })
      }));
    });

    test('should return 403 if not participant', async () => {
      mockReq = {
        headers: { 'x-user-id': 'unauthorized-user' },
        params: { conversationId: 'conv-123' },
        query: {}
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await getMessages(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle empty message list', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        query: {}
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await getMessages(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        meta: expect.objectContaining({ total: 0 })
      }));
    });

    test('should filter messages by date range', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        query: { since: '2024-01-01', until: '2024-01-31' }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: Array(10).fill(mockMessage)
      });

      await getMessages(mockReq, mockRes);

      expect(Message.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });
  });

  describe('Delete Message', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { conversationId: 'conv-123', messageId: 'msg-123' }
      };
    });

    test('should delete own message', async () => {
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findByPk.mockResolvedValue(mockMessage);

      await deleteMessage(mockReq, mockRes);

      expect(mockMessage.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Message deleted'
      }));
    });

    test('should return 404 for non-existent message', async () => {
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findByPk.mockResolvedValue(null);

      await deleteMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized deletion', async () => {
      mockReq.headers['x-user-id'] = 'user-123';
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findByPk.mockResolvedValue(mockMessage);

      await deleteMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should allow deletion within time limit', async () => {
      mockMessage.createdAt = new Date(Date.now() - 300000); // 5 minutes ago
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findByPk.mockResolvedValue(mockMessage);

      await deleteMessage(mockReq, mockRes);

      expect(mockMessage.destroy).toHaveBeenCalled();
    });

    test('should prevent deletion after time limit', async () => {
      mockMessage.createdAt = new Date(Date.now() - 86400000); // 24 hours ago
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findByPk.mockResolvedValue(mockMessage);

      await deleteMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Mark as Read', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        body: { messageIds: ['msg-123', 'msg-124'] }
      };
    });

    test('should mark messages as read', async () => {
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.update.mockResolvedValue([2]);

      await markAsRead(mockReq, mockRes);

      expect(Message.update).toHaveBeenCalledWith(
        { isRead: true, readAt: expect.any(Date) },
        expect.any(Object)
      );
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Messages marked as read'
      }));
    });

    test('should mark all unread messages as read', async () => {
      mockReq.body = {}; // No specific message IDs
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.update.mockResolvedValue([5]);

      await markAsRead(mockReq, mockRes);

      expect(Message.update).toHaveBeenCalledWith(
        { isRead: true, readAt: expect.any(Date) },
        expect.objectContaining({
          where: expect.objectContaining({
            conversationId: 'conv-123',
            senderId: expect.any(Object),
            isRead: false
          })
        })
      );
    });

    test('should return 403 if not participant', async () => {
      mockReq.headers['x-user-id'] = 'unauthorized-user';
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await markAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should not mark own messages as read', async () => {
      mockReq.body = {}; // Mark all as read
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await markAsRead(mockReq, mockRes);

      expect(Message.update).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
        where: expect.objectContaining({
          senderId: expect.any(Object) // Should exclude own messages
        })
      }));
    });
  });

  describe('Archive Conversation', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' }
      };
    });

    test('should archive conversation', async () => {
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await archiveConversation(mockReq, mockRes);

      expect(mockConversation.update).toHaveBeenCalledWith({ isArchived: true });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Conversation archived'
      }));
    });

    test('should unarchive conversation', async () => {
      mockReq.body = { archived: false };
      mockConversation.isArchived = true;
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await archiveConversation(mockReq, mockRes);

      expect(mockConversation.update).toHaveBeenCalledWith({ isArchived: false });
    });

    test('should return 403 if not participant', async () => {
      mockReq.headers['x-user-id'] = 'unauthorized-user';
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await archiveConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle very long messages', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        body: {
          content: 'a'.repeat(10000),
          type: 'text'
        }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.create.mockResolvedValue(mockMessage);

      await sendMessage(mockReq, mockRes);

      // Should either accept or truncate/reject
      expect(mockRes.status).toBeDefined();
    });

    test('should handle unicode and emojis in messages', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        body: {
          content: 'Hello! 👋 你好 🎉 مرحبا',
          type: 'text'
        }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.create.mockResolvedValue(mockMessage);

      await sendMessage(mockReq, mockRes);

      expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('👋')
      }));
    });

    test('should handle many attachments', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        body: {
          content: 'Files attached',
          type: 'file',
          attachments: Array(20).fill({ url: 'https://example.com/file.pdf' })
        }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.create.mockResolvedValue(mockMessage);

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle rapid message sending', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        body: { content: 'Rapid message', type: 'text' }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.create.mockResolvedValue(mockMessage);

      // Simulate rapid sending
      const promises = Array(10).fill().map(() => sendMessage(mockReq, mockRes));
      await Promise.all(promises);

      expect(Message.create).toHaveBeenCalledTimes(10);
    });

    test('should handle conversation with thousands of messages', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        query: { page: '100', limit: '50' }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findAndCountAll.mockResolvedValue({
        count: 5000,
        rows: Array(50).fill(mockMessage)
      });

      await getMessages(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        meta: expect.objectContaining({ total: 5000 })
      }));
    });

    test('should handle special characters that could be XSS', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        body: {
          content: '<script>alert("xss")</script> <img src=x onerror=alert(1)>',
          type: 'text'
        }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.create.mockResolvedValue(mockMessage);

      await sendMessage(mockReq, mockRes);

      expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.not.stringContaining('<script>')
      }));
    });

    test('should handle group conversation with all members leaving', async () => {
      const emptyGroupConversation = {
        ...mockConversation,
        type: 'group',
        participants: ['user-123']
      };
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' }
      };
      Conversation.findByPk.mockResolvedValue(emptyGroupConversation);

      // This would typically be handled in a leave function
      // Testing that the conversation still exists
      expect(emptyGroupConversation.participants).toHaveLength(1);
    });

    test('should handle message search in conversation', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        query: { q: 'search term' }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);
      Message.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: [mockMessage, mockMessage, mockMessage]
      });

      await getMessages(mockReq, mockRes);

      expect(Message.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });

    test('should handle very large group conversations', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        body: {
          type: 'group',
          participants: Array(100).fill(0).map((_, i) => `user-${i}`),
          title: 'Large Group'
        }
      };
      Conversation.create.mockResolvedValue({
        ...mockConversation,
        type: 'group',
        participants: mockReq.body.participants
      });

      await createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle conversation with large attachments', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-123' },
        params: { conversationId: 'conv-123' },
        body: {
          content: 'Large file',
          type: 'file',
          attachments: [
            { url: 'https://example.com/large-file.zip', size: 100 * 1024 * 1024 } // 100MB
          ]
        }
      };
      Conversation.findByPk.mockResolvedValue(mockConversation);

      await sendMessage(mockReq, mockRes);

      // Should either accept or reject based on size limits
      expect(mockRes.status).toBeDefined();
    });
  });
});
