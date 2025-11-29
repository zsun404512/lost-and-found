import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

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

describe('Latitude/Longitude input validation', () => {
  beforeEach(() => {
    // Stub fetch used by Home's useEffect so tests don't hit the real API
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

  it('accepts valid latitude and rejects invalid characters', async () => {
    renderLoggedInApp();

    const latInput = await screen.findByPlaceholderText(/Latitude \(optional\)/i);

    fireEvent.change(latInput, { target: { name: 'lat', value: '34.05' } });
    expect(latInput.value).toBe('34.05');

    // Attempt to type an invalid character
    fireEvent.change(latInput, { target: { name: 'lat', value: '34.05x' } });
    expect(latInput.value).toBe('34.05');
  });

  it('rejects out-of-range latitude values', async () => {
    renderLoggedInApp();

    const latInput = await screen.findByPlaceholderText(/Latitude \(optional\)/i);

    fireEvent.change(latInput, { target: { name: 'lat', value: '89' } });
    expect(latInput.value).toBe('89');

    // Beyond valid latitude range
    fireEvent.change(latInput, { target: { name: 'lat', value: '100' } });
    expect(latInput.value).toBe('89');
  });

  it('allows intermediate negative/decimal latitude while typing', async () => {
    renderLoggedInApp();

    const latInput = await screen.findByPlaceholderText(/Latitude \(optional\)/i);

    fireEvent.change(latInput, { target: { name: 'lat', value: '-' } });
    expect(latInput.value).toBe('-');

    fireEvent.change(latInput, { target: { name: 'lat', value: '-3.' } });
    expect(latInput.value).toBe('-3.');

    fireEvent.change(latInput, { target: { name: 'lat', value: '-34.05' } });
    expect(latInput.value).toBe('-34.05');
  });

  it('validates longitude range and format', async () => {
    renderLoggedInApp();

    const lngInput = await screen.findByPlaceholderText(/Longitude \(optional\)/i);

    fireEvent.change(lngInput, { target: { name: 'lng', value: '-118.45' } });
    expect(lngInput.value).toBe('-118.45');

    // Attempt to go out of range (> 180)
    fireEvent.change(lngInput, { target: { name: 'lng', value: '200' } });
    expect(lngInput.value).toBe('-118.45');

    // Attempt to add invalid characters
    fireEvent.change(lngInput, { target: { name: 'lng', value: '-118.45abc' } });
    expect(lngInput.value).toBe('-118.45');
  });
});
