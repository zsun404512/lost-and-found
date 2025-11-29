const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// Shared helpers
function jsonField(path, obj) {
  const parts = path.split('.');
  return parts.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

// --- Generic/background steps ---

Given('the system is running', async function () {
  const res = await this.request.get('/api/ping');
  expect(res.status).to.be.within(200, 299);
});

// We do not manipulate the real database here; these steps assume
// appropriate seed data exists in the test database.
Given('the user database is empty', function () {
  return 'pending';
});

Given(
  'the user database contains a user with email {string} and password {string}',
  function (email, password) {
    return 'pending';
  }
);

Given('the database is unavailable', function () {
  return 'pending';
});

// --- Auth: register ---

Given('I provide an email {string}', function (email) {
  this.body.email = email;
});

Given('I provide no email', function () {
  delete this.body.email;
});

Given('I provide a password {string}', function (password) {
  this.body.password = password;
});

Given('I provide no password', function () {
  delete this.body.password;
});

When(
  'I send a POST request to {string} with this email and password',
  async function (path) {
    const res = await this.request
      .post(path)
      .set(this.headers)
      .send({ email: this.body.email, password: this.body.password });
    this.response = res;

    if (path === '/api/auth/login' && res.status === 200 && res.body.token) {
      this.context.lastToken = res.body.token;
    }
  }
);

Then('the response status should be {int}', function (statusCode) {
  expect(this.response, 'response not set').to.exist;
  expect(this.response.status).to.equal(statusCode);
});

Then('the response JSON {string} should be {string}', function (field, value) {
  const actual = jsonField(field, this.response.body);
  expect(actual).to.equal(value);
});

Then('the response JSON should contain a non-empty {string}', function (field) {
  const actual = jsonField(field, this.response.body);
  expect(actual).to.exist;
  expect(String(actual)).to.have.length.greaterThan(0);
});

Then('the user {string} should exist in the database', function () {
  return 'pending';
});

Then(
  'the stored password for {string} should not equal {string}',
  function () {
    return 'pending';
  }
);

Then(
  'the stored password for {string} should be a bcrypt hash',
  function () {
    return 'pending';
  }
);

Then(
  'the user in the database should have email {string}',
  function () {
    return 'pending';
  }
);

// --- Auth: login ---

Given('I provide a login email {string}', function (email) {
  this.body.email = email;
});

Given('I provide no login email', function () {
  delete this.body.email;
});

Given('I provide a login password {string}', function (password) {
  this.body.password = password;
});

Given('I provide no login password', function () {
  delete this.body.password;
});

When(
  'I send a POST request to {string} with this email and password',
  async function (path) {
    const res = await this.request
      .post(path)
      .set(this.headers)
      .send({ email: this.body.email, password: this.body.password });
    this.response = res;

    if (path === '/api/auth/login' && res.status === 200 && res.body.token) {
      this.context.lastToken = res.body.token;
    }
  }
);

Then('the token should be a valid JWT signed with the server secret', function () {
  return 'pending';
});

Then(
  'the token payload should contain the user\'s "_id" and "email" {string}',
  function () {
    return 'pending';
  }
);

Then('the token "exp" claim should be approximately 1 hour in the future', function () {
  return 'pending';
});

// --- Auth token / headers ---

Given('I have obtained a valid JWT for {string} via {string}', function () {
  return 'pending';
});

Given('I set the {string} header to {string}', function (name, value) {
  this.headers[name] = value;
});

Given('I do not send an {string} header', function (name) {
  delete this.headers[name];
});

When('I send a GET request to {string}', async function (path) {
  const res = await this.request.get(path).set(this.headers);
  this.response = res;
});

Then('the request should have {string} equal to {string}', function () {
  return 'pending';
});
