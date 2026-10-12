/**
 * Thin client for the Google Ads REST API.
 *
 * Every call needs the app's developer token plus the user's OAuth access token.
 * Accounts reached through a manager (MCC) also need `login-customer-id` set to
 * that manager's id.
 */

/** Google retires API versions roughly a year after release — bump when it does. */
export const GOOGLE_ADS_API_VERSION = 'v25';

const BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export function getGoogleAdsDeveloperToken(): string | null {
  return process.env.GOOGLE_ADS_DEVELOPER_TOKEN || null;
}

export interface GoogleAdsAuth {
  accessToken: string;
  /** Manager account id when the customer is accessed through one */
  loginCustomerId?: string | null;
}

export class GoogleAdsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** Google Ads error codes, e.g. `DEVELOPER_TOKEN_NOT_APPROVED` */
    public readonly codes: string[],
  ) {
    super(message);
    this.name = 'GoogleAdsApiError';
  }

  has(code: string): boolean {
    return this.codes.includes(code);
  }

  /** The developer token only has test access and this is a real (production) account. */
  get isTestTokenOnProductionAccount(): boolean {
    return (
      this.has('DEVELOPER_TOKEN_NOT_APPROVED') ||
      this.has('CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION')
    );
  }
}

/** Pull the specific error codes out of a Google Ads failure response. */
function extractErrorCodes(body: unknown): string[] {
  const codes: string[] = [];
  const details = (body as { error?: { details?: unknown[] } })?.error?.details ?? [];
  for (const detail of details) {
    const errors = (detail as { errors?: { errorCode?: Record<string, string> }[] })?.errors ?? [];
    for (const err of errors) {
      codes.push(...Object.values(err.errorCode ?? {}));
    }
  }
  const status = (body as { error?: { status?: string } })?.error?.status;
  if (status) codes.push(status);
  return codes;
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  auth: GoogleAdsAuth,
  body?: unknown,
): Promise<T> {
  const developerToken = getGoogleAdsDeveloperToken();
  if (!developerToken) {
    throw new GoogleAdsApiError('GOOGLE_ADS_DEVELOPER_TOKEN is not set', 503, ['NOT_CONFIGURED']);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken}`,
    'developer-token': developerToken,
  };
  if (auth.loginCustomerId) headers['login-customer-id'] = normalizeCustomerId(auth.loginCustomerId);
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      (json as { error?: { message?: string } })?.error?.message ??
      `Google Ads request failed (${res.status})`;
    throw new GoogleAdsApiError(message, res.status, extractErrorCodes(json));
  }
  return json as T;
}

/** Google Ads customer ids are 10 digits; the UI shows them as 123-456-7890. */
export function normalizeCustomerId(id: string): string {
  return id.replace(/^customers\//, '').replace(/-/g, '');
}

export function formatCustomerId(id: string): string {
  const digits = normalizeCustomerId(id);
  return digits.length === 10
    ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    : digits;
}

/** Customer ids the signed-in Google user can access directly. */
export async function listAccessibleCustomerIds(accessToken: string): Promise<string[]> {
  const json = await request<{ resourceNames?: string[] }>(
    'GET',
    '/customers:listAccessibleCustomers',
    { accessToken },
  );
  return (json.resourceNames ?? []).map(normalizeCustomerId);
}

/** Run a GAQL query against one customer and return every result row. */
export async function searchGoogleAds<Row>(
  customerId: string,
  query: string,
  auth: GoogleAdsAuth,
): Promise<Row[]> {
  const rows: Row[] = [];
  let pageToken: string | undefined;
  do {
    const json = await request<{ results?: Row[]; nextPageToken?: string }>(
      'POST',
      `/customers/${normalizeCustomerId(customerId)}/googleAds:search`,
      auth,
      pageToken ? { query, pageToken } : { query },
    );
    rows.push(...(json.results ?? []));
    pageToken = json.nextPageToken;
  } while (pageToken);
  return rows;
}

export interface GoogleAdsMutateResult {
  /** Resource name created by each operation, in the order sent */
  resourceNames: string[];
}

/**
 * Apply several operations as one atomic change: if any fails, none are applied.
 * Operations may reference each other with temporary (negative) resource ids.
 */
export async function mutateGoogleAds(
  customerId: string,
  mutateOperations: Record<string, unknown>[],
  auth: GoogleAdsAuth,
  options?: { validateOnly?: boolean },
): Promise<GoogleAdsMutateResult> {
  const json = await request<{ mutateOperationResponses?: Record<string, { resourceName?: string }>[] }>(
    'POST',
    `/customers/${normalizeCustomerId(customerId)}/googleAds:mutate`,
    auth,
    { mutateOperations, validateOnly: options?.validateOnly === true },
  );
  return {
    resourceNames: (json.mutateOperationResponses ?? []).map(
      (r) => Object.values(r)[0]?.resourceName ?? '',
    ),
  };
}

export interface GeoTargetSuggestion {
  resourceName: string;
  name: string;
  /** e.g. `City`, `State`, `County` */
  targetType: string;
}

/** Look up Google's location ids for place names (US only). */
export async function suggestGeoTargets(
  names: string[],
  auth: GoogleAdsAuth,
): Promise<GeoTargetSuggestion[]> {
  const json = await request<{
    geoTargetConstantSuggestions?: {
      geoTargetConstant?: { resourceName?: string; name?: string; targetType?: string; status?: string };
    }[];
  }>('POST', '/geoTargetConstants:suggest', auth, {
    locale: 'en',
    countryCode: 'US',
    locationNames: { names },
  });
  return (json.geoTargetConstantSuggestions ?? [])
    .map((s) => s.geoTargetConstant)
    .filter((g): g is NonNullable<typeof g> => Boolean(g?.resourceName) && g?.status !== 'REMOVAL_PLANNED')
    .map((g) => ({
      resourceName: String(g.resourceName),
      name: g.name ?? '',
      targetType: g.targetType ?? '',
    }));
}
