import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Configure the default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const UCLA_CENTER = [34.0703, -118.4449];
const UCLA_ZOOM = 16;

export default function ItemsMap({ items, onBoundsChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // initialize map once
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(UCLA_CENTER, UCLA_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      if (typeof onBoundsChange === 'function') {
        const updateBounds = () => {
          const b = map.getBounds();
          onBoundsChange({
            north: b.getNorth(),
            south: b.getSouth(),
            east: b.getEast(),
            west: b.getWest(),
          });
        };

        map.on('moveend', updateBounds);
        updateBounds();
      }

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // create or clear markers layer
    if (!markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup().addTo(map);
    } else {
      markersLayerRef.current.clearLayers();
    }

    const validItems = items
      .filter((it) => it.status === 'open')
      .map((it) => {
        const rawLat = it.lat;
        const rawLng = it.lng;

        const hasLat = rawLat !== undefined && rawLat !== null && rawLat !== '';
        const hasLng = rawLng !== undefined && rawLng !== null && rawLng !== '';
        if (!hasLat || !hasLng) {
          return null;
        }

        const lat = typeof rawLat === 'number' ? rawLat : Number(rawLat);
        const lng = typeof rawLng === 'number' ? rawLng : Number(rawLng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          return null;
        }

        return { ...it, lat, lng };
      })
      .filter(Boolean);

    if (validItems.length === 0) {
      map.setView(UCLA_CENTER, UCLA_ZOOM);
      return;
    }

    const bounds = L.latLngBounds([]);

    validItems.forEach((item) => {
      const position = [item.lat, item.lng];

      const marker = L.marker(position).addTo(markersLayerRef.current);

      marker.bindPopup(
        `<div><strong>${item.title || ''}</strong><br/>${
          item.description || ''
        }<br/>${item.date || ''}</div>`,
      );
      bounds.extend(position);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [items]);

  return <div className="map-container" ref={mapRef} />;
}
