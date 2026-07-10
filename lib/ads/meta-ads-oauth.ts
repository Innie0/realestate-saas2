const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/ads/meta/callback`;

const META_SCOPES = ['ads_read', 'ads_management', 'business_management'].join(',');

export function isMetaAdsConfigured(): boolean {
  return Boolean(META_APP_ID && META_APP_SECRET && process.env.NEXT_PUBLIC_APP_URL);
}

export function getMetaAdsAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: META_SCOPES,
    response_type: 'code',
    state: 'meta_ads',
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeMetaAdsCode(code: string) {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    redirect_uri: REDIRECT_URI,
    code,
  });

  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`
  );
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: { message: string };
  };

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error?.message || 'Failed to exchange Meta authorization code');
  }

  const longLivedParams = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    fb_exchange_token: tokenData.access_token,
  });

  const longRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${longLivedParams.toString()}`
  );
  const longData = (await longRes.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  const accessToken = longData.access_token || tokenData.access_token;
  const expiresIn = longData.expires_in ?? tokenData.expires_in ?? 60 * 60 * 24 * 60;
  const expiryDate = Date.now() + expiresIn * 1000;

  return {
    access_token: accessToken,
    refresh_token: '',
    expiry_date: expiryDate,
  };
}

export async function getMetaAccountInfo(accessToken: string): Promise<{
  email: string | null;
  accountId: string | null;
  accountName: string | null;
}> {
  const meRes = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
  );
  const me = (await meRes.json()) as { id?: string; name?: string; email?: string };

  const adAccountsRes = await fetch(
    `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id&access_token=${encodeURIComponent(accessToken)}`
  );
  const adAccounts = (await adAccountsRes.json()) as {
    data?: Array<{ id: string; name?: string; account_id?: string }>;
  };

  const first = adAccounts.data?.[0];
  return {
    email: me.email ?? null,
    accountId: first?.account_id ?? first?.id ?? null,
    accountName: first?.name ?? me.name ?? null,
  };
}

export function getMetaAdsManagerUrl(): string {
  return 'https://www.facebook.com/adsmanager';
}
