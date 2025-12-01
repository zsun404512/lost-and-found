const { Given, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// This step seeds the database with a small set of items that have
// different combinations of status and type, including at least one
// resolved+found item that should match our filter.
Given('there are items in the system with different status and type', async function () {
  const slug = `filters-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  this.context.slug = slug;

  const email = `filters-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
  const password = 'TestPassword123!';

  // 1) Register a user
  let res = await this.request.post('/api/auth/register').send({ email, password });
  expect(res.status).to.equal(201);

  // 2) Log in to get a JWT
  res = await this.request.post('/api/auth/login').send({ email, password });
  expect(res.status).to.equal(200);
  const token = res.body.token;
  expect(token).to.exist;

  this.context.token = token;

  // Helper to create an item owned by this user
  const basePayload = {
    description: 'BDD filters test item',
    location: 'Test location',
    date: '2025-01-01',
    image: '',
  };

  const createItem = async (overrides) => {
    const payload = { ...basePayload, ...overrides };
    const createRes = await this.request
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(createRes.status).to.equal(201);
    expect(createRes.body._id).to.exist;
    return createRes.body;
  };

  const openLost = await createItem({
    title: `Open lost ${slug}`,
    type: 'lost',
  });

  const openFound = await createItem({
    title: `Open found ${slug}`,
    type: 'found',
  });

  const resolvedLost = await createItem({
    title: `Resolved lost ${slug}`,
    type: 'lost',
  });

  const resolvedFound = await createItem({
    title: `Resolved found ${slug}`,
    type: 'found',
  });

  // Helper to toggle resolve status
  const toggleResolve = async (item) => {
    const toggleRes = await this.request
      .put(`/api/items/${item._id}/toggle-resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(toggleRes.status).to.equal(200);
    expect(toggleRes.body.status).to.equal('resolved');
    return toggleRes.body;
  };

  this.context.openLost = openLost;
  this.context.openFound = openFound;
  this.context.resolvedLost = await toggleResolve(resolvedLost);
  this.context.resolvedFound = await toggleResolve(resolvedFound);
});

// This step asserts that all items in the last HTTP response have the
// expected status and type, and that our resolvedFound item is included.
Then(
  'every item in the response JSON should have status {string} and type {string}',
  function (expectedStatus, expectedType) {
    const res = this.response;
    expect(res, 'response not set').to.exist;

    const items = res.body;
    expect(items, 'response body should be an array').to.be.an('array');

    // There should be at least one matching item
    expect(items.length).to.be.greaterThan(0);

    // All items must have the expected status and type
    for (const item of items) {
      expect(item.status).to.equal(expectedStatus);
      expect(item.type).to.equal(expectedType);
    }

    // For the resolved+found case, also ensure our seeded resolvedFound item is present
    if (
      expectedStatus === 'resolved' &&
      expectedType === 'found' &&
      this.context &&
      this.context.resolvedFound
    ) {
      const ids = items.map((it) => String(it._id));
      expect(ids).to.include(String(this.context.resolvedFound._id));
    }
  },
);

Then('every item in the response JSON should have status {string}', function (expectedStatus) {
  const res = this.response;
  expect(res, 'response not set').to.exist;

  const items = res.body;
  expect(items, 'response body should be an array').to.be.an('array');
  expect(items.length).to.be.greaterThan(0);

  for (const item of items) {
    expect(item.status).to.equal(expectedStatus);
  }
});
