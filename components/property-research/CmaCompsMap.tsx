'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocateFixed, Map as MapIcon, Satellite } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoredComp } from '@/lib/cma';
import { formatListingStatus } from '@/lib/comp-filters';
import {
  boundsForPoints,
  radiusCirclePolygon,
  toLngLat,
  type MapCoordinate,
} from '@/lib/cma-map-utils';

export interface CmaCompsMapProps {
  subjectLocation: MapCoordinate | null;
  comps?: ScoredComp[];
  radiusMiles: number;
  subjectAddress?: string;
  /** Preview shows subject pin + radius only; results adds comp pins */
  mode?: 'preview' | 'results';
  /** Tailwind height classes for the map canvas */
  mapHeightClassName?: string;
  /** When true, legend is omitted (e.g. parent shows legend elsewhere) */
  hideLegend?: boolean;
  /** Fill the parent container edge-to-edge */
  fillContainer?: boolean;
}

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

export default function CmaCompsMap({
  subjectLocation,
  comps = [],
  radiusMiles,
  subjectAddress,
  mode = 'results',
  mapHeightClassName = 'h-[320px]',
  hideLegend = false,
  fillContainer = false,
}: CmaCompsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

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
  const canRenderMap = Boolean(
    token && subjectPoint && (isPreview || compPoints.length > 0),
  );

  useEffect(() => {
    if (!canRenderMap || !containerRef.current || !subjectPoint) return;

    mapboxgl.accessToken = token!;

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
    markersRef.current = [];

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const setupMapLayers = () => {
      const circle = radiusCirclePolygon(subjectPoint, radiusMiles);

      map.addSource('search-radius', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: circle,
        },
      });

      map.addLayer({
        id: 'search-radius-fill',
        type: 'fill',
        source: 'search-radius',
        paint: {
          'fill-color': '#3f3f46',
          'fill-opacity': 0.12,
        },
      });

      map.addLayer({
        id: 'search-radius-line',
        type: 'line',
        source: 'search-radius',
        paint: {
          'line-color': '#3f3f46',
          'line-width': 2,
          'line-opacity': 0.45,
        },
      });

      const subjectMarker = new mapboxgl.Marker({
        element: createPinElement({
          label: 'Subject property',
          background: '#18181b',
          size: 28,
        }),
        anchor: 'center',
      })
        .setLngLat(toLngLat(subjectPoint))
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

      const fitPoints: MapCoordinate[] = isPreview
        ? [subjectPoint]
        : [subjectPoint, ...compPoints.map(({ coordinate }) => coordinate)];
      const bounds = boundsForPoints(fitPoints);
      if (bounds) {
        map.fitBounds(bounds, { padding: isPreview ? 64 : 48, maxZoom: isPreview ? 14 : 15, duration: 0 });
      }
    };

    map.on('load', setupMapLayers);

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [canRenderMap, compPoints, isPreview, mapStyle, radiusMiles, subjectAddress, subjectPoint, token]);

  if (!token) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-600',
          fillContainer ? 'h-full min-h-0' : `rounded-[10px] border border-dashed border-gray-200 ${mapHeightClassName}`,
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
          'flex items-center justify-center bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-600',
          fillContainer ? 'h-full min-h-0' : `rounded-[10px] border border-dashed border-gray-200 ${mapHeightClassName}`,
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
          'flex items-center justify-center bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-600',
          fillContainer ? 'h-full min-h-0' : `rounded-[10px] border border-dashed border-gray-200 ${mapHeightClassName}`,
        )}
      >
        Map unavailable — none of the comps include location coordinates.
      </div>
    );
  }

  const containerClass = fillContainer
    ? 'relative h-full min-h-0 w-full overflow-hidden'
    : hideLegend
      ? `flex h-full min-h-0 flex-col ${mapHeightClassName}`
      : 'space-y-2';

  return (
    <div className={containerClass}>
      {!hideLegend && !fillContainer && (
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-full bg-[#0668E1] border border-white shadow-sm" />
            Subject
          </span>
          {!isPreview && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-full bg-[#0668E1] border border-white shadow-sm" />
                Used in valuation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-[#9ca3af] border border-white shadow-sm" />
                Other nearby sale
              </span>
            </>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#0668E1]/55 bg-[#0668E1]/10" />
            {radiusMiles} mi search radius
          </span>
          <span className="text-[10px] text-gray-400 sm:ml-auto">© Mapbox © OpenStreetMap</span>
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          'cma-map-host w-full overflow-hidden [&_.mapboxgl-ctrl-attrib]:!hidden [&_.mapboxgl-ctrl-logo]:!hidden',
          fillContainer ? 'absolute inset-0 h-full' : hideLegend
              ? 'min-h-[320px] flex-1 rounded-[10px] border border-gray-200 lg:min-h-[400px]'
              : mapHeightClassName,
        )}
        aria-label="Comparable sales map"
      />
      {fillContainer && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
            <div className="pointer-events-auto inline-flex items-center rounded-full border border-gray-200/90 bg-white/95 p-1 shadow-md backdrop-blur-sm">
              <span className="rounded-full bg-gray-900 px-4 py-1.5 text-[12.5px] font-medium text-white">
                Radius · {radiusMiles} mi
              </span>
              <span className="px-3 py-1.5 text-[12.5px] text-gray-400">Custom</span>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-col gap-2">
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
            aria-label="Locate me"
            onClick={() => {
              const map = mapRef.current;
              if (!map || !navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition((pos) => {
                map.flyTo({
                  center: [pos.coords.longitude, pos.coords.latitude],
                  zoom: 14,
                });
              });
            }}
            className="absolute bottom-4 right-4 z-10 flex size-10 items-center justify-center rounded-lg border border-gray-200/90 bg-white/95 text-gray-700 shadow-md backdrop-blur-sm hover:bg-white"
          >
            <LocateFixed className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
