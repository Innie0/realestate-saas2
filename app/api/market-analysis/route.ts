// @ts-nocheck
// Market Analysis API route
// Pulls Rentcast property record, AVM, rental estimate, and comp sales,
// then runs comp-based CMA valuation with adjustments.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { checkUsageLimit, incrementUsage, usageLimitError } from '@/lib/usage';
import {
  calculateCma,
  defaultSubject,
  subjectFromRentcast,
  type ConditionLevel,
  type SubjectProperty,
} from '@/lib/cma';

const RENTCAST_BASE = 'https://api.rentcast.io/v1';

function getRentcastKey() {
  return process.env.RENTCAST_API_KEY || null;
}

function buildAddress(street: string, city: string, state: string, zip: string) {
  const parts = [street];
  if (city) parts.push(city);
  parts.push(state);
  if (zip) parts.push(zip);
  return parts.join(', ');
}

async function fetchRentcastProperty(street: string, city: string, state: string, zip: string) {
  const key = getRentcastKey();
  if (!key) return null;
  const address = buildAddress(street, city, state, zip);
  try {
    const params = new URLSearchParams({ address, limit: '1' });
    const res = await fetch(`${RENTCAST_BASE}/properties?${params}`, {
      headers: { 'X-Api-Key': key, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

async function fetchAVM(address: string, key: string) {
  try {
    const params = new URLSearchParams({ address });
    const res = await fetch(`${RENTCAST_BASE}/avm/value?${params}`, {
      headers: { 'X-Api-Key': key, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchRentEstimate(address: string, key: string) {
  try {
    const params = new URLSearchParams({ address });
    const res = await fetch(`${RENTCAST_BASE}/avm/rent/long-term?${params}`, {
      headers: { 'X-Api-Key': key, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchComps(
  address: string,
  key: string,
  propertyType?: string,
  radius: number = 0.5,
  daysOld: number = 365,
) {
  try {
    const params = new URLSearchParams({
      address,
      status: 'Sold',
      limit: '25',
      radius: String(radius),
      daysOld: String(daysOld),
    });
    if (propertyType) params.set('propertyType', propertyType);
    const res = await fetch(`${RENTCAST_BASE}/listings/sale?${params}`, {
      headers: { 'X-Api-Key': key, Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.listings ?? []);
  } catch {
    return [];
  }
}

function mergeSubject(
  rentcastProperty: Record<string, unknown> | null,
  body: Record<string, unknown>
): SubjectProperty {
  const base = rentcastProperty ? subjectFromRentcast(rentcastProperty) : defaultSubject();

  const num = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
  const bool = (v: unknown) => v === true;

  return {
    bedrooms: num(body.bedrooms) ?? base.bedrooms,
    bathrooms: num(body.bathrooms) ?? base.bathrooms,
    squareFootage: num(body.squareFootage) ?? base.squareFootage,
    lotSize: num(body.lotSize) ?? base.lotSize,
    yearBuilt: num(body.yearBuilt) ?? base.yearBuilt,
    condition: (body.condition as ConditionLevel) || base.condition,
    hasPool: body.hasPool !== undefined ? bool(body.hasPool) : base.hasPool,
    garageSpaces: num(body.garageSpaces) ?? base.garageSpaces,
  };
}

async function buildAISummary(
  address: string,
  subject: SubjectProperty,
  valuation: { suggestedPrice: number | null; priceLow: number | null; priceHigh: number | null; compCount: number },
  avm: { price?: number; priceLow?: number; priceHigh?: number } | null,
  rentEstimate: { rent?: number } | null,
  scoredComps: { address: string; price: number | null; adjustedPrice: number | null; squareFootage: number | null }[]
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const fmt = (n: number | null | undefined) =>
      n ? `$${n.toLocaleString()}` : 'N/A';

    const topComps = scoredComps.slice(0, 6).map((c) =>
      `${c.address}: sold ${fmt(c.price)}, adjusted to ${fmt(c.adjustedPrice)}${c.squareFootage ? ` (${c.squareFootage.toLocaleString()} sqft)` : ''}`
    ).join('\n');

    const cmaText = valuation.suggestedPrice
      ? `Comp-based suggested list price: ${fmt(valuation.suggestedPrice)} (range ${fmt(valuation.priceLow)} – ${fmt(valuation.priceHigh)}, based on ${valuation.compCount} comparable sales with size and feature adjustments).`
      : 'Comp-based valuation unavailable — insufficient comparable sales.';

    const avmText = avm?.price
      ? `Automated AVM reference: ${fmt(avm.price)} (range ${fmt(avm.priceLow ?? avm.price * 0.92)} – ${fmt(avm.priceHigh ?? avm.price * 1.08)}). Note: AVMs may lag market or miss renovations.`
      : '';

    const subjectText = [
      subject.bedrooms != null ? `${subject.bedrooms} bed` : null,
      subject.bathrooms != null ? `${subject.bathrooms} bath` : null,
      subject.squareFootage != null ? `${subject.squareFootage.toLocaleString()} sqft` : null,
      `condition: ${subject.condition.replace('_', ' ')}`,
    ].filter(Boolean).join(', ');

    const rentText = rentEstimate?.rent
      ? `Estimated rent: $${rentEstimate.rent.toLocaleString()}/mo.`
      : '';

    const prompt = `You are a real estate market analyst writing a CMA summary for an agent to share with a seller.

Subject property: ${address}
Details: ${subjectText}

${cmaText}
${avmText}
${rentText}

Top adjusted comparable sales:
${topComps || 'None found.'}

Write 3-4 sentences of professional prose. Lead with the comp-based suggested price range. Mention how subject size/condition factored in. If AVM differs significantly from comp-based price, briefly note that comps are typically more reliable for list pricing. Be specific with numbers. No bullet points.`;

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.5,
    });
    return completion.choices[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.warn('OpenAI summary failed (non-fatal):', err);
    return null;
  }
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
    const { street, city, state, zip, propertyType, radius, yearsBack, prefillOnly } = body;

    if (!street || !state) {
      return NextResponse.json(
        { success: false, error: 'Street address and state are required.' },
        { status: 400 }
      );
    }

    const key = getRentcastKey();
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Market analysis is not configured.' },
        { status: 500 }
      );
    }

    const address = buildAddress(street, city, state, zip);
    const rentcastProperty = await fetchRentcastProperty(street, city, state, zip);
    const subject = mergeSubject(rentcastProperty, body);

    // Prefill only — return subject details without using quota
    if (prefillOnly) {
      return NextResponse.json({
        success: true,
        data: {
          address,
          subject,
          propertyType: propertyType || rentcastProperty?.propertyType || null,
          formattedAddress: rentcastProperty?.formattedAddress || address,
        },
      });
    }

    const usage = await checkUsageLimit(supabase, user.id, 'market_analyses');
    if (!usage.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: usageLimitError('market_analyses', usage.current, usage.limit, usage.plan),
        },
        { status: 403 }
      );
    }

    await incrementUsage(supabase, user.id, 'market_analyses');

    const [avm, rentEstimate] = await Promise.all([
      fetchAVM(address, key),
      fetchRentEstimate(address, key),
    ]);

    const resolvedPropertyType = propertyType || rentcastProperty?.propertyType || avm?.propertyType || undefined;
    const resolvedRadius = typeof radius === 'number' && radius > 0 && radius <= 5 ? radius : 0.5;
    const resolvedDaysOld = typeof yearsBack === 'number' ? Math.round(yearsBack * 365) : 365;
    const compsRaw = await fetchComps(address, key, resolvedPropertyType, resolvedRadius, resolvedDaysOld);

    const comps = compsRaw.map((c: Record<string, unknown>) => ({
      address: (c.formattedAddress as string) || [c.addressLine1, c.city, c.state].filter(Boolean).join(', '),
      propertyType: (c.propertyType as string) ?? null,
      price: (c.price as number) ?? null,
      bedrooms: (c.bedrooms as number) ?? null,
      bathrooms: (c.bathrooms as number) ?? null,
      squareFootage: (c.squareFootage as number) ?? null,
      pricePerSqft:
        c.price && c.squareFootage ? Math.round((c.price as number) / (c.squareFootage as number)) : null,
      daysOnMarket: (c.daysOnMarket as number) ?? null,
      soldDate: (c.listedDate as string) ?? (c.lastSaleDate as string) ?? null,
      distance: (c.distance as number) ?? null,
    }));

    const { scoredComps, valuation } = calculateCma(subject, comps);
    const summary = await buildAISummary(address, subject, valuation, avm, rentEstimate, scoredComps);

    return NextResponse.json({
      success: true,
      data: {
        address,
        propertyType: resolvedPropertyType ?? null,
        radius: resolvedRadius,
        yearsBack: resolvedDaysOld / 365,
        subject,
        valuation,
        avm: avm
          ? {
              estimatedValue: avm.price ?? null,
              valueLow: avm.priceLow ?? null,
              valueHigh: avm.priceHigh ?? null,
              confidence: avm.priceRangePercent ?? null,
            }
          : null,
        rentEstimate: rentEstimate
          ? {
              monthlyRent: rentEstimate.rent ?? null,
              rentLow: rentEstimate.rentRangeLow ?? null,
              rentHigh: rentEstimate.rentRangeHigh ?? null,
            }
          : null,
        comps: scoredComps,
        summary,
        queriedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Error in POST /api/market-analysis:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
