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

describe('Search history', () => {
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

  it('adds a term to history and persists it to localStorage on Enter submit', async () => {
    renderLoggedInApp();

    const searchInput = await screen.findByPlaceholderText('Search by title or description...');

    fireEvent.change(searchInput, { target: { value: 'wallet' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Recent searches header and chip should appear
    await screen.findByText('Recent searches');
    const chip = await screen.findByRole('button', { name: 'wallet' });
    expect(chip).toBeTruthy();

    // localStorage should contain the term
    const stored = localStorage.getItem('searchHistory');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toContain('wallet');
  });

  it('maintains most-recent-first order and avoids duplicates', async () => {
    renderLoggedInApp();

    const searchInput = await screen.findByPlaceholderText('Search by title or description...');

    const submitSearch = async (term) => {
      fireEvent.change(searchInput, { target: { value: term } });
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    };

    await submitSearch('wallet');
    await submitSearch('keys');
    await submitSearch('wallet');

    await screen.findByText('Recent searches');

    // Chips are rendered in the flex container after the header+Clear row
    const header = screen.getByText('Recent searches');
    const chipsContainer = header.parentElement?.nextSibling;
    const chipButtons = chipsContainer
      ? Array.from(chipsContainer.querySelectorAll('button'))
      : [];

    const labels = chipButtons.map((btn) => btn.textContent);
    expect(labels[0]).toBe('wallet');
    expect(labels[1]).toBe('keys');
    // Ensure there are no duplicate labels
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('clicking a history term updates the search box and triggers a new fetch', async () => {
    renderLoggedInApp();

    // Wait for initial fetch triggered by App
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    const initialCalls = global.fetch.mock.calls.length;

    const searchInput = await screen.findByPlaceholderText('Search by title or description...');

    fireEvent.change(searchInput, { target: { value: 'wallet' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    const chip = await screen.findByRole('button', { name: 'wallet' });
    fireEvent.click(chip);

    // Search box value should now be the history term
    expect(searchInput.value).toBe('wallet');

    // A new fetch call should eventually be made with search=wallet
    await waitFor(() => {
      expect(global.fetch.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    const lastUrl = global.fetch.mock.calls[global.fetch.mock.calls.length - 1][0];
    expect(lastUrl).toContain('/api/items');
    expect(lastUrl).toContain('search=wallet');
  });

  it('clear button removes history chips and clears localStorage', async () => {
    renderLoggedInApp();

    const searchInput = await screen.findByPlaceholderText('Search by title or description...');

    fireEvent.change(searchInput, { target: { value: 'wallet' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    await screen.findByText('Recent searches');

    const clearButton = await screen.findByRole('button', { name: 'Clear' });
    fireEvent.click(clearButton);

    // History block should disappear
    await waitFor(() => {
      expect(screen.queryByText('Recent searches')).toBeNull();
    });

    const stored = localStorage.getItem('searchHistory');
    expect(stored === null || stored === '[]').toBe(true);
  });

  it('loads initial history from localStorage on mount', async () => {
    // Pre-populate localStorage before rendering
    localStorage.setItem('searchHistory', JSON.stringify(['wallet', 'keys']));

    renderLoggedInApp();

    await screen.findByText('Recent searches');

    const walletChip = await screen.findByRole('button', { name: 'wallet' });
    const keysChip = await screen.findByRole('button', { name: 'keys' });

    expect(walletChip).toBeTruthy();
    expect(keysChip).toBeTruthy();

    // Ensure order is as stored (wallet first, then keys)
    const header = screen.getByText('Recent searches');
    const chipsContainer = header.parentElement?.nextSibling;
    const chipButtons = chipsContainer
      ? Array.from(chipsContainer.querySelectorAll('button'))
      : [];
    const labels = chipButtons.map((btn) => btn.textContent);

    expect(labels[0]).toBe('wallet');
    expect(labels[1]).toBe('keys');
  });
});
