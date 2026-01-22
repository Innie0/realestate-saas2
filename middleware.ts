import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Create Supabase client with proper typing
  const supabase = createMiddlewareClient<Database>({ req, res });
  
  // IMPORTANT: This refreshes the session and sets/updates cookies
  // This must be called for authentication to work in API routes
  const { data: { session } } = await supabase.auth.getSession();
  
  // Log for debugging (remove in production)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    console.log(`[Middleware] ${req.method} ${req.nextUrl.pathname} - Session: ${session ? '✅' : '❌'}`);
  }
  
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


