// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { META_ADS_OAUTH_STATE_COOKIE, getMetaAdsAuthUrl, isMetaAdsConfigured } from '@/lib/ads/meta-ads-oauth';
import { APIResponse } from '@/types';
import { PLATFORM_AVAILABLE } from '@/lib/ads/ad-type-config';

export async function POST(request: NextRequest) {
  try {
    if (!PLATFORM_AVAILABLE.meta) {
      return NextResponse.json(
        { success: false, error: 'Facebook & Instagram ads are coming soon.' } satisfies APIResponse,
        { status: 503 }
      );
    }

    if (!isMetaAdsConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Meta Ads OAuth is not configured. Set META_APP_ID, META_APP_SECRET, and NEXT_PUBLIC_APP_URL.',
        } satisfies APIResponse,
        { status: 503 }
      );
    }

    // A random value Meta echoes back; the callback rejects the response unless it
    // matches this browser's cookie, so nobody can link their ad account to someone else's login.
    const state = crypto.randomUUID();
    const authUrl = getMetaAdsAuthUrl(state);
    const response = NextResponse.json({
      success: true,
      data: { authUrl },
      message: 'Redirect to Meta to connect your Ads account',
    } satisfies APIResponse);
    response.cookies.set(META_ADS_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api',
      maxAge: 10 * 60,
    });
    return response;
  } catch (error: any) {
    console.error('Meta Ads connect error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start Meta Ads connection' } satisfies APIResponse,
      { status: 500 }
    );
  }
}
