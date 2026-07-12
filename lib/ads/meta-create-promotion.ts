interface MetaGraphError {
  error?: { message?: string; error_user_msg?: string };
}

async function metaPost(
  path: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: accessToken }),
  });
  const json = (await res.json()) as Record<string, unknown> & MetaGraphError;
  if (!res.ok || json.error) {
    throw new Error(json.error?.error_user_msg || json.error?.message || 'Meta API request failed');
  }
  return json;
}

function actId(accountId: string): string {
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

function buildGeoTargeting(zip: string | null) {
  if (zip && /^\d{5}$/.test(zip)) {
    return {
      geo_locations: {
        zips: [{ key: `US:${zip}` }],
        location_types: ['home', 'recent'],
      },
    };
  }
  return {
    geo_locations: {
      countries: ['US'],
      location_types: ['home', 'recent'],
    },
  };
}

export async function createMetaListingPromotion(options: {
  accessToken: string;
  accountId: string;
  campaignName: string;
  dailyBudgetCents: number;
  durationDays: number;
  landingUrl: string;
  headline: string;
  primaryText: string;
  imageUrl: string;
  zip: string | null;
  state: string | null;
}): Promise<{ campaignId: string; adSetId: string; adId: string }> {
  const account = actId(options.accountId);
  const endTime = Math.floor(Date.now() / 1000) + options.durationDays * 24 * 60 * 60;

  const campaign = await metaPost(`${account}/campaigns`, options.accessToken, {
    name: options.campaignName,
    objective: 'OUTCOME_TRAFFIC',
    status: 'ACTIVE',
    special_ad_categories: ['HOUSING'],
  });

  const campaignId = String(campaign.id);

  const adSet = await metaPost(`${account}/adsets`, options.accessToken, {
    name: `${options.campaignName} · Ad set`,
    campaign_id: campaignId,
    daily_budget: options.dailyBudgetCents,
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'LINK_CLICKS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    destination_type: 'WEBSITE',
    targeting: {
      ...buildGeoTargeting(options.zip),
      age_min: 25,
      age_max: 65,
    },
    end_time: endTime,
    status: 'ACTIVE',
  });

  const adSetId = String(adSet.id);

  const creative = await metaPost(`${account}/adcreatives`, options.accessToken, {
    name: `${options.campaignName} · Creative`,
    object_story_spec: {
      link_data: {
        link: options.landingUrl,
        message: options.primaryText,
        name: options.headline,
        picture: options.imageUrl,
        call_to_action: { type: 'LEARN_MORE' },
      },
    },
  });

  const creativeId = String(creative.id);

  const ad = await metaPost(`${account}/ads`, options.accessToken, {
    name: `${options.campaignName} · Ad`,
    adset_id: adSetId,
    creative: { creative_id: creativeId },
    status: 'ACTIVE',
  });

  return {
    campaignId,
    adSetId,
    adId: String(ad.id),
  };
}
