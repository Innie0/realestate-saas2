// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';
import { getAdTypeLabel, getAdTypeOption } from '@/lib/ads/ad-type-config';
import type { AdType } from '@/lib/ads/ad-draft-types';
import { consumeDailyAiAllowance, DAILY_AI_CAP_MESSAGE } from '@/lib/usage';

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

function fallbackVariants(adType: AdType, details: Record<string, string | number>) {
  const city = String(details.city || '').trim();
  if (adType === 'home_value') {
    return [
      {
        headline: city ? `What's your ${city} home worth?` : "What's your home worth?",
        body: 'Get a free home value report based on recent sales near you. No obligation.',
      },
      {
        headline: 'Thinking of selling?',
        body: 'Find out what your home could sell for today. Request your free report.',
      },
      {
        headline: city ? `${city} home values` : 'See what homes near you sold for',
        body: 'A local agent prepares your report from recent nearby sales. Quick and free.',
      },
    ];
  }
  if (adType === 'agent_branding') {
    return [
      {
        headline: city ? `Your ${city} real estate agent` : 'Your local real estate agent',
        body: 'Buying or selling? Get clear advice and a plan that fits your goals.',
      },
      {
        headline: 'Buying or selling a home?',
        body: 'Talk to a local agent who knows the market. Reach out today.',
      },
      {
        headline: city ? `Thinking of moving in ${city}?` : 'Thinking of moving?',
        body: 'Get honest answers about pricing, timing, and next steps.',
      },
    ];
  }
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

    if (!(await consumeDailyAiAllowance(supabase, user.id, 'ai_ads'))) {
      return NextResponse.json({ success: false, error: DAILY_AI_CAP_MESSAGE }, { status: 429 });
    }

    const body = await request.json();
    const adType = VALID_TYPES.has(body.adType) ? body.adType : 'new_listing';
    const propertyDetails =
      typeof body.propertyDetails === 'object' && body.propertyDetails ? body.propertyDetails : {};
    const templateId = body.templateId || 'clean_minimal';

    const toneHint =
      templateId === 'luxury'
        ? 'Upscale and refined.'
        : templateId === 'bold_photo'
          ? 'Short, punchy, energetic.'
          : 'Clear, friendly, professional.';

    if (!process.env.OPENAI_API_KEY) {
      const variants = fallbackVariants(adType, propertyDetails);
      return NextResponse.json({ success: true, data: variants });
    }

    const prompt = `You write short ad copy for real estate agents, used for Google Search and Meta/Facebook ads.

Ad type: ${getAdTypeLabel(adType)}
Goal: ${getAdTypeOption(adType)?.goal ?? 'Leads'}${adType === 'home_value' ? ' — offer a free home value report to homeowners thinking of selling; do not state a price or promise a value.' : ''}${adType === 'agent_branding' ? ' — introduce the agent to people looking for help buying or selling; if a client review is provided, you may paraphrase it.' : ''}
Property/details: ${JSON.stringify(propertyDetails)}${adType === 'custom' ? '\nThe agent\'s own ad idea (follow it closely): ' + String(propertyDetails.customIdea ?? '').slice(0, 600) : ''}
Tone: ${toneHint}

Return a JSON object with exactly 4 variants: { "variants": [{ "headline": "max 80 chars", "body": "max 200 chars" }] }
Headlines should be compelling and specific. Bodies should include a clear call to action.
Follow fair-housing rules: describe the property and its features, never who should live there
(no "perfect for families", ages, religion, or similar), and make no claims about a neighborhood
being safe, exclusive, or better than others. Avoid unprovable superlatives like "best" or "#1".
Do not use emojis or exclamation marks in headlines.
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
