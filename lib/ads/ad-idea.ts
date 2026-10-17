/**
 * "Your own idea" ads: an AI review of an agent's ad idea, cleaned up so the
 * builder can trust its shape and Google's limits.
 */

export type AdIdeaVerdict = 'strong' | 'okay' | 'weak';
export type AdIdeaPlatform = 'google' | 'meta' | 'either';

export interface AdIdeaReview {
  verdict: AdIdeaVerdict;
  /** One plain sentence: is this a good ad and why */
  summary: string;
  reasons: string[];
  /** Fair-housing, MLS, or policy problems; empty when none */
  risks: string[];
  bestPlatform: AdIdeaPlatform;
  platformReason: string;
  /** A sharper version of the idea, in the agent's voice */
  improvedIdea: string;
  google: {
    /** False when people don't search for this, so a search ad wouldn't work */
    suitable: boolean;
    headline: string;
    message: string;
    keywords: string[];
  };
}

const MAX_KEYWORDS = 10;

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function list(value: unknown, maxItems: number, maxChars: number): string[] {
  return Array.isArray(value)
    ? value.map((v) => text(v, maxChars)).filter(Boolean).slice(0, maxItems)
    : [];
}

/** Search terms safe to send to Google: plain words, no duplicates. */
export function sanitizeAdKeywords(value: unknown): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of Array.isArray(value) ? value : []) {
    const keyword = String(raw ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
    // Real search phrases have letters; drop stray numbers, fragments, and run-ons
    if (!/[a-z]{2}/.test(keyword) || keyword.split(' ').length > 10 || keyword.length < 3 || seen.has(keyword)) continue;
    seen.add(keyword);
    out.push(keyword);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
}

/** Turn the AI's raw JSON into a review the app can rely on. */
export function sanitizeAdIdeaReview(raw: unknown): AdIdeaReview | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const g = (r.google && typeof r.google === 'object' ? r.google : {}) as Record<string, unknown>;

  const verdict = ['strong', 'okay', 'weak'].includes(r.verdict as string)
    ? (r.verdict as AdIdeaVerdict)
    : 'okay';
  const bestPlatform = ['google', 'meta', 'either'].includes(r.bestPlatform as string)
    ? (r.bestPlatform as AdIdeaPlatform)
    : 'either';
  const keywords = sanitizeAdKeywords(g.keywords);
  const summary = text(r.summary, 300);
  if (!summary) return null;

  return {
    verdict,
    summary,
    reasons: list(r.reasons, 3, 200),
    risks: list(r.risks, 3, 200),
    bestPlatform,
    platformReason: text(r.platformReason, 250),
    improvedIdea: text(r.improvedIdea, 400),
    google: {
      // A search ad needs search terms to show for
      suitable: g.suitable === true && keywords.length > 0,
      headline: text(g.headline, 100),
      message: text(g.message, 250),
      keywords,
    },
  };
}
