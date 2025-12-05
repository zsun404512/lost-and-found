import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'
// login page for existing users: link on bottom to sign up
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const { login } = useAuth(); 
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    
    // call login
    try {
        await login(email, password);
        navigate('/');
    }
    // display errors if they exist
    catch (error) {
        setMessage({ type: 'error', text: error.message });
        setLoading(false);
    }
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