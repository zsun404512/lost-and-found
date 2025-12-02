import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock object standing in for the real messageStore
const mockStore = {
  getOrCreateConversation: jest.fn(),
};

const createMessageStoreMock = jest.fn(() => mockStore);

// Replace createMessageStore before importing the router under test
jest.unstable_mockModule('../../messages/messageStore.js', () => ({
  __esModule: true,
  createMessageStore: createMessageStoreMock,
}));

const messagesRoutesModule = await import('../messagesRoutes.js');
const messagesRouter = messagesRoutesModule.default;

function createApp() {
  const app = express();
  app.use(express.json());

  // Simulate authenticated user so routes can read req.user.userId
  app.use('/api/messages', (req, res, next) => {
    req.user = { userId: 'current-user-id' };
    next();
  });

  app.use('/api/messages', messagesRouter);
  return app;
}

describe('POST /api/messages/conversations', () => {
  beforeEach(() => {
    createMessageStoreMock.mockClear();
    mockStore.getOrCreateConversation.mockReset();
  });

  test('calls messageStore.getOrCreateConversation and returns 201 with the conversation', async () => {
    const fakeConversation = {
      _id: 'conv1',
      participants: ['current-user-id', 'other-user-id'],
    };

    mockStore.getOrCreateConversation.mockResolvedValue(fakeConversation);

    const app = createApp();

    const res = await request(app)
      .post('/api/messages/conversations')
      .send({ participantId: 'other-user-id' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(fakeConversation);

    // Verify the indirect output: correct call into the DOC (mockStore)
    expect(mockStore.getOrCreateConversation).toHaveBeenCalledTimes(1);
    expect(mockStore.getOrCreateConversation).toHaveBeenCalledWith(
      'current-user-id',
      'other-user-id',
    );
  });

  test('returns 400 when participantId is missing and does not call messageStore', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/messages/conversations')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'participantId is required' });

    expect(mockStore.getOrCreateConversation).not.toHaveBeenCalled();
  });

  test('returns 500 when messageStore.getOrCreateConversation throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockStore.getOrCreateConversation.mockRejectedValue(new Error('store error'));

    const app = createApp();

    const res = await request(app)
      .post('/api/messages/conversations')
      .send({ participantId: 'other-user-id' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Server Error' });

    consoleSpy.mockRestore();
  });
});
