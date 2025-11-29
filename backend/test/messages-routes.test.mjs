import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

function makeRandomEmail(prefix = 'msg') {
  const rand = Math.floor(Math.random() * 1_000_000);
  return `${prefix}-${Date.now()}-${rand}@example.com`;
}

async function registerAndLogin() {
  const email = makeRandomEmail();
  const password = 'TestPassword123!';

  // Register
  let res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const registerBody = await res.json();
  assert.equal(
    res.status,
    201,
    `Expected 201 from register, got ${res.status}: ${JSON.stringify(registerBody)}`
  );
  assert.ok(registerBody._id, 'Register response should include _id');

  // Login
  res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginBody = await res.json();
  assert.equal(
    res.status,
    200,
    `Expected 200 from login, got ${res.status}: ${JSON.stringify(loginBody)}`
  );
  assert.ok(loginBody.token, 'Login response should include token');

  return { token: loginBody.token, userId: registerBody._id, email };
}

// --- Auth tests for messaging routes ---

test('POST /api/messages/conversations without token returns 401', async () => {
  const res = await fetch(`${BASE_URL}/api/messages/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ participantId: '000000000000000000000001' }),
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.message, 'Not authorized, no token');
});

test('POST /api/messages/conversations with invalid token returns 401', async () => {
  const res = await fetch(`${BASE_URL}/api/messages/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer totally-invalid-token',
    },
    body: JSON.stringify({ participantId: '000000000000000000000001' }),
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.message, 'Not authorized, token failed');
});

test('GET /api/messages/conversations without token returns 401', async () => {
  const res = await fetch(`${BASE_URL}/api/messages/conversations`);

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.message, 'Not authorized, no token');
});

// --- Happy-path messaging flow and behavior ---

