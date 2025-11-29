export function getItemImageUrl(item) {
  if (!item || !item.image) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:4000${item.image}`;
  }

  return item.image;
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
