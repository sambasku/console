import { useEffect, useRef, useState } from 'react';
import { AutoComplete, InputNumber, Skeleton, Space, Typography } from 'antd';
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  reverseNominatim,
  searchNominatim,
  type MapBias,
  type MapPoint,
  type NominatimPlace,
} from './nominatim';
import { OPENFREEMAP_STYLE_BRIGHT } from './basemap';

const DEFAULT_CENTER: MapPoint = { lat: -2.5, lng: 118 };
const PIN = '#1677ff';

function createPin(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '18px';
  el.style.height = '18px';
  el.style.margin = '0';
  el.style.borderRadius = '50%';
  el.style.background = PIN;
  el.style.border = '2px solid #fff';
  el.style.boxShadow = '0 1px 4px rgba(0,0,0,.45)';
  el.style.zIndex = '5';
  return el;
}

export interface MapPickerProps {
  value?: MapPoint | null;
  onChange?: (point: MapPoint | null) => void;
  defaultCenter?: MapPoint;
  /** Bias hasil Nominatim. `bounded` memaksa hasil di dalam kotak. */
  bias?: MapBias;
  bounded?: boolean;
  height?: number;
  disabled?: boolean;
}

/**
 * Peta klik-dan-cari. Tidak tahu soal form atau domain.
 * Modul lain: `<MapPicker value={point} onChange={setPoint} />`.
 * Basemap: MapLibre + petak vektor OpenFreeMap Bright.
 */
