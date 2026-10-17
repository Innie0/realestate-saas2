'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Check, Loader2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { AIInsight } from '@/lib/ads/performance-types';
import type { AdDiagnosis } from '@/lib/ads/ad-diagnosis';
import clsx from 'clsx';

interface OptimizeAdFlowProps {
  open: boolean;
  onClose: () => void;
  promotionId: string | null;
  insight?: AIInsight | null;
  /** New lines were added to the live ad */
  onImproved?: (message: string) => void;
  /** The fix is a different ad — take the agent to the builder */
  onStartNewAd?: () => void;
}

interface OptimizeResult {
  diagnosis: AdDiagnosis;
  suggestions: { headlines: string[]; descriptions: string[] } | null;
  canAddToAd: boolean;
}

const PROBLEM_TONE: Record<AdDiagnosis['problem'], string> = {
  learning: 'border-blue-100 bg-blue-50/60 text-blue-950',
  healthy: 'border-emerald-100 bg-emerald-50/60 text-emerald-950',
  ended: 'border-gray-150 bg-gray-50 text-gray-900',
  not_approved: 'border-red-100 bg-red-50/70 text-red-900',
  no_views: 'border-amber-100 bg-amber-50/70 text-amber-950',
  low_ctr: 'border-amber-100 bg-amber-50/70 text-amber-950',
  no_leads: 'border-amber-100 bg-amber-50/70 text-amber-950',
  high_cost: 'border-amber-100 bg-amber-50/70 text-amber-950',
};

function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Checks an ad's numbers, explains what's holding it back, and fixes the wording when that's the problem. */
export default function OptimizeAdFlow({
  open,
  onClose,
  promotionId,
  insight,
  onImproved,
  onStartNewAd,
}: OptimizeAdFlowProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !promotionId) return;
    setLoading(true);
    setError('');
    setResult(null);

    void fetch('/api/ai/optimize-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promotionId }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || 'Could not check this ad.');
        const data = json.data as OptimizeResult;
        setResult(data);
        setPicked(new Set([...(data.suggestions?.headlines ?? []), ...(data.suggestions?.descriptions ?? [])]));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, promotionId]);

  const toggle = (text: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(text)) next.delete(text);
      else next.add(text);
      return next;
    });

  const addToAd = async () => {
    if (!promotionId || !result?.suggestions) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/ads/promotions/${promotionId}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headlines: result.suggestions.headlines.filter((t) => picked.has(t)),
          descriptions: result.suggestions.descriptions.filter((t) => picked.has(t)),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error || 'Could not update the ad.');
      onImproved?.(json.message || 'Your ad was updated.');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the ad.');
    } finally {
      setSaving(false);
    }
  };

  const diagnosis = result?.diagnosis;
  const suggestions = result?.suggestions;
  const needsNewAd = diagnosis && ['no_views', 'no_leads', 'not_approved'].includes(diagnosis.problem);

  const Option = ({ text }: { text: string }) => (
    <button
      type="button"
      onClick={() => toggle(text)}
      className={clsx(
        'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors',
        picked.has(text)
          ? 'border-brand-500 bg-brand-50/40 text-gray-900'
          : 'border-gray-200 text-gray-600 hover:border-gray-300'
      )}
    >
      <span
        className={clsx(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
          picked.has(text) ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300'
        )}
      >
        {picked.has(text) && <Check className="h-3 w-3" />}
      </span>
      {text}
    </button>
  );

  return (
    <Modal isOpen={open} onClose={onClose} title="Check this ad" size="lg">
      <div className="space-y-4">
        {insight && !diagnosis && (
          <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-[12.5px] text-amber-900">
            {insight.message}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-gray-700 py-6 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking your ad’s numbers…
          </div>
        )}

        {error && (
          <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        {diagnosis && (
          <div className={clsx('rounded-lg border px-4 py-3', PROBLEM_TONE[diagnosis.problem])}>
            <p className="text-[14px] font-semibold">{diagnosis.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed">{diagnosis.explanation}</p>
            {diagnosis.checkBackOn && (
              <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium">
                <CalendarClock className="h-3.5 w-3.5" />
                Check back around {formatDay(diagnosis.checkBackOn)}
              </p>
            )}
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12.5px]">
              {diagnosis.advice.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {suggestions && (suggestions.headlines.length > 0 || suggestions.descriptions.length > 0) && (
          <div className="space-y-3">
            <p className="text-[12.5px] text-gray-700">
              New lines to add — Google mixes them in with your current ones and keeps what gets clicks.
            </p>
            {suggestions.headlines.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-label">Headlines</p>
                {suggestions.headlines.map((t) => (
                  <Option key={t} text={t} />
                ))}
              </div>
            )}
            {suggestions.descriptions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-label">Descriptions</p>
                {suggestions.descriptions.map((t) => (
                  <Option key={t} text={t} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-150">
          {suggestions && result?.canAddToAd && (
            <Button onClick={() => void addToAd()} disabled={saving || picked.size === 0} isLoading={saving} className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Add {picked.size} to my ad
            </Button>
          )}
          {needsNewAd && onStartNewAd && (
            <Button
              onClick={() => {
                onStartNewAd();
                onClose();
              }}
            >
              Start a new ad
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {diagnosis?.problem === 'learning' || diagnosis?.problem === 'healthy' ? 'Got it' : 'Close'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
