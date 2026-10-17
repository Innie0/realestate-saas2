// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';
import { getAdTypeLabel } from '@/lib/ads/ad-type-config';
import { diagnoseAd } from '@/lib/ads/ad-diagnosis';
import { findAdWordingConcerns } from '@/lib/ads/fair-housing';
import { APIResponse } from '@/types';
import { consumeDailyAiAllowance, DAILY_AI_CAP_MESSAGE } from '@/lib/usage';

const GOOGLE_HEADLINE_MAX = 30;
const GOOGLE_DESCRIPTION_MAX = 90;

/** Google ad text: plain characters, no exclamation marks in headlines, within limits, nothing risky. */
function cleanGoogleText(values: unknown, max: number, isHeadline: boolean): string[] {
  const seen = new Set<string>();
  return (Array.isArray(values) ? values : [])
    .map((v) =>
      String(v ?? '')
        .replace(/[—–]/g, '-')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(isHeadline ? /!/g : /!+/g, isHeadline ? '' : '.')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((t) => {
      const key = t.toLowerCase();
      if (t.length < 5 || t.length > max || seen.has(key)) return false;
      seen.add(key);
      return findAdWordingConcerns(t).length === 0;
    });
}

/**
 * POST /api/ai/optimize-copy
 * Diagnose an ad from its numbers and, only when the wording is the problem,
 * suggest new headlines. Body: { promotionId }
 */
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
    const promotionId = typeof body.promotionId === 'string' ? body.promotionId : '';
    if (!promotionId) {
      return NextResponse.json({ success: false, error: 'promotionId is required' } satisfies APIResponse, {
        status: 400,
      });
    }

    const { data: promo, error: promoError } = await supabase
      .from('ad_promotions')
      .select(
        'id, headline, primary_text, ad_type, platform, status, created_at, error_message, google_ad_id, projects:project_id ( title, property_info )'
      )
      .eq('id', promotionId)
      .eq('user_id', user.id)
      .single();

    if (promoError || !promo) {
      return NextResponse.json({ success: false, error: 'Ad not found' } satisfies APIResponse, {
        status: 404,
      });
    }

    const { data: daily } = await supabase
      .from('ad_performance_daily')
      .select('impressions, clicks, spend_cents, leads')
      .eq('promotion_id', promotionId);
    const sum = (key: string) => (daily ?? []).reduce((s, r) => s + (Number(r[key]) || 0), 0);

    const diagnosis = diagnoseAd({
      status: promo.status,
      createdAt: promo.created_at,
      impressions: sum('impressions'),
      clicks: sum('clicks'),
      leads: sum('leads'),
      spendCents: sum('spend_cents'),
      issue: promo.error_message,
    });

    // Rewriting only helps when people see the ad but don't click — skip the AI otherwise
    if (!diagnosis.suggestNewHeadlines || !process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: true,
        data: { promotionId, diagnosis, suggestions: null, canAddToAd: false },
      } satisfies APIResponse);
    }

    if (!(await consumeDailyAiAllowance(supabase, user.id, 'ai_ads'))) {
      return NextResponse.json({ success: false, error: DAILY_AI_CAP_MESSAGE }, { status: 429 });
    }

    const project = promo.projects && !Array.isArray(promo.projects) ? promo.projects : null;
    const info = project?.property_info || {};
    const prompt = `You improve a real estate Google Search ad whose click-through rate is low (${diagnosis.stats.ctr}% from ${diagnosis.stats.impressions} views; good is 3–6%).

Ad type: ${promo.ad_type ? getAdTypeLabel(promo.ad_type) : 'Real estate ad'}
Current headline: ${promo.headline ?? ''}
Current message: ${promo.primary_text ?? ''}
Listing: ${JSON.stringify({ address: info.address, city: info.city, price: info.price, bedrooms: info.bedrooms, bathrooms: info.bathrooms })}

Write NEW text that gives a searcher a stronger reason to click: be specific (price, area, beds, a free report, a private showing).
Rules: headlines max 30 characters, descriptions max 90 characters, no exclamation marks in headlines, no emojis.
Fair housing: describe the home or service, never who should live there; no claims an area is safer or better; no "best" or "#1".

Return ONLY JSON: { "headlines": ["6 different headlines"], "descriptions": ["2 descriptions"] }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch {
      parsed = {};
    }

    const suggestions = {
      headlines: cleanGoogleText(parsed.headlines, GOOGLE_HEADLINE_MAX, true).slice(0, 6),
      descriptions: cleanGoogleText(parsed.descriptions, GOOGLE_DESCRIPTION_MAX, false).slice(0, 2),
    };

    return NextResponse.json({
      success: true,
      data: {
        promotionId,
        diagnosis,
        suggestions,
        // New text goes into the live ad only for Google ads Oikaro created
        canAddToAd: promo.platform === 'google' && Boolean(promo.google_ad_id) && promo.status !== 'ended',
      },
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('optimize-copy error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Optimization failed' } satisfies APIResponse,
      { status: 500 }
    );
  }
}
