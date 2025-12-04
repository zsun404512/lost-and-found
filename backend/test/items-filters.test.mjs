import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

function makeRandomEmail(prefix = 'filters') {
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
    `Expected 201 from register, got ${res.status}: ${JSON.stringify(registerBody)}`,
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
    `Expected 200 from login, got ${res.status}: ${JSON.stringify(loginBody)}`,
  );
  assert.ok(loginBody.token, 'Login response should include token');

  return { token: loginBody.token };
}

async function createItem(token, overrides = {}) {
  const base = {
    title: 'Test item',
    type: 'lost',
    description: 'Test description',
    location: 'Test location',
    date: '2025-01-01',
    image: '',
  };

  const payload = { ...base, ...overrides };

  const res = await fetch(`${BASE_URL}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  assert.equal(
    res.status,
    201,
    `Expected 201 from create, got ${res.status}: ${JSON.stringify(body)}`,
  );
  assert.ok(body._id, 'Created item should have an _id');

  return body;
}

/**
 * Integration test for /api/items filters: search, type, and status.
 *
 * This test creates a small set of items with a unique slug in the title,
 * toggles one of them to resolved, and then verifies the combinations of
 * status and type filters return the expected items.
 */

test('GET /api/items applies search, status, and type filters', async () => {
  const { token } = await registerAndLogin();
  const slug = `filters-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  // Create three items that all share the same slug in the title so we can
  // isolate them using the search query.
  const openLost = await createItem(token, {
    title: `Open lost ${slug}`,
    type: 'lost',
  });

  const openFound = await createItem(token, {
    title: `Open found ${slug}`,
    type: 'found',
  });

  const resolvedLost = await createItem(token, {
    title: `Resolved lost ${slug}`,
    type: 'lost',
  });

  const resolvedFound = await createItem(token, {
    title: `Resolved found ${slug}`,
    type: 'found',
  });

  // Toggle the last item to resolved
  let res = await fetch(`${BASE_URL}/api/items/${resolvedLost._id}/toggle-resolve`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  let toggled = await res.json();

  assert.equal(res.status, 200, `Expected 200 from toggle-resolve, got ${res.status}`);
  assert.equal(toggled.status, 'resolved', 'Toggled item should now be resolved');

  res = await fetch(`${BASE_URL}/api/items/${resolvedFound._id}/toggle-resolve`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  toggled = await res.json();

  assert.equal(res.status, 200, `Expected 200 from toggle-resolve, got ${res.status}`);
  assert.equal(toggled.status, 'resolved', 'Toggled item should now be resolved');

  // Helper to fetch items matching our slug with optional extra query params
  async function fetchItems(query = '') {
    const qs = new URLSearchParams({ search: slug, ...query });
    const url = `${BASE_URL}/api/items?${qs.toString()}`;
    const r = await fetch(url);
    const items = await r.json();
    assert.equal(r.status, 200, `Expected 200 from ${url}, got ${r.status}`);
    return items;
  }

  // 1) Default behavior: no explicit status -> should show open items only
  let items = await fetchItems();
  const ids = items.map((it) => String(it._id));

  assert.ok(
    ids.includes(String(openLost._id)) && ids.includes(String(openFound._id)),
    'Default filter should include open items',
  );
  assert.ok(
    !ids.includes(String(resolvedLost._id)),
    'Default filter should NOT include resolved items',
  );
  assert.ok(items.every((it) => it.status === 'open'));

  // 2) status=resolved -> only resolved items
  items = await fetchItems({ status: 'resolved' });
  const resolvedIds = items.map((it) => String(it._id));

  assert.ok(
    resolvedIds.includes(String(resolvedLost._id)),
    'status=resolved should include the resolved item',
  );
  assert.ok(
    !resolvedIds.includes(String(openLost._id)) &&
      !resolvedIds.includes(String(openFound._id)),
    'status=resolved should NOT include open items',
  );
  assert.ok(items.every((it) => it.status === 'resolved'));

  // 3) status=all -> both open and resolved items
  items = await fetchItems({ status: 'all' });
  const allIds = items.map((it) => String(it._id));

  assert.ok(allIds.includes(String(openLost._id)));
  assert.ok(allIds.includes(String(openFound._id)));
  assert.ok(allIds.includes(String(resolvedLost._id)));
  assert.ok(allIds.includes(String(resolvedFound._id)));

  // 4) status=open&type=lost -> only open, lost items
  items = await fetchItems({ status: 'open', type: 'lost' });
  const typeFilteredIds = items.map((it) => String(it._id));

  assert.ok(
    typeFilteredIds.includes(String(openLost._id)),
    'status=open&type=lost should include the open lost item',
  );
  assert.ok(
    !typeFilteredIds.includes(String(openFound._id)),
    'status=open&type=lost should NOT include found items',
  );
  assert.ok(items.every((it) => it.status === 'open' && it.type === 'lost'));

  // 5) status=open&type=found -> only open, found items
  items = await fetchItems({ status: 'open', type: 'found' });
  const foundFilteredIds = items.map((it) => String(it._id));

  assert.ok(
    foundFilteredIds.includes(String(openFound._id)),
    'status=open&type=found should include the open found item',
  );
  assert.ok(
    !foundFilteredIds.includes(String(openLost._id)),
    'status=open&type=found should NOT include lost items',
  );
  assert.ok(items.every((it) => it.status === 'open' && it.type === 'found'));
  
  // 6) status=resolved&type=found -> only resolved, found items
  items = await fetchItems({ status: 'resolved', type: 'found' });
  const resolvedFoundIds = items.map((it) => String(it._id));

  assert.ok(
    resolvedFoundIds.includes(String(resolvedFound._id)),
    'status=resolved&type=found should include the resolved found item',
  );
  assert.ok(
    !resolvedFoundIds.includes(String(resolvedLost._id)) &&
      !resolvedFoundIds.includes(String(openLost._id)) &&
      !resolvedFoundIds.includes(String(openFound._id)),
    'status=resolved&type=found should NOT include non-found or non-resolved items',
  );
  assert.ok(items.every((it) => it.status === 'resolved' && it.type === 'found'));
});

// initial prompt for items-filters.test.mjs
/*
* suppose you are a high end software quality assurance engineer
* I need a way to test my items filters
* I want to make sure that my filters are working correctly
* specifically, I want to test if my filters do the following (choose some scenarios or come up with your own):
* 1) Default behavior: no explicit status -> should show open items only
* 2) status = resolved -> only resolved items
* 3) status = all -> both open and resolved items
* 4) status = open & type = lost -> only open, lost items
* 5) status = open & type = found -> only open, found items
* 6) status = resolved & type = found -> only resolved, found items
* take a look at the existing integration tests in @backend/test
* please help me generate an integration test in the same style as the existing tests
* I will run the tests afterwards and will let you know if anything fails
*/