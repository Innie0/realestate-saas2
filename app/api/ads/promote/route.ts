// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { buildListingAdCopy, getAgentLeadUrl, isProjectPromotable } from '@/lib/ads/listing-ad-copy';
import { createMetaListingPromotion } from '@/lib/ads/meta-create-promotion';
import {
  buildCallouts,
  buildGoogleSearchAdAssets,
  buildNegativeKeywords,
  createGoogleSearchPromotion,
  normalizeUsPhone,
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
import { sanitizeAdKeywords } from '@/lib/ads/ad-idea';
import {
  isValidDestinationUrl,
  listingRequiredForAdType,
  type AdType,
} from '@/lib/ads/ad-draft-types';
import {
  getAdTypeOption,
  isPlatformAllowedForAdType,
  PLATFORM_AVAILABLE,
  PLATFORM_NAMES,
} from '@/lib/ads/ad-type-config';
import { buildAgentProfilePath, buildBookingPath } from '@/lib/agent-profile-shared';
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

    const adTypeOption = getAdTypeOption(adType);
    if (!adTypeOption) {
      return NextResponse.json(
        { success: false, error: 'Choose one of the available ad types.' } satisfies APIResponse,
        { status: 400 }
      );
    }
    if (!PLATFORM_AVAILABLE[platform]) {
      return NextResponse.json(
        { success: false, error: `${PLATFORM_NAMES[platform]} ads are coming soon.` } satisfies APIResponse,
        { status: 400 }
      );
    }
    // Each ad type runs only on the platform where it tends to pay off
    if (!isPlatformAllowedForAdType(adType, platform)) {
      return NextResponse.json(
        {
          success: false,
          error: `“${adTypeOption.label}” ads run on ${adTypeOption.platforms.map((p) => PLATFORM_NAMES[p]).join(' and ')}.`,
        } satisfies APIResponse,
        { status: 400 }
      );
    }

    // "Your own idea" on Google needs search terms people actually type
    const customKeywords = adType === 'custom' ? sanitizeAdKeywords(body.customKeywords) : [];
    if (adType === 'custom' && platform === 'google' && customKeywords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'This idea isn’t a fit for Google search ads — people don’t search for it. Try a different idea.',
        } satisfies APIResponse,
        { status: 400 }
      );
    }

    // Listing ads promote a project; ads about the agent aren't tied to one
    const isListingAd = listingRequiredForAdType(adType);
    let project: any = null;

    if (isListingAd) {
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

      const { data: projectRow, error: projectError } = await supabase
        .from('projects')
        .select('id, title, description, property_info, images, ai_content')
        .eq('id', resolvedProjectId)
        .eq('user_id', user.id)
        .single();

      if (projectError || !projectRow) {
        return NextResponse.json({ success: false, error: 'Project not found.' } satisfies APIResponse, {
          status: 404,
        });
      }
      project = projectRow;

      // Google Search ads are text-only, so only Meta needs a photo
      if (platform === 'meta' && !imageUrlOverride) {
        const promotable = isProjectPromotable(project);
        if (!promotable.ok) {
          return NextResponse.json({ success: false, error: promotable.reason } satisfies APIResponse, {
            status: 400,
          });
        }
      }
    }

    const detailText = (key: string) =>
      typeof propertyDetails[key] === 'string' && propertyDetails[key].trim() ? propertyDetails[key].trim() : null;
    const defaults = project
      ? buildListingAdCopy(project)
      : {
          address: adTypeOption.label,
          price: '',
          headline: '',
          primaryText: '',
          imageUrl: null,
          zip: null,
          city: detailText('city'),
          state: detailText('state'),
        };
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
      project &&
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
      projectId: project?.id ?? null,
      promotionId,
    });

    const campaignName = (
      project
        ? `Oikaro · ${defaults.address}`
        : `Oikaro · ${adTypeOption.label}${defaults.city ? ` · ${defaults.city}` : ''}`
    ).slice(0, 120);

    const { data: promotion, error: insertError } = await supabase
      .from('ad_promotions')
      .insert({
        id: promotionId,
        user_id: user.id,
        project_id: project?.id ?? null,
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
      // 23502 = project_id still required; ads-agent-ads.sql hasn't been run
      if (insertError.code === '23502' && !project) {
        return NextResponse.json(
          { success: false, error: 'Run ads-agent-ads.sql in Supabase to enable agent ads.' } satisfies APIResponse,
          { status: 503 }
        );
      }
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
        const info = project?.property_info || {};
        const listing = {
          address: info.address?.trim() || null,
          city: defaults.city,
          state: defaults.state,
          zip: defaults.zip,
          price: typeof info.price === 'number' ? info.price : null,
          bedrooms: typeof info.bedrooms === 'number' ? info.bedrooms : null,
          bathrooms: typeof info.bathrooms === 'number' ? info.bathrooms : null,
        };
        // Extras that come from the agent's Oikaro settings: call button and links to their pages
        const { data: agentSettings } = await supabase
          .from('agent_settings')
          .select('profile_enabled, profile_phone, booking_enabled')
          .eq('user_id', user.id)
          .maybeSingle();
        const agentName = user.user_metadata?.full_name || '';
        const tagged = (url: string) =>
          buildAdLandingUrl(url, { platform, projectId: project?.id ?? null, promotionId });
        // Sitelinks must be on the same site as the ad, so only add them for Oikaro destinations
        const sitelinks = customDestination
          ? []
          : [
              agentSettings?.profile_enabled && destinationType !== 'profile'
                ? { text: 'About the Agent', url: tagged(`${siteBase}${buildAgentProfilePath(agentName, user.id)}`) }
                : null,
              agentSettings?.booking_enabled
                ? { text: 'Book a Time to Talk', url: tagged(`${siteBase}${buildBookingPath(agentName, user.id)}`) }
                : null,
              destinationType !== 'lead_form'
                ? { text: 'Contact the Agent', url: tagged(getAgentLeadUrl(user.id)) }
                : null,
            ].filter(Boolean);

        const accessToken = await getFreshGoogleAccessToken(supabase, metaConnection);
        const googleIds = await createGoogleSearchPromotion({
          auth: { accessToken, loginCustomerId: metaConnection.login_customer_id },
          customerId: metaConnection.account_id,
          promotionId,
          campaignName,
          dailyBudgetCents,
          durationDays,
          landingUrl,
          assets: buildGoogleSearchAdAssets({
            adType,
            headline,
            body: primaryText,
            listing,
            openHouseDate:
              typeof propertyDetails.openHouseDate === 'string' ? propertyDetails.openHouseDate : null,
            customKeywords,
          }),
          audiencePreset,
          radiusMiles,
          listing,
          negativeKeywords: buildNegativeKeywords(adType),
          extras: {
            phone: normalizeUsPhone(agentSettings?.profile_phone),
            sitelinks,
            callouts: buildCallouts(adType),
          },
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
