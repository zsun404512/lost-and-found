import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export function useItems({ setMessage } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');

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

    const queryString = params.toString();
    const url = `/api/items${queryString ? `?${queryString}` : ''}`;
    console.log('Fetching:', url);

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
  }, [debouncedSearch, filterType, setMessage]);

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
  };
}
