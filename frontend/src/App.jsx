import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', type: 'lost', description: '', location: '', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch('/api/items')
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setMessage(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (!form.title) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(err.error || 'Failed to submit');
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
      <p className="lead">Below are recent items reported in the system.</p>

      <form className="form" onSubmit={onSubmit}>
        <div>
          <input name="title" value={form.title} onChange={onChange} placeholder="Item title (required)" />
          <div className="form-row">
            <select name="type" value={form.type} onChange={onChange}>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <input type="date" name="date" value={form.date} onChange={onChange} />
          </div>
          <input name="location" value={form.location} onChange={onChange} placeholder="Location" />
          <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" />
        </div>

        <div>
          <button className="btn" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Item'}</button>
          {message && <div className={message.type === 'error' ? 'error' : 'success'}>{message.text}</div>}
        </div>
      </form>

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

const LoginPage = () => (
  <div className="app">
    <h1 className="title">Login</h1>
    <p className="lead">This is a placeholder page.</p>
  </div>
);

const SignUpPage = () => (
  <div className="app">
    <h1 className="title">Sign Up</h1>
    <p className="lead">This is a placeholder page.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="app" style={{ paddingBottom: 8 }}>
        <nav>
          <Link to="/">Home</Link>{' '}
          <span>|</span>{' '}
          <Link to="/login">Login</Link>{' '}
          <span>|</span>{' '}
          <Link to="/signup">Sign Up</Link>
        </nav>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  );
}
