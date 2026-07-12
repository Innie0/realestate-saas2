// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';
import { getAdTypeLabel } from '@/lib/ads/ad-type-config';
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

function fallbackVariants(adType: AdType, details: Record<string, string | number>) {
  const address = String(details.address || details.areaName || 'this property');
  const price = details.price ? `$${Number(details.price).toLocaleString('en-US')}` : '';
  const label = getAdTypeLabel(adType);

  return [
    {
      headline: `${label}: ${address}`.slice(0, 100),
      body: price
        ? `Now ${price}. See photos and schedule a showing today.`
        : `Learn more about ${address}. Tap to view details.`,
    },
    {
      headline: `Don't miss ${address}`.slice(0, 100),
      body: `Open house, new listing, or fresh on market — reach serious buyers in your area.`,
    },
    {
      headline: `${address} — see inside`.slice(0, 100),
      body: `Quality homes move fast. Get the details buyers are looking for.`,
    },
  ];
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
    const adType = VALID_TYPES.has(body.adType) ? body.adType : 'new_listing';
    const propertyDetails =
      typeof body.propertyDetails === 'object' && body.propertyDetails ? body.propertyDetails : {};
    const templateId = body.templateId || 'clean_minimal';

    const toneHint =
      templateId === 'luxury'
        ? 'Upscale, refined, exclusive.'
        : templateId === 'bold_photo'
          ? 'Short, punchy, energetic.'
          : 'Clear, friendly, professional.';

    if (!process.env.OPENAI_API_KEY) {
      const variants = fallbackVariants(adType, propertyDetails);
      return NextResponse.json({ success: true, data: variants });
    }

    const prompt = `You write short Meta/Facebook ad copy for real estate agents.

Ad type: ${getAdTypeLabel(adType)}
Property/details: ${JSON.stringify(propertyDetails)}
Tone: ${toneHint}

Return exactly 4 variants as JSON array: [{ "headline": "max 80 chars", "body": "max 200 chars" }]
Headlines should be compelling and specific. Bodies should include a clear call to action.
Return ONLY valid JSON, no markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    let variants = fallbackVariants(adType, propertyDetails);
    try {
      const parsed = JSON.parse(raw) as {
        variants?: Array<{ headline: string; body: string }>;
      };
      if (Array.isArray(parsed.variants) && parsed.variants.length > 0) {
        variants = parsed.variants;
      }
    } catch {
      /* use fallback */
    }

    return NextResponse.json({
      success: true,
      data: variants.slice(0, 5).map((v) => ({
        headline: String(v.headline || '').slice(0, 100),
        body: String(v.body || '').slice(0, 250),
      })),
    });
  } catch (error: any) {
    console.error('generate-ad-copy error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate copy' },
      { status: 500 }
    );
  }
}
