// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsAuthUrl, isGoogleAdsConfigured } from '@/lib/ads/google-ads-oauth';
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

    const authUrl = getGoogleAdsAuthUrl();
    return NextResponse.json({
      success: true,
      data: { authUrl },
      message: 'Redirect to Google to connect your Ads account',
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('Google Ads connect error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start Google Ads connection' } satisfies APIResponse,
      { status: 500 }
    );
  }
}
