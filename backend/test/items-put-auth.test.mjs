import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const ITEM_ID = '123456789012345678901234'; // any 24-char string is fine

function makeRandomEmail() {
  const rand = Math.floor(Math.random() * 1_000_000);
  return `test-edit-${Date.now()}-${rand}@example.com`;
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

  return { token: loginBody.token };
}

test('PUT /api/items/:id without token returns 401', async () => {
  const res = await fetch(`${BASE_URL}/api/items/${ITEM_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'Updated title' }),
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.message, 'Not authorized, no token');
});

test('PUT /api/items/:id with invalid token returns 401', async () => {
  const res = await fetch(`${BASE_URL}/api/items/${ITEM_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer totally-invalid-token',
    },
    body: JSON.stringify({ title: 'Updated title' }),
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.message, 'Not authorized, token failed');
});

// Happy-path integration test: register -> login -> create item -> update item -> delete item
// NOTE: run this against a dedicated test database, not your dev/prod database.
// You can go into backend/.env and set MONGODB_URI to a test database.
test('PUT /api/items/:id updates an item for the owner (happy path)', async () => {
  // Arrange: register + login to get a valid token
  const { token } = await registerAndLogin();

  // Create an item
  let res = await fetch(`${BASE_URL}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Item to update',
      type: 'lost',
      description: 'Original description',
      location: 'Original location',
      date: '2025-01-01',
      image: '',
    }),
  });

  const created = await res.json();
  assert.equal(
    res.status,
    201,
    `Expected 201 from create, got ${res.status}: ${JSON.stringify(created)}`
  );
  assert.ok(created._id, 'Created item should have an _id');

  const itemId = created._id;

  try {
    // Act: update the item
    res = await fetch(`${BASE_URL}/api/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Updated item title',
        description: 'Updated description',
        location: 'Updated location',
      }),
    });

    const updated = await res.json();
    assert.equal(
      res.status,
      200,
      `Expected 200 from update, got ${res.status}: ${JSON.stringify(updated)}`
    );
    assert.equal(updated._id, itemId);
    assert.equal(updated.title, 'Updated item title');
    assert.equal(updated.description, 'Updated description');
    assert.equal(updated.location, 'Updated location');
    assert.equal(updated.type, 'lost'); // unchanged
  } finally {
    // Cleanup: delete the item (ignore failures)
    try {
      await fetch(`${BASE_URL}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch {
      // ignore cleanup errors
    }
  }
});