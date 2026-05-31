// Server-side Supabase ADMIN client.
//
// This client uses the SERVICE ROLE key and therefore bypasses Row Level
// Security. It must ONLY ever be imported from server-side code (API routes,
// server components) — never from a client component, or the service role key
// would be exposed to the browser.
//
// It is used by the public lead capture flow so that an unauthenticated visitor
// can create a client/lead record in a specific agent's account.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing Supabase admin environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.'
  );
}

/**
 * Create a Supabase client with service-role privileges.
 * Bypasses RLS — only use on the server.
 */
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
