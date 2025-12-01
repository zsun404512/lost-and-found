const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

function makeRandomEmail(prefix = 'msg-bdd') {
  const rand = Math.floor(Math.random() * 1_000_000);
  return `${prefix}-${Date.now()}-${rand}@example.com`;
}

async function registerAndLoginWorld(world) {
  const email = makeRandomEmail();
  const password = 'TestPassword123!';

  // Register
  let res = await world.request
    .post('/api/auth/register')
    .send({ email, password });

  expect(res.status).to.equal(201);
  const registerBody = res.body;
  expect(registerBody._id, 'Register response should include _id').to.exist;

  // Login
  res = await world.request
    .post('/api/auth/login')
    .send({ email, password });

  expect(res.status).to.equal(200);
  const loginBody = res.body;
  expect(loginBody.token, 'Login response should include token').to.exist;

  return { token: loginBody.token, userId: registerBody._id, email };
}

Given('there are two messaging users in the system', async function () {
  const userA = await registerAndLoginWorld(this);
  const userB = await registerAndLoginWorld(this);

  this.context.userA = userA;
  this.context.userB = userB;
});

When(
  'the first messaging user creates a conversation with the second user',
  async function () {
    const { userA, userB } = this.context;
    expect(userA, 'userA not initialized').to.exist;
    expect(userB, 'userB not initialized').to.exist;

    const res = await this.request
      .post('/api/messages/conversations')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ participantId: userB.userId });

    this.response = res;

    expect(res.status === 200 || res.status === 201, `Unexpected status ${res.status}`).to.be
      .true;

    const conv = res.body;
    expect(conv._id, 'Conversation should have an _id').to.exist;
    expect(conv.participants, 'Conversation should have participants').to.be.an('array');

    this.context.conversationId = conv._id;
  },
);

When(
  'the first messaging user sends a message {string}',
  async function (text) {
    const { userA, conversationId } = this.context;
    expect(userA, 'userA not initialized').to.exist;
    expect(conversationId, 'conversationId not set').to.exist;

    const res = await this.request
      .post(`/api/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ body: text });

    this.response = res;

    expect(res.status === 200 || res.status === 201, `Unexpected status ${res.status}`).to.be
      .true;
  },
);

When(
  'the second messaging user sends a message {string}',
  async function (text) {
    const { userB, conversationId } = this.context;
    expect(userB, 'userB not initialized').to.exist;
    expect(conversationId, 'conversationId not set').to.exist;

    const res = await this.request
      .post(`/api/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ body: text });

    this.response = res;

    expect(res.status === 200 || res.status === 201, `Unexpected status ${res.status}`).to.be
      .true;
  },
);

When(
  'the first messaging user fetches the messages for that conversation',
  async function () {
    const { userA, conversationId } = this.context;
    expect(userA, 'userA not initialized').to.exist;
    expect(conversationId, 'conversationId not set').to.exist;

    const res = await this.request
      .get(`/api/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${userA.token}`);

    this.response = res;
  },
);

Then(
  'the response JSON should contain 2 messages with bodies {string} and {string} in order',
  function (firstBody, secondBody) {
    const res = this.response;
    expect(res, 'response not set').to.exist;

    const messages = res.body;
    expect(messages, 'response body should be an array').to.be.an('array');
    expect(messages.length).to.equal(2);

    expect(messages[0].body).to.equal(firstBody);
    expect(messages[1].body).to.equal(secondBody);
  },
);
