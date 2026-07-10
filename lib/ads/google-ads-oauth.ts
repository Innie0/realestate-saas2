import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/ads/google/callback`;

export function isGoogleAdsConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && process.env.NEXT_PUBLIC_APP_URL);
}

export function getGoogleAdsOAuthClient() {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
}

export function getGoogleAdsAuthUrl(): string {
  const client = getGoogleAdsOAuthClient();
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
  const client = getGoogleAdsOAuthClient();
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token || '',
    refresh_token: tokens.refresh_token || '',
    expiry_date: tokens.expiry_date,
  };
}

export async function getGoogleAccountEmail(accessToken: string): Promise<string | null> {
  const client = getGoogleAdsOAuthClient();
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();
  return data.email ?? null;
}

export function getGoogleAdsManagerUrl(): string {
  return 'https://ads.google.com/aw/campaigns';
}
