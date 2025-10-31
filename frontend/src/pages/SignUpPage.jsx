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

    // TODO: We will wire this up to the backend later
    console.log('Submitting signup form:', { email, password });
    
    // Simulate a network request
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Account created! (Simulation)' });
      setLoading(false);
    }, 1000);
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