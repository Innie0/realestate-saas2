// @ts-nocheck
// Market Analysis API route
// Pulls Rentcast property record, AVM, rental estimate, and comp sales,
// then runs comp-based CMA valuation with adjustments.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { checkUsageLimit, incrementUsage, usageLimitError } from '@/lib/usage';
import {
  enrichSubjectFromRecords,
  type SubjectEnrichmentMeta,
} from '@/lib/subject-enrichment';
import {
  calculateCma,
  defaultSubject,
  valueFromSelectedComps,
  type ConditionLevel,
  type SubjectProperty,
} from '@/lib/cma';
import {
  addressesToSelectedComps,
  selectBestCompsWithAI,
} from '@/lib/cma-ai-comp-selection';
import { CMA_RESULT_VERSION, isStaleCmaResult } from '@/lib/cma-result-format';
import {
  compAddressFromRaw,
  filterCompsBySubjectSimilarity,
  filterSoldComps,
  mapRawComp,
  summarizeInvalidExcluded,
} from '@/lib/comp-filters';
import { fetchCompsWithFallback } from '@/lib/comp-fetch';
import { buildSubjectProfile } from '@/lib/subject-profile';
import { extractCoordinates } from '@/lib/cma-map-utils';
import { assessCmaConfidence } from '@/lib/cma-confidence';
import { enrichCmaImages } from '@/lib/enrich-cma-images';
import {
  getResearchCache,
  setResearchCache,
  normalizeAddressKey,
  marketAnalysisCacheKey,
  marketPrefillCacheKey,
} from '@/lib/property-research-cache';
import {
  isDemoMarketingAddress,
  getDemoMarketPrefillResponse,
  getDemoMarketAnalysisResponse,
} from '@/lib/demo-property-research';

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

