import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// Mock jwt-decode so AuthProvider can treat us as logged in without needing a real JWT
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ userId: 'test-user', email: 'test@example.com' }),
}));

import App from '../../src/App.jsx';
import { AuthProvider } from '../../src/context/AuthContext.jsx';

function renderAppLoggedIn() {
  // mark user as logged in
  window.localStorage.setItem('token', 'dummy-token');

  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

function renderAppLoggedOut() {
  window.localStorage.removeItem('token');

  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

describe('Home empty state messages', () => {
  beforeEach(() => {
    // stub fetch to always return an empty items array
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([]),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    window.localStorage.clear();
  });

  it('shows "No items yet. Be the first to post!" when logged in with no items and no active search/filter', async () => {
    renderAppLoggedIn();

    // Wait for initial fetch to resolve and UI to settle
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const message = await screen.findByText('No items yet. Be the first to post!');
    expect(message).toBeTruthy();
  });

  it('shows "No items match your search." when there is an active search with no results', async () => {
    renderAppLoggedIn();

    const searchInput = await screen.findByPlaceholderText('Search by title or description...');

    fireEvent.change(searchInput, { target: { value: 'wallet' } });

    // Wait for the debounced search to trigger another fetch and the empty-state message to appear
    const message = await screen.findByText('No items match your search.');
    expect(message).toBeTruthy();
  });

  it('shows generic "No items yet." message when logged out with no items and no active search/filter', async () => {
    renderAppLoggedOut();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const message = await screen.findByText('No items yet.');
    expect(message).toBeTruthy();
  });
});
