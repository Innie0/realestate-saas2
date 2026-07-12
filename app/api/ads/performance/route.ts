// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  ctrPercent,
  costPerLeadCents,
  type PerformanceDashboardData,
} from '@/lib/ads/performance-types';
import { APIResponse } from '@/types';
import type { AdType } from '@/lib/ads/ad-draft-types';

export async function GET(request: NextRequest) {
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

    const params = request.nextUrl.searchParams;
    const adTypeFilter = params.get('adType');
    const fromParam = params.get('from');
    const toParam = params.get('to');

    const to = toParam || new Date().toISOString().slice(0, 10);
    const fromDate = fromParam ? new Date(fromParam) : new Date();
    if (!fromParam) fromDate.setUTCDate(fromDate.getUTCDate() - 30);
    const from = fromDate.toISOString().slice(0, 10);

    let promoQuery = supabase
      .from('ad_promotions')
      .select(
        `
        id, platform, ad_type, headline, status, created_at,
        projects:project_id ( title, property_info )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (adTypeFilter) {
      promoQuery = promoQuery.eq('ad_type', adTypeFilter);
    }

    const { data: promotions, error: promoError } = await promoQuery;

    if (promoError) {
      if (promoError.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: emptyDashboard(from, to),
        } satisfies APIResponse);
      }
      throw promoError;
    }

    const promoIds = (promotions ?? []).map((p) => p.id);
    let daily: Array<Record<string, unknown>> = [];

    if (promoIds.length > 0) {
      const { data: dailyRows, error: dailyError } = await supabase
        .from('ad_performance_daily')
        .select('*')
        .eq('user_id', user.id)
        .in('promotion_id', promoIds)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true });

      if (dailyError && dailyError.code !== '42P01') throw dailyError;
      daily = dailyRows ?? [];
    }

    const dailyByPromo = new Map<string, typeof daily>();
    for (const row of daily) {
      const pid = row.promotion_id as string;
      if (!dailyByPromo.has(pid)) dailyByPromo.set(pid, []);
      dailyByPromo.get(pid)!.push(row);
    }

    const ads = (promotions ?? []).map((p) => {
      const rows = dailyByPromo.get(p.id) ?? [];
      const impressions = rows.reduce((s, r) => s + (r.impressions as number), 0);
      const clicks = rows.reduce((s, r) => s + (r.clicks as number), 0);
      const spendCents = rows.reduce((s, r) => s + (r.spend_cents as number), 0);
      const leads = rows.reduce((s, r) => s + (r.leads as number), 0);
      const freqRows = rows.filter((r) => r.frequency != null);
      const avgFrequency =
        freqRows.length > 0
          ? freqRows.reduce((s, r) => s + Number(r.frequency), 0) / freqRows.length
          : null;

      const project = p.projects && !Array.isArray(p.projects) ? p.projects : null;
      const info = project?.property_info || {};

      return {
        promotionId: p.id,
        platform: p.platform,
        adType: (p.ad_type as AdType) || null,
        headline: p.headline,
        status: p.status,
        projectTitle: project?.title ?? null,
        projectAddress: info.address ?? null,
        impressions,
        clicks,
        ctr: ctrPercent(clicks, impressions),
        spendCents,
        leads,
        costPerLead: costPerLeadCents(spendCents, leads),
        avgFrequency,
        daily: rows.map((r) => ({
          id: r.id,
          promotion_id: r.promotion_id,
          user_id: r.user_id,
          platform: r.platform,
          date: r.date,
          impressions: r.impressions,
          clicks: r.clicks,
          spend_cents: r.spend_cents,
          leads: r.leads,
          frequency: r.frequency,
        })),
      };
    });

    const totals = ads.reduce(
      (acc, ad) => ({
        impressions: acc.impressions + ad.impressions,
        clicks: acc.clicks + ad.clicks,
        spendCents: acc.spendCents + ad.spendCents,
        leads: acc.leads + ad.leads,
      }),
      { impressions: 0, clicks: 0, spendCents: 0, leads: 0 }
    );

    const data: PerformanceDashboardData = {
      totals: {
        ...totals,
        ctr: ctrPercent(totals.clicks, totals.impressions),
        costPerLead: costPerLeadCents(totals.spendCents, totals.leads),
      },
      ads,
      dateRange: { from, to },
    };

    return NextResponse.json({ success: true, data } satisfies APIResponse);
  } catch (error: any) {
    console.error('GET /api/ads/performance:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load performance' } satisfies APIResponse,
      { status: 500 }
    );
  }
}

function emptyDashboard(from: string, to: string): PerformanceDashboardData {
  return {
    totals: {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      spendCents: 0,
      leads: 0,
      costPerLead: null,
    },
    ads: [],
    dateRange: { from, to },
  };
}
