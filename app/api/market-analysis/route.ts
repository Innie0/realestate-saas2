// @ts-nocheck
// Market Analysis API route
// Pulls Rentcast AVM (value estimate), rental estimate, and recent comp sales,
// then uses OpenAI to write a plain-English market summary.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { checkUsageLimit, incrementUsage, usageLimitError } from '@/lib/usage';

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

async function fetchComps(address: string, key: string) {
  try {
    const params = new URLSearchParams({
      address,
      status: 'Sold',
      limit: '10',
      radius: '1',
    });
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

async function buildAISummary(
  address: string,
  avm: any,
  rentEstimate: any,
  comps: any[]
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const compsText =
      comps.length > 0
        ? comps
            .slice(0, 8)
            .map(
              (c) =>
                `${c.formattedAddress || c.addressLine1}: $${c.price?.toLocaleString() ?? 'N/A'}, ${c.bedrooms ?? '?'}bd/${c.bathrooms ?? '?'}ba, ${c.squareFootage ? c.squareFootage.toLocaleString() + ' sqft' : 'sqft N/A'}, sold ${c.listedDate || c.lastSaleDate || 'recently'}`
            )
            .join('\n')
        : 'No recent comparable sales found nearby.';

    const avmText = avm?.price
      ? `Estimated value: $${avm.price.toLocaleString()} (range $${(avm.priceLow ?? avm.price * 0.92).toLocaleString()} – $${(avm.priceHigh ?? avm.price * 1.08).toLocaleString()})`
      : 'Value estimate unavailable.';

    const rentText = rentEstimate?.rent
      ? `Estimated monthly rent: $${rentEstimate.rent.toLocaleString()} (range $${(rentEstimate.rentRangeLow ?? rentEstimate.rent * 0.9).toLocaleString()} – $${(rentEstimate.rentRangeHigh ?? rentEstimate.rent * 1.1).toLocaleString()})`
      : 'Rental estimate unavailable.';

    const prompt = `You are a real estate market analyst. Write a concise 3-4 sentence market summary for a real estate agent based on the following data for ${address}.

${avmText}
${rentText}

Recent comparable sold properties nearby:
${compsText}

Write a professional market summary that highlights current market conditions, typical price range, and anything noteworthy from the comps. Be specific and data-driven. Do not use bullet points — write flowing prose.`;

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
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
    const { street, city, state, zip, bedrooms, bathrooms, squareFootage } = body;

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

    const address = buildAddress(street, city, state, zip);

    const [avm, rentEstimate, compsRaw] = await Promise.all([
      fetchAVM(address, key),
      fetchRentEstimate(address, key),
      fetchComps(address, key),
    ]);

    // Normalise comps
    const comps = compsRaw.map((c: any) => ({
      address: c.formattedAddress || [c.addressLine1, c.city, c.state].filter(Boolean).join(', '),
      price: c.price ?? null,
      bedrooms: c.bedrooms ?? null,
      bathrooms: c.bathrooms ?? null,
      squareFootage: c.squareFootage ?? null,
      pricePerSqft:
        c.price && c.squareFootage ? Math.round(c.price / c.squareFootage) : null,
      daysOnMarket: c.daysOnMarket ?? null,
      soldDate: c.listedDate ?? c.lastSaleDate ?? null,
      distance: c.distance ?? null,
    }));

    const summary = await buildAISummary(address, avm, rentEstimate, comps);

    return NextResponse.json({
      success: true,
      data: {
        address,
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
        comps,
        summary,
        queriedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Error in POST /api/market-analysis:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
