import React, { createContext, useState, useContext } from 'react';

// Create the context
const AuthContext = createContext(null);

// Wraps the entire app by providing auth context to all children
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // login takes email and password
  const login = (email, password) => {
    console.log('Logging in with', email, password);
    setUser({ email: email, name: 'Test User' });
  };

  // logout resets user
  const logout = () => {
    console.log('Logging out');
    setUser(null);
  };

  // This object is what all children components will receive.
  const value = {
    user, login, logout,
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