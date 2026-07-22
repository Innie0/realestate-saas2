'use client';

import { Loader2, Megaphone } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import GooglePreviewCard from '@/components/ads/GooglePreviewCard';
import AdPreviewMockup from '@/components/ads/AdPreviewMockup';
import { getAdTypeLabel } from '@/lib/ads/ad-type-config';
import { getEffectiveCopy, getPrimaryImage, type AdDraft } from '@/lib/ads/ad-draft-types';
import { getAudienceLabel, getCtaLabel } from '@/lib/ads/promotion-options';
import { platformLabel } from '@/components/ads/wizard/AdPreviewPane';

interface ReviewLaunchStepProps {
  draft: AdDraft;
  advertiserName: string;
  advertiserAvatar?: string | null;
  metaConnected: boolean;
  metaReady: boolean;
  googleConnected: boolean;
  googleReady: boolean;
  launching: boolean;
  onLaunch: () => void;
  onSaveDraft: () => void;
}

export default function ReviewLaunchStep({
  draft,
  advertiserName,
  advertiserAvatar,
  metaConnected,
  metaReady,
  googleConnected,
  googleReady,
  launching,
  onLaunch,
  onSaveDraft,
}: ReviewLaunchStepProps) {
  const { headline, body } = getEffectiveCopy(draft);
  const imageUrl = getPrimaryImage(draft);
  const wantsMeta = draft.platforms.includes('meta');
  const wantsGoogle = draft.platforms.includes('google');

  const launchBlocked =
    !headline ||
    !body ||
    !imageUrl ||
    !wantsMeta ||
    !metaReady;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        {wantsMeta && (
          <AdPreviewMockup
            platform="facebook"
            onPlatformChange={() => {}}
            imageUrl={imageUrl}
            headline={headline}
            primaryText={body}
            cta={draft.cta}
            advertiserName={advertiserName}
            advertiserAvatar={advertiserAvatar}
          />
        )}
        {wantsGoogle && (
          <GooglePreviewCard headline={headline} description={body} />
        )}
      </div>

      <Card className="p-5 sm:p-6 space-y-3">
        <p className="text-label">Summary</p>
        <dl className="grid gap-2 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-700">Ad type</dt>
            <dd className="font-medium text-gray-900 text-right">
              {draft.adType ? getAdTypeLabel(draft.adType) : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-700">Platforms</dt>
            <dd className="font-medium text-gray-900 text-right">
              {draft.platforms.map(platformLabel).join(' · ') || '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-700">Audience</dt>
            <dd className="font-medium text-gray-900 text-right">
              {getAudienceLabel(draft.audience.preset)} · {draft.audience.radiusMiles} mi ·{' '}
              {draft.audience.ageMin}–{draft.audience.ageMax}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-700">Budget</dt>
            <dd className="font-medium text-gray-900 text-right tabular-nums">
              ${draft.budget.dailyAmountCents / 100}/day · {draft.budget.durationDays} days
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-700">Button</dt>
            <dd className="font-medium text-gray-900 text-right">{getCtaLabel(draft.cta)}</dd>
          </div>
        </dl>
      </Card>

      {wantsMeta && !metaConnected && (
        <p className="text-[12.5px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Connect Meta under Ad accounts to publish to Facebook & Instagram.
        </p>
      )}
      {wantsMeta && metaConnected && !metaReady && (
        <p className="text-[12.5px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Meta is signed in, but no ad account was found. Expand Ad accounts below, create a Meta ad
          account with the same login, add billing, then click Check again.
        </p>
      )}
      {wantsGoogle && !wantsMeta && (
        <p className="text-[12.5px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Google-only publishing is coming soon. Include Meta to publish now.
        </p>
      )}
      {wantsGoogle && wantsMeta && !googleReady && (
        <p className="text-[12.5px] text-gray-600 bg-gray-50 border border-gray-150 rounded-lg px-3 py-2">
          Google will be included when publishing is available. Meta will launch now.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onLaunch}
          disabled={launching || launchBlocked}
          className="gap-2"
        >
          {launching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing…
            </>
          ) : (
            <>
              <Megaphone className="h-4 w-4" />
              Publish ad
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onSaveDraft}>
          Save draft
        </Button>
      </div>
    </div>
  );
}
