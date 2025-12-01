const { Given, When, Then, AfterAll } = require('@cucumber/cucumber');
const { expect } = require('chai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// The backend uses ES modules, so we load the User model via dynamic import
// from this CommonJS step file, and ensure we have a MongoDB connection in
// the Cucumber test process.
let userModelPromise;

async function getUserModel() {
  if (!userModelPromise) {
    userModelPromise = (async () => {
      if (mongoose.connection.readyState === 0) {
        const uri =
          process.env.MONGODB_URI ||
          'mongodb://127.0.0.1:27017/lostandfound-test';
        await mongoose.connect(uri);
      }

      const mod = await import('../../src/models/userModel.js');
      return mod.default || mod;
    })();
  }

  return userModelPromise;
}

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

// For the auth features we manipulate the test database so that each scenario
// can start from a known state using the real User model.
Given('the user database is empty', async function () {
  const User = await getUserModel();
  await User.deleteMany({});
});

Given(
  'the user database contains a user with email {string} and password {string}',
  async function (email, password) {
    // Seed a real user via the register endpoint so hashing/validation match production.
    await this.request.post('/api/auth/register').send({ email, password });

    const User = await getUserModel();
    const user = await User.findOne({ email });
    this.context.user = user;
  }
);

Given(
  'a user already exists in the database with email {string} and password {string}',
  async function (email, password) {
    // Alias that uses the same seeding strategy as the step above.
    await this.request.post('/api/auth/register').send({ email, password });

    const User = await getUserModel();
    const user = await User.findOne({ email });
    this.context.user = user;
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

Then(
  'the response status should be {int} or {int} depending on validation behavior',
  function (status1, status2) {
    expect(this.response, 'response not set').to.exist;
    expect([status1, status2]).to.include(this.response.status);
  }
);

Then('the response JSON should contain a non-empty {string}', function (field) {
  const actual = jsonField(field, this.response.body);
  expect(actual).to.exist;
  expect(String(actual)).to.have.length.greaterThan(0);
});

Then('the user {string} should exist in the database', async function (email) {
  const User = await getUserModel();
  const user = await User.findOne({ email });

  expect(user).to.exist;
  expect(user.email).to.equal(email);
  expect(user._id).to.exist;
});

Then(
  'the stored password for {string} should not equal {string}',
  async function (email, plainPassword) {
    const User = await getUserModel();
    const user = await User.findOne({ email });

    expect(user).to.exist;
    expect(user.password).to.not.equal(plainPassword);
  }
);

Then(
  'the stored password for {string} should be a bcrypt hash',
  async function (email) {
    const User = await getUserModel();
    const user = await User.findOne({ email });

    const matches = await bcrypt.compare(this.body.password, user.password);
    expect(matches).to.be.true;
  }
);

Then(
  'the user in the database should have email {string}',
  async function (expectedEmail) {
    const User = await getUserModel();
    const user = await User.findOne({ email: expectedEmail });
    expect(user).to.exist;
    expect(user.email).to.equal(expectedEmail);
    expect(user._id).to.exist;
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

Then('the token should be a valid JWT signed with the server secret', function () {
  const token = this.response.body.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  expect(decoded).to.be.an('object');
});

Then(
  'the token payload should contain the user\'s "_id" and "email" {string}',
  function (expectedEmail) {
    const token = this.response.body.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.userId).to.exist;
    expect(decoded.email).to.equal(expectedEmail);
  }
);

Then('the token "exp" claim should be approximately 1 hour in the future', function () {
  const token = this.response.body.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const curTime = Math.floor(Date.now() / 1000);
  const diff = decoded.exp - curTime;
  expect(diff).to.be.within(3500, 3700);
});

// --- Auth token / headers ---

Given('I have obtained a valid JWT for {string} via {string}', async function (email, path) {
  const password = 'TestPassword123!';

  // Ensure the user exists; ignore errors if the user is already registered
  await this.request.post('/api/auth/register').send({ email, password });

  const res = await this.request.post(path).send({ email, password });
  expect(res.status).to.equal(200);
  expect(res.body.token, 'login response should contain a token').to.exist;
  this.context.lastToken = res.body.token;
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

AfterAll(async function () {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
