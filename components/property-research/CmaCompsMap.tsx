'use client';

import { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ScoredComp } from '@/lib/cma';
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
      <p style="margin: 0; color: #6b6d76;">Sold ${fmtDate(comp.soldDate)}</p>
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
}: CmaCompsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
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

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: toLngLat(subjectPoint),
      zoom: 13,
      attributionControl: true,
    });

    mapRef.current = map;
    markersRef.current = [];

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
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
          'fill-color': '#0668E1',
          'fill-opacity': 0.08,
        },
      });

      map.addLayer({
        id: 'search-radius-line',
        type: 'line',
        source: 'search-radius',
        paint: {
          'line-color': '#0668E1',
          'line-width': 2,
          'line-opacity': 0.55,
        },
      });

      const subjectMarker = new mapboxgl.Marker({
        element: createPinElement({
          label: 'Subject property',
          background: '#0668E1',
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
          const marker = new mapboxgl.Marker({
            element: createPinElement({
              label: comp.address,
              background: '#1c1d22',
              size: 18,
              border: '2px solid #ffffff',
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
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [canRenderMap, compPoints, isPreview, radiusMiles, subjectAddress, subjectPoint, token]);

  if (!token) {
    return (
      <div className="rounded-[10px] border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-600">
        Map unavailable — add <code className="text-[12px]">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to enable the comps map.
      </div>
    );
  }

  if (!subjectPoint) {
    return (
      <div className="rounded-[10px] border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-600">
        Map unavailable — subject coordinates were not returned for this address.
      </div>
    );
  }

  if (!isPreview && compPoints.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-600">
        Map unavailable — none of the comps include location coordinates.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full bg-[#0668E1] border border-white shadow-sm" />
          Subject
        </span>
        {!isPreview && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-[#1C1D22] border border-white shadow-sm" />
            Comp sale
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#0668E1]/55 bg-[#0668E1]/10" />
          {radiusMiles} mi search radius
        </span>
      </div>
      <div
        ref={containerRef}
        className="h-[320px] w-full overflow-hidden rounded-[10px] border border-gray-200"
        aria-label="Comparable sales map"
      />
    </div>
  );
}
