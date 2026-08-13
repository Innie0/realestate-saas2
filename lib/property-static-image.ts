/**
 * Static map thumbnails for properties (Rentcast listings have no photo URLs).
 * Uses Mapbox Static Images when coordinates are available.
 */

export function propertyStaticImageUrl(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  options: { width?: number; height?: number; zoom?: number } = {},
): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token || latitude == null || longitude == null) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const width = options.width ?? 320;
  const height = options.height ?? 200;
  const zoom = options.zoom ?? 16;

  const pin = `pin-s+0668E1(${longitude},${latitude})`;
  const center = `${longitude},${latitude},${zoom},0`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pin}/${center}/${width}x${height}@2x?access_token=${token}`;
}
