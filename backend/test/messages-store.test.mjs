import test from 'node:test';
import assert from 'node:assert/strict';

// This test suite defines the contract for the Phase 1 message store abstraction.
// The implementation should live in ../src/messages/messageStore.js and export
// a createMessageStore({ backend }) factory. The same contract must be
// respected by both the in-memory and Mongo-backed implementations.

import { createMessageStore } from '../src/messages/messageStore.js';

// Use 24-character hex strings so they are valid ObjectId values for Mongo.
const USER_A_ID = '000000000000000000000001';
const USER_B_ID = '000000000000000000000002';
const THIRD_USER_ID = '000000000000000000000003';

function defineStoreTests(backend, { skip } = {}) {
  const testOptions = skip ? { skip: true } : {};

  test(`Message store [${backend}] getOrCreateConversation creates a new conversation`, testOptions, async () => {
    const store = await createMessageStore({ backend });

    const conversation = await store.getOrCreateConversation(USER_A_ID, USER_B_ID);

    assert.ok(conversation, 'Conversation should be returned');
    assert.ok(conversation._id, 'Conversation should have an _id');
    assert.ok(Array.isArray(conversation.participants), 'Conversation should have participants array');
    assert.equal(conversation.participants.length, 2, 'Conversation should have exactly two participants');

    const sorted = conversation.participants.map(String).sort();
    const expected = [USER_A_ID, USER_B_ID].map(String).sort();
    assert.deepEqual(sorted, expected, 'Conversation participants should match the two user IDs');
  });

  test(`Message store [${backend}] getOrCreateConversation reuses the same conversation for the same pair`, testOptions, async () => {
    const store = await createMessageStore({ backend });

    const conv1 = await store.getOrCreateConversation(USER_A_ID, USER_B_ID);
    const conv2 = await store.getOrCreateConversation(USER_A_ID, USER_B_ID);
    const conv3 = await store.getOrCreateConversation(USER_B_ID, USER_A_ID);

    assert.equal(conv1._id, conv2._id, 'Second call with same pair should reuse conversation');
    assert.equal(conv1._id, conv3._id, 'Order of participants should not matter');
  });

  test(`Message store [${backend}] listConversations returns conversations for each participant only`, testOptions, async () => {
    const store = await createMessageStore({ backend });

    const conv = await store.getOrCreateConversation(USER_A_ID, USER_B_ID);

    const forA = await store.listConversations(USER_A_ID);
    const forB = await store.listConversations(USER_B_ID);
    const forThird = await store.listConversations(THIRD_USER_ID);

    assert.ok(Array.isArray(forA), 'listConversations for A should return an array');
    assert.ok(Array.isArray(forB), 'listConversations for B should return an array');
    assert.ok(Array.isArray(forThird), 'listConversations for third user should return an array');

    assert.ok(forA.some(c => String(c._id) === String(conv._id)), 'Conversation should appear for user A');
    assert.ok(forB.some(c => String(c._id) === String(conv._id)), 'Conversation should appear for user B');
    assert.equal(forThird.length, 0, 'Uninvolved user should see no conversations');
  });

  test(`Message store [${backend}] addMessage and getMessages return the correct messages in order`, testOptions, async () => {
    const store = await createMessageStore({ backend });

    const conv = await store.getOrCreateConversation(USER_A_ID, USER_B_ID);

    const msg1 = await store.addMessage(conv._id, USER_A_ID, 'Hello from A to B');
    const msg2 = await store.addMessage(conv._id, USER_B_ID, 'Reply from B to A');

    assert.ok(msg1._id, 'First message should have an _id');
    assert.ok(msg2._id, 'Second message should have an _id');
    assert.equal(String(msg1.conversationId), String(conv._id), 'First message should belong to the conversation');
    assert.equal(String(msg2.conversationId), String(conv._id), 'Second message should belong to the conversation');

    const messages = await store.getMessages(conv._id);
    assert.equal(messages.length, 2, 'Conversation should have 2 messages');
    assert.equal(messages[0].body, 'Hello from A to B');
    assert.equal(messages[0].senderId, USER_A_ID);
    assert.equal(messages[1].body, 'Reply from B to A');
    assert.equal(messages[1].senderId, USER_B_ID);
  });

  test(`Message store [${backend}] markRead marks all messages as read for a user`, testOptions, async () => {
    const store = await createMessageStore({ backend });

    const conv = await store.getOrCreateConversation(USER_A_ID, USER_B_ID);
    await store.addMessage(conv._id, USER_A_ID, 'Message 1');
    await store.addMessage(conv._id, USER_A_ID, 'Message 2');

    let messages = await store.getMessages(conv._id);
    assert.equal(messages.length, 2, 'Two messages should be stored before markRead');

    // Before markRead, messages should not be marked as read by USER_B_ID
    for (const msg of messages) {
      if (Array.isArray(msg.readBy)) {
        assert.ok(
          !msg.readBy.includes(USER_B_ID),
          'Messages should not yet be marked as read by USER_B_ID'
        );
      }
    }

    await store.markRead(conv._id, USER_B_ID);

    messages = await store.getMessages(conv._id);
    assert.equal(messages.length, 2, 'Two messages should still be stored after markRead');

    for (const msg of messages) {
      assert.ok(
        Array.isArray(msg.readBy),
        'Messages should have a readBy array after markRead'
      );
      assert.ok(
        msg.readBy.includes(USER_B_ID),
        'Messages should be marked as read by USER_B_ID'
      );
    }
  });
}

// Always run the in-memory store tests.
defineStoreTests('memory');

// Run Mongo-backed store tests when MONGODB_URI is available.
defineStoreTests('mongo', { skip: !process.env.MONGODB_URI });