test('Messaging happy path: create conversation, list, exchange messages, mark as read', async () => {
  // Arrange: create three users
  const userA = await registerAndLogin();
  const userB = await registerAndLogin();
  const userC = await registerAndLogin();

  // A creates a conversation with B
  let res = await fetch(`${BASE_URL}/api/messages/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA.token}`,
    },
    body: JSON.stringify({ participantId: userB.userId }),
  });
  let conv = await res.json();

  assert.ok(
    res.status === 200 || res.status === 201,
    `Expected 200 or 201 from conversation create, got ${res.status}: ${JSON.stringify(conv)}`
  );
  assert.ok(conv._id, 'Conversation should have an _id');
  assert.ok(Array.isArray(conv.participants), 'Conversation should have participants array');

  const participantIds = conv.participants.map(String).sort();
  const expected = [userA.userId, userB.userId].map(String).sort();
  assert.deepEqual(participantIds, expected, 'Conversation should include both A and B');

  const conversationId = conv._id;

  // A calls again with same participant; should reuse same conversation
  res = await fetch(`${BASE_URL}/api/messages/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA.token}`,
    },
    body: JSON.stringify({ participantId: userB.userId }),
  });
  const conv2 = await res.json();

  assert.equal(String(conv2._id), String(conversationId), 'Second call should reuse the same conversation');

  // List conversations for A and B
  res = await fetch(`${BASE_URL}/api/messages/conversations`, {
    headers: {
      'Authorization': `Bearer ${userA.token}`,
    },
  });
  let listA = await res.json();

  assert.equal(res.status, 200, `Expected 200 from conversations list for A, got ${res.status}`);
  assert.ok(Array.isArray(listA), 'List for A should be an array');
  assert.ok(
    listA.some(c => String(c._id) === String(conversationId)),
    'Conversation should appear in A\'s list'
  );

  res = await fetch(`${BASE_URL}/api/messages/conversations`, {
    headers: {
      'Authorization': `Bearer ${userB.token}`,
    },
  });
  let listB = await res.json();

  assert.equal(res.status, 200, `Expected 200 from conversations list for B, got ${res.status}`);
  assert.ok(Array.isArray(listB), 'List for B should be an array');
  assert.ok(
    listB.some(c => String(c._id) === String(conversationId)),
    'Conversation should appear in B\'s list'
  );

  // C should not see this conversation
  res = await fetch(`${BASE_URL}/api/messages/conversations`, {
    headers: {
      'Authorization': `Bearer ${userC.token}`,
    },
  });
  const listC = await res.json();

  assert.equal(res.status, 200, `Expected 200 from conversations list for C, got ${res.status}`);
  assert.ok(Array.isArray(listC), 'List for C should be an array');
  assert.ok(
    !listC.some(c => String(c._id) === String(conversationId)),
    'Conversation should not appear in C\'s list'
  );

  // Initially, messages should be empty
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    headers: {
      'Authorization': `Bearer ${userA.token}`,
    },
  });
  let messages = await res.json();

  assert.equal(res.status, 200, `Expected 200 from initial messages list, got ${res.status}`);
  assert.ok(Array.isArray(messages), 'Messages response should be an array');
  assert.equal(messages.length, 0, 'New conversation should start with no messages');

  // A sends a message to B
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA.token}`,
    },
    body: JSON.stringify({ body: 'Hello from A to B' }),
  });
  const msg1 = await res.json();

  assert.ok(
    res.status === 200 || res.status === 201,
    `Expected 200 or 201 from send message, got ${res.status}: ${JSON.stringify(msg1)}`
  );
  assert.ok(msg1._id, 'First message should have an _id');
  assert.equal(String(msg1.conversationId), String(conversationId));
  assert.equal(msg1.senderId, userA.userId);
  assert.equal(msg1.body, 'Hello from A to B');

  // B replies
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userB.token}`,
    },
    body: JSON.stringify({ body: 'Reply from B to A' }),
  });
  const msg2 = await res.json();

  assert.ok(
    res.status === 200 || res.status === 201,
    `Expected 200 or 201 from reply message, got ${res.status}: ${JSON.stringify(msg2)}`
  );
  assert.ok(msg2._id, 'Second message should have an _id');
  assert.equal(String(msg2.conversationId), String(conversationId));
  assert.equal(msg2.senderId, userB.userId);
  assert.equal(msg2.body, 'Reply from B to A');

  // Verify messages list and order
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    headers: {
      'Authorization': `Bearer ${userA.token}`,
    },
  });
  messages = await res.json();

  assert.equal(res.status, 200, `Expected 200 from messages list after sending, got ${res.status}`);
  assert.equal(messages.length, 2, 'Conversation should have 2 messages');
  assert.equal(messages[0].body, 'Hello from A to B');
  assert.equal(messages[0].senderId, userA.userId);
  assert.equal(messages[1].body, 'Reply from B to A');
  assert.equal(messages[1].senderId, userB.userId);

  // Before mark-as-read, messages should not be marked as read by B
  for (const m of messages) {
    if (Array.isArray(m.readBy)) {
      assert.ok(
        !m.readBy.includes(userB.userId),
        'Messages should not initially be marked as read by B'
      );
    }
  }

  // B marks conversation as read
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userB.token}`,
    },
    body: JSON.stringify({}),
  });
  const markBody = await res.json();

  assert.equal(
    res.status,
    200,
    `Expected 200 from mark-as-read, got ${res.status}: ${JSON.stringify(markBody)}`
  );

  // After mark-as-read, messages should be marked as read by B
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    headers: {
      'Authorization': `Bearer ${userB.token}`,
    },
  });
  messages = await res.json();

  assert.equal(res.status, 200, 'Expected 200 from messages list after mark-as-read');
  assert.equal(messages.length, 2, 'Messages count should not change after mark-as-read');

  for (const m of messages) {
    assert.ok(Array.isArray(m.readBy), 'Each message should have a readBy array after mark-as-read');
    assert.ok(
      m.readBy.includes(userB.userId),
      'Each message should be marked as read by user B'
    );
  }
});

// --- Validation tests for message body ---

test('POST /api/messages/conversations/:id/messages validates message body', async () => {
  const userA = await registerAndLogin();
  const userB = await registerAndLogin();

  // Create a conversation between A and B
  let res = await fetch(`${BASE_URL}/api/messages/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA.token}`,
    },
    body: JSON.stringify({ participantId: userB.userId }),
  });
  const conv = await res.json();

  assert.ok(conv._id, 'Conversation should have an _id');
  const conversationId = conv._id;

  // Empty (after trimming) body should be rejected
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA.token}`,
    },
    body: JSON.stringify({ body: '   ' }),
  });
  let body = await res.json();

  assert.equal(res.status, 400, 'Expected 400 for empty (trimmed) message body');
  assert.equal(typeof body.message, 'string', 'Error response should include a message string');

  // 500-char body should be accepted
  const maxAcceptedBody = 'x'.repeat(500);
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA.token}`,
    },
    body: JSON.stringify({ body: maxAcceptedBody }),
  });
  body = await res.json();

  assert.ok(
    res.status === 200 || res.status === 201,
    `Expected 200 or 201 for 500-char message body, got ${res.status}: ${JSON.stringify(body)}`
  );

  // Too-long body (> 500 chars) should be rejected
  const longBody = 'x'.repeat(501);
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA.token}`,
    },
    body: JSON.stringify({ body: longBody }),
  });
  body = await res.json();

  assert.equal(res.status, 400, 'Expected 400 for too-long message body');
  assert.equal(typeof body.message, 'string', 'Error response should include a message string');
});

