// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getMetaAdsAuthUrl, isMetaAdsConfigured } from '@/lib/ads/meta-ads-oauth';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    if (!isMetaAdsConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Meta Ads OAuth is not configured. Set META_APP_ID, META_APP_SECRET, and NEXT_PUBLIC_APP_URL.',
        } satisfies APIResponse,
        { status: 503 }
      );
    }

    const authUrl = getMetaAdsAuthUrl();
    return NextResponse.json({
      success: true,
      data: { authUrl },
      message: 'Redirect to Meta to connect your Ads account',
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('Meta Ads connect error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start Meta Ads connection' } satisfies APIResponse,
      { status: 500 }
    );
  }
}
