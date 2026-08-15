'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Crosshair, Map as MapIcon, Minus, Plus, Satellite } from 'lucide-react';
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
  onCustomPointsChange?: Dispatch<SetStateAction<MapCoordinate[]>>;
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

function mapStyleUrl(style: 'streets' | 'satellite') {
  return style === 'satellite'
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/light-v11';
}

function toFeatureCollection(feature: GeoJSON.Feature | null): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: feature ? [feature] : [] };
}

function ensureSearchAreaLayers(
  map: mapboxgl.Map,
  paints: { fillColor: string; fillOpacity: number; lineColor: string; lineOpacity: number; isSatellite: boolean },
) {
  if (!map.getSource(SEARCH_AREA_SOURCE)) {
    map.addSource(SEARCH_AREA_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  if (!map.getLayer(SEARCH_AREA_FILL)) {
    map.addLayer({
      id: SEARCH_AREA_FILL,
      type: 'fill',
      source: SEARCH_AREA_SOURCE,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': paints.fillColor, 'fill-opacity': paints.fillOpacity },
    });
  }

  if (!map.getLayer(SEARCH_AREA_LINE)) {
    map.addLayer({
      id: SEARCH_AREA_LINE,
      type: 'line',
      source: SEARCH_AREA_SOURCE,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: { 'line-color': paints.lineColor, 'line-width': 2, 'line-opacity': 0.75 },
    });
  }

  if (!map.getLayer(SEARCH_AREA_STROKE)) {
    map.addLayer({
      id: SEARCH_AREA_STROKE,
      type: 'line',
      source: SEARCH_AREA_SOURCE,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'line-color': paints.lineColor,
        'line-width': paints.isSatellite ? 2.5 : 2,
        'line-opacity': paints.lineOpacity,
      },
    });
  }
}

function mapControlButtonClass(extra?: string) {
  return cn(
    'flex size-9 items-center justify-center text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40',
    extra,
  );
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
  const mapStyleRef = useRef(mapStyle);
  const [mapReady, setMapReady] = useState(false);
  const appliedStyleRef = useRef<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  customPointsRef.current = customPoints;
  areaModeRef.current = areaMode;
  onCustomPointsChangeRef.current = onCustomPointsChange;
  mapStyleRef.current = mapStyle;

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
  const subjectLat = subjectPoint?.latitude;
  const subjectLng = subjectPoint?.longitude;
  const isPreview = mode === 'preview';
  const canRenderMap = Boolean(token && subjectLat !== undefined && subjectLng !== undefined && (isPreview || compPoints.length > 0));

  const syncSearchArea = useCallback(
    (map: mapboxgl.Map, subject: MapCoordinate) => {
      if (!map.isStyleLoaded()) return;

      const feature = searchAreaGeoJson(areaModeRef.current, subject, radiusMiles, customPointsRef.current);
      const isSatellite = mapStyleRef.current === 'satellite';
      const paints = {
        fillColor: isSatellite ? '#fafafa' : '#3f3f46',
        fillOpacity: isSatellite ? 0.34 : 0.12,
        lineColor: isSatellite ? '#ffffff' : '#3f3f46',
        lineOpacity: isSatellite ? 0.92 : 0.45,
        isSatellite,
      };

      try {
        ensureSearchAreaLayers(map, paints);

        const source = map.getSource(SEARCH_AREA_SOURCE) as mapboxgl.GeoJSONSource | undefined;
        source?.setData(toFeatureCollection(feature));

        const isLine = feature?.geometry.type === 'LineString';

        if (map.getLayer(SEARCH_AREA_FILL)) {
          map.setPaintProperty(SEARCH_AREA_FILL, 'fill-color', paints.fillColor);
          map.setPaintProperty(SEARCH_AREA_FILL, 'fill-opacity', paints.fillOpacity);
          map.setLayoutProperty(SEARCH_AREA_FILL, 'visibility', isLine ? 'none' : 'visible');
        }
        if (map.getLayer(SEARCH_AREA_LINE)) {
          map.setPaintProperty(SEARCH_AREA_LINE, 'line-color', paints.lineColor);
          map.setLayoutProperty(SEARCH_AREA_LINE, 'visibility', isLine ? 'visible' : 'none');
        }
        if (map.getLayer(SEARCH_AREA_STROKE)) {
          map.setPaintProperty(SEARCH_AREA_STROKE, 'line-color', paints.lineColor);
          map.setPaintProperty(SEARCH_AREA_STROKE, 'line-opacity', paints.lineOpacity);
          map.setPaintProperty(SEARCH_AREA_STROKE, 'line-width', isSatellite ? 2.5 : 2);
          map.setLayoutProperty(SEARCH_AREA_STROKE, 'visibility', isLine ? 'none' : 'visible');
        }
      } catch (err) {
        console.warn('CMA map search area sync failed:', err);
      }
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

  const syncSearchAreaRef = useRef(syncSearchArea);
  syncSearchAreaRef.current = syncSearchArea;
  const syncVertexMarkersRef = useRef(syncVertexMarkers);
  syncVertexMarkersRef.current = syncVertexMarkers;
  const syncCompMarkersRef = useRef(syncCompMarkers);
  syncCompMarkersRef.current = syncCompMarkers;

  const resyncMapLayers = useCallback(
    (map: mapboxgl.Map, subject: MapCoordinate) => {
      syncSearchAreaRef.current(map, subject);
      syncVertexMarkersRef.current(map);
      syncCompMarkersRef.current(map, subject);
    },
    [],
  );

  useEffect(() => {
    if (!canRenderMap || !containerRef.current || subjectLat === undefined || subjectLng === undefined) return;

    const subject: MapCoordinate = { latitude: subjectLat, longitude: subjectLng };

    mapboxgl.accessToken = token!;
    setMapReady(false);

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapStyleUrl(mapStyleRef.current),
      center: toLngLat(subject),
      zoom: 13,
      attributionControl: false,
      logoPosition: 'bottom-left',
    });

    mapRef.current = map;
    map.getCanvas().style.cursor = areaModeRef.current === 'custom' ? 'crosshair' : '';

    const handleClick = (event: mapboxgl.MapMouseEvent) => {
      if (areaModeRef.current !== 'custom') return;
      event.preventDefault();
      const nextPoint: MapCoordinate = {
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      };
      onCustomPointsChangeRef.current?.((prev) => [...prev, nextPoint]);
    };

    map.on('click', handleClick);

    map.on('load', () => {
      resyncMapLayers(map, subject);

      const fitPoints: MapCoordinate[] = isPreview
        ? [subject]
        : [subject, ...compPoints.map(({ coordinate }) => coordinate)];
      const bounds = boundsForPoints(fitPoints);
      if (bounds) {
        map.fitBounds(bounds, {
          padding: { top: 56, bottom: 88, left: 48, right: 56 },
          maxZoom: isPreview ? 14 : 15,
          duration: 0,
        });
      }

      homeViewRef.current = {
        center: map.getCenter().toArray() as [number, number],
        zoom: map.getZoom(),
      };
      appliedStyleRef.current = mapStyleUrl(mapStyleRef.current);
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
  }, [canRenderMap, isPreview, resyncMapLayers, subjectLat, subjectLng, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || subjectLat === undefined || subjectLng === undefined) return;

    const nextStyle = mapStyleUrl(mapStyle);
    if (appliedStyleRef.current === nextStyle) return;

    appliedStyleRef.current = nextStyle;
    map.setStyle(nextStyle);
    map.once('style.load', () => {
      const subject: MapCoordinate = { latitude: subjectLat, longitude: subjectLng };
      resyncMapLayers(map, subject);
    });
  }, [mapStyle, mapReady, resyncMapLayers, subjectLat, subjectLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || subjectLat === undefined || subjectLng === undefined) return;

    const subject: MapCoordinate = { latitude: subjectLat, longitude: subjectLng };
    syncSearchAreaRef.current(map, subject);
    syncVertexMarkersRef.current(map);
    map.getCanvas().style.cursor = areaMode === 'custom' ? 'crosshair' : '';
  }, [areaMode, customPoints, mapReady, radiusMiles, subjectLat, subjectLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || subjectLat === undefined || subjectLng === undefined) return;
    const subject: MapCoordinate = { latitude: subjectLat, longitude: subjectLng };
    syncCompMarkersRef.current(map, subject);
  }, [compPoints, isPreview, mapReady, subjectAddress, subjectLat, subjectLng]);

  const handleRecenter = () => {
    const map = mapRef.current;
    const home = homeViewRef.current;
    if (!map || !home) return;
    map.flyTo({ center: home.center, zoom: home.zoom, duration: 800 });
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 200 });
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

  const showClearSelection = areaMode === 'custom' && customPoints.length > 0;

  const mapFrameClass = cn(
    'relative isolate h-full min-h-0 w-full overflow-hidden rounded-2xl',
    fillContainer ? '' : cn('min-h-[320px] flex-1 lg:min-h-[400px]', mapHeightClassName),
  );

  const mapCanvasClass =
    'h-full w-full [&_.mapboxgl-ctrl-attrib]:!hidden [&_.mapboxgl-ctrl-logo]:!hidden [&_.mapboxgl-ctrl-top-right]:!hidden';

  const controlRailClass =
    'pointer-events-auto absolute right-4 top-4 z-20 overflow-hidden rounded-lg border border-gray-200/90 bg-white/95 shadow-md backdrop-blur-sm';

  const recenterButtonClass =
    'absolute bottom-[4.75rem] right-4 z-20 flex size-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white/95 text-gray-700 shadow-md backdrop-blur-sm hover:bg-white';

  return (
    <div className={cn(fillContainer ? 'h-full min-h-0 w-full' : hideLegend ? 'flex h-full min-h-0 flex-col' : 'space-y-2')}>
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

      <div className={mapFrameClass}>
        <div ref={containerRef} className={mapCanvasClass} aria-label="Comparable sales map" />

        {fillContainer && (
          <>
            {showClearSelection && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute left-4 top-4 z-20 rounded-lg border border-gray-200/90 bg-white/95 px-3 py-2 text-[12.5px] font-medium text-gray-800 shadow-md backdrop-blur-sm hover:bg-white"
              >
                Clear selection
              </button>
            )}

            <div className={controlRailClass}>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={handleZoomIn}
                className={mapControlButtonClass('border-b border-gray-200/90')}
              >
                <Plus className="size-4" strokeWidth={2.25} />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={handleZoomOut}
                className={mapControlButtonClass()}
              >
                <Minus className="size-4" strokeWidth={2.25} />
              </button>
            </div>

            <button
              type="button"
              aria-label="Recenter map on subject property"
              onClick={handleRecenter}
              className={recenterButtonClass}
            >
              <Crosshair className="size-4" />
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
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

            <div className="absolute bottom-4 left-4 z-20">
              <button
                type="button"
                aria-label={mapStyle === 'satellite' ? 'Show street map' : 'Show satellite map'}
                onClick={() => setMapStyle((s) => (s === 'satellite' ? 'streets' : 'satellite'))}
                className="flex size-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white/95 text-gray-700 shadow-md backdrop-blur-sm hover:bg-white"
              >
                {mapStyle === 'satellite' ? <MapIcon className="size-4" /> : <Satellite className="size-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
