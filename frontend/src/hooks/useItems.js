import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export function useItems({ setMessage } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [statusFilter, setStatusFilter] = useState('open');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Reset pagination when search or filters change
  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setTotalItems(0);
    setTotalPages(1);
  }, [debouncedSearch, filterType, statusFilter]);

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
    params.append('page', String(page));
    params.append('limit', String(itemsPerPage));
    const queryString = params.toString();
    const url = `/api/items${queryString ? `?${queryString}` : ''}`;
    console.log('Fetching:', url);

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const incomingItems = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : [];

        if (page === 1) {
          setItems(incomingItems);
        } else {
          setItems((prev) => [...prev, ...incomingItems]);
        }

        if (!Array.isArray(data)) {
          const total =
            typeof data.totalItems === 'number'
              ? data.totalItems
              : incomingItems.length;
          const pages =
            typeof data.totalPages === 'number'
              ? data.totalPages
              : 1;
          const more =
            typeof data.hasMore === 'boolean'
              ? data.hasMore
              : page < pages;

          setTotalItems(total);
          setTotalPages(pages);
          setHasMore(more);
        } else {
          // Fallback if backend still returns a plain array
          setTotalItems(incomingItems.length);
          setTotalPages(1);
          setHasMore(false);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setItems([]);
         setHasMore(false);
        if (typeof setMessage === 'function') {
          setMessage({ type: 'error', text: 'Failed to load items' });
        }
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, filterType, statusFilter, page, itemsPerPage, setMessage]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    setPage((prev) => prev + 1);
  };

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
    page,
    totalPages,
    totalItems,
    hasMore,
    loadMore,
  };
}
