export function getItemImageUrl(item) {
  if (!item || !item.image) {
    return null;
  }

  // If the image field still looks like an old filesystem path, treat it as
  // "no image" to avoid depending on backend/uploads.
  if (typeof item.image === 'string' && item.image.startsWith('/uploads')) {
    return null;
  }

  // Otherwise assume it is a Mongo image ID and construct the API URL.
  return `/api/images/${item.image}`;
}

export function formatDateTime(isoString) {
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

export function filterItemsByBounds(items, mapBounds) {
  if (!mapBounds) return items;

  return items.filter((it) => {
    const rawLat = it.lat;
    const rawLng = it.lng;
    const hasLat = rawLat !== undefined && rawLat !== null && rawLat !== '';
    const hasLng = rawLng !== undefined && rawLng !== null && rawLng !== '';

    if (!hasLat || !hasLng) {
      return false;
    }

    const lat = typeof rawLat === 'number' ? rawLat : Number(rawLat);
    const lng = typeof rawLng === 'number' ? rawLng : Number(rawLng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return false;
    }

    return (
      lat >= mapBounds.south &&
      lat <= mapBounds.north &&
      lng >= mapBounds.west &&
      lng <= mapBounds.east
    );
  });
}
