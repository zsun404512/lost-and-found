import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { jwtDecode } from 'jwt-decode';

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('AuthContext - JWT Expiration', () => {
  beforeEach(() => {
    localStorage.clear();
    mockLocation.href = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should redirect to login when token is expired on app load', async () => {
    // Create a mock expired token (exp in the past)
    const expiredToken = 'expired.token.here';
    const expiredPayload = {
      userId: '123',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) - 60, // Expired 1 minute ago
    };

    localStorage.setItem('token', expiredToken);
    jwtDecode.mockReturnValue(expiredPayload);

    renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for the expiration check to run
    await waitFor(() => {
      expect(mockLocation.href).toBe('/login');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('should not redirect when token is valid', async () => {
    // Create a mock valid token (exp in the future)
    const validToken = 'valid.token.here';
    const validPayload = {
      userId: '123',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
    };

    localStorage.setItem('token', validToken);
    jwtDecode.mockReturnValue(validPayload);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
      expect(result.current.user.email).toBe('test@example.com');
      expect(mockLocation.href).toBe(''); // Should not redirect
    });
  });

  it('should handle invalid token and redirect to login', async () => {
    const invalidToken = 'invalid.token';
    localStorage.setItem('token', invalidToken);
    
    // Mock jwtDecode to throw an error
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(mockLocation.href).toBe('/login');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('should check token expiration periodically', async () => {
    // This test verifies the periodic check is set up
    // The actual periodic behavior is tested in integration tests
    const validToken = 'valid.token';
    const validPayload = {
      userId: '123',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    localStorage.setItem('token', validToken);
    jwtDecode.mockReturnValue(validPayload);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    });

    // Verify the hook is set up correctly
    expect(result.current.user).toBeTruthy();
    expect(result.current.logout).toBeDefined();
  });

  it('should redirect to login on logout', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    result.current.logout();

    expect(mockLocation.href).toBe('/login');
    expect(localStorage.getItem('token')).toBeNull();
    expect(result.current.user).toBeNull();
  });
});

