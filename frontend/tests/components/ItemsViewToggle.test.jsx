import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// Mock jwt-decode so AuthProvider can treat us as logged in
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ userId: 'test-user', email: 'test@example.com' }),
}));

// Mock ItemsMap to avoid loading Leaflet in the test environment
vi.mock('../../src/components/ItemsMap.jsx', () => ({
  default: () => <div data-testid="items-map" />,
}));

import App from '../../src/App.jsx';
import { AuthProvider } from '../../src/context/AuthContext.jsx';

function renderLoggedInApp() {
  localStorage.setItem('token', 'dummy-token');

  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

describe('Items view toggle', () => {
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

  it('starts in list view and can switch to map view', async () => {
    renderLoggedInApp();

    const mapCheckbox = await screen.findByLabelText(/show map view/i);

    expect(mapCheckbox.checked).toBe(false);
    expect(screen.queryByTestId('items-map')).toBeNull();

    fireEvent.click(mapCheckbox);

    await waitFor(() => {
      expect(mapCheckbox.checked).toBe(true);
    });

    const map = await screen.findByTestId('items-map');
    expect(map).toBeTruthy();
  });
});
