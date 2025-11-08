import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { useAuth } from './context/AuthContext';

/**
 * Home component — main application UI for listing and submitting items.
 */
function Home() {
  // 1. Get the current user from the AuthContext
  const { user } = useAuth();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', type: 'lost', description: '', location: '', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  /**
   * Load items from the backend when the component mounts.
   */
  useEffect(() => {
    fetch('/api/items')
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setItems([]);
        setMessage({ type: 'error', text: 'Failed to load items' });
      })
      .finally(() => setLoading(false));
  }, []);

  /**
 * Handle form input changes.
 */
  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setMessage(null);
  }

  /**
   * Handle form submission.
   */
  async function onSubmit(e) {
    e.preventDefault(); 
    setMessage(null);
    if (!form.title) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }
    setSubmitting(true);

    // 2. Get the token from localStorage to send with the request
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in to post.' });
      setSubmitting(false);
      return;
    }

    try {
      // 3. Add the Authorization header to the request
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // This is the new part
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(err.message || 'Failed to submit');
      }

      const created = await res.json();
      setItems((p) => [created, ...p]);
      setForm({ title: '', type: 'lost', description: '', location: '', date: '' });
      setMessage({ type: 'success', text: 'Item submitted.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <h1 className="title">Lost & Found Tracker</h1>

      {/* 4. Conditionally show the form only if the user is logged in */}
      {user ? (
        <>
          <p className="lead">Report a lost or found item using the form below.</p>
          <form className="form" onSubmit={onSubmit}>
            <div>
              <input name="title" value={form.title} onChange={onChange} placeholder="Item title (required)" />
              <div className="form-row" style={{ marginTop: '8px' }}>
                <select name="type" value={form.type} onChange={onChange}>
                  <option value="lost">I lost it on...</option>
                  <option value="found">I found it on...</option>
                </select>
                <input type="date" name="date" value={form.date} onChange={onChange} />
              </div>
              <input name="location" value={form.location} onChange={onChange} placeholder="Location" />
              <div className="form-row" style={{ marginTop: '8px' }}>
              <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" />
              </div>
              <div className="form-row" style={{ marginTop: '8px' }}>
              <button className="btn" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Item'}</button>
              </div>
              {message && <div className={message.type === 'error' ? 'error' : 'success'}>{message.text}</div>}
            </div>
          </form>
        </>
      ) : (
        <p className="lead">
          Please <Link to="/login" style={{color: 'var(--accent)', fontWeight: '500'}}>log in</Link> to post a lost or found item.
        </p>
      )}

      <h2 className="subtitle">Recent Items</h2>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div>
          {items.length === 0 ? (
            <p className="empty">No items yet.</p>
          ) : (
            <ul className="items-list">
              {items.map((it) => (
                <li key={it._id || it.id} className="item">
                  <h3>
                    {it.title} <small style={{ color: '#374151' }}>({it.type})</small>
                  </h3>
                  <div className="desc">{it.description}</div>
                  <div className="meta">{it.location} · {it.date}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * App — top-level router component.
 */
export default function App() {
  const { user, logout } = useAuth();

  return (
    <BrowserRouter>
      <header className="header">
        <nav className="nav-container">
          <Link to="/" className="nav-brand">Lost & Found</Link>
          <div className="nav-links">
            {user ? (
              <>
                <span className="nav-user-email">{user.email}</span>
                <button onClick={logout} className="nav-logout-button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <span>|</span>
                <Link to="/signup">Sign Up</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  );
}