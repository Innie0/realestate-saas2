// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import {
  getGoogleAdsAuthUrl,
  GOOGLE_ADS_OAUTH_STATE_COOKIE,
  isGoogleAdsConfigured,
} from '@/lib/ads/google-ads-oauth';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    if (!isGoogleAdsConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Ads OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXT_PUBLIC_APP_URL.',
        } satisfies APIResponse,
        { status: 503 }
      );
    }

    // A random value Google echoes back; the callback rejects the response unless it
    // matches this browser's cookie, so nobody can link their ad account to someone else's login.
    const state = crypto.randomUUID();
    const authUrl = await getGoogleAdsAuthUrl(state);
    const response = NextResponse.json({
      success: true,
      data: { authUrl },
      message: 'Redirect to Google to connect your Ads account',
    } satisfies APIResponse);
    response.cookies.set(GOOGLE_ADS_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/ads/google',
      maxAge: 10 * 60,
    });
    return response;
  } catch (error: any) {
    console.error('Google Ads connect error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start Google Ads connection' } satisfies APIResponse,
      { status: 500 }
    );
  }
}
