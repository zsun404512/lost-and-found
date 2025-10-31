import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

/**
 * Home component — main application UI for listing and submitting items.
 *
 * Responsibilities:
 * - load recent items from the backend on mount
 * - render a submission form for lost/found items
 * - display messages and UI loading/submitting states
 *
 * Local state:
 * - items: array of items received from the server
 * - loading: whether initial fetch is in progress
 * - form: controlled form state for the submission fields
 * - submitting: whether a submit request is in progress
 * - message: optional UI message ({type: 'error'|'success', text})
 *
 * Note: this component keeps state locally for simplicity; for a larger app consider
 * lifting state up or using a global store.
 */

/**
 * Home component — main application UI for listing and submitting items.
 *
 * Responsibilities:
 * - load recent items from the backend on mount
 * - render a submission form for lost/found items
 * - display messages and UI loading/submitting states
 *
 * Local state:
 * - items: array of items received from the server
 * - loading: whether initial fetch is in progress
 * - form: controlled form state for the submission fields
 * - submitting: whether a submit request is in progress
 * - message: optional UI message ({type: 'error'|'success', text})
 *
 * Note: this component keeps state locally for simplicity; for a larger app consider
 * lifting state up or using a global store.
 */
function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', type: 'lost', description: '', location: '', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  /**
   * Load items from the backend when the component mounts.
   *
   * Contract:
   * - Runs once on mount (empty dependency array).
   * - Side-effects:
   *   - fetches `/api/items` and populates local `items` state on success
   *   - updates `loading` state during the request
   *   - on error, sets `items` to an empty array and shows an optional message
   *
   * Implementation notes:
   * - Uses AbortController to cancel the fetch if the component unmounts before
   *   the response arrives. This avoids setting state on an unmounted component.
   * - Checks `response.ok` and treats non-2xx responses as errors.
   * - Keeps the UI responsive by ensuring `loading` is cleared in `finally`.
   * - If you expect frequent updates, consider polling or a websocket instead
   *   of a single one-time fetch.
   *
   * Edge cases:
   * - Network failures and server errors are caught; we swallow aborts silently
   *   (AbortError) to avoid noisy error messages when the user navigates away.
   * - TODO: If the server returns an unexpected shape, the `setItems` call may be
   *   given malformed data
   *
   * @returns {void}
   */
  useEffect(() => {
    fetch('/api/items')
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch((err) => {
        // Ignore aborts — they are expected on unmount. Show other errors.
        if (err.name === 'AbortError') return;
        setItems([]);
        // optional: show a message to the user for load failure
        setMessage({ type: 'error', text: 'Failed to load items' });
      })
      .finally(() => setLoading(false));
  }, []);

  /**
 * Handle form input changes.
 *
 * Contract:
 * - Input: browser Input change Event
 * - Output: void
 * - Side-effects:
 *   - updates the corresponding field in `form` state
 *   - clears any existing `message`
 *
 * Example:
 *   <input name="title" value={form.title} onChange={onChange} />
 *
 * @param {Event} e - change event from the browser
 * @returns {void}
 */
  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setMessage(null);
  }

  /**
   * Handle form submission.
   *
   * Contract:
   * - Input: browser Form submit Event
   * - Output: Promise<void>
   * - Side-effects:
   *   - prevents default form navigation
   *   - validates `form.title` and sets an error message if missing
   *   - sets `submitting` state while the request is in-flight
   *   - performs a POST to `/api/items` with the JSON form body
   *   - on success: prepends the created item to `items`, resets `form`, and shows a success message
   *   - on failure: sets an error message describing the failure
   *
   * Behavior / error modes:
   * - If `form.title` is empty, the request is not made and a client-side error message is shown.
   * - If the fetch fails or the server returns a non-2xx status, an error message is set using the
   *   server-provided JSON `error` field when available, otherwise a generic message is used.
   * - The `submitting` flag is always reset in the `finally` block so the UI re-enables inputs.
   *
   * Notes:
   * - Expects the server to return the created item as JSON on success.
   * - This function mutates local component state (`items`, `form`, `message`, `submitting`).
   *
   * Example:
   *   <form onSubmit={onSubmit}>...
   *
   * @param {Event} e - submit event from the browser
   * @returns {Promise<void>}
   */
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

      <h2 className="subtitle">Recent Items</h2>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div>
          {items.length === 0 ? (
            <p className="empty">No items yet.</p>
          ) : (
            <ul className="items-list">
              {/* Render each item. Key prefers MongoDB _id, fallback to id. */}
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
 *
 * Responsibilities:
 * - provide client-side routing for the SPA
 * - render the header/nav present on all pages
 *
 * This is intentionally small; as the app grows consider splitting routes into
 * a separate `routes` module and lazy-loading page components with React.lazy.
 */
export default function App() {
  return (
    <BrowserRouter>
      <header className="header">
        <nav className="nav-container">
          <Link to="/" className="nav-brand">Lost & Found</Link>
          <div className="nav-links">
            <Link to="/login">Login</Link>
            <span>|</span>
            <Link to="/signup">Sign Up</Link>
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