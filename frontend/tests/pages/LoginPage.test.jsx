import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock jwt-decode so AuthProvider can decode tokens without needing a real JWT
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ userId: 'test-user-id', email: 'test@example.com' }),
}));

import { AuthProvider } from '../../src/context/AuthContext.jsx';
import LoginPage from '../../src/pages/LoginPage.jsx';

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    window.localStorage.clear();
  });

  it('renders email and password fields and submit button', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });
    const signUpLinkText = screen.getByText(/No account\?/i);

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    expect(signUpLinkText).toBeTruthy();
  });

  it('submits credentials and stores token on successful login', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'fake-jwt-token' }),
      }),
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'StrongPass1!' },
    });

    const button = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(button);

    // Button should enter loading state
    await waitFor(() => {
      const loadingButton = screen.getByRole('button', { name: /logging in\.{3}/i });
      expect(loadingButton.disabled).toBe(true);
    });

    // AuthContext.login should have hit the backend and stored the token
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem('token')).toBe('fake-jwt-token');
    });
  });

  it('shows an error message when login fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      }),
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'WrongPass!' },
    });

    const button = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(button);

    const errorMessage = await screen.findByText('Invalid credentials');
    expect(errorMessage).toBeTruthy();

    // Button should be re-enabled (loading cleared on error)
    const resetButton = screen.getByRole('button', { name: /log in/i });
    expect(resetButton.disabled).toBe(false);
  });
});
