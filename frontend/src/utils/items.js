export function getItemImageUrl(item) {
  if (!item || !item.image) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:4000${item.image}`;
  }

  return item.image;
}
