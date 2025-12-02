const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');

// Reuse jsonField helper from auth steps if needed; redefined here for isolation.
function jsonField(path, obj) {
  const parts = path.split('.');
  return parts.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

Given('I prepare an item payload:', function (dataTable) {
  const rows = dataTable.rowsHash();
  this.body.itemPayload = rows;
});

Given('I prepare an item update payload:', function (dataTable) {
  const rows = dataTable.rowsHash();
  this.body.itemUpdatePayload = rows;
});

When('I send a POST request to {string} with this payload', async function (path) {
  const payload = this.body.itemPayload || {};
  const res = await this.request.post(path).set(this.headers).send(payload);
  this.response = res;
});

When('I send a DELETE request to {string}', async function (path) {
  const resolved = path.replace('{ownerItemId}', this.context.ownerItemId || '');
  const res = await this.request.delete(resolved).set(this.headers);
  this.response = res;
});

When('I send a PUT request to {string} with this payload', async function (path) {
  const resolved = path
    .replace('{editableItemId}', this.context.editableItemId || '')
    .replace('{toggleItemId}', this.context.toggleItemId || '');
  const payload = this.body.itemUpdatePayload || {};
  const res = await this.request.put(resolved).set(this.headers).send(payload);
  this.response = res;
});

Then(
  'the "user" field of the created item should equal the "userId" in the JWT payload',
  function () {
    const res = this.response;
    expect(res, 'response not set').to.exist;

    const body = res.body;
    expect(body, 'response body should be an object').to.be.an('object');
    expect(body.user, 'created item should have a user field').to.exist;

    const authHeader = this.headers['Authorization'] || this.headers['authorization'];
    expect(authHeader, 'Authorization header should be set for this request').to.exist;

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.userId, 'decoded token should contain userId').to.exist;

    expect(String(body.user)).to.equal(String(decoded.userId));
  }
);

Given('there is an existing item created by {string} with title {string}', async function (
  email,
  title
) {
  // Assumes the current Authorization header already contains a valid JWT
  // for the specified email, as set up by previous steps.
  const payload = {
    title,
    type: 'lost',
    description: `${title} description`,
  };

  const res = await this.request.post('/api/items').set(this.headers).send(payload);
  expect(res.status, 'expected item creation to succeed').to.equal(201);

  const item = res.body;
  expect(item && item._id, 'created item should have an _id').to.exist;

  this.context = this.context || {};
  this.context.lastItem = item;
});

Given(
  'there is an existing item created by {string} with title {string} and status {string}',
  async function (email, title, status) {
    const payload = {
      title,
      type: 'lost',
      description: `${title} description`,
    };

    const res = await this.request.post('/api/items').set(this.headers).send(payload);
    expect(res.status, 'expected item creation to succeed').to.equal(201);

    const item = res.body;
    expect(item && item._id, 'created item should have an _id').to.exist;

    this.context = this.context || {};
    this.context.lastItem = item;
  }
);

Given('I remember the ID of this item as {string}', function (key) {
  this.context = this.context || {};
  const item = this.context.lastItem;
  expect(item && item._id, 'No lastItem with _id found in context').to.exist;

  this.context[key] = String(item._id);
});

Given(
  'the user database also contains a user with email {string} and password {string}',
  async function (email, password) {
    // Seed a user via the real register endpoint; if the user already exists,
    // the exact status code is not critical for these authorization scenarios.
    await this.request.post('/api/auth/register').send({ email, password });

    this.context = this.context || {};
    this.context.passwordByEmail = this.context.passwordByEmail || {};
    this.context.passwordByEmail[email] = password;
  }
);

When('I send a PUT request to {string}', async function (path) {
  const resolved = path.replace('{toggleItemId}', this.context.toggleItemId || '');
  const res = await this.request.put(resolved).set(this.headers);
  this.response = res;
});