export function MapPicker({
  value = null,
  onChange,
  defaultCenter = DEFAULT_CENTER,
  bias,
  bounded = false,
  height = 320,
  disabled = false,
}: MapPickerProps) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<NominatimPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapError, setMapError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ lat: number | null; lng: number | null }>({
    lat: value?.lat ?? null,
    lng: value?.lng ?? null,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  const flownRef = useRef<string | null>(null);
  const loadedRef = useRef(false);
  const centerOnNextRef = useRef(value != null);
  const pointRef = useRef<MapPoint | null>(value);
  onChangeRef.current = onChange;
  disabledRef.current = disabled;
  pointRef.current = value;

  const lat = value?.lat;
  const lng = value?.lng;

  const applyPoint = (map: MapLibreMap) => {
    if (!loadedRef.current) return;
    const point = pointRef.current;
    if (!point) {
      markerRef.current?.remove();
      markerRef.current = null;
      flownRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const marker = new Marker({
        element: createPin(),
        anchor: 'center',
        draggable: !disabledRef.current,
      })
        .setLngLat([point.lng, point.lat])
        .addTo(map);
      marker.on('dragend', () => {
        const ll = marker.getLngLat();
        centerOnNextRef.current = false;
        onChangeRef.current?.({ lat: ll.lat, lng: ll.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([point.lng, point.lat]);
      markerRef.current.setDraggable(!disabledRef.current);
    }
    if (!centerOnNextRef.current) return;
    const key = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
    centerOnNextRef.current = false;
    if (flownRef.current === key) return;
    flownRef.current = key;
    map.jumpTo({ center: [point.lng, point.lat], zoom: Math.max(map.getZoom() || 0, 15) });
  };
  const applyPointRef = useRef(applyPoint);
  applyPointRef.current = applyPoint;
  const startRef = useRef({
    lng: (value ?? defaultCenter).lng,
    lat: (value ?? defaultCenter).lat,
    zoom: value ? 15 : 11,
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: node,
        style: OPENFREEMAP_STYLE_BRIGHT,
        center: [startRef.current.lng, startRef.current.lat],
        zoom: startRef.current.zoom,
        attributionControl: { compact: true },
      });
    } catch (err) {
      setMapStatus('error');
      setMapError(err instanceof Error ? err.message : 'Peta gagal dimuat');
      return;
    }
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      loadedRef.current = true;
      map.resize();
      markerRef.current?.remove();
      markerRef.current = null;
      flownRef.current = null;
      applyPointRef.current(map);
      setMapStatus('ready');
    });
    map.on('error', (event) => {
      const detail = event as unknown as { sourceId?: string; error?: { message?: string } };
      if (detail.sourceId) return;
      const message = detail.error?.message ?? '';
      if (/tile|glyph|sprite/i.test(message)) return;
      setMapError(message || 'Peta gagal dimuat');
      setMapStatus('error');
    });
    map.on('click', (event) => {
      if (disabledRef.current) return;
      centerOnNextRef.current = false;
      onChangeRef.current?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });
    const observer = new ResizeObserver(() => {
      map.resize();
      if (loadedRef.current) applyPointRef.current(map);
    });
    observer.observe(node);
    mapRef.current = map;
    return () => {
      observer.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      loadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyPointRef.current(map);
  }, [lat, lng, disabled]);

  useEffect(() => {
    setDraft((prev) => {
      if (lat != null && lng != null) return { lat, lng };
      if (lat == null && lng == null && prev.lat != null && prev.lng != null) {
        return { lat: null, lng: null };
      }
      return prev;
    });
  }, [lat, lng]);

  const pick = (point: MapPoint | null, center = false) => {
    if (disabled) return;
    centerOnNextRef.current = center;
    onChange?.(point);
  };

  const setAxis = (axis: 'lat' | 'lng', next: number | null) => {
    const merged = { ...draft, [axis]: next };
    setDraft(merged);
    if (merged.lat != null && merged.lng != null) pick({ lat: merged.lat, lng: merged.lng });
    else if (merged.lat == null && merged.lng == null) pick(null);
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setHits([]);
      setSearching(false);
      return;
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      setError(null);
      searchNominatim(q, { bias, bounded, signal: ac.signal })
        .then((rows) => {
          if (!ac.signal.aborted) setHits(rows);
        })
        .catch((err: unknown) => {
          if (ac.signal.aborted) return;
          setHits([]);
          setError(err instanceof Error ? err.message : 'Pencarian gagal');
        })
        .finally(() => {
          if (!ac.signal.aborted) setSearching(false);
        });
    }, 600);
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [query, bias, bounded]);

  useEffect(() => {
    if (lat == null || lng == null) {
      setLabel(null);
      return;
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      reverseNominatim({ lat, lng }, ac.signal)
        .then((name) => {
          if (!ac.signal.aborted) setLabel(name);
        })
        .catch(() => {
          if (!ac.signal.aborted) setLabel(null);
        });
    }, 500);
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [lat, lng]);

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <AutoComplete
        style={{ width: '100%' }}
        value={query}
        disabled={disabled}
        placeholder="Cari lewat Nominatim, atau klik peta"
        options={hits.map((hit) => ({ value: hit.label, label: hit.label }))}
        onSearch={setQuery}
        onSelect={(selected) => {
          const hit = hits.find((row) => row.label === selected);
          if (!hit) return;
          setQuery(hit.label);
          setLabel(hit.label);
          pick({ lat: hit.lat, lng: hit.lng }, true);
        }}
        notFoundContent={searching ? 'Mencari...' : query.trim().length >= 3 ? 'Tidak ketemu' : null}
      />
      <div style={{ position: 'relative', height, borderRadius: 8, overflow: 'hidden' }}>
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        {mapStatus !== 'ready' ? (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Skeleton.Node active style={{ width: '100%', height: '100%' }} />
            {mapStatus === 'error' && mapError ? (
              <Typography.Text
                type="danger"
                style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}
              >
                {mapError}
              </Typography.Text>
            ) : null}
          </div>
        ) : null}
      </div>
      <Space wrap>
        <InputNumber
          value={draft.lat}
          disabled={disabled}
          step={0.000001}
          placeholder="Latitude"
          style={{ width: 180 }}
          onChange={(next) => setAxis('lat', typeof next === 'number' ? next : null)}
        />
        <InputNumber
          value={draft.lng}
          disabled={disabled}
          step={0.000001}
          placeholder="Longitude"
          style={{ width: 180 }}
          onChange={(next) => setAxis('lng', typeof next === 'number' ? next : null)}
        />
      </Space>
      {label ? <Typography.Text type="secondary">{label}</Typography.Text> : null}
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Peta vektor OpenFreeMap. Pencarian Nominatim.
      </Typography.Text>
    </Space>
  );
}
