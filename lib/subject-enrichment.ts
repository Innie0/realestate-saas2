/**
 * Infer subject property amenities and condition from county/MLS data.
 */

import type { ConditionLevel, SubjectProperty } from '@/lib/cma';

export type EnrichmentSource = 'county' | 'mls' | 'heuristic' | 'ai' | 'default';

export interface SubjectEnrichmentMeta {
  hasPool: EnrichmentSource;
  garageSpaces: EnrichmentSource;
  condition: EnrichmentSource;
}

export interface EnrichedSubject extends SubjectProperty {
  enrichment?: SubjectEnrichmentMeta;
}

function readFeatures(property: Record<string, unknown> | null | undefined) {
  const features = property?.features;
  if (!features || typeof features !== 'object') return null;
  return features as Record<string, unknown>;
}

function readListingFeatures(listing: Record<string, unknown> | null | undefined) {
  if (!listing) return null;
  const features = listing.features;
  if (features && typeof features === 'object') return features as Record<string, unknown>;
  return listing;
}

/** Parse pool flag from Rentcast property or listing records. */
export function detectPool(
  property: Record<string, unknown> | null,
  activeListing?: Record<string, unknown> | null
): { hasPool: boolean; source: EnrichmentSource } {
  const county = readFeatures(property);
  if (county?.pool === true) {
    return { hasPool: true, source: 'county' };
  }
  if (typeof county?.poolType === 'string' && county.poolType.trim()) {
    return { hasPool: true, source: 'county' };
  }

  const mls = readListingFeatures(activeListing);
  if (mls?.pool === true) {
    return { hasPool: true, source: 'mls' };
  }
  if (typeof mls?.poolType === 'string' && mls.poolType.trim()) {
    return { hasPool: true, source: 'mls' };
  }

  const listingText = [
    activeListing?.description,
    activeListing?.remarks,
    activeListing?.publicRemarks,
  ]
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase();
  if (/\b(pool|spa|heated pool|inground pool)\b/.test(listingText) && !/no pool/.test(listingText)) {
    return { hasPool: true, source: 'mls' };
  }

  // Some feeds nest differently
  const countyStr = JSON.stringify(county ?? {}).toLowerCase();
  if (/\bpool\b/.test(countyStr) && !/no pool/.test(countyStr)) {
    return { hasPool: true, source: 'county' };
  }

  return { hasPool: false, source: 'default' };
}

function parseGarageCountFromText(text: string): number | null {
  const lower = text.toLowerCase();
  const carMatch = lower.match(/(\d+)\s*[- ]?\s*car\s+garage/);
  if (carMatch) return parseInt(carMatch[1], 10);
  const spaceMatch = lower.match(/(\d+)\s+garage\s+spaces?/);
  if (spaceMatch) return parseInt(spaceMatch[1], 10);
  if (/\btandem\s+garage\b/.test(lower)) return 2;
  if (/\battached\s+garage\b/.test(lower) || /\bdetached\s+garage\b/.test(lower)) return 1;
  return null;
}

function parseGarageTypeCount(garageType: unknown): number | null {
  if (typeof garageType !== 'string' || !garageType.trim()) return null;
  return parseGarageCountFromText(garageType) ?? (/garage/i.test(garageType) ? 1 : null);
}

/** Parse garage space count from Rentcast records. */
export function detectGarageSpaces(
  property: Record<string, unknown> | null,
  activeListing?: Record<string, unknown> | null
): { garageSpaces: number; source: EnrichmentSource } {
  const county = readFeatures(property);
  if (typeof county?.garageSpaces === 'number' && county.garageSpaces > 0) {
    return { garageSpaces: county.garageSpaces, source: 'county' };
  }
  const countyTypeCount = parseGarageTypeCount(county?.garageType);
  if (countyTypeCount !== null && countyTypeCount > 0) {
    return { garageSpaces: countyTypeCount, source: 'county' };
  }
  if (county?.garage === true) {
    return { garageSpaces: 1, source: 'county' };
  }

  const mls = readListingFeatures(activeListing);
  if (typeof mls?.garageSpaces === 'number' && mls.garageSpaces > 0) {
    return { garageSpaces: mls.garageSpaces, source: 'mls' };
  }
  const mlsTypeCount = parseGarageTypeCount(mls?.garageType);
  if (mlsTypeCount !== null && mlsTypeCount > 0) {
    return { garageSpaces: mlsTypeCount, source: 'mls' };
  }
  if (mls?.garage === true) {
    return { garageSpaces: 1, source: 'mls' };
  }

  if (typeof activeListing?.garageSpaces === 'number' && activeListing.garageSpaces > 0) {
    return { garageSpaces: activeListing.garageSpaces as number, source: 'mls' };
  }
  if (typeof activeListing?.parkingSpaces === 'number' && activeListing.parkingSpaces > 0) {
    return { garageSpaces: activeListing.parkingSpaces as number, source: 'mls' };
  }

  const listingText = [
    activeListing?.description,
    activeListing?.remarks,
    activeListing?.publicRemarks,
  ]
    .filter((v) => typeof v === 'string')
    .join(' ');
  const fromText = parseGarageCountFromText(listingText);
  if (fromText !== null && fromText > 0) {
    return { garageSpaces: fromText, source: 'mls' };
  }

  return { garageSpaces: 0, source: 'default' };
}

