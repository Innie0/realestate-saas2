/** Google Ads connection outcomes and their messages — safe to import in client components. */

/** Outcome shown to the agent after connecting or re-checking Google Ads. */
export type GoogleConnectionStatus =
  | 'ready'
  /** Developer token missing on the server */
  | 'unverified'
  /** Developer token is test-only and this login has only real ad accounts */
  | 'test_token'
  /** No Google Ads account on this login */
  | 'setup_required'
  /** ads-google-login-customer.sql hasn't been run yet */
  | 'db_update_needed';

export const GOOGLE_CONNECTION_MESSAGES: Record<GoogleConnectionStatus, string> = {
  ready: 'Google Ads account connected — ready to go.',
  unverified:
    'Google signed in, but Google Ads isn’t fully set up on our side yet. Please try again later.',
  test_token:
    'Google signed in, but Oikaro is still awaiting Google’s approval to work with live ad accounts. Only Google Ads test accounts can connect for now.',
  setup_required:
    'Google signed in, but no Google Ads account exists on this login yet. Create one at ads.google.com, then click “Check again” under Ad accounts.',
  db_update_needed:
    'Google signed in, but the database needs an update first. Run ads-google-login-customer.sql in Supabase, then click “Check again”.',
};
