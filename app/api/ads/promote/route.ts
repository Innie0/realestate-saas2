// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { buildListingAdCopy, getAgentLeadUrl, isProjectPromotable } from '@/lib/ads/listing-ad-copy';
import { createMetaListingPromotion } from '@/lib/ads/meta-create-promotion';
import {
  buildGoogleSearchAdAssets,
  createGoogleSearchPromotion,
} from '@/lib/ads/google-create-promotion';
import { getFreshGoogleAccessToken } from '@/lib/ads/google-connection';
import { GoogleAdsApiError } from '@/lib/ads/google-ads-api';
import {
  CTA_OPTIONS,
  AUDIENCE_PRESETS,
  isValidDailyBudget,
  isValidDuration,
} from '@/lib/ads/promotion-options';
import { resolvePromotionProjectId } from '@/lib/ads/resolve-promotion-project';
import { buildAdLandingUrl } from '@/lib/ads/utm';
import { isValidDestinationUrl, type AdType } from '@/lib/ads/ad-draft-types';
import { buildAgentProfilePath } from '@/lib/agent-profile-shared';
import { SITE_URL } from '@/lib/site-config';
import { APIResponse } from '@/types';

const VALID_CTAS = new Set(CTA_OPTIONS.map((o) => o.id));
const VALID_AUDIENCE = new Set(AUDIENCE_PRESETS.map((o) => o.id));

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
    const platform: 'meta' | 'google' = body.platform === 'google' ? 'google' : 'meta';
    const platformName = platform === 'google' ? 'Google Ads' : 'Meta';
    const radiusMiles = Number(body.radiusMiles) || 15;
    const destinationType = ['custom', 'profile', 'open_house'].includes(body.destinationType)
      ? body.destinationType
      : 'lead_form';
    const customDestination =
      destinationType === 'custom' && typeof body.destinationUrl === 'string'
        ? body.destinationUrl.trim().slice(0, 500)
        : null;
    if (destinationType === 'custom' && !isValidDestinationUrl(customDestination ?? '')) {
      return NextResponse.json(
        { success: false, error: 'Enter a full web address (https://…) for your link.' } satisfies APIResponse,
        { status: 400 }
      );
    }

    // Oikaro pages the ad can point to — checked so an ad never links to a dead page
    const siteBase = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/$/, '');
    let oikaroDestination: string | null = null;
    if (destinationType === 'profile') {
      const { data: settings } = await supabase
        .from('agent_settings')
        .select('profile_enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!settings?.profile_enabled) {
        return NextResponse.json(
          { success: false, error: 'Turn on your public profile in Settings before sending ad clicks to it.' } satisfies APIResponse,
          { status: 400 }
        );
      }
      oikaroDestination = `${siteBase}${buildAgentProfilePath(user.user_metadata?.full_name || '', user.id)}`;
    } else if (destinationType === 'open_house') {
      const { data: openHouse } = await supabase
        .from('open_houses')
        .select('id, status')
        .eq('id', String(body.openHouseId ?? ''))
        .eq('user_id', user.id)
        .maybeSingle();
      if (!openHouse || openHouse.status === 'ended') {
        return NextResponse.json(
          { success: false, error: 'Pick an upcoming open house for this ad.' } satisfies APIResponse,
          { status: 400 }
        );
      }
      oikaroDestination = `${siteBase}/open-house/${openHouse.id}`;
    }
    const dailyBudgetCents = Number(body.dailyBudgetCents);
    const durationDays = Number(body.durationDays) || 7;
    const headlineOverride = typeof body.headline === 'string' ? body.headline.trim().slice(0, 100) : '';
    const primaryTextOverride =
      typeof body.primaryText === 'string' ? body.primaryText.trim().slice(0, 250) : '';
    const imageUrlOverride = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const audiencePreset = VALID_AUDIENCE.has(body.audiencePreset) ? body.audiencePreset : 'near_home';
    const callToAction = VALID_CTAS.has(body.callToAction) ? body.callToAction : 'LEARN_MORE';
    const ageMin = Math.min(65, Math.max(18, Number(body.ageMin) || 25));
    const ageMax = Math.min(65, Math.max(ageMin, Number(body.ageMax) || 65));
    const adType = typeof body.adType === 'string' ? (body.adType as AdType) : null;
    const propertyDetails =
      typeof body.propertyDetails === 'object' && body.propertyDetails ? body.propertyDetails : {};
    const images = Array.isArray(body.images) ? body.images : [];

    if (!isValidDailyBudget(dailyBudgetCents)) {
      return NextResponse.json({ success: false, error: 'Invalid daily budget.' } satisfies APIResponse, {
        status: 400,
      });
    }

    if (!isValidDuration(durationDays)) {
      return NextResponse.json({ success: false, error: 'Invalid campaign duration.' } satisfies APIResponse, {
        status: 400,
      });
    }

    let resolvedProjectId: string;
    try {
      const resolved = await resolvePromotionProjectId(supabase, user.id, {
        projectId: typeof body.projectId === 'string' ? body.projectId : null,
        adType,
        propertyDetails,
        images,
      });
      resolvedProjectId = resolved.projectId;
    } catch (resolveError: any) {
      return NextResponse.json(
        { success: false, error: resolveError.message || 'Could not prepare ad.' } satisfies APIResponse,
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, description, property_info, images, ai_content')
      .eq('id', resolvedProjectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ success: false, error: 'Project not found.' } satisfies APIResponse, {
        status: 404,
      });
    }

    // Google Search ads are text-only, so only Meta needs a photo
    if (platform === 'meta' && !imageUrlOverride) {
      const promotable = isProjectPromotable(project);
      if (!promotable.ok) {
        return NextResponse.json({ success: false, error: promotable.reason } satisfies APIResponse, {
          status: 400,
        });
      }
    }

    const defaults = buildListingAdCopy(project);
    const headline = headlineOverride || defaults.headline;
    const primaryText = primaryTextOverride || defaults.primaryText;
    const imageUrl = imageUrlOverride || defaults.imageUrl;

    if (platform === 'meta' && !imageUrl) {
      return NextResponse.json({ success: false, error: 'Add a photo before publishing.' } satisfies APIResponse, {
        status: 400,
      });
    }

    if (!headline || !primaryText) {
      return NextResponse.json({ success: false, error: 'Headline and message are required.' } satisfies APIResponse, {
        status: 400,
      });
    }

    const { data: metaConnection, error: connError } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', platform)
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

    if (!metaConnection?.access_token) {
      return NextResponse.json(
        {
          success: false,
          error: `Connect ${platformName} under Ad accounts before publishing.`,
        } satisfies APIResponse,
        { status: 400 }
      );
    }

    if (!metaConnection.account_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            platform === 'google'
              ? 'Google is signed in but no Google Ads account was found. Create one at ads.google.com with the same login, then click Check again under Ad accounts.'
              : 'Meta is signed in but no ad account was found. Create one in Meta Ads Manager with the same login, add billing, then click Check again under Ad accounts.',
        } satisfies APIResponse,
        { status: 400 }
      );
    }

    if (platform === 'google') {
      // Confirm we can record the campaign before creating anything on Google
      const { error: columnError } = await supabase
        .from('ad_promotions')
        .select('google_campaign_id')
        .limit(1);
      if (columnError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Run ads-google-promotions.sql in Supabase to enable Google Ads publishing.',
          } satisfies APIResponse,
          { status: 503 }
        );
      }
    }

    // The agent's own link, one of their Oikaro pages, or their contact form by default
    const baseLandingUrl = customDestination ?? oikaroDestination ?? getAgentLeadUrl(user.id);

    // Remember a pasted listing link on the listing so the next ad starts with it
    if (
      customDestination &&
      body.saveListingLink === true &&
      project.property_info?.listing_url !== customDestination
    ) {
      await supabase
        .from('projects')
        .update({ property_info: { ...(project.property_info || {}), listing_url: customDestination } })
        .eq('id', project.id)
        .eq('user_id', user.id);
    }
    const promotionId = crypto.randomUUID();
    const landingUrl = buildAdLandingUrl(baseLandingUrl, {
      platform,
      projectId: project.id,
      promotionId,
    });

    const campaignName = `Oikaro · ${defaults.address}`.slice(0, 120);

    const { data: promotion, error: insertError } = await supabase
      .from('ad_promotions')
      .insert({
        id: promotionId,
        user_id: user.id,
        project_id: project.id,
        platform,
        ad_type: adType,
        daily_budget_cents: dailyBudgetCents,
        duration_days: durationDays,
        status: 'pending',
        headline,
        primary_text: primaryText,
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

    if (platform === 'google') {
      try {
        const info = project.property_info || {};
        const listing = {
          address: info.address?.trim() || null,
          city: defaults.city,
          state: defaults.state,
          zip: defaults.zip,
          price: typeof info.price === 'number' ? info.price : null,
          bedrooms: typeof info.bedrooms === 'number' ? info.bedrooms : null,
          bathrooms: typeof info.bathrooms === 'number' ? info.bathrooms : null,
        };
        const accessToken = await getFreshGoogleAccessToken(supabase, metaConnection);
        const googleIds = await createGoogleSearchPromotion({
          auth: { accessToken, loginCustomerId: metaConnection.login_customer_id },
          customerId: metaConnection.account_id,
          promotionId,
          campaignName,
          dailyBudgetCents,
          durationDays,
          landingUrl,
          assets: buildGoogleSearchAdAssets({ adType, headline, body: primaryText, listing }),
          audiencePreset,
          radiusMiles,
          listing,
        });

        const { data: updated, error: updateError } = await supabase
          .from('ad_promotions')
          .update({
            status: 'active',
            google_customer_id: metaConnection.account_id,
            google_campaign_id: googleIds.campaignId,
            google_ad_group_id: googleIds.adGroupId,
            google_ad_id: googleIds.adId,
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', promotionId)
          .select(
            `
            id, project_id, platform, daily_budget_cents, duration_days, status,
            headline, landing_url, created_at, google_campaign_id, error_message,
            projects:project_id ( id, title, property_info, images )
          `
          )
          .single();

        if (updateError) throw updateError;

        return NextResponse.json({
          success: true,
          data: updated,
          message: 'Your ad is live on Google. Leads from the ad will appear in your inbox.',
        } satisfies APIResponse);
      } catch (googleError: any) {
        console.error('Google Ads publish error:', googleError);
        const message =
          googleError instanceof GoogleAdsApiError
            ? `Google rejected the ad: ${googleError.message}`
            : googleError?.message || 'Google rejected the ad. Check your ad account or try again.';
        await supabase
          .from('ad_promotions')
          .update({ status: 'failed', error_message: message, updated_at: new Date().toISOString() })
          .eq('id', promotionId);

        return NextResponse.json({ success: false, error: message } satisfies APIResponse, { status: 502 });
      }
    }

    try {
      const metaIds = await createMetaListingPromotion({
        accessToken: metaConnection.access_token,
        accountId: metaConnection.account_id,
        campaignName,
        dailyBudgetCents,
        durationDays,
        landingUrl,
        headline,
        primaryText,
        imageUrl,
        zip: defaults.zip,
        city: defaults.city,
        state: defaults.state,
        audiencePreset,
        callToAction,
        ageMin,
        ageMax,
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
        message: 'Your ad is live on Meta. Leads from the ad will appear in your inbox.',
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
