// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { setGoogleCampaignStatus } from '@/lib/ads/google-create-promotion';
import { getFreshGoogleAccessToken } from '@/lib/ads/google-connection';
import { GoogleAdsApiError } from '@/lib/ads/google-ads-api';
import { APIResponse } from '@/types';

type PromotionAction = 'pause' | 'resume' | 'end';

/** Which statuses each action is allowed from, and what it leads to. */
const TRANSITIONS: Record<PromotionAction, { from: string[]; to: string; google: 'PAUSED' | 'ENABLED' }> = {
  pause: { from: ['active'], to: 'paused', google: 'PAUSED' },
  resume: { from: ['paused'], to: 'active', google: 'ENABLED' },
  // Ending pauses the campaign for good; it can't be resumed from Oikaro
  end: { from: ['active', 'paused'], to: 'ended', google: 'PAUSED' },
};

/**
 * POST /api/ads/promotions/[id]
 * Pause, resume, or end one of the user's ads. Body: { action: 'pause' | 'resume' | 'end' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' } satisfies APIResponse, {
        status: 401,
      });
    }

    const body = await request.json().catch(() => ({}));
    const transition = TRANSITIONS[body?.action as PromotionAction];
    if (!transition) {
      return NextResponse.json({ success: false, error: 'Invalid action.' } satisfies APIResponse, {
        status: 400,
      });
    }

    const { data: promotion, error: fetchError } = await supabase
      .from('ad_promotions')
      .select('id, platform, status, google_customer_id, google_campaign_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!promotion) {
      return NextResponse.json({ success: false, error: 'Ad not found.' } satisfies APIResponse, {
        status: 404,
      });
    }

    if (!transition.from.includes(promotion.status)) {
      return NextResponse.json(
        { success: false, error: `This ad is ${promotion.status} and can't be changed that way.` } satisfies APIResponse,
        { status: 409 },
      );
    }

    if (promotion.platform !== 'google' || !promotion.google_campaign_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pausing from Oikaro is only available for Google ads right now. Manage this ad in Meta Ads Manager.',
        } satisfies APIResponse,
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
        { success: false, error: 'Reconnect Google Ads under Ad accounts to manage this ad.' } satisfies APIResponse,
        { status: 400 },
      );
    }

    try {
      const accessToken = await getFreshGoogleAccessToken(supabase, connection);
      await setGoogleCampaignStatus(
        promotion.google_customer_id || connection.account_id,
        promotion.google_campaign_id,
        transition.google,
        { accessToken, loginCustomerId: connection.login_customer_id },
      );
    } catch (googleError: any) {
      console.error('Google Ads status change error:', googleError);
      const message =
        googleError instanceof GoogleAdsApiError
          ? `Google couldn't update the ad: ${googleError.message}`
          : 'Could not update the ad on Google. Please try again.';
      return NextResponse.json({ success: false, error: message } satisfies APIResponse, { status: 502 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('ad_promotions')
      .update({ status: transition.to, updated_at: new Date().toISOString() })
      .eq('id', promotion.id)
      .select('id, platform, status')
      .single();

    if (updateError) throw updateError;

    const messages: Record<PromotionAction, string> = {
      pause: 'Ad paused. It won’t show or spend until you resume it.',
      resume: 'Ad resumed.',
      end: 'Ad ended.',
    };

    return NextResponse.json({
      success: true,
      data: updated,
      message: messages[body.action as PromotionAction],
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('Promotion action error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update ad' } satisfies APIResponse,
      { status: 500 },
    );
  }
}