// --- Access control: non-participant must not access conversation ---

test('Non-participant cannot access or send messages in a conversation', async () => {
  const userA = await registerAndLogin();
  const userB = await registerAndLogin();
  const userC = await registerAndLogin();

  // Create conversation between A and B
  let res = await fetch(`${BASE_URL}/api/messages/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA.token}`,
    },
    body: JSON.stringify({ participantId: userB.userId }),
  });
  const conv = await res.json();

  assert.ok(conv._id, 'Conversation should have an _id');
  const conversationId = conv._id;

  // C tries to get the conversation details
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}`, {
    headers: {
      'Authorization': `Bearer ${userC.token}`,
    },
  });
  let body = await res.json();

  assert.ok(
    res.status === 403 || res.status === 404,
    `Expected 403 or 404 for non-participant get conversation, got ${res.status}: ${JSON.stringify(body)}`
  );
  assert.equal(typeof body.message, 'string', 'Error response should include a message string');

  // C tries to list messages in the conversation
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    headers: {
      'Authorization': `Bearer ${userC.token}`,
    },
  });
  body = await res.json();

  assert.ok(
    res.status === 403 || res.status === 404,
    `Expected 403 or 404 for non-participant get messages, got ${res.status}: ${JSON.stringify(body)}`
  );
  assert.equal(typeof body.message, 'string', 'Error response should include a message string');

  // C tries to send a message
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userC.token}`,
    },
    body: JSON.stringify({ body: 'Intruding message' }),
  });
  body = await res.json();

  assert.ok(
    res.status === 403 || res.status === 404,
    `Expected 403 or 404 for non-participant send message, got ${res.status}: ${JSON.stringify(body)}`
  );
  assert.equal(typeof body.message, 'string', 'Error response should include a message string');

  // C tries to mark as read
  res = await fetch(`${BASE_URL}/api/messages/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userC.token}`,
    },
    body: JSON.stringify({}),
  });
  body = await res.json();

  assert.ok(
    res.status === 403 || res.status === 404,
    `Expected 403 or 404 for non-participant mark-as-read, got ${res.status}: ${JSON.stringify(body)}`
  );
  assert.equal(typeof body.message, 'string', 'Error response should include a message string');
});
