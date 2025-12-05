import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// Mock jwt-decode so AuthProvider can treat us as logged in without needing a real JWT
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ userId: 'test-user', email: 'test@example.com' }),
}));

import App from '../../src/App.jsx';
import { AuthProvider } from '../../src/context/AuthContext.jsx';

function renderLoggedInApp() {
  // Token value is irrelevant because jwtDecode is mocked
  localStorage.setItem('token', 'dummy-token');

  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

async function openFiltersPanel() {
  const toggleButton = await screen.findByRole('button', { name: /show filters/i });
  fireEvent.click(toggleButton);
}

describe('Items filters', () => {
  beforeEach(() => {
    // stub fetch to avoid real API calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([]),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('calls /api/items with status=resolved when status filter is changed', async () => {
    renderLoggedInApp();

    // wait for initial fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // check first call URL, should default to status=open
    const firstUrl = global.fetch.mock.calls[0][0];
    expect(firstUrl).toContain('/api/items');
    expect(firstUrl).toContain('status=open');

    await openFiltersPanel();

    const resolvedButton = await screen.findByRole('button', { name: /resolved only/i });
    fireEvent.click(resolvedButton);

    // wait until some fetch call uses status=resolved
    await waitFor(() => {
      const calls = global.fetch.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      const lastUrl = calls[calls.length - 1][0];
      expect(lastUrl).toContain('/api/items');
      expect(lastUrl).toContain('status=resolved');
    });
  });

  it('calls /api/items with type=found when type filter is changed', async () => {
    renderLoggedInApp();

    // wait for initial fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // check first call URL; by default there should be no explicit type filter
    const firstUrl = global.fetch.mock.calls[0][0];
    expect(firstUrl).toContain('/api/items');
    expect(firstUrl).not.toContain('type=');

    await openFiltersPanel();

    const foundButton = await screen.findByRole('button', { name: /^found$/i });
    fireEvent.click(foundButton);

    // wait until some fetch call uses type=found
    await waitFor(() => {
      const calls = global.fetch.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      const lastUrl = calls[calls.length - 1][0];
      expect(lastUrl).toContain('/api/items');
      expect(lastUrl).toContain('type=found');
      expect(lastUrl).toContain('status=open');
    });
  });

  it('calls /api/items with type=found and status=resolved when both filters are changed', async () => {
    renderLoggedInApp();

    // wait for initial fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const firstUrl = global.fetch.mock.calls[0][0];
    expect(firstUrl).toContain('/api/items');
    expect(firstUrl).toContain('status=open');

    await openFiltersPanel();

    const typeFoundButton = await screen.findByRole('button', { name: /^found$/i });
    const statusResolvedButton = await screen.findByRole('button', { name: /resolved only/i });

    fireEvent.click(typeFoundButton);
    fireEvent.click(statusResolvedButton);

    // wait until the latest fetch uses both filters
    await waitFor(() => {
      const calls = global.fetch.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      const lastUrl = calls[calls.length - 1][0];
      expect(lastUrl).toContain('/api/items');
      expect(lastUrl).toContain('type=found');
      expect(lastUrl).toContain('status=resolved');
    });
  });

  it('calls /api/items with a search query when the user types in the search box', async () => {
    renderLoggedInApp();

    // wait for initial fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const firstUrl = global.fetch.mock.calls[0][0];
    expect(firstUrl).toContain('/api/items');
    expect(firstUrl).not.toContain('search=');

    const searchInput = await screen.findByPlaceholderText('Search by title or description...');

    // type a search term
    fireEvent.change(searchInput, { target: { value: 'wallet' } });

    // wait until a later fetch includes the debounced search term
    await waitFor(() => {
      const calls = global.fetch.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      const lastUrl = calls[calls.length - 1][0];
      expect(lastUrl).toContain('/api/items');
      expect(lastUrl).toContain('search=wallet');
    });
  });

  it('shows "No items match your search." when there are no items for an active search', async () => {
    // Override the default fetch mock to simulate empty results every time
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([]),
      }),
    );

    renderLoggedInApp();

    const searchInput = await screen.findByPlaceholderText('Search by title or description...');

    fireEvent.change(searchInput, { target: { value: 'wallet' } });

    // Wait for the empty-state message that is shown when search or filters are active
    const message = await screen.findByText('No items match your search.');
    expect(message).toBeTruthy();
  });

  it('filters to only items created by the current user when "My posts only" is selected', async () => {
    const items = [
      {
        _id: '1',
        user: 'test-user',
        title: 'My owned item',
        status: 'open',
        type: 'lost',
      },
      {
        _id: '2',
        user: 'someone-else',
        title: 'Not my item',
        status: 'open',
        type: 'lost',
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(items),
      }),
    );

    renderLoggedInApp();

    // Both items should be visible initially
    await screen.findByText('My owned item');
    await screen.findByText('Not my item');

    await openFiltersPanel();

    const myPostsButton = await screen.findByRole('button', { name: /my posts only/i });
    fireEvent.click(myPostsButton);

    await waitFor(() => {
      expect(screen.getByText('My owned item')).toBeTruthy();
      expect(screen.queryByText('Not my item')).toBeNull();
    });
  });
});