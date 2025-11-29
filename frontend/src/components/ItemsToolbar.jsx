export default function ItemsToolbar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
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
          style={{ marginBottom: '16px' }}
        />
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
