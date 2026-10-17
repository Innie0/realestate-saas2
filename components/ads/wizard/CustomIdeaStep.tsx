'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { AdDraft } from '@/lib/ads/ad-draft-types';
import type { AdIdeaReview } from '@/lib/ads/ad-idea';
import { PLATFORM_AVAILABLE } from '@/lib/ads/ad-type-config';

interface CustomIdeaStepProps {
  draft: AdDraft;
  onChange: (patch: Partial<AdDraft>) => void;
}

const VERDICT_STYLES: Record<AdIdeaReview['verdict'], { label: string; className: string }> = {
  strong: { label: 'Strong idea', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  okay: { label: 'Okay idea', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  weak: { label: 'Weak idea', className: 'bg-amber-50 text-amber-900 border-amber-200' },
};

const PLATFORM_LABELS: Record<AdIdeaReview['bestPlatform'], string> = {
  google: 'Google',
  meta: 'Facebook & Instagram',
  either: 'Google or Facebook & Instagram',
};

/** "Your own idea": the agent describes an ad, and AI reviews it before they spend money. */
export default function CustomIdeaStep({ draft, onChange }: CustomIdeaStepProps) {
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');

  const ideaText = draft.customIdea?.text ?? '';
  const review = draft.customIdea?.review ?? null;
  const city = String(draft.propertyDetails.city ?? '');
  const state = String(draft.propertyDetails.state ?? '');

  const setIdea = (text: string) =>
    onChange({
      // Editing the idea makes the old review out of date
      customIdea: { text, review: null },
      propertyDetails: { ...draft.propertyDetails, customIdea: text },
    });

  const setDetail = (key: 'city' | 'state', value: string) =>
    onChange({ propertyDetails: { ...draft.propertyDetails, [key]: value } });

  const reviewIdea = async () => {
    setReviewing(true);
    setError('');
    try {
      const res = await fetch('/api/ai/evaluate-ad-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaText, city, state }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error || 'Could not review your idea.');
      const result = json.data as AdIdeaReview;
      onChange({
        customIdea: { text: ideaText, review: result },
        // Start the ad copy from the AI's Google version; the agent can edit it next
        customHeadline: draft.customHeadline.trim() || result.google.headline,
        customBody: draft.customBody.trim() || result.google.message,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not review your idea.');
    } finally {
      setReviewing(false);
    }
  };

  const useImprovedVersion = () => {
    if (!review?.improvedIdea) return;
    onChange({
      customIdea: { text: review.improvedIdea, review },
      propertyDetails: { ...draft.propertyDetails, customIdea: review.improvedIdea },
      customHeadline: review.google.headline || draft.customHeadline,
      customBody: review.google.message || draft.customBody,
    });
  };

  const verdict = review ? VERDICT_STYLES[review.verdict] : null;
  const googleUnsuitable = review && !review.google.suitable;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="ad-idea" className="text-[12px] font-medium text-gray-600 mb-1.5 block">
          Describe your ad idea
        </label>
        <textarea
          id="ad-idea"
          value={ideaText}
          onChange={(e) => setIdea(e.target.value.slice(0, 600))}
          rows={4}
          placeholder="e.g. An ad explaining down payment help programs for first-time buyers in Visalia"
          className="block w-full rounded-lg border border-gray-200 bg-[var(--surface)] px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
        />
        <p className="text-[11px] text-gray-600 mt-1">
          Plain words are fine — what you want to advertise and who it’s for.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="City you serve" value={city} onChange={(e) => setDetail('city', e.target.value)} placeholder="Visalia" />
        <Input label="State" value={state} onChange={(e) => setDetail('state', e.target.value)} placeholder="CA" />
      </div>

      <Button
        onClick={() => void reviewIdea()}
        disabled={reviewing || ideaText.trim().length < 10}
        className="gap-1.5"
      >
        {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {review ? 'Review again' : 'Review my idea'}
      </Button>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {review && verdict && (
        <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)] p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx('rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold', verdict.className)}>
              {verdict.label}
            </span>
            <span className="text-[12px] text-gray-600">AI review — a judgment, not a guarantee</span>
          </div>
          <p className="text-[13.5px] font-medium text-gray-900">{review.summary}</p>

          {review.reasons.length > 0 && (
            <ul className="space-y-1">
              {review.reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-1.5 text-[12.5px] text-gray-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
                  {reason}
                </li>
              ))}
            </ul>
          )}

          {review.risks.length > 0 && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5" /> Risks to fix
              </p>
              <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[12.5px] text-amber-900">
                {review.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[12.5px] text-gray-700">
            <span className="font-medium text-gray-900">Best on {PLATFORM_LABELS[review.bestPlatform]}.</span>{' '}
            {review.platformReason}
            {review.bestPlatform === 'meta' && !PLATFORM_AVAILABLE.meta && ' Facebook & Instagram ads are coming soon.'}
          </p>

          {googleUnsuitable && (
            <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
              People don’t search Google for this, so a Google ad wouldn’t work.
              {PLATFORM_AVAILABLE.meta
                ? ' Run it on Facebook & Instagram instead.'
                : ' Try a different idea for now — Facebook & Instagram ads are coming soon.'}
            </p>
          )}

          {review.improvedIdea && review.improvedIdea !== ideaText && (
            <div className="rounded-lg border border-brand-100 bg-brand-50/40 px-3 py-2.5">
              <p className="text-[12px] font-medium text-gray-900">A sharper version</p>
              <p className="mt-0.5 text-[12.5px] text-gray-800">{review.improvedIdea}</p>
              <button
                type="button"
                onClick={useImprovedVersion}
                className="mt-2 text-[12.5px] font-medium text-brand-600 hover:text-brand-700"
              >
                Use this version
              </button>
            </div>
          )}

          {review.google.suitable && (
            <p className="text-[12px] text-gray-600">
              Google search terms: {review.google.keywords.join(' · ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
