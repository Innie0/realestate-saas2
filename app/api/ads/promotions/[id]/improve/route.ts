// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { addGoogleAdText } from '@/lib/ads/google-create-promotion';
import { getFreshGoogleAccessToken } from '@/lib/ads/google-connection';
import { GoogleAdsApiError } from '@/lib/ads/google-ads-api';
import { findAdWordingConcerns } from '@/lib/ads/fair-housing';
import { APIResponse } from '@/types';

function texts(values: unknown, max: number): string[] {
  return (Array.isArray(values) ? values : [])
    .map((v) => String(v ?? '').replace(/[^\x20-\x7E]/g, '').trim())
    .filter((t) => t.length >= 5 && t.length <= max && findAdWordingConcerns(t).length === 0)
    .slice(0, 6);
}

/**
 * POST /api/ads/promotions/[id]/improve
 * Add chosen headlines/descriptions to a live Google ad in place.
 * Body: { headlines: string[], descriptions: string[] }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' } satisfies APIResponse, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const headlines = texts(body.headlines, 30);
    const descriptions = texts(body.descriptions, 90);
    if (headlines.length + descriptions.length === 0) {
      return NextResponse.json({ success: false, error: 'Pick at least one line to add.' } satisfies APIResponse, { status: 400 });
    }

    const { data: promotion } = await supabase
      .from('ad_promotions')
      .select('id, platform, status, google_customer_id, google_ad_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!promotion) {
      return NextResponse.json({ success: false, error: 'Ad not found.' } satisfies APIResponse, { status: 404 });
    }
    if (promotion.platform !== 'google' || !promotion.google_ad_id || promotion.status === 'ended') {
      return NextResponse.json(
        { success: false, error: 'New lines can only be added to a running Google ad.' } satisfies APIResponse,
        { status: 400 },
      );
    }

    const { data: connection } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .eq('is_active', true)
      .maybeSingle();
    if (!connection?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Reconnect Google Ads under Ad accounts first.' } satisfies APIResponse,
        { status: 400 },
      );
    }

    try {
      const accessToken = await getFreshGoogleAccessToken(supabase, connection);
      const result = await addGoogleAdText(
        promotion.google_customer_id || connection.account_id,
        promotion.google_ad_id,
        { headlines, descriptions },
        { accessToken, loginCustomerId: connection.login_customer_id },
      );
      await supabase.from('ad_promotions').update({ updated_at: new Date().toISOString() }).eq('id', promotion.id);

      const added = result.addedHeadlines + result.addedDescriptions;
      return NextResponse.json({
        success: true,
        data: result,
        message:
          added === 0
            ? 'Those lines are already in your ad (or it’s at Google’s limit of 15 headlines).'
            : `Added ${added} new line${added === 1 ? '' : 's'} to your ad. Google reviews the update, usually within a day.`,
      } satisfies APIResponse);
    } catch (googleError: any) {
      console.error('Improve Google ad error:', googleError);
      const message =
        googleError instanceof GoogleAdsApiError
          ? `Google couldn’t update the ad: ${googleError.message}`
          : googleError?.message || 'Could not update the ad. Please try again.';
      return NextResponse.json({ success: false, error: message } satisfies APIResponse, { status: 502 });
    }
  } catch (error: any) {
    console.error('Improve ad error:', error);
    return NextResponse.json({ success: false, error: 'Could not update the ad.' } satisfies APIResponse, { status: 500 });
  }
}
