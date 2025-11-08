import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // We need to install this!

// Create the context
const AuthContext = createContext(null);

// Wraps the entire app by providing auth context to all children
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // On app load, check if a token already exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        // TODO: Check if token is expired!
        setUser(decodedUser);
      } catch (err) {
        console.error('Invalid token', err);
        localStorage.removeItem('token');
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
    // 1. Clear the token from localStorage
    localStorage.removeItem('token');
    // 2. Clear the user from state
    setUser(null);
  };

  // This object is what all children components will receive.
  const value = {
    user,
    login,
    logout,
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