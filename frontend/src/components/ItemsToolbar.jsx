export default function ItemsToolbar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <>
      <div className="filter-container">
        <input
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
          style={{ marginBottom: '16px' }}
        >
          <option value="all">All Items</option>
          <option value="lost">Lost Items</option>
          <option value="found">Found Items</option>
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
        >
          Map view
        </button>
      </div>
    </>
  );
}
