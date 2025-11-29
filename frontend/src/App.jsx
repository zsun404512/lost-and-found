import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MessagesPage from './pages/MessagesPage.jsx';
import MessagesNavButton from './components/MessagesNavButton.jsx';
import ItemForm from './components/ItemForm.jsx';
import ItemsToolbar from './components/ItemsToolbar.jsx';
import ItemsList from './components/ItemsList.jsx';
import { useAuth } from './context/AuthContext';
import { useItems } from './hooks/useItems';
import { useItemForm } from './hooks/useItemForm';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [message, setMessage] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapFilterActive, setMapFilterActive] = useState(false);

  const itemsState = useItems({ setMessage });
  const {
    items,
    loading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
  } = itemsState;

  const {
    form,
    editingItem,
    uploading,
    previewImage,
    submitting,
    handleChange,
    handleStartEdit,
    handleCancelEdit,
    handleFileChange,
    handleSubmit,
    handleDelete,
    handleToggleResolve,
    handleMessageOwner,
  } = useItemForm({
    itemsState,
    message,
    setMessage,
    user,
    logout,
    navigate,
  });

  const visibleItems = mapFilterActive && mapBounds
    ? items.filter((it) => {
        const lat = typeof it.lat === 'number' ? it.lat : Number(it.lat);
        const lng = typeof it.lng === 'number' ? it.lng : Number(it.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
        return (
          lat >= mapBounds.south &&
          lat <= mapBounds.north &&
          lng >= mapBounds.west &&
          lng <= mapBounds.east
        );
      })
    : items;

  return (
    <div className="app">
      <h1 className="title">UCLostAndfound</h1>

      {user ? (
        <>
          <p className="lead">
            Report a lost or found item using the form below.
          </p>
          <ItemForm
            form={form}
            editingItem={editingItem}
            uploading={uploading}
            previewImage={previewImage}
            submitting={submitting}
            message={message}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancelEdit={handleCancelEdit}
            onFileChange={handleFileChange}
          />
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

      <ItemsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterChange={setFilterType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {viewMode === 'map' && mapBounds && (
        <div className="map-filter-indicator" style={{ marginBottom: '8px' }}>
          <button
            type="button"
            className={mapFilterActive ? 'btn btn-secondary active' : 'btn btn-secondary'}
            onClick={() => setMapFilterActive((prev) => !prev)}
          >
            {mapFilterActive ? 'Map filter: ON' : 'Map filter: OFF'}
          </button>
          {mapFilterActive && (
            <span style={{ marginLeft: '8px' }}>
              Showing items in current map area.
            </span>
          )}
        </div>
      )}

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div>
          {viewMode === 'map' ? (
            <>
              <ItemsMap
                items={items}
                onBoundsChange={(bounds) => {
                  setMapBounds(bounds);
                }}
              />

              {items.length === 0 ? (
                <p className="empty">
                  {searchQuery || filterType !== 'all'
                    ? 'No items match your search.'
                    : user
                    ? 'No items yet. Be the first to post!'
                    : 'No items yet.'}
                </p>
              ) : mapFilterActive && visibleItems.length === 0 ? (
                <p className="empty">
                  No items in this map area. Try zooming, panning, or turning off the map filter.
                </p>
              ) : (
                <ItemsList
                  items={mapFilterActive ? visibleItems : items}
                  user={user}
                  onEdit={handleStartEdit}
                  onToggleResolve={handleToggleResolve}
                  onDelete={handleDelete}
                  onMessageOwner={handleMessageOwner}
                />
              )}
            </>
          ) : (
            <>
              {items.length === 0 ? (
                <p className="empty">
                  {searchQuery || filterType !== 'all'
                    ? 'No items match your search.'
                    : user
                    ? 'No items yet. Be the first to post!'
                    : 'No items yet.'}
                </p>
              ) : (
                <ItemsList
                  items={items}
                  user={user}
                  onEdit={handleStartEdit}
                  onToggleResolve={handleToggleResolve}
                  onDelete={handleDelete}
                  onMessageOwner={handleMessageOwner}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const UCLA_CENTER = [34.0703, -118.4449];
const UCLA_ZOOM = 16;

function ItemsMap({ items, onBoundsChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // initialize map once
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(UCLA_CENTER, UCLA_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      if (typeof onBoundsChange === 'function') {
        const updateBounds = () => {
          const b = map.getBounds();
          onBoundsChange({
            north: b.getNorth(),
            south: b.getSouth(),
            east: b.getEast(),
            west: b.getWest(),
          });
        };

        map.on('moveend', updateBounds);
        updateBounds();
      }

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // create or clear markers layer
    if (!markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup().addTo(map);
    } else {
      markersLayerRef.current.clearLayers();
    }

    const validItems = items
      .filter((it) => it.status === 'open')
      .map((it) => {
        const lat = typeof it.lat === 'number' ? it.lat : Number(it.lat);
        const lng = typeof it.lng === 'number' ? it.lng : Number(it.lng);
        return { ...it, lat, lng };
      })
      .filter((it) => !Number.isNaN(it.lat) && !Number.isNaN(it.lng));

    if (validItems.length === 0) {
      map.setView(UCLA_CENTER, UCLA_ZOOM);
      return;
    }

    const bounds = L.latLngBounds([]);

    validItems.forEach((item) => {
      const position = [item.lat, item.lng];

      const marker = L.marker(position).addTo(markersLayerRef.current);

      marker.bindPopup(
        `<div><strong>${item.title || ''}</strong><br/>${
          item.description || ''
        }<br/>${item.date || ''}</div>`,
      );
      bounds.extend(position);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [items]);

  return <div className="map-container" ref={mapRef} />;
}

// serves as router

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onMessagesPage = location.pathname === '/messages';

  const handleMessagesClick = () => {
    navigate('/messages');
  };

  const handlePostsClick = () => {
    navigate('/');
  };

  return (
    <>
      <header className="header">
        <nav className="nav-container">
          <Link to="/" className="nav-brand">
            Lost & Found
          </Link>
          <div className="nav-links">
            {user ? (
              <>
                <span className="nav-user-email">{user.email}</span>
                {onMessagesPage ? (
                  <button
                    type="button"
                    className="nav-messages-button nav-posts-button"
                    onClick={handlePostsClick}
                  >
                    Posts
                  </button>
                ) : (
                  <MessagesNavButton
                    isLoggedIn={true}
                    unreadCount={0}
                    onClick={handleMessagesClick}
                  />
                )}
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
        <Route path="/messages" element={<MessagesPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
