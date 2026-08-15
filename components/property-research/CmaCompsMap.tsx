'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Crosshair, Map as MapIcon, Satellite } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoredComp } from '@/lib/cma';
import { formatListingStatus } from '@/lib/comp-filters';
import {
  boundsForPoints,
  lineFromPoints,
  polygonFromPoints,
  radiusCirclePolygon,
  toLngLat,
  type MapCoordinate,
} from '@/lib/cma-map-utils';

export type CmaMapAreaMode = 'radius' | 'custom';

export interface CmaCompsMapProps {
  subjectLocation: MapCoordinate | null;
  comps?: ScoredComp[];
  radiusMiles: number;
  subjectAddress?: string;
  mode?: 'preview' | 'results';
  mapHeightClassName?: string;
  hideLegend?: boolean;
  fillContainer?: boolean;
  areaMode?: CmaMapAreaMode;
  onAreaModeChange?: (mode: CmaMapAreaMode) => void;
  customPoints?: MapCoordinate[];
  onCustomPointsChange?: (points: MapCoordinate[]) => void;
}

const SEARCH_AREA_SOURCE = 'search-area';
const SEARCH_AREA_FILL = 'search-area-fill';
const SEARCH_AREA_LINE = 'search-area-line';
const SEARCH_AREA_STROKE = 'search-area-stroke';

