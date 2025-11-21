import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
        // 1. Send the form data to our new backend route
        const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        // 2. Check if the backend sent an error
        if (!res.ok) {
        // 'data.message' will be "User already exists" or similar
        throw new Error(data.message || 'Failed to register');
        }

        // 3. Success!
        setMessage({ type: 'success', text: 'Account created! You can now log in.' });

    } catch (error) {
        // 4. Show any errors to the user
        setMessage({ type: 'error', text: error.message });
    } finally {
        // 5. Always stop the loading spinner
        setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="auth-form-container">
        <h1 className="title">Create Account</h1>
        <p className="lead" style={{ marginBottom: '24px' }}>
          Get started by creating your account.
        </p>
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-auth" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          
          {message && (
            <div className={message.type === 'error' ? 'error' : 'success'} style={{marginTop: '12px'}}>
              {message.text}
            </div>
          )}
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
}