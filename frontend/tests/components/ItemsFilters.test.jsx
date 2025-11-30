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

    // find the status dropdown by its visible option text "Open Only"
    const statusOption = await screen.findByText('Open Only');
    const statusSelect = statusOption.closest('select');
    if (!statusSelect) {
      throw new Error('Could not find status filter <select>');
    }

    // change status to resolved only
    fireEvent.change(statusSelect, { target: { value: 'resolved' } });

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

    // find the type dropdown by its visible option text "Found Items"
    const typeOption = await screen.findByText('Found Items');
    const typeSelect = typeOption.closest('select');
    if (!typeSelect) {
      throw new Error('Could not find type filter <select>');
    }

    // change type to found
    fireEvent.change(typeSelect, { target: { value: 'found' } });

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

    // locate both dropdowns by their default option labels
    const typeOption = await screen.findByText('All Items');
    const typeSelect = typeOption.closest('select');
    if (!typeSelect) {
      throw new Error('Could not find type filter <select>');
    }

    const statusOption = await screen.findByText('Open Only');
    const statusSelect = statusOption.closest('select');
    if (!statusSelect) {
      throw new Error('Could not find status filter <select>');
    }

    // change both filters
    fireEvent.change(typeSelect, { target: { value: 'found' } });
    fireEvent.change(statusSelect, { target: { value: 'resolved' } });

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
});