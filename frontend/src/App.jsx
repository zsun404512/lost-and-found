import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MessagesPage from './pages/MessagesPage.jsx';
import MessagesNavButton from './components/MessagesNavButton.jsx';
import ItemForm from './components/ItemForm.jsx';
import ItemsToolbar from './components/ItemsToolbar.jsx';
import ItemsList from './components/ItemsList.jsx';
import ItemsMap from './components/ItemsMap.jsx';
import { useAuth } from './context/AuthContext';
import { useItems } from './hooks/useItems';
import { useItemForm } from './hooks/useItemForm';
import { filterItemsByBounds } from './utils/items';

function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [message, setMessage] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapFilterActive, setMapFilterActive] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [ownOnly, setOwnOnly] = useState(false);

  const updateHistory = (newTerm) => {
    let trimmed = newTerm.trim();
    if (!trimmed) {
      return;
    }
    setSearchHistory((prevHistory) => {
      const filteredHistory = prevHistory.filter((term) => term !== trimmed);
      const updatedHistory = [trimmed, ...filteredHistory];
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const handleSearchSubmit = (term) => {
    let trimmed = term.trim();
    if (!trimmed) {
      return;
    }
    setSearchQuery(trimmed);
    updateHistory(trimmed);
  };

  const handleHistorySelect = (term) => {
    let trimmed = term.trim();
    if (!trimmed) {
      return;
    }
    setSearchQuery(trimmed);
    updateHistory(trimmed);
  };
  
  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // const variables and functions
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
  const ownedItems = ownOnly && user ? items.filter((it) => it.user === user.userId) : items;
  const {
    form,
    editingItem,
    uploading,
    previewImage,
    submitting,
    showCropper,
    handleImageCropped,
    handleDoneCrop,
    handleRevertCrop,
    handleChange,
    handleSetCoordinatesFromMap,
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
  // show filter items if in bounds
  const visibleItems = mapFilterActive && mapBounds ? filterItemsByBounds(items, mapBounds) : items;

  return (
    <div className="app">
      <h1 className="title">UCLostAndfound</h1>
      {user ? (
        <>
          {!showForm ? (
            <div className="home-hero">
              <div className="home-hero-content">
                <div className="home-hero-text">
                  <h2 className="home-hero-title">Post a lost or found item</h2>
                  <p className="home-hero-subtitle">
                    Share a quick title and whether it was lost or found. You can add
                    more details after starting your report.
                  </p>
                  <button
                    type="button"
                    className="btn home-hero-button"
                    onClick={() => setShowForm(true)}
                  >
                    Report an item
                  </button>
                </div>
                <div className="home-hero-illustration">
                  <img
                    src="/decorations/magnifying-glass.png"
                    alt="Search for lost items"
                  />
                </div>
              </div>
            </div>
          ) : (
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
              showCropper={showCropper}
              onImageCropped={handleImageCropped}
              onDoneCrop={handleDoneCrop}
              onRevertCrop={handleRevertCrop}
            />
          )}
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
        searchHistory={searchHistory}
        onClearHistory={handleClearHistory}
        onSearchSubmit={handleSearchSubmit}
        onHistorySelect={handleHistorySelect}
        mapFilterActive={mapFilterActive}
        onMapFilterChange={setMapFilterActive}
        ownOnly={ownOnly}
        onOwnOnlyChange={setOwnOnly}
      />
      {!loading && (
        <div className="items-count" style={{ marginBottom: '12px', color: '#666', fontSize: '0.9em' }}>
          {(() => {
            const countSource = viewMode === 'map' && mapFilterActive ? visibleItems : ownedItems;
            const count = countSource.length;
            if (count === 0) return 'No items found';
            if (count === 1) return '1 item found';
            return `${count} items found`;
          })()}
        </div>
      )}
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
                items={ownedItems}
                user={user}
                onBoundsChange={(bounds) => {
                  setMapBounds(bounds);
                }}
                onMapClick={showForm ? handleSetCoordinatesFromMap : undefined}
              />

              {ownedItems.length === 0 ? (
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
                  items={mapFilterActive ? visibleItems : ownedItems}
                  user={user}
                  onEdit={(item) => {
                    setShowForm(true);
                    handleStartEdit(item);
                  }}
                  onToggleResolve={handleToggleResolve}
                  onDelete={handleDelete}
                  onMessageOwner={handleMessageOwner}
                />
              )}
            </>
          ) : (
            <>
              {ownedItems.length === 0 ? (
                <p className="empty">
                  {searchQuery || filterType !== 'all'
                    ? 'No items match your search.'
                    : user
                    ? 'No items yet. Be the first to post!'
                    : 'No items yet.'}
                </p>
              ) : (
                <ItemsList
                  items={ownedItems}
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
