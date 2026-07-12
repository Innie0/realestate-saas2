// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import type { AdType } from '@/lib/ads/ad-draft-types';

const VALID_TYPES = new Set([
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
  const price = Number(details.price) || 0;
  const isLuxury = price >= 750_000;
  const isStarter = price > 0 && price < 350_000;

  let radiusMiles = 15;
  let dailyAmountCents = 2000;
  let ageMin = 25;
  let ageMax = 65;
  let preset: 'near_home' | 'city' | 'wide' = 'near_home';
  let note = 'Balanced reach for a typical listing.';

  if (adType === 'just_sold' || adType === 'agent_branding' || adType === 'testimonial') {
    radiusMiles = 25;
    preset = 'city';
    note = 'Wider reach helps attract seller leads and brand awareness.';
  } else if (adType === 'market_update') {
    preset = 'city';
    radiusMiles = 20;
    note = 'City-wide reach suits neighborhood market updates.';
  } else if (isLuxury) {
    radiusMiles = 35;
    preset = 'wide';
    dailyAmountCents = 4000;
    ageMin = 30;
    ageMax = 65;
    note = 'Luxury listings often benefit from a wider radius and higher daily budget.';
  } else if (isStarter) {
    radiusMiles = 12;
    dailyAmountCents = 1500;
    ageMin = 22;
    ageMax = 45;
    note = 'Tighter radius and younger skew for starter-home buyers.';
  } else if (adType === 'open_house') {
    radiusMiles = 18;
    dailyAmountCents = 2500;
    note = 'Open houses perform well with a moderate boost the week of the event.';
  }

  return {
    audience: { preset, radiusMiles, ageMin, ageMax },
    budget: { dailyAmountCents, durationDays: adType === 'open_house' ? 7 : 14 },
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
