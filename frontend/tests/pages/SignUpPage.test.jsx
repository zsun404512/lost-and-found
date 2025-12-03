import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import SignUpPage from '../../src/pages/SignUpPage.jsx';

function renderSignUpPage() {
  return render(
    <MemoryRouter>
      <SignUpPage />
    </MemoryRouter>,
  );
}

describe('SignUpPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('renders email and password fields and submit button', () => {
    renderSignUpPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    const loginLinkText = screen.getByText(/Already have an account\?/i);

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    expect(loginLinkText).toBeTruthy();
  });

  it('shows a success message when registration succeeds', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: 'User registered successfully',
          _id: 'new-user-id',
          email: 'new@example.com',
        }),
      }),
    );

    renderSignUpPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'StrongPass1!' },
    });

    const button = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(button);

    // Button should enter loading state
    await waitFor(() => {
      const loadingButton = screen.getByRole('button', { name: /creating\.\.\./i });
      expect(loadingButton.disabled).toBe(true);
    });

    // After request completes, success message should be shown and button no longer loading
    const successMessage = await screen.findByText('Account created! You can now log in.');
    expect(successMessage).toBeTruthy();

    const resetButton = screen.getByRole('button', { name: /create account/i });
    expect(resetButton.disabled).toBe(false);
  });

  it('shows an error message when registration fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'User already exists' }),
      }),
    );

    renderSignUpPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'StrongPass1!' },
    });

    const button = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(button);

    const errorMessage = await screen.findByText('User already exists');
    expect(errorMessage).toBeTruthy();

    const resetButton = screen.getByRole('button', { name: /create account/i });
    expect(resetButton.disabled).toBe(false);
  });
});
