import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

// Mock Leaflet so we can test ItemsMap's behavior without a real browser map
vi.mock('leaflet', () => {
  const mapOnHandlers = {};

  const mapBounds = {
    getNorth: () => 10,
    getSouth: () => -10,
    getEast: () => 20,
    getWest: () => -20,
  };

  const mapInstance = {
    setView: vi.fn().mockReturnThis(),
    on: vi.fn((event, cb) => {
      mapOnHandlers[event] = cb;
    }),
    getBounds: vi.fn(() => mapBounds),
    fitBounds: vi.fn(),
  };

  const layerGroupInstance = {
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
  };

  const boundsInstance = {
    extend: vi.fn(),
    isValid: vi.fn(() => true),
  };

  const markers = [];

  function DefaultIcon() {}
  DefaultIcon.prototype._getIconUrl = () => {};
  DefaultIcon.mergeOptions = vi.fn();

  const L = {
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => layerGroupInstance),
    marker: vi.fn((position) => {
      const marker = {
        addTo: vi.fn().mockReturnThis(),
        bindPopup: vi.fn(),
        position,
      };
      markers.push(marker);
      return marker;
    }),
    latLngBounds: vi.fn(() => boundsInstance),
    Icon: { Default: DefaultIcon },

    // Expose internals for assertions
    __mapInstance: mapInstance,
    __mapOnHandlers: mapOnHandlers,
    __markers: markers,
    __boundsInstance: boundsInstance,
  };

  return { __esModule: true, default: L };
});

import L from 'leaflet';
import ItemsMap from '../../src/components/ItemsMap.jsx';

describe('ItemsMap', () => {
  beforeEach(() => {
    L.__markers.length = 0;
    L.__boundsInstance.extend.mockClear();
    L.__boundsInstance.isValid.mockClear();
    L.__mapInstance.fitBounds.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('calls onBoundsChange with map bounds on mount', async () => {
    const onBoundsChange = vi.fn();

    render(<ItemsMap items={[]} onBoundsChange={onBoundsChange} user={null} />);

    await waitFor(() => {
      expect(onBoundsChange).toHaveBeenCalledTimes(1);
    });

    expect(onBoundsChange).toHaveBeenCalledWith({
      north: 10,
      south: -10,
      east: 20,
      west: -20,
    });
  });

  it('creates markers only for open items with valid coordinates', async () => {
    const items = [
      { _id: '1', status: 'open', lat: '34.0', lng: '-118.0', title: 'Open item 1' },
      { _id: '2', status: 'resolved', lat: '34.1', lng: '-118.1', title: 'Resolved item' },
      { _id: '3', status: 'open', lat: null, lng: '-118.2', title: 'Missing lat' },
    ];

    render(<ItemsMap items={items} onBoundsChange={() => {}} user={null} />);

    await waitFor(() => {
      // Only the first item should produce a marker
      expect(L.__markers.length).toBe(1);
    });

    const positions = L.__markers.map((m) => m.position);
    expect(positions).toEqual([[34, -118]]);
  });
});
