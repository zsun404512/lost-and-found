import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Create the context
const AuthContext = createContext(null);

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    return decoded.exp < currentTime;
  } catch (err) {
    return true; 
  }
};

// Wraps the entire app by providing auth context to all children
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Function to clear user and token (redirect will be handled by components)
  const handleExpiredToken = () => {
    // console.log('Token expired, clearing session');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  // Check token expiration periodically (every minute)
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        handleExpiredToken();
      }
    };

    checkTokenExpiration();

    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, []);

  // On app load, check if a token already exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        if (isTokenExpired(token)) {
          handleExpiredToken();
          return;
        }
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      } catch (err) {
        console.error('Invalid token', err);
        handleExpiredToken();
      }
    }
  }, []);

  // login takes email and password
  const login = async (email, password) => {
    // console.log('Attempting login with', email, password);

    // 1. Send login request to our backend
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to log in');
    }

    // 2. Get the token from the response
    const { token } = data;

    // 3. Save the token to localStorage
    localStorage.setItem('token', token);

    // 4. Decode the user info from the token
    const decodedUser = jwtDecode(token);

    // 5. Set the user state
    setUser(decodedUser);
  };

  // logout resets user and clears token
  const logout = () => {
    // console.log('Logging out');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  // Helper function for authenticated API calls that handles 401 responses
  const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    if (token && isTokenExpired(token)) {
      handleExpiredToken();
      throw new Error('Session expired');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add token to headers if it exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized responses (token expired or invalid)
    if (response.status === 401) {
      handleExpiredToken();
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  };

  // This object is what all children components will receive.
  const value = {
    user,
    login,
    logout,
    authenticatedFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// custom hook to minimize imports
export function useAuth() {
  return useContext(AuthContext);
}