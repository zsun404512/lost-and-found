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
  onClearHistory
}) {
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
        <select
          className="type-filter"
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value)}
          style={{ marginBottom: '16px', marginRight: '8px' }}
        >
          <option value="all">All Items</option>
          <option value="lost">Lost Items</option>
          <option value="found">Found Items</option>
        </select>

        <select
          className="type-filter"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          style={{ marginBottom: '16px' }}
        >
          <option value="open">Open Only</option>
          <option value="resolved">Resolved Only</option>
          <option value="all">All Statuses</option>
        </select>
      </div>

      <div className="view-toggle">
        <button
          type="button"
          className={
            viewMode === 'list'
              ? 'view-toggle-button active'
              : 'view-toggle-button'
          }
          onClick={() => onViewModeChange('list')}
          aria-pressed={viewMode === 'list'}
        >
          List view
        </button>
        <button
          type="button"
          className={
            viewMode === 'map'
              ? 'view-toggle-button active'
              : 'view-toggle-button'
          }
          onClick={() => onViewModeChange('map')}
          aria-pressed={viewMode === 'map'}
        >
          Map view
        </button>
      </div>
    </>
  );
}
