// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';
import { getAdTypeLabel } from '@/lib/ads/ad-type-config';
import { ctrPercent } from '@/lib/ads/performance-types';
import { APIResponse } from '@/types';

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
    const reason = typeof body.reason === 'string' ? body.reason : 'underperforming';
    const insightMessage = typeof body.insightMessage === 'string' ? body.insightMessage : '';

    if (!promotionId) {
      return NextResponse.json({ success: false, error: 'promotionId is required' } satisfies APIResponse, {
        status: 400,
      });
    }

    const { data: promo, error: promoError } = await supabase
      .from('ad_promotions')
      .select(
        'id, headline, primary_text, ad_type, platform, projects:project_id ( title, property_info )'
      )
      .eq('id', promotionId)
      .eq('user_id', user.id)
      .single();

    if (promoError || !promo) {
      return NextResponse.json({ success: false, error: 'Ad not found' } satisfies APIResponse, {
        status: 404,
      });
    }

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 14);
    const { data: daily } = await supabase
      .from('ad_performance_daily')
      .select('impressions, clicks, spend_cents, leads, frequency')
      .eq('promotion_id', promotionId)
      .gte('date', since.toISOString().slice(0, 10));

    const impressions = (daily ?? []).reduce((s, r) => s + r.impressions, 0);
    const clicks = (daily ?? []).reduce((s, r) => s + r.clicks, 0);
    const ctr = ctrPercent(clicks, impressions);
    const avgFreq =
      (daily ?? []).filter((r) => r.frequency != null).reduce((s, r) => s + r.frequency, 0) /
        Math.max(1, (daily ?? []).filter((r) => r.frequency != null).length) || null;

    const project = promo.projects && !Array.isArray(promo.projects) ? promo.projects : null;
    const info = project?.property_info || {};
    const adTypeLabel = promo.ad_type ? getAdTypeLabel(promo.ad_type) : 'Real estate ad';

    const metricsContext = {
      reason,
      insightMessage,
      ctr,
      impressions,
      clicks,
      avgFrequency: avgFreq,
      currentHeadline: promo.headline,
      currentBody: promo.primary_text,
      adType: adTypeLabel,
      address: info.address || project?.title,
    };

    let variants = [
      {
        headline: (promo.headline || 'See this property').slice(0, 80),
        body: (promo.primary_text || 'Schedule a showing today.').slice(0, 200),
      },
    ];

    if (process.env.OPENAI_API_KEY) {
      const prompt = `You improve underperforming real estate Meta ads.

Context: ${JSON.stringify(metricsContext)}

Reason flagged: ${reason}
${insightMessage ? `Insight: ${insightMessage}` : ''}

Return JSON: { "variants": [{ "headline": "max 80 chars", "body": "max 200 chars" }] }
Provide 3 fresh variants that address the issue (fatigue = new angle/photo hook; low CTR = stronger hook).
Return ONLY valid JSON.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        response_format: { type: 'json_object' },
      });

      try {
        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        if (Array.isArray(parsed.variants) && parsed.variants.length > 0) {
          variants = parsed.variants.slice(0, 5);
        }
      } catch {
        /* keep fallback */
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        promotionId,
        metrics: metricsContext,
        variants: variants.map((v) => ({
          headline: String(v.headline || '').slice(0, 100),
          body: String(v.body || '').slice(0, 250),
        })),
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
