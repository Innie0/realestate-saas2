// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAdTypeOption } from '@/lib/ads/ad-type-config';
import type { AdType } from '@/lib/ads/ad-draft-types';
import { createClient } from '@/lib/supabase-server';
import type { AdType } from '@/lib/ads/ad-draft-types';

const VALID_TYPES = new Set([
  'custom',
  'home_value',
  'new_listing',
  'open_house',
  'just_sold',
  'price_reduced',
  'agent_branding',
  'market_update',
  'testimonial',
  'coming_soon',
]);

function suggestTargeting(adType: string, details: Record<string, string | number>) {
  const option = getAdTypeOption(adType as AdType);
  const price = Number(details.price) || 0;
  const isLuxury = price >= 750_000;

  let radiusMiles = 15;
  let preset: 'near_home' | 'city' | 'wide' = 'near_home';
  let dailyAmountCents = option?.suggestedDailyCents ?? 2000;
  let note = option?.tip ?? 'Balanced reach for a typical ad.';

  if (adType === 'home_value' || adType === 'agent_branding' || adType === 'custom') {
    preset = 'city';
    radiusMiles = 20;
  } else if (adType === 'just_sold') {
    // Neighbors of a sold home are the likeliest next sellers
    radiusMiles = 3;
  } else if (isLuxury) {
    preset = 'wide';
    radiusMiles = 35;
    dailyAmountCents = Math.max(dailyAmountCents, 3000);
    note = 'Higher-priced homes draw buyers from farther away, so this widens the area and budget.';
  } else if (adType === 'open_house') {
    radiusMiles = 10;
  }

  const durationDays = option?.suggestedDays && option.suggestedDays >= 30 ? 30 : option?.suggestedDays === 7 ? 7 : 14;

  return {
    // Ages are kept only for older drafts; housing ads can't target by age
    audience: { preset, radiusMiles, ageMin: 18, ageMax: 65, interests: [] as string[] },
    budget: { dailyAmountCents, durationDays },
    note,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const adType = VALID_TYPES.has(body.adType) ? (body.adType as AdType) : 'new_listing';
    const propertyDetails =
      typeof body.propertyDetails === 'object' && body.propertyDetails ? body.propertyDetails : {};

    const suggestion = suggestTargeting(adType, propertyDetails);

    return NextResponse.json({ success: true, data: suggestion });
  } catch (error: any) {
    console.error('suggest-targeting error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to suggest targeting' },
      { status: 500 }
    );
  }
}
