import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// TODO: We will import the 'useAuth' hook here later

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // TODO: We will get the 'login' function from useAuth
//   const { login } = useAuth(); 

  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    
    // TODO: We will call the real 'login' function later
    console.log('Submitting login form:', { email, password });
    
    // Simulate a network request
    setTimeout(() => {
      setMessage({ type: 'error', text: 'Invalid credentials (Simulation)' });
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="app">
      <div className="auth-form-container">
        <h1 className="title">Welcome Back</h1>
        <p className="lead" style={{ marginBottom: '24px' }}>
          Log in to manage your posts.
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
            {loading ? 'Logging in...' : 'Log In'}
          </button>
          
          {message && (
            <div className={message.type === 'error' ? 'error' : 'success'} style={{marginTop: '12px'}}>
              {message.text}
            </div>
          )}
        </form>
        <p className="auth-footer">
          No account? <Link to="/signup">Sign up for free</Link>
        </p>
      </div>
    </div>
  );
}