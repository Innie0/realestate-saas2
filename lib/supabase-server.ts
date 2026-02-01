// @ts-nocheck
// Server-side Supabase client configuration
// This file is only used in API routes and server components

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Create a Supabase client for server-side use (API routes)
 * This client properly handles authentication via cookies
 * Note: In Next.js 16+, cookies() returns a promise
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  return createRouteHandlerClient<Database>({ 
    cookies: () => cookieStore 
  });
}

