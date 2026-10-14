/**
 * Flags ad wording that commonly gets housing ads rejected or raises fair-housing
 * concerns. A plain phrase screen, not legal advice — it warns, it doesn't block.
 */

export interface AdWordingConcern {
  /** The wording found in the ad */
  phrase: string;
  /** Why it's risky, in plain language */
  reason: string;
}

const DESCRIBES_PEOPLE = 'Describe the home, not who should live there.';
const NEIGHBORHOOD_CLAIM = 'Claims about a neighborhood being safer or better are a fair-housing risk.';
const UNPROVABLE = 'Ad platforms often reject claims that can’t be proven.';

const RULES: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(perfect|ideal|great|best) for (a |young |growing )?(famil(y|ies)|couples?|singles?|retirees?|seniors?|professionals?)\b/i, reason: DESCRIBES_PEOPLE },
  { pattern: /\b(no|without) (kids|children)\b/i, reason: DESCRIBES_PEOPLE },
  { pattern: /\b(adults?[- ]only|mature (adults?|community|couple)|empty[- ]nesters?|bachelor pad)\b/i, reason: DESCRIBES_PEOPLE },
  { pattern: /\bfamily[- ]friendly\b/i, reason: DESCRIBES_PEOPLE },
  { pattern: /\b(christian|catholic|jewish|muslim|hindu)\b/i, reason: 'Mentions of religion are a fair-housing risk.' },
  { pattern: /\b(near|close to|walking distance to|steps from) (a |the )?(church|synagogue|mosque|temple)\b/i, reason: 'Mentions of places of worship are a fair-housing risk.' },
  { pattern: /\b(able[- ]bodied|no wheelchairs?|not handicap)\b/i, reason: 'Mentions of disability are a fair-housing risk.' },
  { pattern: /\b(safe|safest|exclusive|prestigious|desirable|good|best|better|nice) (neighbou?rhood|area|community|part of town|side of town)\b/i, reason: NEIGHBORHOOD_CLAIM },
  { pattern: /\b(low[- ]crime|crime[- ]free)\b/i, reason: NEIGHBORHOOD_CLAIM },
  { pattern: /#1\b|\b(number one|guaranteed|best (agent|realtor|deal|price))\b/i, reason: UNPROVABLE },
];

/** Risky wording found in ad text, one entry per distinct phrase. */
export function findAdWordingConcerns(...texts: (string | null | undefined)[]): AdWordingConcern[] {
  const concerns: AdWordingConcern[] = [];
  const seen = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    for (const rule of RULES) {
      const match = text.match(rule.pattern);
      if (!match) continue;
      const phrase = match[0].trim();
      const key = phrase.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      concerns.push({ phrase, reason: rule.reason });
    }
  }
  return concerns;
}
