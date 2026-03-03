/**
 * conversationService unit tests — business logic layer, no HTTP.
 * Agent: A-11 (Testing Agent) | 2026-03-03
 */

jest.mock('../../backend/messaging-service/src/models', () => ({
  Conversation: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  Message: {
    findAndCountAll: jest.fn(),
    create: jest.fn()
  }
}));

const { getConversations, getConversationById, createConversation, getMessages, sendMessage } =
  require('../../backend/messaging-service/src/services/conversationService');
const { Conversation, Message } = require('../../backend/messaging-service/src/models');

const mockConv = (overrides = {}) => ({
  id: 'conv-1',
  type: 'direct',
  participants: ['user-1', 'user-2'],
  createdBy: 'user-1',
  update: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

const mockMsg = (overrides = {}) => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'Hello',
  isDeleted: false,
  ...overrides
});

beforeEach(() => jest.clearAllMocks());

// ─── getConversations ──────────────────────────────────────────────────────────

describe('getConversations', () => {
  test('returns conversations where user is a participant', async () => {
    Conversation.findAll.mockResolvedValue([mockConv()]);
    const result = await getConversations('user-1');
    expect(result).toHaveLength(1);
    expect(Conversation.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.any(Object)
    }));
  });
});

// ─── getConversationById ───────────────────────────────────────────────────────

describe('getConversationById', () => {
  test('returns conversation for participant', async () => {
    Conversation.findByPk.mockResolvedValue(mockConv());
    const result = await getConversationById('conv-1', 'user-1');
    expect(result).toBeDefined();
  });

  test('throws 404 when conversation not found', async () => {
    Conversation.findByPk.mockResolvedValue(null);
    await expect(getConversationById('ghost', 'user-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  test('throws 403 when user is not a participant', async () => {
    Conversation.findByPk.mockResolvedValue(mockConv({ participants: ['user-1', 'user-2'] }));
    await expect(getConversationById('conv-1', 'user-9')).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── createConversation ────────────────────────────────────────────────────────

describe('createConversation', () => {
  test('creates new direct conversation', async () => {
    Conversation.findOne.mockResolvedValue(null); // no existing
    const conv = mockConv();
    Conversation.create.mockResolvedValue(conv);
    const result = await createConversation('user-1', { type: 'direct', participants: ['user-2'] });
    expect(result).toBe(conv);
  });

  test('returns existing direct conversation (idempotent)', async () => {
    const existing = mockConv();
    Conversation.findOne.mockResolvedValue(existing);
    const result = await createConversation('user-1', { type: 'direct', participants: ['user-2'] });
    expect(result).toBe(existing);
    expect(Conversation.create).not.toHaveBeenCalled();
  });

  test('always includes creator in participants list', async () => {
    Conversation.findOne.mockResolvedValue(null);
    const conv = mockConv();
    Conversation.create.mockResolvedValue(conv);
    await createConversation('user-1', { type: 'direct', participants: ['user-2'] });
    const [args] = Conversation.create.mock.calls;
    expect(args[0].participants).toContain('user-1');
  });

  test('deduplicates participants (creator already in list)', async () => {
    Conversation.findOne.mockResolvedValue(null);
    Conversation.create.mockResolvedValue(mockConv());
    await createConversation('user-1', { type: 'direct', participants: ['user-1', 'user-2'] });
    const [args] = Conversation.create.mock.calls;
    const count = args[0].participants.filter((id) => id === 'user-1').length;
    expect(count).toBe(1);
  });

  test('creates group conversation without idempotency check', async () => {
    Conversation.create.mockResolvedValue(mockConv({ type: 'group' }));
    const result = await createConversation('user-1', {
      type: 'group', title: 'Study Group', participants: ['user-2', 'user-3']
    });
    expect(Conversation.findOne).not.toHaveBeenCalled();
    expect(result.type).toBe('group');
  });
});

// ─── getMessages ───────────────────────────────────────────────────────────────

describe('getMessages', () => {
  test('returns messages for participant in reverse chronological order', async () => {
    Conversation.findByPk.mockResolvedValue(mockConv());
    const msg = mockMsg();
    Message.findAndCountAll.mockResolvedValue({ count: 1, rows: [msg] });
    const result = await getMessages('conv-1', 'user-1', 1, 50);
    expect(result.messages).toContain(msg);
    expect(result.total).toBe(1);
  });

  test('throws 403 for non-participant', async () => {
    Conversation.findByPk.mockResolvedValue(mockConv({ participants: ['user-1', 'user-2'] }));
    await expect(getMessages('conv-1', 'user-9', 1, 50)).rejects.toMatchObject({ statusCode: 403 });
  });

  test('clamps limit to 100 max', async () => {
    Conversation.findByPk.mockResolvedValue(mockConv());
    Message.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await getMessages('conv-1', 'user-1', 1, 500);
    const [args] = Message.findAndCountAll.mock.calls;
    expect(args[0].limit).toBe(100);
  });

  test('queries only non-deleted messages', async () => {
    Conversation.findByPk.mockResolvedValue(mockConv());
    Message.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await getMessages('conv-1', 'user-1');
    const [args] = Message.findAndCountAll.mock.calls;
    expect(args[0].where.isDeleted).toBe(false);
  });
});

// ─── sendMessage ───────────────────────────────────────────────────────────────

describe('sendMessage', () => {
  test('sends message and updates conversation.updatedAt', async () => {
    const conv = mockConv();
    Conversation.findByPk.mockResolvedValue(conv);
    const msg = mockMsg();
    Message.create.mockResolvedValue(msg);
    const result = await sendMessage('conv-1', 'user-1', { content: 'Hello', type: 'text' });
    expect(result).toBe(msg);
    expect(conv.update).toHaveBeenCalled(); // updatedAt touch
  });

  test('throws 403 for non-participant', async () => {
    Conversation.findByPk.mockResolvedValue(mockConv({ participants: ['user-1', 'user-2'] }));
    await expect(sendMessage('conv-1', 'user-9', { content: 'Hi' })).rejects.toMatchObject({ statusCode: 403 });
  });
});
