import React, { createContext, useState, useContext } from 'react';

// TODO 1: Create the context.
// This is what components will use to 'get' the auth state.
const AuthContext = createContext(null);

// This is the component that will "wrap" our entire app.
// It provides the auth state to all children.
export function AuthProvider({ children }) {
  // TODO 2: Add state for the user.
  // For now, the user can just be null (logged out) or an object (logged in).
  const [user, setUser] = useState(null);

  // TODO 3: Create a 'login' function.
  // It will take email/password, but for now, just simulate a login.
  const login = (email, password) => {
    console.log('Logging in with', email, password);
    // Later, we will fetch() from our backend API here.
    // For now, just set a fake user object.
    setUser({ email: email, name: 'Test User' });
  };

  // TODO 4: Create a 'logout' function.
  const logout = () => {
    // console.log('Logging out');
    setUser(null);
  };

  // This object is what all children components will receive.
  const value = {
    // TODO 5: Add your state and functions to this object.
    user, login, logout,
  };

  return (
    // TODO 6: Provide the 'value' to the children.
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// TODO 7: Create a custom hook.
// This is a shortcut so components don't have to import 'useContext'
// and 'AuthContext' every time.
//
export function useAuth() {
  return useContext(AuthContext);
}