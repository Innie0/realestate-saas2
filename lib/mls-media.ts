/**
 * RESO Web API (Spark / Bridge-style) listing photo lookup by MLS number.
 * Optional — when MLS_RESO_ACCESS_TOKEN is unset, all lookups no-op.
 */

const DEFAULT_BASE = 'https://replication.sparkapi.com/Version/3/Reso/OData';
const DEFAULT_MLS_FIELD = 'ListingId';
const BATCH_OR_CHUNK = 8;

type ResoMediaRow = {
  MediaURL?: string | null;
  Order?: number | null;
  PreferredPhotoYN?: boolean | null;
  MediaCategory?: string | null;
};

function getMlsConfig() {
  const token = process.env.MLS_RESO_ACCESS_TOKEN?.trim();
  const baseUrl = (process.env.MLS_RESO_API_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/$/, '');
  const mlsNumberField = process.env.MLS_RESO_MLS_NUMBER_FIELD?.trim() || DEFAULT_MLS_FIELD;
  return { token, baseUrl, mlsNumberField };
}

export function isMlsMediaConfigured(): boolean {
  return Boolean(getMlsConfig().token);
}

function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

function normalizeMlsNumber(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickBestPhoto(media: ResoMediaRow[] | null | undefined): string | null {
  if (!media?.length) return null;

  const photos = media.filter((row) => {
    const url = row.MediaURL?.trim();
    if (!url) return false;
    const category = String(row.MediaCategory ?? '').toLowerCase();
    if (category && !category.includes('photo') && category !== 'image') return false;
    return true;
  });

  if (photos.length === 0) return null;

  const preferred = photos.find((row) => row.PreferredPhotoYN === true);
  const sorted = [...(preferred ? [preferred] : photos)].sort(
    (a, b) => (a.Order ?? 999) - (b.Order ?? 999),
  );

  return sorted[0]?.MediaURL?.trim() ?? null;
}

async function fetchPhotosForMlsNumbers(mlsNumbers: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const { token, baseUrl, mlsNumberField } = getMlsConfig();
  if (!token || mlsNumbers.length === 0) return result;

  const unique = [...new Set(mlsNumbers.map((n) => normalizeMlsNumber(n)).filter(Boolean))] as string[];

  for (let i = 0; i < unique.length; i += BATCH_OR_CHUNK) {
    const chunk = unique.slice(i, i + BATCH_OR_CHUNK);
    const filter = chunk
      .map((num) => `${mlsNumberField} eq '${escapeODataString(num)}'`)
      .join(' or ');

    const params = new URLSearchParams();
    params.set('$filter', filter);
    params.set('$select', mlsNumberField);
    params.set(
      '$expand',
      'Media($select=MediaURL,Order,PreferredPhotoYN,MediaCategory;$orderby=Order asc)',
    );
    params.set('$top', String(chunk.length));

    try {
      const res = await fetch(`${baseUrl}/Property?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) {
        console.warn(`MLS media lookup failed (${res.status}) for ${chunk.length} listing(s)`);
        continue;
      }

      const payload = (await res.json()) as { value?: Record<string, unknown>[] };
      for (const row of payload.value ?? []) {
        const mlsNumber = normalizeMlsNumber(row[mlsNumberField]);
        if (!mlsNumber) continue;
        const media = row.Media as ResoMediaRow[] | null | undefined;
        const photo = pickBestPhoto(media);
        if (photo) result.set(mlsNumber, photo);
      }
    } catch (err) {
      console.warn('MLS media lookup error:', err);
    }
  }

  return result;
}

/** Resolve listing photo URLs for a set of MLS numbers. */
export async function fetchListingPhotosByMlsNumbers(
  mlsNumbers: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  if (!isMlsMediaConfigured()) return new Map();
  const normalized = mlsNumbers
    .map((n) => normalizeMlsNumber(n))
    .filter((n): n is string => Boolean(n));
  if (normalized.length === 0) return new Map();
  return fetchPhotosForMlsNumbers(normalized);
}

/** Convenience wrapper for a single MLS number. */
export async function fetchListingPhotoByMlsNumber(
  mlsNumber: string | null | undefined,
): Promise<string | null> {
  const normalized = normalizeMlsNumber(mlsNumber);
  if (!normalized) return null;
  const map = await fetchListingPhotosByMlsNumbers([normalized]);
  return map.get(normalized) ?? null;
}