async function fetchActiveListing(street: string, city: string, state: string, zip: string) {
  const key = getRentcastKey();
  if (!key) return null;
  const address = buildAddress(street, city, state, zip);
  try {
    const params = new URLSearchParams({ address, status: 'Active', limit: '1' });
    const res = await fetch(`${RENTCAST_BASE}/listings/sale?${params}`, {
      headers: { 'X-Api-Key': key, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

function mergeSubject(
  base: SubjectProperty,
  body: Record<string, unknown>,
  enrichment: SubjectEnrichmentMeta | null
): { subject: SubjectProperty; subjectEnrichment: SubjectEnrichmentMeta | null } {
  const num = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
  const bool = (v: unknown) => v === true;
  const manual = new Set(
    Array.isArray(body.manualFields) ? body.manualFields.map(String) : []
  );

  return {
    subject: {
      bedrooms: num(body.bedrooms) ?? base.bedrooms,
      bathrooms: num(body.bathrooms) ?? base.bathrooms,
      squareFootage: num(body.squareFootage) ?? base.squareFootage,
      lotSize: num(body.lotSize) ?? base.lotSize,
      yearBuilt: num(body.yearBuilt) ?? base.yearBuilt,
      condition: manual.has('condition') && body.condition
        ? (body.condition as ConditionLevel)
        : base.condition,
      hasPool: manual.has('hasPool') && body.hasPool !== undefined ? bool(body.hasPool) : base.hasPool,
      garageSpaces: manual.has('garageSpaces') && body.garageSpaces !== undefined
        ? (num(body.garageSpaces) ?? 0)
        : base.garageSpaces,
    },
    subjectEnrichment: enrichment,
  };
}

async function buildAutoSubject(
  rentcastProperty: Record<string, unknown> | null,
  activeListing: Record<string, unknown> | null,
  avmPrice: number | null,
  useAi: boolean
) {
  if (!rentcastProperty) {
    return { base: defaultSubject(), enrichment: null as SubjectEnrichmentMeta | null };
  }
  const enriched = await enrichSubjectFromRecords(
    rentcastProperty,
    activeListing,
    avmPrice,
    useAi
  );
  const { enrichment, ...base } = enriched;
  return { base, enrichment: enrichment ?? null };
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
    const { street, city, state, zip, propertyType, radius, yearsBack, prefillOnly, forceRefresh } = body;

    if (!street || !state) {
      return NextResponse.json(
        { success: false, error: 'Street address and state are required.' },
        { status: 400 }
      );
    }

    const addressKey = normalizeAddressKey({ street, city, state, zip });
    const refresh = forceRefresh === true;

    const demoAddress = { street, city, state, zip };

    // Prefill only — return subject details without using quota
    if (prefillOnly) {
      if (isDemoMarketingAddress(demoAddress)) {
        const prefillData = getDemoMarketPrefillResponse(demoAddress);
        const prefillCacheKey = marketPrefillCacheKey(addressKey);
        await setResearchCache(supabase, user.id, 'market_prefill', prefillCacheKey, prefillData);
        return NextResponse.json({ success: true, data: prefillData, isDemo: true });
      }

      const prefillCacheKey = marketPrefillCacheKey(addressKey);
      if (!refresh) {
        const cachedPrefill = await getResearchCache(supabase, user.id, 'market_prefill', prefillCacheKey);
        if (cachedPrefill) {
          return NextResponse.json({ success: true, data: cachedPrefill, fromCache: true });
        }
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
      const [activeListing, avm] = await Promise.all([
        fetchActiveListing(street, city, state, zip),
        fetchAVM(address, key),
      ]);
      const { base, enrichment } = await buildAutoSubject(
        rentcastProperty,
        activeListing,
        avm?.price ?? null,
        true
      );
      const { subject, subjectEnrichment } = mergeSubject(base, body, enrichment);

      const prefillData = {
        address,
        subject,
        subjectEnrichment,
        propertyType: propertyType || rentcastProperty?.propertyType || null,
        formattedAddress: rentcastProperty?.formattedAddress || address,
        subjectLocation: extractCoordinates(rentcastProperty),
      };

      await setResearchCache(supabase, user.id, 'market_prefill', prefillCacheKey, prefillData);

      return NextResponse.json({
        success: true,
        data: prefillData,
      });
    }

    const resolvedRadius = typeof radius === 'number' && radius > 0 && radius <= 5 ? radius : 0.5;
    const resolvedDaysOld = typeof yearsBack === 'number' ? Math.round(yearsBack * 365) : 365;

    if (isDemoMarketingAddress(demoAddress)) {
      const responseData = getDemoMarketAnalysisResponse(demoAddress, {
        propertyType: propertyType || undefined,
        radius: resolvedRadius,
        yearsBack: resolvedDaysOld / 365,
      });
      const cmaCacheKey = marketAnalysisCacheKey(addressKey, {
        propertyType: propertyType || undefined,
        radius: resolvedRadius,
        yearsBack: resolvedDaysOld / 365,
      });
      await setResearchCache(supabase, user.id, 'market_analysis', cmaCacheKey, responseData);
      return NextResponse.json({ success: true, data: responseData, isDemo: true });
    }

    const key = getRentcastKey();
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Market analysis is not configured.' },
        { status: 500 }
      );
    }

    const address = buildAddress(street, city, state, zip);

    const cmaCacheKey = marketAnalysisCacheKey(addressKey, {
      propertyType: propertyType || undefined,
      radius: resolvedRadius,
      yearsBack: resolvedDaysOld / 365,
    });

    if (!refresh) {
      const cachedCma = await getResearchCache(supabase, user.id, 'market_analysis', cmaCacheKey);
      if (cachedCma && !isStaleCmaResult(cachedCma)) {
        return NextResponse.json({ success: true, data: cachedCma, fromCache: true });
      }
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

    const rentcastProperty = await fetchRentcastProperty(street, city, state, zip);

    const [avm, rentEstimate] = await Promise.all([
      fetchAVM(address, key),
      fetchRentEstimate(address, key),
    ]);

    const resolvedPropertyTypeFinal =
      propertyType || rentcastProperty?.propertyType || avm?.propertyType || undefined;

    const activeListing = await fetchActiveListing(street, city, state, zip);

    const { base: autoSubject, enrichment } = await buildAutoSubject(
      rentcastProperty,
      activeListing,
      avm?.price ?? null,
      true
    );
    const { subject, subjectEnrichment } = mergeSubject(autoSubject, body, enrichment);

    const fetchResult = await fetchCompsWithFallback({
      address,
      apiKey: key,
      propertyType: resolvedPropertyTypeFinal,
      radius: resolvedRadius,
      daysOld: resolvedDaysOld,
    });

    const subjectFormattedAddress =
      (rentcastProperty?.formattedAddress as string) || address;

    const activeListingAddresses: string[] = [];
    const activeMlsNumbers: string[] = [];
    if (activeListing) {
      const activeAddr = compAddressFromRaw(activeListing);
      if (activeAddr) activeListingAddresses.push(activeAddr);
      if (activeListing.mlsNumber) {
        activeMlsNumbers.push(String(activeListing.mlsNumber));
      }
    }

    const { included: validRawComps, excluded: excludedComps } = filterSoldComps(
      fetchResult.raw,
      {
        subjectAddress: subjectFormattedAddress,
        activeListingAddresses,
        activeMlsNumbers,
      }
    );

    const { qualified: similarityQualified, excluded: similarityExcluded } =
      filterCompsBySubjectSimilarity(validRawComps, subject, {
        subjectPropertyType: resolvedPropertyTypeFinal ?? null,
      });

    const compsRawForScoring =
      similarityQualified.length >= 3 ? similarityQualified : validRawComps;
    const excludedCompSummaries = [
      ...summarizeInvalidExcluded(excludedComps),
      ...(similarityQualified.length >= 3 ? similarityExcluded : []),
    ];

    const comps = compsRawForScoring.map(mapRawComp);

    if (excludedComps.length > 0) {
      console.log(
        `CMA: filtered ${excludedComps.length} invalid comp(s):`,
        excludedComps.map((e) => ({
          address: compAddressFromRaw(e.raw),
          reason: e.reason,
        }))
      );
    }

    const subjectLocation = extractCoordinates(rentcastProperty);
    const subjectProfile = buildSubjectProfile(rentcastProperty, subjectLocation);

    const { scoredComps: preliminaryScored } = calculateCma(subject, comps);

    const { selectedAddresses, rationale: compSelectionNote, aiUsed: compSelectionAiUsed } =
      await selectBestCompsWithAI(subject, resolvedPropertyTypeFinal ?? null, preliminaryScored);

    const markedComps = addressesToSelectedComps(preliminaryScored, selectedAddresses);
    const { scoredComps: valuedComps, valuation } = valueFromSelectedComps(subject, markedComps);

    const subjectMlsNumber = activeListing?.mlsNumber
      ? String(activeListing.mlsNumber)
      : null;
    const { comps: scoredComps, subjectProfile: enrichedSubjectProfile } = await enrichCmaImages({
      comps: valuedComps,
      subjectProfile,
      subjectMlsNumber,
    });

    const valuationComps = scoredComps.filter((c) => c.selectedForValuation);
    const cmaConfidence = assessCmaConfidence({
      valuationComps,
      suggestedPrice: valuation.suggestedPrice,
      avmPrice: avm?.price ?? null,
      afterSimilarity: compsRawForScoring.length,
      validSold: validRawComps.length,
      conditionFactor: valuation.conditionFactor,
    });

    const summary = await buildAISummary(
      address,
      subject,
      valuation,
      avm,
      rentEstimate,
      valuationComps.length > 0 ? valuationComps : scoredComps,
    );

    const responseData = {
      resultVersion: CMA_RESULT_VERSION,
      address,
      propertyType: resolvedPropertyTypeFinal ?? null,
      radius: resolvedRadius,
      yearsBack: resolvedDaysOld / 365,
      subject,
      subjectLocation,
      subjectProfile: enrichedSubjectProfile,
      subjectEnrichment,
      valuation,
      activeListing: activeListing
        ? {
            address: compAddressFromRaw(activeListing),
            price: activeListing.price ?? null,
            listedDate: activeListing.listedDate ?? null,
            mlsNumber: activeListing.mlsNumber ?? null,
          }
        : null,
      compsFiltered: excludedCompSummaries.length,
      excludedComps: excludedCompSummaries,
      compStats: {
        fetched: fetchResult.raw.length,
        validSold: validRawComps.length,
        afterSimilarity: compsRawForScoring.length,
        widenedSearch: fetchResult.widenedSearch,
        radiusUsed: fetchResult.radiusUsed,
        daysOldUsed: fetchResult.daysOldUsed,
      },
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
      compSelectionNote,
      compSelectionAiUsed,
      cmaConfidence,
      summary,
      queriedAt: new Date().toISOString(),
    };

    await setResearchCache(supabase, user.id, 'market_analysis', cmaCacheKey, responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error('Error in POST /api/market-analysis:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
