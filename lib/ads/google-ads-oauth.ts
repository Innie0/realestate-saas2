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
