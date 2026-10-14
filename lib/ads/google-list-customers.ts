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
    status?: string;
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
    `SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.test_account, customer_client.status
     FROM customer_client
     WHERE customer_client.level = 1 AND customer_client.manager = FALSE`,
    { accessToken, loginCustomerId: managerId },
  );
  return rows
    .map((r) => r.customerClient)
    .filter((c): c is NonNullable<typeof c> => Boolean(c?.id))
    // Test accounts have no billing, so Google can report them as cancelled — still usable
    .filter((c) => c.status === 'ENABLED' || c.testAccount === true)
    .map((c) => ({
      id: String(c.id),
      name: c.descriptiveName ?? null,
      isManager: false,
      isTestAccount: c.testAccount === true,
      loginCustomerId: managerId,
    }));
}

/** One ad account the agent could advertise from. */
export interface GoogleAdAccountOption {
  customerId: string;
  /** e.g. `Jane Smith Realty · 123-456-7890` */
  label: string;
  isTestAccount: boolean;
  loginCustomerId: string | null;
}

function toOption(account: AdAccount): GoogleAdAccountOption {
  return {
    customerId: account.id,
    label: `${account.name?.trim() || 'Google Ads'} · ${formatCustomerId(account.id)}${account.isTestAccount ? ' (test)' : ''}`,
    isTestAccount: account.isTestAccount,
    loginCustomerId: account.loginCustomerId,
  };
}

/**
 * Every ad account the signed-in Google user can advertise from: accounts they
 * access directly, plus accounts under any manager account they can access.
 * Real accounts are listed before test accounts.
 */
export async function listGoogleAdAccounts(accessToken: string): Promise<{
  accounts: GoogleAdAccountOption[];
  issue: GoogleAdsAccountIssue | null;
}> {
  if (!getGoogleAdsDeveloperToken() || !accessToken) {
    return { accounts: [], issue: 'not_configured' };
  }

  let ids: string[];
  try {
    ids = await listAccessibleCustomerIds(accessToken);
  } catch (err) {
    console.warn('Google Ads listAccessibleCustomers:', err);
    return { accounts: [], issue: 'api_error' };
  }
  if (ids.length === 0) return { accounts: [], issue: 'no_account' };

  const found = new Map<string, AdAccount>();
  let sawTestTokenRejection = false;

  for (const id of ids.slice(0, MAX_ACCOUNTS_TO_INSPECT)) {
    try {
      const account = await describeAccount(id, accessToken);
      if (!account.isManager) {
        found.set(account.id, account);
        continue;
      }
      try {
        for (const client of await listClientAccounts(account.id, accessToken)) {
          // A directly accessible account doesn't need to go through its manager
          if (!found.has(client.id)) found.set(client.id, client);
        }
      } catch (err) {
        console.warn(`Google Ads manager ${account.id} clients skipped:`, err);
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

  const accounts = [...found.values()]
    .sort((a, b) => Number(a.isTestAccount) - Number(b.isTestAccount))
    .map(toOption);

  return {
    accounts,
    issue: accounts.length > 0 ? null : sawTestTokenRejection ? 'test_token_only' : 'no_account',
  };
}

/**
 * The Google Ads account to advertise from for the signed-in user: the one
 * they already chose if it's still available, otherwise the first real account,
 * otherwise a test account.
 */
export async function listGoogleAdsCustomers(
  accessToken: string,
  preferredCustomerId?: string | null,
): Promise<GoogleAdsCustomerInfo> {
  const { accounts, issue } = await listGoogleAdAccounts(accessToken);
  const pick =
    accounts.find((a) => a.customerId === preferredCustomerId) ?? accounts[0] ?? null;

  if (!pick) {
    return { ...NONE, verified: issue !== 'not_configured', issue };
  }

  return {
    customerId: pick.customerId,
    customerName: pick.label,
    loginCustomerId: pick.loginCustomerId,
    isTestAccount: pick.isTestAccount,
    verified: true,
    issue: null,
  };
}
