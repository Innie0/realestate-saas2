'use client';

import { Loader2, Megaphone } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import GooglePreviewCard from '@/components/ads/GooglePreviewCard';
import AdPreviewMockup from '@/components/ads/AdPreviewMockup';
import { getAdTypeLabel } from '@/lib/ads/ad-type-config';
import {
  getDraftDestination,
  getEffectiveCopy,
  getPrimaryImage,
  type AdDraft,
} from '@/lib/ads/ad-draft-types';
import { getAudienceLabel, getCtaLabel } from '@/lib/ads/promotion-options';
import { platformLabel } from '@/components/ads/wizard/AdPreviewPane';
import { googleAssetsFromDraft, googleDisplayUrlFromDraft } from '@/lib/ads/draft-google-preview';
import AdWordingWarning from '@/components/ads/wizard/AdWordingWarning';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
import { useApi } from '@/lib/swr';
import { normalizeUsPhone } from '@/lib/ads/google-ad-assets';

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

  const googleAssets = googleAssetsFromDraft(draft);
  const { data: agentProfile, isLoading: agentProfileLoading } = useApi<{
    profile_phone?: string | null;
    profile_enabled?: boolean | null;
    booking_enabled?: boolean | null;
  } | null>(wantsGoogle ? '/api/agent-profile' : null);
  const hasCallButton = Boolean(normalizeUsPhone(agentProfile?.profile_phone));
  const usesOwnLink = getDraftDestination(draft).type === 'custom';
  // Google shows extra links only when there are at least two, on the same site as the ad
  const extraLinkCount = usesOwnLink
    ? 0
    : [
        agentProfile?.profile_enabled && getDraftDestination(draft).type !== 'profile',
        agentProfile?.booking_enabled,
        getDraftDestination(draft).type !== 'lead_form',
      ].filter(Boolean).length;
  const hasExtraLinks = extraLinkCount >= 2;
  const canPublishMeta = wantsMeta && metaReady && Boolean(imageUrl);
  const canPublishGoogle = wantsGoogle && googleReady;
  const launchBlocked = !headline || !body || (!canPublishMeta && !canPublishGoogle);

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
          <GooglePreviewCard
            headlines={googleAssets.headlines}
            descriptions={googleAssets.descriptions}
            displayUrl={googleDisplayUrlFromDraft(draft)}
          />
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
            <dt className="text-gray-700">Shows</dt>
            <dd className="font-medium text-gray-900 text-right">
              {getAudienceLabel(draft.audience.preset)}
              {draft.audience.preset === 'near_home' ? ` · within ${draft.audience.radiusMiles} miles` : ''}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-700">Budget</dt>
            <dd className="font-medium text-gray-900 text-right tabular-nums">
              ${draft.budget.dailyAmountCents / 100}/day · {draft.budget.durationDays} days
              {draft.platforms.length > 1 && (
                <span className="block text-[11.5px] font-normal text-gray-600">
                  on each platform — ${(draft.budget.dailyAmountCents / 100) * draft.platforms.length}/day total
                </span>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-700">Clicks go to</dt>
            <dd className="font-medium text-gray-900 text-right break-all">
              {
                {
                  lead_form: 'Your contact form',
                  custom: getDraftDestination(draft).customUrl.trim(),
                  profile: 'Your agent profile page',
                  open_house: 'Open house sign-in page',
                }[getDraftDestination(draft).type]
              }
            </dd>
          </div>
          {wantsMeta && (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-700">Button</dt>
              <dd className="font-medium text-gray-900 text-right">{getCtaLabel(draft.cta)}</dd>
            </div>
          )}
        </dl>
      </Card>

      <AdWordingWarning headline={headline} body={body} />

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
      {wantsMeta && metaReady && !imageUrl && (
        <p className="text-[12.5px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Add a photo to publish to Facebook & Instagram.
        </p>
      )}
      {wantsGoogle && !googleConnected && (
        <p className="text-[12.5px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Connect Google Ads under Ad accounts to publish to Google Search.
        </p>
      )}
      {wantsGoogle && googleConnected && !googleReady && (
        <p className="text-[12.5px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Google is signed in, but no Google Ads account was found. Expand Ad accounts, then click
          Check again.
        </p>
      )}
      {canPublishGoogle && (
        <div className="rounded-lg border border-gray-150 bg-gray-50 px-3 py-2.5 text-[12.5px] text-gray-700">
          <p className="font-medium text-gray-900">What Oikaro adds to your Google ad</p>
          <ul className="mt-1.5 space-y-1">
            <li className="flex items-start gap-1.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              Blocks searches like rentals and jobs, so your budget goes to real prospects
            </li>
            <li className="flex items-start gap-1.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              Several headlines that Google mixes to find what works best
            </li>
            {!agentProfileLoading && (
              <>
                <li className="flex items-start gap-1.5">
                  {hasCallButton ? (
                    <>
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      A tap-to-call button with your phone number
                    </>
                  ) : (
                    <>
                      <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>
                        <Link href="/dashboard/leads/profile" className="font-medium text-brand-600 hover:text-brand-700">
                          Add your phone number
                        </Link>{' '}
                        to your profile to get a tap-to-call button on your ads
                      </span>
                    </>
                  )}
                </li>
                {!usesOwnLink && (
                  <li className="flex items-start gap-1.5">
                    {hasExtraLinks ? (
                      <>
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        Extra links to your profile and booking pages
                      </>
                    ) : (
                      <>
                        <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>
                          <Link href="/dashboard/leads/profile" className="font-medium text-brand-600 hover:text-brand-700">
                            Turn on your public profile and booking page
                          </Link>{' '}
                          to add extra links under your ads
                        </span>
                      </>
                    )}
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
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
