import express from 'express';
import { createMessageStore } from '../messages/messageStore.js';
import User from '../models/userModel.js';

const router = express.Router();

const storeBackend = process.env.MONGODB_URI ? 'mongo' : 'memory';
const messageStore = createMessageStore({ backend: storeBackend });

router.post('/conversations', async (req, res) => {
  try {
    const currentUserId = req.user && req.user.userId;
    const { participantId } = req.body || {};

    if (!participantId) {
      return res.status(400).json({ message: 'participantId is required' });
    }

    const conversation = await messageStore.getOrCreateConversation(
      currentUserId,
      participantId
    );

    return res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/conversations', async (req, res) => {
  try {
    const currentUserId = req.user && req.user.userId;
    const rawConversations = await messageStore.listConversations(currentUserId);

    const conversations = Array.isArray(rawConversations)
      ? rawConversations
      : [];

    const currentIdStr = String(currentUserId || '');

    const otherIds = new Set();
    const metaByConvId = new Map();

    for (const conv of conversations) {
      const participants = (conv.participants || []).map(String);
      const otherId = participants.find((id) => id !== currentIdStr) || null;
      const pairKey = participants.slice().sort().join(':');

      metaByConvId.set(String(conv._id), {
        participants,
        otherId,
        pairKey,
      });

      if (otherId) {
        otherIds.add(otherId);
      }
    }

    let emailById = new Map();

    // Only attempt user lookups when using the MongoDB backend.
    if (otherIds.size > 0 && process.env.MONGODB_URI) {
      const ids = Array.from(otherIds);
      const users = await User.find({ _id: { $in: ids } })
        .select('_id email')
        .lean();

      emailById = new Map(
        users.map((u) => [String(u._id), u.email]),
      );
    }

    const seenPairKeys = new Set();
    const enriched = [];

    for (const conv of conversations) {
      const meta = metaByConvId.get(String(conv._id));
      if (!meta) continue;

      const { participants, otherId, pairKey } = meta;

      if (pairKey && seenPairKeys.has(pairKey)) {
        // Avoid duplicate conversations for the same pair of participants.
        continue;
      }

      if (pairKey) {
        seenPairKeys.add(pairKey);
      }

      const otherEmail = otherId ? emailById.get(otherId) || null : null;

      enriched.push({
        ...conv,
        participants,
        otherParticipantId: otherId,
        otherParticipantEmail: otherEmail,
      });
    }

    return res.json(enriched);
  } catch (error) {
    console.error('List conversations error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const currentUserId = req.user && req.user.userId;
    const { conversationId } = req.params;

    const conversation = await messageStore.getConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (id) => String(id) === String(currentUserId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    return res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const currentUserId = req.user && req.user.userId;
    const { conversationId } = req.params;

    const conversation = await messageStore.getConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (id) => String(id) === String(currentUserId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    const messages = await messageStore.getMessages(conversationId);
    return res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const currentUserId = req.user && req.user.userId;
    const { conversationId } = req.params;
    const { body } = req.body || {};

    const conversation = await messageStore.getConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (id) => String(id) === String(currentUserId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    const text = (body || '').trim();

    if (!text) {
      return res.status(400).json({ message: 'Message body is required' });
    }

    if (text.length > 500) {
      return res.status(400).json({ message: 'Message body must be at most 500 characters' });
    }

    const message = await messageStore.addMessage(conversationId, currentUserId, text);
    return res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/conversations/:conversationId/read', async (req, res) => {
  try {
    const currentUserId = req.user && req.user.userId;
    const { conversationId } = req.params;

    const conversation = await messageStore.getConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (id) => String(id) === String(currentUserId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    await messageStore.markRead(conversationId, currentUserId);

    return res.status(200).json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark conversation read error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
