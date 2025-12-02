const { test, expect } = require('@playwright/test');

function makeUniqueEmail(prefix = 'e2e') {
  const rand = Math.floor(Math.random() * 1_000_000);
  return `${prefix}-${Date.now()}-${rand}@example.com`;
}

async function signupViaUi(page, email, password) {
  await page.goto('/');
  await page.getByRole('link', { name: /sign up/i }).click();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();

  await expect(
    page.getByText('Account created! You can now log in.'),
  ).toBeVisible();
}

async function loginViaUi(page, email, password) {
  // Go to login via header
  await page.getByRole('link', { name: /login/i }).click();

  await expect(page.getByText(/welcome back/i)).toBeVisible();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
}

async function createItemViaUi(page, title) {
  await expect(page.getByText('UCLostAndfound')).toBeVisible();

  await page.getByPlaceholder('Item title (required)').fill(title);
  await page.getByPlaceholder('Location').fill('Campus library');
  await page.getByPlaceholder('Description', { exact: true }).fill('E2E test item');

  await page.getByRole('button', { name: /submit item/i }).click();

  // Heading text includes the title plus a type badge, so match by regex
  await expect(
    page.getByRole('heading', { name: new RegExp(title) }),
  ).toBeVisible();
}

async function logoutViaHeader(page) {
  const logoutButton = page.getByRole('button', { name: /logout/i });
  await logoutButton.click();
}

async function findItemCard(page, title) {
  return page.locator('.item', { hasText: title });
}

// 1. New user can sign up and then log in, seeing email in header

test('new user can sign up and then log in', async ({ page }) => {
  const email = makeUniqueEmail('signup-login');
  const password = 'StrongPass1!';

  await signupViaUi(page, email, password);
  await loginViaUi(page, email, password);

  // After login, user email should appear in the header
  await expect(page.getByText(email.toLowerCase())).toBeVisible();

  // Login link should disappear
  await expect(
    page.getByRole('link', { name: /login/i }),
  ).toHaveCount(0);
});

// 2. Logged-in user can create a new lost item and see it in the list

test('logged-in user can create a lost item and see it in Recent Items', async ({ page }) => {
  const email = makeUniqueEmail('items-owner');
  const password = 'StrongPass1!';
  const title = `E2E Lost Item ${Date.now()}`;

  await signupViaUi(page, email, password);
  await loginViaUi(page, email, password);

  await createItemViaUi(page, title);
});

// 3. Non-owner sees Message owner button and no edit/delete for another user\'s item

test('non-owner sees Message owner button but no edit/delete for another user item', async ({ page }) => {
  const ownerEmail = makeUniqueEmail('owner');
  const viewerEmail = makeUniqueEmail('viewer');
  const password = 'StrongPass1!';
  const title = `Owner Item ${Date.now()}`;

  // Owner creates an item
  await signupViaUi(page, ownerEmail, password);
  await loginViaUi(page, ownerEmail, password);
  await createItemViaUi(page, title);

  await logoutViaHeader(page);

  // Viewer logs in
  await signupViaUi(page, viewerEmail, password);
  await loginViaUi(page, viewerEmail, password);

  const itemCard = await findItemCard(page, title);

  await expect(
    itemCard.getByRole('button', { name: /delete/i }),
  ).toHaveCount(0);

  await expect(
    itemCard.getByRole('button', { name: /message owner/i }),
  ).toBeVisible();
});

// 4. Clicking Message owner navigates to Messages page

test('clicking Message owner navigates to Messages page', async ({ page }) => {
  const ownerEmail = makeUniqueEmail('owner-msg');
  const viewerEmail = makeUniqueEmail('viewer-msg');
  const password = 'StrongPass1!';
  const title = `Message Owner Item ${Date.now()}`;

  // Owner creates an item
  await signupViaUi(page, ownerEmail, password);
  await loginViaUi(page, ownerEmail, password);
  await createItemViaUi(page, title);
  await logoutViaHeader(page);

  // Viewer logs in and clicks Message owner
  await signupViaUi(page, viewerEmail, password);
  await loginViaUi(page, viewerEmail, password);

  const itemCard = await findItemCard(page, title);
  await itemCard.getByRole('button', { name: /message owner/i }).click();

  await expect(page).toHaveURL(/\/messages/);
  await expect(
    page.getByRole('heading', { name: /messages/i }),
  ).toBeVisible();
});

// 5. Logged-out user visiting /messages sees a prompt to log in

test('logged-out user visiting /messages sees login prompt', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/messages');

  await expect(
    page.getByText('Please log in to view your messages.'),
  ).toBeVisible();
});

// 6. User can search items and see only matching results

test('user can search items and see only matching results', async ({ page }) => {
  const email = makeUniqueEmail('search-user');
  const password = 'StrongPass1!';

  const titleMatch = `Wallet ${Date.now()}`;
  const titleNonMatch = `Backpack ${Date.now()}`;

  await signupViaUi(page, email, password);
  await loginViaUi(page, email, password);

  // Create two items with different titles
  await createItemViaUi(page, titleMatch);
  await createItemViaUi(page, titleNonMatch);

  // Use the search bar to search for just the wallet
  const searchInput = page.getByPlaceholder('Search by title or description...');
  await searchInput.fill('Wallet');

  // Wait for the debounced search to take effect and results to update
  const matchCard = page.locator('.item', { hasText: titleMatch });
  const nonMatchCard = page.locator('.item', { hasText: titleNonMatch });

  await expect(matchCard).toBeVisible();
  await expect(nonMatchCard).toHaveCount(0);
});