/** Heuristic condition from price/sqft, size, amenities, and listing text. */
export function inferConditionHeuristic(
  property: Record<string, unknown> | null,
  activeListing?: Record<string, unknown> | null,
  avmPrice?: number | null
): ConditionLevel {
  const sqft = typeof property?.squareFootage === 'number' ? property.squareFootage : null;
  const listPrice = typeof activeListing?.price === 'number' ? activeListing.price : null;
  const lastSale =
    typeof property?.lastSalePrice === 'number' ? property.lastSalePrice : null;
  const price = listPrice ?? lastSale ?? (avmPrice ?? null);
  const ppsf = price && sqft && sqft > 0 ? price / sqft : null;

  const features = readFeatures(property);
  const hasPool = features?.pool === true;
  const yearBuilt = typeof property?.yearBuilt === 'number' ? property.yearBuilt : null;
  const architecture = String(features?.architectureType ?? '').toLowerCase();

  const listingText = [
    activeListing?.description,
    activeListing?.remarks,
    activeListing?.publicRemarks,
  ]
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase();

  const luxuryKeywords =
    /\b(luxury|luxurious|estate|custom|gourmet|wine cellar|home theater|smart home|marble|designer|resort|executive|high[- ]end|premium|mansion)\b/;
  const renovatedKeywords =
    /\b(renovated|remodeled|remodel|updated|fully upgraded|newly built|like new|turnkey)\b/;
  const datedKeywords =
    /\b(fixer|handyman|as[- ]is|needs work|tear down|investor|original condition|dated)\b/;

  if (datedKeywords.test(listingText)) return 'below_average';

  if (luxuryKeywords.test(listingText)) return 'luxury';
  if (renovatedKeywords.test(listingText)) return 'renovated';

  if (ppsf !== null) {
    if (ppsf >= 450) return 'luxury';
    if (ppsf >= 350 && (hasPool || (sqft ?? 0) >= 3500)) return 'luxury';
    if (ppsf >= 280) return 'renovated';
    if (ppsf >= 220) return 'updated';
    if (ppsf < 120) return 'below_average';
  }

  if (price !== null && sqft !== null) {
    if (price >= 1_500_000 && sqft >= 3000) return 'luxury';
    if (price >= 900_000 && sqft >= 2500 && hasPool) return 'luxury';
  }

  if (yearBuilt !== null && yearBuilt >= 2020) return 'updated';
  if (yearBuilt !== null && yearBuilt >= 2015 && (ppsf ?? 0) >= 200) return 'updated';

  if (architecture.includes('mediterranean') && (sqft ?? 0) >= 3500) return 'luxury';
  if (architecture.includes('contemporary') && (ppsf ?? 0) >= 300) return 'renovated';

  return 'average';
}

/** Optional AI refinement when heuristics are uncertain. */
export async function inferConditionWithAI(
  property: Record<string, unknown> | null,
  activeListing: Record<string, unknown> | null | undefined,
  heuristic: ConditionLevel
): Promise<ConditionLevel | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const listingText = [
    activeListing?.description,
    activeListing?.remarks,
    activeListing?.publicRemarks,
  ]
    .filter((v) => typeof v === 'string' && (v as string).length > 20)
    .join('\n');

  if (!listingText && heuristic !== 'average') return null;

  try {
    const features = readFeatures(property);
    const prompt = `You classify a home's overall condition for a real estate CMA adjustment.

Choose exactly one: below_average, average, updated, renovated, luxury

Property facts:
- Beds: ${property?.bedrooms ?? 'unknown'}
- Baths: ${property?.bathrooms ?? 'unknown'}
- Sqft: ${property?.squareFootage ?? 'unknown'}
- Year built: ${property?.yearBuilt ?? 'unknown'}
- Pool: ${features?.pool === true ? 'yes' : 'unknown/no'}
- Garage spaces: ${features?.garageSpaces ?? 'unknown'}
- Architecture: ${features?.architectureType ?? 'unknown'}
- List/sale price: ${activeListing?.price ?? property?.lastSalePrice ?? 'unknown'}
- Heuristic guess: ${heuristic}

${listingText ? `Listing remarks:\n${listingText.slice(0, 1500)}` : ''}

Reply with only the single condition label.`;

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 20,
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content?.trim().toLowerCase() ?? '';
    const allowed: ConditionLevel[] = [
      'below_average',
      'average',
      'updated',
      'renovated',
      'luxury',
    ];
    const match = allowed.find((a) => raw.includes(a.replace('_', ' ')) || raw.includes(a));
    return match ?? null;
  } catch {
    return null;
  }
}

/** Build enriched subject fields from Rentcast property + optional active listing. */
export async function enrichSubjectFromRecords(
  property: Record<string, unknown> | null,
  activeListing?: Record<string, unknown> | null,
  avmPrice?: number | null,
  useAi = true
): Promise<EnrichedSubject> {
  const pool = detectPool(property, activeListing);
  const garage = detectGarageSpaces(property, activeListing);
  let condition = inferConditionHeuristic(property, activeListing, avmPrice);
  let conditionSource: EnrichmentSource = 'heuristic';

  if (useAi) {
    const aiCondition = await inferConditionWithAI(property, activeListing, condition);
    if (aiCondition) {
      condition = aiCondition;
      conditionSource = 'ai';
    }
  }

  return {
    bedrooms: typeof property?.bedrooms === 'number' ? property.bedrooms : null,
    bathrooms: typeof property?.bathrooms === 'number' ? property.bathrooms : null,
    squareFootage: typeof property?.squareFootage === 'number' ? property.squareFootage : null,
    lotSize: typeof property?.lotSize === 'number' ? property.lotSize : null,
    yearBuilt: typeof property?.yearBuilt === 'number' ? property.yearBuilt : null,
    condition,
    hasPool: pool.hasPool,
    garageSpaces: garage.garageSpaces,
    enrichment: {
      hasPool: pool.source,
      garageSpaces: garage.source,
      condition: conditionSource,
    },
  };
}
