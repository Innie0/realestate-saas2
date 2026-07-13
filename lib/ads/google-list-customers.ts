export interface GoogleAdsCustomerInfo {
  customerId: string | null;
  customerName: string | null;
  /** False when GOOGLE_ADS_DEVELOPER_TOKEN is missing — verification skipped. */
  verified: boolean;
}

/**
 * List Google Ads customer accounts accessible to the signed-in user.
 * Requires GOOGLE_ADS_DEVELOPER_TOKEN; returns verified:false when not configured.
 */
export async function listGoogleAdsCustomers(accessToken: string): Promise<GoogleAdsCustomerInfo> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken || !accessToken) {
    return { customerId: null, customerName: null, verified: false };
  }

  try {
    const res = await fetch('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': developerToken,
      },
    });

    const json = (await res.json()) as {
      resourceNames?: string[];
      error?: { message?: string };
    };

    if (!res.ok) {
      console.warn('Google Ads listAccessibleCustomers:', json.error?.message ?? res.status);
      return { customerId: null, customerName: null, verified: true };
    }

    const first = json.resourceNames?.[0];
    if (!first) {
      return { customerId: null, customerName: null, verified: true };
    }

    const customerId = first.replace(/^customers\//, '');
    return {
      customerId,
      customerName: customerId ? `Google Ads · ${customerId}` : null,
      verified: true,
    };
  } catch (err) {
    console.warn('Google Ads listAccessibleCustomers error:', err);
    return { customerId: null, customerName: null, verified: true };
  }
}
