import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { useAuth } from './context/AuthContext';
import { useDebounce } from './hooks/useDebounce';

/**
 * Home component — main application UI for listing and submitting items.
 */
function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);


  // Initial form state
  const initialFormState = {
    title: '',
    type: 'lost',
    description: '',
    location: '',
    date: '',
    image: null,
  };
  const [form, setForm] = useState(initialFormState);
  const [editingItem, setEditingItem] = useState(null);

  // State for file upload
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const debouncedSearch = useDebounce(searchQuery, 500);

  /**
   * Load items from the backend.
   */
  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.append('search', debouncedSearch);
    }
    if (filterType !== 'all') {
      params.append('type', filterType);
    }

    const queryString = params.toString();
    const url = `/api/items${queryString ? `?${queryString}` : ''}`;
    // console.log('Fetching:', url);

    fetch(url)
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setItems([]);
        setMessage({ type: 'error', text: 'Failed to load items' });
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, filterType]);

  // Special handler for file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File is too large (Max 5MB)' });
        return;
      }
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewImage(null);
    }
  };

  /**
   * Handle form input changes.
   */
  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setMessage(null);
  }

  function handleStartEdit(item) {
    setEditingItem(item);
    setForm({
      title: item.title || '',
      type: item.type || 'lost',
      description: item.description || '',
      location: item.location || '',
      date: item.date || '',
      image: null,
    });

    const existingImage = item.image
      ? process.env.NODE_ENV === 'development'
        ? `http://localhost:4000${item.image}`
        : item.image
      : null;

    setPreviewImage(existingImage);
    setSelectedFile(null);
    setMessage(null);
  }

  function handleCancelEdit() {
    setEditingItem(null);
    setForm(initialFormState);
    setSelectedFile(null);
    setPreviewImage(null);
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
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in to post.' });
      setSubmitting(false);
      return;
    }

    let imageUrl = '';

    // Step 1: Upload image if selected
    if (selectedFile) {
      setUploading(true);
      setMessage({ type: 'success', text: 'Uploading image...' });

      const formData = new FormData();
      formData.append('image', selectedFile);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Image upload failed');
        }
        imageUrl = data.image;
        setMessage({
          type: 'success',
          text: editingItem
            ? 'Image uploaded! Saving changes...'
            : 'Image uploaded! Submitting post...',
        });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
        setSubmitting(false);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    // Step 2: Submit or update the post
    try {
      const postData = { ...form, image: imageUrl };

      let url = '/api/items';
      let method = 'POST';
      if (editingItem && editingItem._id) {
        url = `/api/items/${editingItem._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(
          err.message ||
            (editingItem ? 'Failed to update item' : 'Failed to submit post'),
        );
      }

      const created = await res.json();
      setSearchQuery('');
      setFilterType('all');

      if (editingItem && editingItem._id) {
        setItems((prevItems) =>
          prevItems.map((item) =>
            (item._id || item.id) === (created._id || created.id)
              ? created
              : item,
          ),
        );
        setEditingItem(null);
        setMessage({ type: 'success', text: 'Item updated.' });
      } else {
        setItems((p) => [created, ...p]);
        setMessage({ type: 'success', text: 'Item submitted.' });
      }

      setForm(initialFormState);
      setSelectedFile(null);
      setPreviewImage(null);
      if (e.target.elements.image) {
        e.target.elements.image.value = null;
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || (editingItem ? 'Update failed' : 'Submission failed'),
      });
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Handle deleting a post.
   */
  async function handleDelete(itemId) {
    console.warn('A custom confirmation modal should be used here.');
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in.' });
      return;
    }
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete');
      }
      setItems((prevItems) => prevItems.filter((item) => item._id !== itemId));
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  /**
   * Handle toggling a post's 'resolved' status.
   */
  async function handleToggleResolve(itemId) {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: "error", text: "You must be logged in." });
      return;
    }

    try {
      const res = await fetch(`/api/items/${itemId}/toggle-resolve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedItem = await res.json();
      if (!res.ok) {
        throw new Error(updatedItem.message || "Failed to update status");
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          (item._id || item.id) === (updatedItem._id || updatedItem.id)
            ? updatedItem
            : item,
        ),
      );

      const statusText =
        updatedItem.status === 'resolved'
          ? 'Item marked as resolved.'
          : 'Item reopened.';
      setMessage({ type: 'success', text: statusText });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }
    // Format an ISO date-time string into something readable
  function formatDateTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return (
    <div className="app">
      <h1 className="title">Lost & Found Tracker</h1>

      {user ? (
        <>
          <p className="lead">
            Report a lost or found item using the form below.
          </p>
          <form className="form" onSubmit={onSubmit}>
            <div>
              {editingItem && (
                <div className="edit-banner">
                  <span>
                    Editing item:{' '}
                    <strong>{editingItem.title || 'Untitled item'}</strong>
                  </span>
                  <button
                    type="button"
                    className="btn-edit-cancel"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="Item title (required)"
              />
              <div className="form-row" style={{ marginTop: '8px' }}>
                <select name="type" value={form.type} onChange={onChange}>
                  <option value="lost">I lost it on...</option>
                  <option value="found">I found it on...</option>
                </select>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={onChange}
                />
              </div>
              <input
                name="location"
                value={form.location}
                onChange={onChange}
                placeholder="Location"
              />
              <div className="form-row" style={{ marginTop: '8px' }}>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Description"
                />
              </div>

              <div
                className="form-row"
                style={{ marginTop: '8px', alignItems: 'center' }}
              >
                <input
                  type="file"
                  name="image"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                  className="file-input"
                />
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="image-preview"
                  />
                )}
              </div>

              <div className="form-row" style={{ marginTop: '8px' }}>
                <button className="btn" type="submit" disabled={submitting || uploading}>
                  {uploading
                    ? 'Uploading...'
                    : submitting
                    ? editingItem
                      ? 'Saving...'
                      : 'Submitting...'
                    : editingItem
                    ? 'Save Changes'
                    : 'Submit Item'}
                </button>
              </div>
              {message && (
                <div className={message.type === 'error' ? 'error' : 'success'}>
                  {message.text}
                </div>
              )}
            </div>
          </form>
        </>
      ) : (
        <p className="lead">
          Please{' '}
          <Link
            to="/login"
            style={{ color: 'var(--accent)', fontWeight: '500' }}
          >
            log in
          </Link>{' '}
          to post a lost or found item.
        </p>
      )}

      <h2 className="subtitle">Recent Items</h2>

      <div className="filter-container">
        <input
          type="search"
          className="search-bar"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '16px' }}
        />
        <select
          className="type-filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ marginBottom: '16px' }}
        >
          <option value="all">All Items</option>
          <option value="lost">Lost Items</option>
          <option value="found">Found Items</option>
        </select>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div>
          {items.length === 0 ? (
            <p className="empty">
              {searchQuery || filterType !== 'all'
                ? 'No items match your search.'
                : 'No items yet.'}
            </p>
          ) : (
            <ul className="items-list">
              {items.map((it) => {
                const isOwner = user && user.userId === it.user;
                const isResolved = it.status === 'resolved';

                return (
                  <li key={it._id || it.id} className="item">
                    {it.image && (
                      <img
                        src={
                          process.env.NODE_ENV === 'development'
                            ? `http://localhost:4000${it.image}`
                            : it.image
                        }
                        alt={it.title}
                        className="item-image"
                      />
                    )}

                    <div className="item-header">
                      <h3>
                        {it.title}{' '}
                        <small style={{ color: '#374151' }}>({it.type})</small>
                      </h3>

                      <div className="item-owner-actions">
                        {isOwner && (
                          <button
                            type="button"
                            className="btn-edit"
                            onClick={() => handleStartEdit(it)}
                          >
                            Edit
                          </button>
                        )}

                        <button
                          className={
                            `status-button ${
                              isResolved ? 'status-resolved' : 'status-open'
                            } ` +
                            (isOwner ? 'status-clickable' : 'status-readonly')
                          }
                          onClick={
                            isOwner
                              ? () => handleToggleResolve(it._id || it.id)
                              : undefined
                          }
                          disabled={!isOwner}
                          type="button"
                        >
                          {isResolved ? 'Resolved' : 'Open'}
                        </button>

                        {isOwner && (
                          <button
                            className="btn-delete"
                            type="button"
                            onClick={() => handleDelete(it._id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="desc">{it.description}</div>
                    <div className="meta">
                      {it.location} · {it.date}
                    </div>
                    <div className="item-timestamps">
                      <div className="item-timestamp-primary">
                        Last updated: {formatDateTime(it.updatedAt || it.createdAt)}
                      </div>
                      <div className="item-timestamp-secondary">
                        Created: {formatDateTime(it.createdAt)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * App — top-level router component.
 * This is the part that was missing from your file.
 */
export default function App() {
  const { user, logout } = useAuth();

  return (
    <BrowserRouter>
      <header className="header">
        <nav className="nav-container">
          <Link to="/" className="nav-brand">
            Lost & Found
          </Link>
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
