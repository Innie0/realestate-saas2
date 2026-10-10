const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

function redirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/ads/google/callback`;
}

export function isGoogleAdsConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && process.env.NEXT_PUBLIC_APP_URL);
}

async function getOAuthClient() {
  const { google } = await import('googleapis');
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri());
}

export async function getGoogleAdsAuthUrl(): Promise<string> {
  const client = await getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
  });
}

export async function exchangeGoogleAdsCode(code: string) {
  const client = await getOAuthClient();
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token || '',
    refresh_token: tokens.refresh_token || '',
    expiry_date: tokens.expiry_date,
  };
}

/** Google access tokens last about an hour; trade the stored refresh token for a new one. */
export async function refreshGoogleAdsAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expiry_date: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error || 'Could not refresh Google access');
  }
  return {
    access_token: json.access_token,
    expiry_date: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}

export async function getGoogleAccountEmail(accessToken: string): Promise<string | null> {
  const { google } = await import('googleapis');
  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri());
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();
  return data.email ?? null;
}

export function getGoogleAdsManagerUrl(): string {
  return 'https://ads.google.com/aw/campaigns';
}
