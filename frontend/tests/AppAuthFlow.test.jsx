import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// Mock jwt-decode so AuthProvider can decode tokens without needing a real JWT
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ userId: 'user-id-123', email: 'user@example.com' }),
}));

import App from '../src/App.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

describe('App auth integration flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Default fetch mock: items -> empty array; anything else -> empty ok
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string' && url.startsWith('/api/items')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    window.localStorage.clear();
  });

  it('navigates between Login and Sign Up pages via the header and footer links', async () => {
    renderApp();

    // Header has Login / Sign Up links when logged out
    const loginLink = screen.getByRole('link', { name: /login/i });
    const signupLinkHeader = screen.getByRole('link', { name: /sign up/i });
    expect(loginLink).toBeTruthy();
    expect(signupLinkHeader).toBeTruthy();

    // Go to the Login page
    fireEvent.click(loginLink);

    // Login page title text
    const loginTitle = await screen.findByText(/welcome back/i);
    expect(loginTitle).toBeTruthy();

    // From Login page, follow the footer link to Sign Up
    const signupFooterLink = screen.getByRole('link', { name: /sign up for free/i });
    fireEvent.click(signupFooterLink);

    // Sign Up page title text (heading)
    const signupTitle = await screen.findByRole('heading', { name: /create account/i });
    expect(signupTitle).toBeTruthy();
  });

  it('logs in successfully and updates the header to show the user email and logout button', async () => {
    // Mock login endpoint specifically
    global.fetch = vi.fn((url, options) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              message: 'Login successful',
              email: 'user@example.com',
              token: 'fake-jwt-token',
            }),
        });
      }

      if (typeof url === 'string' && url.startsWith('/api/items')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderApp();

    // Navigate to the Login page via header
    const loginLink = screen.getByRole('link', { name: /login/i });
    fireEvent.click(loginLink);

    const loginTitle = await screen.findByText(/welcome back/i);
    expect(loginTitle).toBeTruthy();

    // Fill out the form and submit
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'StrongPass1!' },
    });

    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);

    // Wait for login request to be sent and token stored
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
      expect(window.localStorage.getItem('token')).toBe('fake-jwt-token');
    });

    // After successful login, App should navigate back to home and header
    // should show the user email and Logout button instead of Login/Sign Up
    const userEmail = await screen.findByText('user@example.com');
    expect(userEmail).toBeTruthy();

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeTruthy();

    // The Login link should no longer be visible
    const loginLinkAfter = screen.queryByRole('link', { name: /login/i });
    expect(loginLinkAfter).toBeNull();
  });
});
