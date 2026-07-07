import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import { hasAppAccess, isAdminEmail } from '@/lib/subscription';

const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/checkout-success',
  '/privacy',
  '/terms',
  '/pricing',
  '/contact',
  '/about',
  '/for-agents',
  '/agents',
];

const publicPathPrefixes = ['/lead/', '/open-house/', '/agent/', '/listing/'];

const publicApiPrefixes = [
  '/api/stripe/checkout',
  '/api/stripe/verify-checkout',
  '/api/stripe/webhook',
  '/api/leads',
  '/api/contact',
  '/api/cron/',
];

function isPublicPath(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true;
  return publicPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isPublicApi(pathname: string): boolean {
  if (pathname.startsWith('/api/open-houses/') && pathname.endsWith('/sign-in')) {
    return true;
  }
  return publicApiPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function requiresSubscription(pathname: string): boolean {
  if (pathname.startsWith('/dashboard')) return true;
  if (pathname.startsWith('/api/') && !isPublicApi(pathname)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/') && isPublicApi(pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return res;
  }

  if (!requiresSubscription(pathname)) {
    return res;
  }

  const email = session.user.email;
  if (isAdminEmail(email)) {
    return res;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', session.user.id)
    .single();

  if (!hasAppAccess(userData?.subscription_status, email)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'An active subscription is required.' },
        { status: 403 }
      );
    }
    const pricingUrl = new URL('/pricing', req.url);
    if (pathname !== '/pricing') {
      pricingUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(pricingUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
