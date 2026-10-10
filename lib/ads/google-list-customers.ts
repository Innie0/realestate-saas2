import {
  formatCustomerId,
  getGoogleAdsDeveloperToken,
  GoogleAdsApiError,
  listAccessibleCustomerIds,
  searchGoogleAds,
} from '@/lib/ads/google-ads-api';

/** Why no usable ad account was found (null when one was). */
export type GoogleAdsAccountIssue =
  /** GOOGLE_ADS_DEVELOPER_TOKEN missing — can't call the API at all */
  | 'not_configured'
  /** Developer token has test access only and this login has only real accounts */
  | 'test_token_only'
  /** Signed in fine, but this Google login has no Google Ads account */
  | 'no_account'
  /** Google rejected the request for another reason */
  | 'api_error';

export interface GoogleAdsCustomerInfo {
  customerId: string | null;
  customerName: string | null;
  /** Manager account the customer is reached through, when not directly accessible */
  loginCustomerId: string | null;
  isTestAccount: boolean;
  /** False when GOOGLE_ADS_DEVELOPER_TOKEN is missing — verification skipped. */
  verified: boolean;
  issue: GoogleAdsAccountIssue | null;
}

interface AdAccount {
  id: string;
  name: string | null;
  isManager: boolean;
  isTestAccount: boolean;
  loginCustomerId: string | null;
}

const MAX_ACCOUNTS_TO_INSPECT = 10;

const NONE: Omit<GoogleAdsCustomerInfo, 'verified' | 'issue'> = {
  customerId: null,
  customerName: null,
  loginCustomerId: null,
  isTestAccount: false,
};

interface CustomerRow {
  customer?: {
    id?: string;
    descriptiveName?: string;
    manager?: boolean;
    testAccount?: boolean;
  };
}

interface CustomerClientRow {
  customerClient?: {
    id?: string;
    descriptiveName?: string;
    manager?: boolean;
    testAccount?: boolean;
  };
}

async function describeAccount(id: string, accessToken: string): Promise<AdAccount> {
  const rows = await searchGoogleAds<CustomerRow>(
    id,
    'SELECT customer.id, customer.descriptive_name, customer.manager, customer.test_account FROM customer LIMIT 1',
    { accessToken },
  );
  const c = rows[0]?.customer;
  return {
    id,
    name: c?.descriptiveName ?? null,
    isManager: c?.manager === true,
    isTestAccount: c?.testAccount === true,
    loginCustomerId: null,
  };
}

/** Ad accounts (non-manager) directly under a manager account. */
async function listClientAccounts(managerId: string, accessToken: string): Promise<AdAccount[]> {
  const rows = await searchGoogleAds<CustomerClientRow>(
    managerId,
    `SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.test_account
     FROM customer_client
     WHERE customer_client.level = 1 AND customer_client.status = 'ENABLED' AND customer_client.manager = FALSE`,
    { accessToken, loginCustomerId: managerId },
  );
  return rows
    .map((r) => r.customerClient)
    .filter((c): c is NonNullable<typeof c> => Boolean(c?.id))
    .map((c) => ({
      id: String(c.id),
      name: c.descriptiveName ?? null,
      isManager: false,
      isTestAccount: c.testAccount === true,
      loginCustomerId: managerId,
    }));
}

/**
 * Find the Google Ads account to advertise from for the signed-in user.
 *
 * Prefers an ad account the user can access directly; otherwise the first ad
 * account under a manager account they can access (how test accounts are set up).
 */
export async function listGoogleAdsCustomers(accessToken: string): Promise<GoogleAdsCustomerInfo> {
  if (!getGoogleAdsDeveloperToken() || !accessToken) {
    return { ...NONE, verified: false, issue: 'not_configured' };
  }

  let ids: string[];
  try {
    ids = await listAccessibleCustomerIds(accessToken);
  } catch (err) {
    console.warn('Google Ads listAccessibleCustomers:', err);
    return { ...NONE, verified: true, issue: 'api_error' };
  }
  if (ids.length === 0) {
    return { ...NONE, verified: true, issue: 'no_account' };
  }

  const managers: AdAccount[] = [];
  let sawTestTokenRejection = false;
  let pick: AdAccount | null = null;

  for (const id of ids.slice(0, MAX_ACCOUNTS_TO_INSPECT)) {
    try {
      const account = await describeAccount(id, accessToken);
      if (account.isManager) {
        managers.push(account);
      } else {
        pick = account;
        break;
      }
    } catch (err) {
      // Cancelled/suspended accounts and real accounts on a test token fail here — skip them
      if (err instanceof GoogleAdsApiError && err.isTestTokenOnProductionAccount) {
        sawTestTokenRejection = true;
      } else {
        console.warn(`Google Ads account ${id} skipped:`, err);
      }
    }
  }

  if (!pick) {
    for (const manager of managers) {
      try {
        const clients = await listClientAccounts(manager.id, accessToken);
        if (clients.length > 0) {
          pick = clients[0];
          break;
        }
      } catch (err) {
        console.warn(`Google Ads manager ${manager.id} clients skipped:`, err);
      }
    }
  }

  if (!pick) {
    return {
      ...NONE,
      verified: true,
      issue: sawTestTokenRejection ? 'test_token_only' : 'no_account',
    };
  }

  return {
    customerId: pick.id,
    customerName: `${pick.name?.trim() || 'Google Ads'} · ${formatCustomerId(pick.id)}${pick.isTestAccount ? ' (test)' : ''}`,
    loginCustomerId: pick.loginCustomerId,
    isTestAccount: pick.isTestAccount,
    verified: true,
    issue: null,
  };
}
