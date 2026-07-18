'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { AdCopyVariant, AdDraft } from '@/lib/ads/ad-draft-types';
import clsx from 'clsx';

interface AICopyAssistStepProps {
  draft: AdDraft;
  onChange: (patch: Partial<AdDraft>) => void;
}

export default function AICopyAssistStep({ draft, onChange }: AICopyAssistStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!draft.adType) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adType: draft.adType,
          propertyDetails: draft.propertyDetails,
          templateId: draft.templateId,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Generation failed');
      const variants: AdCopyVariant[] = (json.data || []).map(
        (v: { headline: string; body: string }, i: number) => ({
          headline: v.headline,
          body: v.body,
          selected: i === 0,
        })
      );
      onChange({
        copyVariants: variants,
        customHeadline: variants[0]?.headline || draft.customHeadline,
        customBody: variants[0]?.body || draft.customBody,
      });
    } catch (e: any) {
      setError(e.message || 'Could not generate copy');
    } finally {
      setLoading(false);
    }
  };

  const selectVariant = (index: number) => {
    const variants = draft.copyVariants.map((v, i) => ({ ...v, selected: i === index }));
    const picked = variants[index];
    onChange({
      copyVariants: variants,
      customHeadline: picked?.headline || '',
      customBody: picked?.body || '',
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-gray-900">AI copy suggestions</p>
          <p className="text-caption text-gray-700 mt-0.5">
            Pick a variant, edit it, regenerate, or write your own — nothing is required.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void generate()}
          disabled={loading || !draft.adType}
          className="gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {draft.copyVariants.length ? 'Regenerate' : 'Generate options'}
        </Button>
      </div>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {draft.copyVariants.length > 0 && (
        <div className="grid gap-2">
          {draft.copyVariants.map((variant, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectVariant(index)}
              className={clsx(
                'rounded-lg border px-4 py-3 text-left transition-colors duration-150',
                variant.selected
                  ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <p className="text-[13px] font-semibold text-gray-900">{variant.headline}</p>
              <p className="text-[12.5px] text-gray-600 mt-1 line-clamp-2">{variant.body}</p>
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-gray-150 pt-5 space-y-4">
        <p className="text-label flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 text-gray-600" />
          Your copy
        </p>
        <Input
          label="Headline"
          value={draft.customHeadline}
          onChange={(e) => onChange({ customHeadline: e.target.value.slice(0, 100) })}
          placeholder="Short, attention-grabbing headline"
        />
        <div>
          <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">Message</label>
          <textarea
            value={draft.customBody}
            onChange={(e) => onChange({ customBody: e.target.value.slice(0, 250) })}
            rows={4}
            placeholder="Write your own ad message…"
            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
          />
          <p className="text-[11px] text-gray-600 mt-1">{draft.customBody.length}/250</p>
        </div>
      </div>
    </div>
  );
}
