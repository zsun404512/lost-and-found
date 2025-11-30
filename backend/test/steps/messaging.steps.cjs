const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

function makeSlug(prefix = 'msg') {
  const rand = Math.floor(Math.random() * 1_000_000);
  return `${prefix}-${Date.now()}-${rand}`;
}

async function ensureMessagingUser(world, name) {
  world.context.messagingUsers = world.context.messagingUsers || {};
  if (world.context.messagingUsers[name]) {
    return world.context.messagingUsers[name];
  }

  const slug = makeSlug(name.toLowerCase());
  const email = `${slug}@example.com`;
  const password = 'TestPassword123!';

  // Register
  let res = await world.request.post('/api/auth/register').send({ email, password });
  expect(res.status).to.equal(201);
  expect(res.body._id).to.exist;

  const userId = String(res.body._id);

  // Login
  res = await world.request.post('/api/auth/login').send({ email, password });
  expect(res.status).to.equal(200);
  expect(res.body.token).to.exist;

  const user = {
    userId,
    email,
    password,
    token: res.body.token,
  };

  world.context.messagingUsers[name] = user;
  return user;
}

function setConversationForPair(world, nameA, nameB, conversationId) {
  const key = [nameA, nameB].map(String).sort().join('|');
  world.context.conversationsByKey = world.context.conversationsByKey || {};
  world.context.conversationsByKey[key] = String(conversationId);
  world.context.lastConversationId = String(conversationId);
}

function getConversationForPair(world, nameA, nameB) {
  const key = [nameA, nameB].map(String).sort().join('|');
  const map = world.context.conversationsByKey || {};
  return map[key];
}

Given('a registered messaging user {string}', async function (name) {
  await ensureMessagingUser(this, name);
});

When('{string} creates a conversation with {string}', async function (nameA, nameB) {
  const userA = await ensureMessagingUser(this, nameA);
  const userB = await ensureMessagingUser(this, nameB);

  const res = await this.request
    .post('/api/messages/conversations')
    .set('Authorization', `Bearer ${userA.token}`)
    .send({ participantId: userB.userId });

  this.response = res;

  expect(res.status).to.be.oneOf([200, 201]);
  expect(res.body._id).to.exist;

  setConversationForPair(this, nameA, nameB, res.body._id);
});

Then('there should be a conversation between {string} and {string}', function (nameA, nameB) {
  const convId = getConversationForPair(this, nameA, nameB);
  expect(convId, 'Expected a conversation id for this pair').to.exist;
});

When('user {string} sends a message {string} in that conversation', async function (name, messageText) {
  const user = await ensureMessagingUser(this, name);
  const conversationId = this.context.lastConversationId;

  expect(conversationId, 'lastConversationId not set in context').to.exist;

  const res = await this.request
    .post(`/api/messages/conversations/${conversationId}/messages`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({ body: messageText });

  this.response = res;

  expect(res.status).to.be.oneOf([200, 201]);
  expect(res.body._id).to.exist;
});

When('user {string} fetches messages for that conversation', async function (name) {
  const user = await ensureMessagingUser(this, name);
  const conversationId = this.context.lastConversationId;

  expect(conversationId, 'lastConversationId not set in context').to.exist;

  const res = await this.request
    .get(`/api/messages/conversations/${conversationId}/messages`)
    .set('Authorization', `Bearer ${user.token}`);

  this.response = res;
});

Then('the messaging response should contain messages:', function (dataTable) {
  const res = this.response;
  expect(res, 'response not set').to.exist;
  expect(res.status).to.equal(200);

  const messages = res.body;
  expect(messages).to.be.an('array');

  const expected = dataTable.hashes();
  expect(messages.length).to.equal(expected.length);

  for (let i = 0; i < expected.length; i += 1) {
    const row = expected[i];
    const msg = messages[i];

    expect(msg.body).to.equal(row.body);

    const user = this.context.messagingUsers && this.context.messagingUsers[row.sender];
    expect(user, `Unknown sender alias: ${row.sender}`).to.exist;
    expect(String(msg.senderId)).to.equal(String(user.userId));
  }
});

When('user {string} marks that conversation as read', async function (name) {
  const user = await ensureMessagingUser(this, name);
  const conversationId = this.context.lastConversationId;

  expect(conversationId, 'lastConversationId not set in context').to.exist;

  const res = await this.request
    .post(`/api/messages/conversations/${conversationId}/read`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({});

  this.response = res;
});

Then('all messages in the messaging response should be marked as read by {string}', function (name) {
  const res = this.response;
  expect(res, 'response not set').to.exist;
  expect(res.status).to.equal(200);

  const messages = res.body;
  expect(messages).to.be.an('array');

  const user = this.context.messagingUsers && this.context.messagingUsers[name];
  expect(user, `Unknown user alias: ${name}`).to.exist;

  for (const msg of messages) {
    expect(msg.readBy, 'message.readBy should be an array').to.be.an('array');
    const ids = msg.readBy.map((id) => String(id));
    expect(ids).to.include(String(user.userId));
  }
});

When('user {string} tries to get that conversation', async function (name) {
  const user = await ensureMessagingUser(this, name);
  const conversationId = this.context.lastConversationId;

  expect(conversationId, 'lastConversationId not set in context').to.exist;

  const res = await this.request
    .get(`/api/messages/conversations/${conversationId}`)
    .set('Authorization', `Bearer ${user.token}`);

  this.response = res;
});

When('user {string} tries to list messages for that conversation', async function (name) {
  const user = await ensureMessagingUser(this, name);
  const conversationId = this.context.lastConversationId;

  expect(conversationId, 'lastConversationId not set in context').to.exist;

  const res = await this.request
    .get(`/api/messages/conversations/${conversationId}/messages`)
    .set('Authorization', `Bearer ${user.token}`);

  this.response = res;
});

When('user {string} tries to send a message {string} in that conversation', async function (name, messageText) {
  const user = await ensureMessagingUser(this, name);
  const conversationId = this.context.lastConversationId;

  expect(conversationId, 'lastConversationId not set in context').to.exist;

  const res = await this.request
    .post(`/api/messages/conversations/${conversationId}/messages`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({ body: messageText });

  this.response = res;
});

When('user {string} tries to mark that conversation as read', async function (name) {
  const user = await ensureMessagingUser(this, name);
  const conversationId = this.context.lastConversationId;

  expect(conversationId, 'lastConversationId not set in context').to.exist;

  const res = await this.request
    .post(`/api/messages/conversations/${conversationId}/read`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({});

  this.response = res;
});

Then('the messaging response status should be {int} or {int}', function (a, b) {
  const res = this.response;
  expect(res, 'response not set').to.exist;
  expect([a, b]).to.include(res.status);
});
