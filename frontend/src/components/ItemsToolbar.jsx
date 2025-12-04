// Search and filtering toolbar for the items list/map, including history,
// item/status/ownership filters, and map-scope controls.
import { useState } from 'react';

export default function ItemsToolbar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  searchHistory,
  onSearchSubmit,
  onHistorySelect,
  onClearHistory,
  mapFilterActive,
  onMapFilterChange,
  ownOnly,
  onOwnOnlyChange,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <>
      <div className="filter-container">
        <label style={{ display: 'none' }} htmlFor="search-input">
          Search
        </label>
        <input
          id="search-input"
          type="search"
          className="search-bar"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearchSubmit(searchQuery);
            }
          }}
          style={{ marginBottom: '16px' }}
        />
        {searchHistory && searchHistory.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '0.9em', color: '#666' }}>Recent searches</span>
              <button
                type="button"
                className="btn btn-link clear-history-btn"
                onClick={onClearHistory}
                style={{ padding: '4px 8px', fontSize: '0.9em' }}
              >
                Clear
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
              }}
            >
              {searchHistory.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onHistorySelect(term)}
                  className="btn btn-secondary"
                  style={{
                    padding: '2px 6px',
                    fontSize: '0.85em',
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="view-toggle">
          <label className="filters-checkbox">
            <input
              type="checkbox"
              checked={viewMode === 'map'}
              onChange={(e) =>
                onViewModeChange(e.target.checked ? 'map' : 'list')
              }
            />
            <span>Show map view</span>
          </label>
        </div>
        <div className="filters-bar">
          <button
            type="button"
            className="btn-secondary filters-toggle"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {filtersOpen ? 'Hide filters' : 'Show filters'}
          </button>
        </div>

        {filtersOpen && (
          <div className="filters-panel">
            {/* Item type */}
            <div className="filters-group">
              <div className="filters-label">Item type</div>
              <div className="filters-options">
                <button
                  type="button"
                  className={
                    filterType === 'all'
                      ? 'filters-chip filters-chip--active'
                      : 'filters-chip'
                  }
                  onClick={() => onFilterChange('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={
                    filterType === 'lost'
                      ? 'filters-chip filters-chip--active'
                      : 'filters-chip'
                  }
                  onClick={() => onFilterChange('lost')}
                >
                  Lost
                </button>
                <button
                  type="button"
                  className={
                    filterType === 'found'
                      ? 'filters-chip filters-chip--active'
                      : 'filters-chip'
                  }
                  onClick={() => onFilterChange('found')}
                >
                  Found
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="filters-group">
              <div className="filters-label">Status</div>
              <div className="filters-options">
                <button
                  type="button"
                  className={
                    statusFilter === 'open'
                      ? 'filters-chip filters-chip--active'
                      : 'filters-chip'
                  }
                  onClick={() => onStatusFilterChange('open')}
                >
                  Open only
                </button>
                <button
                  type="button"
                  className={
                    statusFilter === 'resolved'
                      ? 'filters-chip filters-chip--active'
                      : 'filters-chip'
                  }
                  onClick={() => onStatusFilterChange('resolved')}
                >
                  Resolved only
                </button>
                <button
                  type="button"
                  className={
                    statusFilter === 'all'
                      ? 'filters-chip filters-chip--active'
                      : 'filters-chip'
                  }
                  onClick={() => onStatusFilterChange('all')}
                >
                  All
                </button>
              </div>
            </div>

            <div className="filters-group">
              <div className="filters-label">Posts</div>
              <div className="filters-options">
                <button
                  type="button"
                  className={
                    !ownOnly
                      ? 'filters-chip filters-chip--active'
                      : 'filters-chip'
                  }
                  onClick={() => onOwnOnlyChange(false)}
                >
                  All posts
                </button>
                <button
                  type="button"
                  className={
                    ownOnly
                      ? 'filters-chip filters-chip--active'
                      : 'filters-chip'
                  }
                  onClick={() => onOwnOnlyChange(true)}
                >
                  My posts only
                </button>
              </div>
            </div>

            {/* View + map radius */}
            <div className="filters-group">
              <div className="filters-label">Map filter</div>
              <div className="filters-options-column">
                <label className="filters-checkbox filters-checkbox-nested">
                  <input
                    type="checkbox"
                    disabled={viewMode !== 'map'}
                    checked={viewMode === 'map' && mapFilterActive}
                    onChange={(e) => onMapFilterChange(e.target.checked)}
                  />
                  <span>
                    Only show items in current map area
                    {viewMode !== 'map' && ' (enable map view first)'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div> {/* closes .filter-container */}
    </>
  );
}
