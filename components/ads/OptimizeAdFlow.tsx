'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { AIInsight } from '@/lib/ads/performance-types';
import { saveAdDraft, loadAdDraft } from '@/lib/ads/ad-draft-storage';
import { createEmptyDraft } from '@/lib/ads/ad-draft-types';
import clsx from 'clsx';

interface OptimizeAdFlowProps {
  open: boolean;
  onClose: () => void;
  promotionId: string | null;
  insight?: AIInsight | null;
  onApplied?: () => void;
}

interface OptimizeVariant {
  headline: string;
  body: string;
}

export default function OptimizeAdFlow({
  open,
  onClose,
  promotionId,
  insight,
  onApplied,
}: OptimizeAdFlowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [variants, setVariants] = useState<OptimizeVariant[]>([]);
  const [selected, setSelected] = useState(0);
  const [metricsNote, setMetricsNote] = useState('');

  useEffect(() => {
    if (!open || !promotionId) return;

    setLoading(true);
    setError('');
    setVariants([]);

    void fetch('/api/ai/optimize-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promotionId,
        reason: insight?.type ?? 'underperformer',
        insightMessage: insight?.message ?? '',
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || 'Failed');
        setVariants(json.data?.variants ?? []);
        const m = json.data?.metrics;
        if (m?.ctr != null) {
          setMetricsNote(
            `Current CTR: ${m.ctr.toFixed(2)}% · ${m.impressions?.toLocaleString?.() ?? m.impressions} impressions`
          );
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, promotionId, insight?.type, insight?.message]);

  const applyToNewAd = () => {
    const picked = variants[selected];
    if (!picked) return;

    const existing = loadAdDraft() ?? createEmptyDraft();
    saveAdDraft({
      ...existing,
      customHeadline: picked.headline,
      customBody: picked.body,
      copyVariants: [
        {
          headline: picked.headline,
          body: picked.body,
          selected: true,
        },
      ],
      status: 'draft',
    });
    onApplied?.();
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Optimize ad copy" size="lg">
      <div className="space-y-4">
        {insight && (
          <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-[12.5px] text-amber-900">
            {insight.message}
          </div>
        )}
        {metricsNote && <p className="text-caption text-gray-700">{metricsNote}</p>}

        {loading && (
          <div className="flex items-center gap-2 text-gray-700 py-6 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating improved copy…
          </div>
        )}

        {error && (
          <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!loading && variants.length > 0 && (
          <div className="space-y-2">
            {variants.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                className={clsx(
                  'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                  selected === i
                    ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <p className="text-[13px] font-semibold text-gray-900">{v.headline}</p>
                <p className="text-[12.5px] text-gray-600 mt-1">{v.body}</p>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-150">
          <Button onClick={applyToNewAd} disabled={!variants.length} className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Use in new ad draft
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
        <p className="text-[11px] text-gray-600">
          Saves copy to your ad wizard draft — review and publish when ready.
        </p>
      </div>
    </Modal>
  );
}