function fmtPrice(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return `$${n.toLocaleString()}`;
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCompPopupHtml(comp: ScoredComp) {
  const details = [
    comp.bedrooms !== null ? `${comp.bedrooms} bd` : null,
    comp.bathrooms !== null ? `${comp.bathrooms} ba` : null,
    comp.squareFootage !== null ? `${comp.squareFootage.toLocaleString()} sqft` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return `
    <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.45; color: #1c1d22; min-width: 180px;">
      <p style="margin: 0 0 6px; font-weight: 600;">${escapeHtml(comp.address)}</p>
      <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #0668E1;">${fmtPrice(comp.price)}</p>
      <p style="margin: 0; color: #6b6d76;">${formatListingStatus(comp.listingStatus)} ${fmtDate(comp.soldDate)}</p>
      ${details ? `<p style="margin: 4px 0 0; color: #6b6d76;">${escapeHtml(details)}</p>` : ''}
    </div>
  `;
}

function createPinElement(options: { label: string; background: string; size: number; border?: string }) {
  const el = document.createElement('button');
  el.type = 'button';
  el.setAttribute('aria-label', options.label);
  el.style.width = `${options.size}px`;
  el.style.height = `${options.size}px`;
  el.style.borderRadius = '9999px';
  el.style.border = options.border ?? '2px solid #ffffff';
  el.style.background = options.background;
  el.style.boxShadow = '0 2px 8px rgba(28, 29, 34, 0.22)';
  el.style.cursor = 'pointer';
  el.style.padding = '0';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.color = '#ffffff';
  el.style.fontSize = `${Math.max(10, options.size * 0.38)}px`;
  el.style.fontWeight = '700';
  el.style.lineHeight = '1';
  el.textContent = options.label === 'Subject property' ? 'S' : '';
  return el;
}

function createVertexElement(index: number) {
  const el = document.createElement('button');
  el.type = 'button';
  el.setAttribute('aria-label', `Custom area point ${index + 1}`);
  el.style.width = '14px';
  el.style.height = '14px';
  el.style.borderRadius = '9999px';
  el.style.border = '2px solid #ffffff';
  el.style.background = '#18181b';
  el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.25)';
  el.style.padding = '0';
  return el;
}

function searchAreaGeoJson(
  areaMode: CmaMapAreaMode,
  subjectPoint: MapCoordinate,
  radiusMiles: number,
  customPoints: MapCoordinate[],
): GeoJSON.Feature | null {
  if (areaMode === 'radius') {
    return {
      type: 'Feature',
      properties: {},
      geometry: radiusCirclePolygon(subjectPoint, radiusMiles),
    };
  }

  const polygon = polygonFromPoints(customPoints);
  if (polygon) {
    return { type: 'Feature', properties: {}, geometry: polygon };
  }

  const line = lineFromPoints(customPoints);
  if (line) {
    return { type: 'Feature', properties: {}, geometry: line };
  }

  return null;
}

export default function CmaCompsMap({
  subjectLocation,
  comps = [],
  radiusMiles,
  subjectAddress,
  mode = 'results',
  mapHeightClassName = 'h-[320px]',
  hideLegend = false,
  fillContainer = false,
  areaMode = 'radius',
  onAreaModeChange,
  customPoints = [],
  onCustomPointsChange,
}: CmaCompsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const vertexMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const homeViewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const customPointsRef = useRef(customPoints);
  const areaModeRef = useRef(areaMode);
  const onCustomPointsChangeRef = useRef(onCustomPointsChange);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [mapReady, setMapReady] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  customPointsRef.current = customPoints;
  areaModeRef.current = areaMode;
  onCustomPointsChangeRef.current = onCustomPointsChange;

  const compPoints = useMemo(
    () =>
      comps
        .filter(
          (comp): comp is ScoredComp & { latitude: number; longitude: number } =>
            comp.latitude !== null && comp.longitude !== null,
        )
        .map((comp) => ({
          comp,
          coordinate: { latitude: comp.latitude, longitude: comp.longitude },
        })),
    [comps],
  );

  const subjectPoint = subjectLocation;
  const isPreview = mode === 'preview';
  const canRenderMap = Boolean(token && subjectPoint && (isPreview || compPoints.length > 0));

  const syncSearchArea = useCallback(
    (map: mapboxgl.Map, subject: MapCoordinate) => {
      const feature = searchAreaGeoJson(areaModeRef.current, subject, radiusMiles, customPointsRef.current);
      const source = map.getSource(SEARCH_AREA_SOURCE) as mapboxgl.GeoJSONSource | undefined;

      if (!feature) {
        if (source) {
          source.setData({ type: 'FeatureCollection', features: [] });
        }
        if (map.getLayer(SEARCH_AREA_FILL)) {
          map.setLayoutProperty(SEARCH_AREA_FILL, 'visibility', 'none');
          map.setLayoutProperty(SEARCH_AREA_LINE, 'visibility', 'none');
          map.setLayoutProperty(SEARCH_AREA_STROKE, 'visibility', 'none');
        }
        return;
      }

      const isLine = feature.geometry.type === 'LineString';
      if (source) {
        source.setData(feature);
      } else {
        map.addSource(SEARCH_AREA_SOURCE, { type: 'geojson', data: feature });
        map.addLayer({
          id: SEARCH_AREA_FILL,
          type: 'fill',
          source: SEARCH_AREA_SOURCE,
          filter: ['==', '$type', 'Polygon'],
          paint: { 'fill-color': '#3f3f46', 'fill-opacity': 0.12 },
        });
        map.addLayer({
          id: SEARCH_AREA_LINE,
          type: 'line',
          source: SEARCH_AREA_SOURCE,
          filter: ['==', '$type', 'LineString'],
          paint: { 'line-color': '#3f3f46', 'line-width': 2, 'line-opacity': 0.65 },
        });
        map.addLayer({
          id: SEARCH_AREA_STROKE,
          type: 'line',
          source: SEARCH_AREA_SOURCE,
          filter: ['==', '$type', 'Polygon'],
          paint: { 'line-color': '#3f3f46', 'line-width': 2, 'line-opacity': 0.45 },
        });
      }

      map.setLayoutProperty(SEARCH_AREA_FILL, 'visibility', isLine ? 'none' : 'visible');
      map.setLayoutProperty(SEARCH_AREA_LINE, 'visibility', isLine ? 'visible' : 'none');
      map.setLayoutProperty(SEARCH_AREA_STROKE, 'visibility', isLine ? 'none' : 'visible');
    },
    [radiusMiles],
  );

  const syncVertexMarkers = useCallback((map: mapboxgl.Map) => {
    vertexMarkersRef.current.forEach((marker) => marker.remove());
    vertexMarkersRef.current = [];

    if (areaModeRef.current !== 'custom') return;

    customPointsRef.current.forEach((point, index) => {
      const marker = new mapboxgl.Marker({
        element: createVertexElement(index),
        anchor: 'center',
      })
        .setLngLat(toLngLat(point))
        .addTo(map);
      vertexMarkersRef.current.push(marker);
    });
  }, []);

  const syncCompMarkers = useCallback(
    (map: mapboxgl.Map, subject: MapCoordinate) => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const subjectMarker = new mapboxgl.Marker({
        element: createPinElement({
          label: 'Subject property',
          background: '#18181b',
          size: 28,
        }),
        anchor: 'center',
      })
        .setLngLat(toLngLat(subject))
        .setPopup(
          new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
            `<div style="font-family: system-ui, sans-serif; font-size: 12px;">
              <p style="margin: 0 0 4px; font-weight: 700; color: #0668E1;">Subject property</p>
              <p style="margin: 0; color: #1c1d22;">${escapeHtml(subjectAddress ?? 'Subject')}</p>
            </div>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(subjectMarker);

      if (!isPreview) {
        for (const { comp, coordinate } of compPoints) {
          const selected = comp.selectedForValuation === true;
          const marker = new mapboxgl.Marker({
            element: createPinElement({
              label: comp.address,
              background: selected ? '#0668E1' : '#9ca3af',
              size: selected ? 20 : 16,
              border: selected ? '2px solid #ffffff' : '1.5px solid #ffffff',
            }),
            anchor: 'center',
          })
            .setLngLat(toLngLat(coordinate))
            .setPopup(
              new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: '260px' }).setHTML(
                buildCompPopupHtml(comp),
              ),
            )
            .addTo(map);
          markersRef.current.push(marker);
        }
      }
    },
    [compPoints, isPreview, subjectAddress],
  );

  useEffect(() => {
    if (!canRenderMap || !containerRef.current || !subjectPoint) return;

    mapboxgl.accessToken = token!;
    setMapReady(false);

    const styleUrl =
      mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/light-v11';

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: toLngLat(subjectPoint),
      zoom: 13,
      attributionControl: false,
      logoPosition: 'bottom-right',
    });

    mapRef.current = map;
    map.getCanvas().style.cursor = areaModeRef.current === 'custom' ? 'crosshair' : '';

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const handleClick = (event: mapboxgl.MapMouseEvent) => {
      if (areaModeRef.current !== 'custom') return;
      const nextPoint: MapCoordinate = {
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      };
      onCustomPointsChangeRef.current?.([...customPointsRef.current, nextPoint]);
    };

    map.on('click', handleClick);

    map.on('load', () => {
      syncSearchArea(map, subjectPoint);
      syncVertexMarkers(map);
      syncCompMarkers(map, subjectPoint);

      const fitPoints: MapCoordinate[] = isPreview
        ? [subjectPoint]
        : [subjectPoint, ...compPoints.map(({ coordinate }) => coordinate)];
      const bounds = boundsForPoints(fitPoints);
      if (bounds) {
        map.fitBounds(bounds, {
          padding: { top: 56, bottom: 88, left: 48, right: 48 },
          maxZoom: isPreview ? 14 : 15,
          duration: 0,
        });
      }

      homeViewRef.current = {
        center: map.getCenter().toArray() as [number, number],
        zoom: map.getZoom(),
      };
      setMapReady(true);
    });

    return () => {
      map.off('click', handleClick);
      vertexMarkersRef.current.forEach((marker) => marker.remove());
      vertexMarkersRef.current = [];
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [
    canRenderMap,
    compPoints,
    isPreview,
    mapStyle,
    subjectPoint,
    syncCompMarkers,
    syncSearchArea,
    syncVertexMarkers,
    token,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !subjectPoint) return;

    syncSearchArea(map, subjectPoint);
    syncVertexMarkers(map);
    map.getCanvas().style.cursor = areaMode === 'custom' ? 'crosshair' : '';
  }, [areaMode, customPoints, mapReady, radiusMiles, subjectPoint, syncSearchArea, syncVertexMarkers]);

  const handleRecenter = () => {
    const map = mapRef.current;
    const home = homeViewRef.current;
    if (!map || !home) return;
    map.flyTo({ center: home.center, zoom: home.zoom, duration: 800 });
  };

  const handleClearSelection = () => {
    onCustomPointsChange?.([]);
  };

  const handleAreaMode = (next: CmaMapAreaMode) => {
    if (next === areaMode) return;
    onAreaModeChange?.(next);
    if (next === 'radius') {
      onCustomPointsChange?.([]);
    }
  };

  if (!token) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-600',
          fillContainer ? 'h-full min-h-0' : `border border-dashed border-gray-200 ${mapHeightClassName}`,
        )}
      >
        Map unavailable — add <code className="text-[12px]">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to enable the comps map.
      </div>
    );
  }

  if (!subjectPoint) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-600',
          fillContainer ? 'h-full min-h-0' : `border border-dashed border-gray-200 ${mapHeightClassName}`,
        )}
      >
        Map unavailable — subject coordinates were not returned for this address.
      </div>
    );
  }

  if (!isPreview && compPoints.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-600',
          fillContainer ? 'h-full min-h-0' : `border border-dashed border-gray-200 ${mapHeightClassName}`,
        )}
      >
        Map unavailable — none of the comps include location coordinates.
      </div>
    );
  }

  const mapShellClass = fillContainer
    ? 'relative h-full min-h-0 w-full overflow-hidden rounded-xl'
    : hideLegend
      ? cn('relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl', mapHeightClassName)
      : 'space-y-2';

  const mapCanvasClass = cn(
    'cma-map-host absolute inset-0 h-full w-full overflow-hidden rounded-xl',
    '[&_.mapboxgl-ctrl-attrib]:!hidden [&_.mapboxgl-ctrl-logo]:!hidden',
    '[&_.mapboxgl-ctrl-top-right]:!right-3 [&_.mapboxgl-ctrl-top-right]:!top-3',
  );

  const showClearSelection = areaMode === 'custom' && customPoints.length > 0;

  return (
    <div className={mapShellClass}>
      {!hideLegend && !fillContainer && (
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-full border border-white bg-[#0668E1] shadow-sm" />
            Subject
          </span>
          {!isPreview && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-full border border-white bg-[#0668E1] shadow-sm" />
                Used in valuation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full border border-white bg-[#9ca3af] shadow-sm" />
                Other nearby sale
              </span>
            </>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#0668E1]/55 bg-[#0668E1]/10" />
            {areaMode === 'radius' ? `${radiusMiles} mi search radius` : 'Custom search area'}
          </span>
        </div>
      )}

      <div className={cn(fillContainer ? 'relative h-full min-h-0 w-full' : 'relative min-h-[320px] flex-1 lg:min-h-[400px]')}>
        <div ref={containerRef} className={mapCanvasClass} aria-label="Comparable sales map" />

        {fillContainer && (
          <>
            {showClearSelection && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute left-3 top-3 z-10 rounded-lg border border-gray-200/90 bg-white/95 px-3 py-2 text-[12.5px] font-medium text-gray-800 shadow-md backdrop-blur-sm hover:bg-white"
              >
                Clear selection
              </button>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
              <div className="pointer-events-auto inline-flex items-center rounded-full border border-gray-200/90 bg-white/95 p-1 shadow-md backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => handleAreaMode('radius')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors',
                    areaMode === 'radius' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  Radius · {radiusMiles} mi
                </button>
                <button
                  type="button"
                  onClick={() => handleAreaMode('custom')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors',
                    areaMode === 'custom' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  Custom
                </button>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-4 left-3 z-10 flex flex-col gap-2">
              <button
                type="button"
                aria-label={mapStyle === 'satellite' ? 'Show street map' : 'Show satellite map'}
                onClick={() => setMapStyle((s) => (s === 'satellite' ? 'streets' : 'satellite'))}
                className="pointer-events-auto flex size-10 items-center justify-center rounded-lg border border-gray-200/90 bg-white/95 text-gray-700 shadow-md backdrop-blur-sm hover:bg-white"
              >
                {mapStyle === 'satellite' ? <MapIcon className="size-4" /> : <Satellite className="size-4" />}
              </button>
            </div>

            <button
              type="button"
              aria-label="Recenter map on subject property"
              onClick={handleRecenter}
              className="absolute bottom-4 right-3 z-10 flex size-10 items-center justify-center rounded-lg border border-gray-200/90 bg-white/95 text-gray-700 shadow-md backdrop-blur-sm hover:bg-white"
            >
              <Crosshair className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
