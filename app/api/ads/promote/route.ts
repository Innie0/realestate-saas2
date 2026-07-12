// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { buildListingAdCopy, getListingPublicUrl, isProjectPromotable } from '@/lib/ads/listing-ad-copy';
import { createMetaListingPromotion } from '@/lib/ads/meta-create-promotion';
import { buildAdLandingUrl } from '@/lib/ads/utm';
import { APIResponse } from '@/types';

const BUDGET_OPTIONS = [1000, 1500, 2000, 3000, 5000];
const DURATION_OPTIONS = [7, 14];

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const projectId = typeof body.projectId === 'string' ? body.projectId : '';
    const dailyBudgetCents = Number(body.dailyBudgetCents);
    const durationDays = Number(body.durationDays) || 7;

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Select a listing to promote.' } satisfies APIResponse, {
        status: 400,
      });
    }

    if (!BUDGET_OPTIONS.includes(dailyBudgetCents)) {
      return NextResponse.json({ success: false, error: 'Invalid daily budget.' } satisfies APIResponse, {
        status: 400,
      });
    }

    if (!DURATION_OPTIONS.includes(durationDays)) {
      return NextResponse.json({ success: false, error: 'Invalid campaign duration.' } satisfies APIResponse, {
        status: 400,
      });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, description, property_info, images, ai_content, published')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ success: false, error: 'Listing not found.' } satisfies APIResponse, {
        status: 404,
      });
    }

    const promotable = isProjectPromotable(project);
    if (!promotable.ok) {
      return NextResponse.json({ success: false, error: promotable.reason } satisfies APIResponse, {
        status: 400,
      });
    }

    const { data: metaConnection, error: connError } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'meta')
      .eq('is_active', true)
      .maybeSingle();

    if (connError?.code === '42P01') {
      return NextResponse.json(
        {
          success: false,
          error: 'Run ads-promotions.sql and ads-management.sql in Supabase first.',
        } satisfies APIResponse,
        { status: 503 }
      );
    }

    if (!metaConnection?.access_token || !metaConnection.account_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connect Meta Ads first — we run the campaign on your connected account.',
        } satisfies APIResponse,
        { status: 400 }
      );
    }

    const copy = buildListingAdCopy(project);
    if (!copy.imageUrl) {
      return NextResponse.json({ success: false, error: 'Add a listing photo before promoting.' } satisfies APIResponse, {
        status: 400,
      });
    }

    const baseLandingUrl = getListingPublicUrl(project.id);
    const promotionId = crypto.randomUUID();
    const landingUrl = buildAdLandingUrl(baseLandingUrl, {
      platform: 'meta',
      projectId: project.id,
      promotionId,
    });

    const campaignName = `Realestic · ${copy.address}`.slice(0, 120);

    const { data: promotion, error: insertError } = await supabase
      .from('ad_promotions')
      .insert({
        id: promotionId,
        user_id: user.id,
        project_id: project.id,
        platform: 'meta',
        daily_budget_cents: dailyBudgetCents,
        duration_days: durationDays,
        status: 'pending',
        headline: copy.headline,
        primary_text: copy.primaryText,
        landing_url: landingUrl,
      })
      .select(
        'id, project_id, platform, daily_budget_cents, duration_days, status, headline, landing_url, created_at, meta_campaign_id'
      )
      .single();

    if (insertError) {
      if (insertError.code === '42P01') {
        return NextResponse.json(
          { success: false, error: 'Run ads-promotions.sql in Supabase to enable promotions.' } satisfies APIResponse,
          { status: 503 }
        );
      }
      throw insertError;
    }

    try {
      const metaIds = await createMetaListingPromotion({
        accessToken: metaConnection.access_token,
        accountId: metaConnection.account_id,
        campaignName,
        dailyBudgetCents,
        durationDays,
        landingUrl,
        headline: copy.headline,
        primaryText: copy.primaryText,
        imageUrl: copy.imageUrl,
        zip: copy.zip,
        state: copy.state,
      });

      const { data: updated, error: updateError } = await supabase
        .from('ad_promotions')
        .update({
          status: 'active',
          meta_campaign_id: metaIds.campaignId,
          meta_adset_id: metaIds.adSetId,
          meta_ad_id: metaIds.adId,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promotionId)
        .select(
          `
          id, project_id, platform, daily_budget_cents, duration_days, status,
          headline, landing_url, created_at, meta_campaign_id, error_message,
          projects:project_id ( id, title, property_info, images )
        `
        )
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Your listing ad is live on Meta. Leads from the ad will appear in your inbox.',
      } satisfies APIResponse);
    } catch (metaError: any) {
      const message = metaError?.message || 'Meta rejected the ad. Check your ad account or try again.';
      await supabase
        .from('ad_promotions')
        .update({
          status: 'failed',
          error_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promotionId);

      return NextResponse.json({ success: false, error: message } satisfies APIResponse, { status: 502 });
    }
  } catch (error: any) {
    console.error('Promote listing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to launch ad' } satisfies APIResponse,
      { status: 500 }
    );
  }
}
