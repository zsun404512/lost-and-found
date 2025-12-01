import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';

function createMemoryStore() {
  let nextId = 1;
  const conversations = [];
  const messages = [];

  function makeId() {
    // Return a 24-character zero-padded numeric string to resemble an ObjectId.
    const id = String(nextId++);
    return id.padStart(24, '0');
  }

  function normalizeConversation(conv) {
    if (!conv) return null;
    return {
      _id: String(conv._id),
      participants: (conv.participants || []).map((p) => String(p)),
      tag: conv.tag || 'none',
      itemId: conv.itemId ? String(conv.itemId) : null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  function normalizeMessage(msg) {
    if (!msg) return null;
    return {
      _id: String(msg._id),
      conversationId: String(msg.conversationId),
      senderId: String(msg.senderId),
      body: msg.body,
      readBy: Array.isArray(msg.readBy)
        ? msg.readBy.map((u) => String(u))
        : [],
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    };
  }

  return {
    async getOrCreateConversation(userIdA, userIdB, options = {}) {
      const { itemId } = options || {};
      const a = String(userIdA);
      const b = String(userIdB);
      const target = [a, b].sort().join(':');

      let existing = conversations.find((c) => {
        const key = c.participants.map(String).sort().join(':');
        return key === target;
      });

      if (!existing) {
        const now = new Date();
        existing = {
          _id: makeId(),
          participants: [a, b],
          itemId: itemId ? String(itemId) : null,
          tag: 'none',
          createdAt: now,
          updatedAt: now,
        };
        conversations.push(existing);
      } else if (itemId && !existing.itemId) {
        existing.itemId = String(itemId);
        existing.updatedAt = new Date();
      }

      return normalizeConversation(existing);
    },

    async listConversations(userId) {
      const id = String(userId);
      const list = conversations.filter((c) =>
        c.participants.some((p) => String(p) === id)
      );
      return list.map(normalizeConversation);
    },

    async getConversationById(conversationId) {
      const id = String(conversationId);
      const conv = conversations.find((c) => String(c._id) === id);
      return normalizeConversation(conv);
    },

    async setConversationTag(conversationId, tag) {
      const id = String(conversationId);
      const conv = conversations.find((c) => String(c._id) === id);
      if (!conv) return null;
      conv.tag = tag;
      conv.updatedAt = new Date();
      return normalizeConversation(conv);
    },

    async addMessage(conversationId, senderId, body) {
      const now = new Date();
      const msg = {
        _id: makeId(),
        conversationId: String(conversationId),
        senderId: String(senderId),
        body,
        readBy: [],
        createdAt: now,
        updatedAt: now,
      };
      messages.push(msg);
      return normalizeMessage(msg);
    },

    async getMessages(conversationId) {
      const id = String(conversationId);
      const list = messages
        .filter((m) => String(m.conversationId) === id)
        .sort((a, b) => a.createdAt - b.createdAt);
      return list.map(normalizeMessage);
    },

    async markRead(conversationId, userId) {
      const convId = String(conversationId);
      const uid = String(userId);

      for (const msg of messages) {
        if (String(msg.conversationId) !== convId) continue;
        if (!Array.isArray(msg.readBy)) {
          msg.readBy = [];
        }
        if (!msg.readBy.some((u) => String(u) === uid)) {
          msg.readBy.push(uid);
        }
      }
    },
  };
}

function createMongoStore() {
  function normalizeConversation(conv) {
    if (!conv) return null;
    return {
      _id: String(conv._id),
      participants: (conv.participants || []).map((p) => String(p)),
      tag: conv.tag || 'none',
      itemId: conv.itemId ? String(conv.itemId) : null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  function normalizeMessage(msg) {
    if (!msg) return null;
    return {
      _id: String(msg._id),
      conversationId: String(msg.conversationId),
      senderId: String(msg.senderId),
      body: msg.body,
      readBy: Array.isArray(msg.readBy)
        ? msg.readBy.map((u) => String(u))
        : [],
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    };
  }

  return {
    async getOrCreateConversation(userIdA, userIdB, options = {}) {
      const { itemId, tag } = options || {};
      const a = String(userIdA);
      const b = String(userIdB);

      let conv = await Conversation.findOne({
        participants: { $all: [a, b] },
      }).lean();

      if (!conv) {
        const created = await Conversation.create({
          participants: [a, b],
          itemId: itemId || null,
          tag: 'none',
        });
        conv = created.toObject();
      } else if (itemId && !conv.itemId) {
        await Conversation.updateOne({ _id: conv._id }, { itemId });
        conv.itemId = itemId;
      }

      return normalizeConversation(conv);
    },

    async listConversations(userId) {
      const id = String(userId);
      const list = await Conversation.find({
        participants: id,
      }).lean();
      return list.map(normalizeConversation);
    },

    async getConversationById(conversationId) {
      const conv = await Conversation.findById(conversationId).lean();
      return normalizeConversation(conv);
    },

    async setConversationTag(conversationId, tag) {
      const updated = await Conversation.findByIdAndUpdate(
        conversationId,
        { tag },
        { new: true, lean: true },
      );
      return normalizeConversation(updated);
    },

    async addMessage(conversationId, senderId, body) {
      const created = await Message.create({
        conversationId,
        senderId,
        body,
        readBy: [],
      });
      const msg = created.toObject();
      return normalizeMessage(msg);
    },

    async getMessages(conversationId) {
      const list = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .lean();
      return list.map(normalizeMessage);
    },

    async markRead(conversationId, userId) {
      const uid = String(userId);
      await Message.updateMany(
        { conversationId },
        { $addToSet: { readBy: uid } }
      );
    },
  };
}

export function createMessageStore({ backend } = {}) {
  const mode = backend || (process.env.MONGODB_URI ? 'mongo' : 'memory');

  if (mode === 'mongo') {
    return createMongoStore();
  }

  return createMemoryStore();
}
