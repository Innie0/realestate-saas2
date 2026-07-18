'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import type { AIInsight, AIInsightType } from '@/lib/ads/performance-types';
import clsx from 'clsx';

const TYPE_STYLES: Record<
  AIInsightType,
  { label: string; border: string; bg: string; icon: string }
> = {
  winner: {
    label: 'Winner',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/60',
    icon: 'text-emerald-600',
  },
  underperformer: {
    label: 'Needs work',
    border: 'border-amber-200',
    bg: 'bg-amber-50/60',
    icon: 'text-amber-600',
  },
  creative_fatigue: {
    label: 'Refresh creative',
    border: 'border-orange-200',
    bg: 'bg-orange-50/50',
    icon: 'text-orange-600',
  },
  budget_reallocation: {
    label: 'Budget tip',
    border: 'border-blue-200',
    bg: 'bg-blue-50/50',
    icon: 'text-blue-600',
  },
  audience_tuning: {
    label: 'Audience tip',
    border: 'border-violet-200',
    bg: 'bg-violet-50/50',
    icon: 'text-violet-600',
  },
};

interface AIInsightsFeedProps {
  insights: AIInsight[];
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  onDismiss?: (id: string) => void;
  onOptimize?: (insight: AIInsight) => void;
  compact?: boolean;
}

export default function AIInsightsFeed({
  insights,
  loading,
  onRefresh,
  refreshing,
  onDismiss,
  onOptimize,
  compact,
}: AIInsightsFeedProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-caption text-gray-700 py-3">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading insights…
      </div>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-label flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" />
          AI insights
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </button>
        )}
      </div>

      {insights.length === 0 ? (
        <Surface flat padding="md">
          <p className="text-[13px] text-gray-600">
            Insights appear after your ads run for a few days. We analyze performance daily and
            suggest what to do next.
          </p>
        </Surface>
      ) : (
        <div className={clsx('space-y-2', compact && 'max-h-64 overflow-y-auto pr-1')}>
          {insights.map((insight) => {
            const style = TYPE_STYLES[insight.type];
            const canOptimize =
              insight.type === 'underperformer' || insight.type === 'creative_fatigue';

            return (
              <Surface
                key={insight.id}
                flat
                padding="md"
                className={clsx('border', style.border, style.bg)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={clsx(
                        'text-[10.5px] font-mono font-semibold uppercase tracking-wide mb-1',
                        style.icon
                      )}
                    >
                      {style.label}
                    </p>
                    <p className="text-[13px] text-gray-900 leading-snug">{insight.message}</p>
                    <p className="text-[12px] text-gray-600 mt-2">{insight.suggestedAction}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {canOptimize && onOptimize && insight.relatedAdIds[0] && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOptimize(insight)}
                          className="text-[12px] h-8"
                        >
                          Optimize this ad
                        </Button>
                      )}
                    </div>
                  </div>
                  {onDismiss && (
                    <button
                      type="button"
                      onClick={() => onDismiss(insight.id)}
                      className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-white/80"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </section>
  );
}
