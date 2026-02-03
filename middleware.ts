import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

// Routes that don't require authentication or subscription
const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/callback', '/privacy', '/terms'];
// Routes that require authentication but NOT subscription
const authOnlyRoutes = ['/pricing'];
// API routes that don't require subscription check
const publicApiRoutes = ['/api/stripe/checkout', '/api/stripe/webhook', '/api/debug-auth'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;
  
  // Create Supabase client with proper typing
  const supabase = createMiddlewareClient<Database>({ req, res });
  
  // IMPORTANT: This refreshes the session and sets/updates cookies
  const { data: { session } } = await supabase.auth.getSession();
  
  // Log for debugging
  if (pathname.startsWith('/api/')) {
    console.log(`[Middleware] ${req.method} ${pathname} - Session: ${session ? '✅' : '❌'}`);
  }
  
  // Skip public routes
  if (publicRoutes.includes(pathname)) {
    return res;
  }
  
  // Skip public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return res;
  }
  
  // Check if user is authenticated for protected routes
  if (!session?.user) {
    // Not logged in - redirect to login for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    return res;
  }
  
  // User is logged in - check for auth-only routes (like pricing)
  if (authOnlyRoutes.includes(pathname)) {
    return res;
  }
  
  // For dashboard routes, check subscription status
  if (pathname.startsWith('/dashboard')) {
    try {
      // Check if user has an active subscription
      const { data: userData, error } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan')
        .eq('id', session.user.id)
        .single();
      
      console.log(`[Middleware] Subscription check for ${session.user.email}:`, {
        status: userData?.subscription_status,
        plan: userData?.subscription_plan,
        error: error?.message
      });
      
      // If no subscription data or not active/trialing, redirect to pricing
      const hasActiveSubscription = 
        userData?.subscription_status === 'active' || 
        userData?.subscription_status === 'trialing';
      
      if (!hasActiveSubscription) {
        console.log(`[Middleware] No active subscription - redirecting to pricing`);
        return NextResponse.redirect(new URL('/pricing', req.url));
      }
    } catch (error) {
      console.error('[Middleware] Error checking subscription:', error);
      // On error, redirect to pricing to be safe
      return NextResponse.redirect(new URL('/pricing', req.url));
    }
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


