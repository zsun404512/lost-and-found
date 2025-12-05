// Hook for loading and managing the items collection, with debounced search
// and type/status/view filter state wired into the items API.
import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export function useItems({ setMessage } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [statusFilter, setStatusFilter] = useState('open');

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.append('search', debouncedSearch);
    }
    if (filterType !== 'all') {
      params.append('type', filterType);
    }
    if (statusFilter === 'open') {
      params.append('status', 'open');
    } else if (statusFilter === 'resolved') {
      params.append('status', 'resolved');
    } else {
      params.append('status', 'all');
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
        if (typeof setMessage === 'function') {
          setMessage({ type: 'error', text: 'Failed to load items' });
        }
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, filterType, statusFilter, setMessage]);

  return {
    items,
    setItems,
    loading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
  };
}
