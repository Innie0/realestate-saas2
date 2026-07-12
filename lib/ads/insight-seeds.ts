import type { AdDraft } from '@/lib/ads/ad-draft-types';
import type { AIInsight } from '@/lib/ads/performance-types';
import { getAdTypeLabel } from '@/lib/ads/ad-type-config';

export interface InsightSeedResult {
  draftPatch: Partial<AdDraft>;
  note: string;
}

/** Apply active insights to a new ad draft (non-destructive — only fills empty-ish fields). */
export function applyInsightSeeds(draft: AdDraft, insights: AIInsight[]): InsightSeedResult | null {
  if (insights.length === 0) return null;

  const relevant = insights.filter(
    (i) =>
      !i.dismissed &&
      (i.type === 'winner' ||
        i.type === 'budget_reallocation' ||
        i.type === 'audience_tuning') &&
      (!i.adType || !draft.adType || i.adType === draft.adType)
  );

  const insight = relevant[0] ?? insights.find((i) => !i.dismissed);
  if (!insight) return null;

  const patch: Partial<AdDraft> = {};
  let note = insight.message;

  if (insight.type === 'winner' && insight.adType && !draft.adType) {
    patch.adType = insight.adType;
    note = `Suggested based on your recent ads: ${getAdTypeLabel(insight.adType)} ads are outperforming. ${insight.suggestedAction}`;
  }

  if (insight.type === 'budget_reallocation') {
    const meta = insight.metadata as { cheapCpl?: number; highCpl?: number } | undefined;
    if (meta?.cheapCpl && draft.budget.dailyAmountCents <= 2000) {
      patch.budget = {
        ...draft.budget,
        dailyAmountCents: Math.min(5000, Math.max(draft.budget.dailyAmountCents, 2500)),
      };
      note = `${insight.message} We bumped your suggested daily budget slightly.`;
    }
  }

  if (insight.type === 'audience_tuning') {
    patch.audience = {
      ...draft.audience,
      preset: draft.audience.preset === 'near_home' ? 'city' : draft.audience.preset,
      radiusMiles: Math.min(35, draft.audience.radiusMiles + 3),
    };
    note = `${insight.message} ${insight.suggestedAction}`;
  }

  if (Object.keys(patch).length === 0 && insight.adType && draft.adType === insight.adType) {
    note = `Suggested based on your last ${insight.relatedAdIds.length || 'few'} ${getAdTypeLabel(insight.adType).toLowerCase()} ads. ${insight.suggestedAction}`;
  }

  return { draftPatch: patch, note };
}
