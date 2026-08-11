/**
 * AI-assisted selection of the best comparable sales for CMA valuation.
 * Picks a small set of structurally similar closed sales — not just nearby sold listings.
 */

import type { ScoredComp, SubjectProperty } from '@/lib/cma';
import { normalizeAddress } from '@/lib/comp-filters';

const MAX_CANDIDATES = 18;
const TARGET_SELECTED = 5;
const MIN_SELECTED = 2;

export interface AiCompSelectionResult {
  selectedAddresses: Set<string>;
  rationale: string | null;
  aiUsed: boolean;
}

type CandidatePayload = {
  id: number;
  address: string;
  propertyType: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  soldDate: string | null;
  listingStatus: string | null;
  distanceMiles: number | null;
  similarityScore: number;
};

function buildCandidates(scoredComps: ScoredComp[]): CandidatePayload[] {
  return scoredComps.slice(0, MAX_CANDIDATES).map((comp, id) => ({
    id,
    address: comp.address,
    propertyType: comp.propertyType ?? null,
    price: comp.price,
    bedrooms: comp.bedrooms,
    bathrooms: comp.bathrooms,
    squareFootage: comp.squareFootage,
    soldDate: comp.soldDate,
    listingStatus: comp.listingStatus ?? null,
    distanceMiles: comp.distance,
    similarityScore: comp.similarityScore,
  }));
}

function fallbackSelection(scoredComps: ScoredComp[]): Set<string> {
  const strong = scoredComps.filter((c) => c.similarityScore >= 35);
  const pool = (strong.length >= MIN_SELECTED ? strong : scoredComps).slice(0, TARGET_SELECTED);
  return new Set(pool.map((c) => normalizeAddress(c.address)).filter(Boolean));
}

function parseAiSelection(
  raw: string,
  candidates: CandidatePayload[],
): { selectedIds: number[]; summary: string | null } | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      selectedIds?: unknown;
      summary?: unknown;
    };
    if (!Array.isArray(parsed.selectedIds)) return null;

    const validIds = new Set(candidates.map((c) => c.id));
    const selectedIds = parsed.selectedIds
      .filter((id): id is number => typeof id === 'number' && validIds.has(id))
      .slice(0, TARGET_SELECTED);

    if (selectedIds.length < MIN_SELECTED) return null;

    return {
      selectedIds,
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : null,
    };
  } catch {
    return null;
  }
}

/**
 * Use OpenAI to pick the best comps for valuation. Falls back to similarity ranking on failure.
 */
export async function selectBestCompsWithAI(
  subject: SubjectProperty,
  propertyType: string | null,
  scoredComps: ScoredComp[],
): Promise<AiCompSelectionResult> {
  if (scoredComps.length === 0) {
    return { selectedAddresses: new Set(), rationale: null, aiUsed: false };
  }

  if (scoredComps.length <= MIN_SELECTED) {
    return {
      selectedAddresses: new Set(
        scoredComps.map((c) => normalizeAddress(c.address)).filter(Boolean),
      ),
      rationale: 'Using all available comparable sales in this area.',
      aiUsed: false,
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      selectedAddresses: fallbackSelection(scoredComps),
      rationale: null,
      aiUsed: false,
    };
  }

  const candidates = buildCandidates(scoredComps);

  const subjectPayload = {
    propertyType,
    bedrooms: subject.bedrooms,
    bathrooms: subject.bathrooms,
    squareFootage: subject.squareFootage,
    lotSize: subject.lotSize,
    yearBuilt: subject.yearBuilt,
    condition: subject.condition,
    hasPool: subject.hasPool,
    garageSpaces: subject.garageSpaces,
  };

  const prompt = `You are a licensed appraiser assistant selecting comparable CLOSED sales for a CMA.

Pick ${MIN_SELECTED}–${TARGET_SELECTED} comps that best match the SUBJECT for list-price valuation.

Prioritize (in order):
1. Similar living area (sqft within ~15–20% when possible)
2. Same property type and similar bed/bath count
3. Recent verified closed sale (not pending/active)
4. Proximity — tie-breaker only; do NOT pick a nearby sale if size/type mismatch badly

Reject comps that are likely not closed sales, wrong property type, or much larger/smaller than subject unless no better options exist.

SUBJECT:
${JSON.stringify(subjectPayload, null, 2)}

CANDIDATES (id is index — only use these ids):
${JSON.stringify(candidates, null, 2)}

Reply with JSON only:
{
  "selectedIds": [0, 2],
  "summary": "One sentence explaining why these comps match the subject."
}`;

  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty AI response');

    const parsed = parseAiSelection(content, candidates);
    if (!parsed) throw new Error('Invalid AI selection JSON');

    const selectedAddresses = new Set(
      parsed.selectedIds
        .map((id) => normalizeAddress(candidates[id]?.address ?? ''))
        .filter(Boolean),
    );

    if (selectedAddresses.size < MIN_SELECTED) throw new Error('Too few AI selections');

    return {
      selectedAddresses,
      rationale: parsed.summary,
      aiUsed: true,
    };
  } catch (err) {
    console.warn('AI comp selection failed (using similarity fallback):', err);
    return {
      selectedAddresses: fallbackSelection(scoredComps),
      rationale: null,
      aiUsed: false,
    };
  }
}

export function addressesToSelectedComps(
  scoredComps: ScoredComp[],
  selectedAddresses: Set<string>,
): ScoredComp[] {
  return scoredComps.map((comp) => {
    const key = normalizeAddress(comp.address);
    return {
      ...comp,
      selectedForValuation: key ? selectedAddresses.has(key) : false,
    };
  });
}
