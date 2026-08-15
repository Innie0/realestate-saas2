/** Helpers for CMA comp map (radius circle, bounds). */

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export function parseCoordinatePair(
  latitude: unknown,
  longitude: unknown,
): MapCoordinate | null {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export function extractCoordinates(raw: Record<string, unknown> | null | undefined): MapCoordinate | null {
  if (!raw) return null;
  return parseCoordinatePair(raw.latitude, raw.longitude);
}

/** Point at distance (km) and bearing (degrees) from origin — for radius circle. */
function destinationPoint(
  lat: number,
  lng: number,
  distanceKm: number,
  bearingDeg: number,
): MapCoordinate {
  const R = 6371;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceKm / R) +
      Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(brng),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(distanceKm / R) * Math.cos(lat1),
      Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2),
    );
  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lon2 * 180) / Math.PI,
  };
}

/** GeoJSON polygon approximating a circle on the WGS84 ellipsoid. */
export function radiusCirclePolygon(
  center: MapCoordinate,
  radiusMiles: number,
  steps = 64,
): GeoJSON.Polygon {
  const km = radiusMiles * 1.609344;
  const ring: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 360;
    const point = destinationPoint(center.latitude, center.longitude, km, bearing);
    ring.push([point.longitude, point.latitude]);
  }

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

export function toLngLat(coord: MapCoordinate): [number, number] {
  return [coord.longitude, coord.latitude];
}

export function boundsForPoints(points: MapCoordinate[]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;

  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;

  for (const point of points) {
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function lineFromPoints(points: MapCoordinate[]): GeoJSON.LineString | null {
  if (points.length < 2) return null;
  return {
    type: 'LineString',
    coordinates: points.map((point) => [point.longitude, point.latitude]),
  };
}

export function polygonFromPoints(points: MapCoordinate[]): GeoJSON.Polygon | null {
  if (points.length < 3) return null;
  const ring: [number, number][] = points.map((point) => [point.longitude, point.latitude]);
  ring.push(ring[0]);
  return { type: 'Polygon', coordinates: [ring] };
}

/** Ray-casting point-in-polygon test for a closed ring. */
export function pointInPolygon(point: MapCoordinate, polygon: MapCoordinate[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;
    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}
