'use client';

import { useEffect } from 'react';
import clsx from 'clsx';
import { useApi } from '@/lib/swr';
import {
  AD_TEMPLATES,
  getDraftDestination,
  isThirdPartyListingSite,
  isValidDestinationUrl,
  listingRequiredForAdType,
  recommendedDestinationType,
  type AdDestination,
  type AdDestinationType,
  type AdDraft,
} from '@/lib/ads/ad-draft-types';
import type { AdPlatform } from '@/lib/ads/types';

interface PlatformTemplateStepProps {
  draft: AdDraft;
  onChange: (patch: Partial<AdDraft>) => void;
  metaConnected: boolean;
  metaReady: boolean;
  googleConnected: boolean;
  googleReady: boolean;
}

interface AgentProfilePayload {
  profile_enabled?: boolean | null;
}

interface OpenHouseOption {
  id: string;
  property_address: string;
  date: string;
  status: string;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatOpenHouseDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function PlatformTemplateStep({
  draft,
  onChange,
  metaConnected,
  metaReady,
  googleConnected,
  googleReady,
}: PlatformTemplateStepProps) {
  const { data: profile, isLoading: profileLoading } = useApi<AgentProfilePayload | null>('/api/agent-profile');
  const { data: openHouses, isLoading: openHousesLoading } = useApi<OpenHouseOption[]>(
    draft.adType === 'open_house' ? '/api/open-houses' : null,
  );

  const togglePlatform = (platform: AdPlatform) => {
    const has = draft.platforms.includes(platform);
    if (has && draft.platforms.length === 1) return;
    onChange({
      platforms: has
        ? draft.platforms.filter((p) => p !== platform)
        : [...draft.platforms, platform],
    });
  };

  const metaHint = metaReady
    ? 'Facebook & Instagram'
    : metaConnected
      ? 'Finish ad account setup'
      : 'Connect to publish';

  const googleHint = googleReady
    ? 'Google Search'
    : googleConnected
      ? 'No ads account yet'
      : 'Connect to publish';

  const destination = getDraftDestination(draft);
  const isListingAd = listingRequiredForAdType(draft.adType);
  const savedListingLink = String(draft.propertyDetails.listingUrl ?? '').trim();
  const profileEnabled = profile?.profile_enabled === true;
  const upcomingOpenHouses = (openHouses ?? []).filter(
    (oh) => oh.status !== 'ended' && oh.date >= todayIsoDate(),
  );

  const setDestination = (patch: Partial<AdDestination>, touched = true) =>
    onChange({ destination: { ...destination, ...patch, touched: touched || destination.touched } });

  const chooseDestination = (type: AdDestinationType, touched = true) => {
    setDestination(
      {
        type,
        ...(type === 'custom' && !destination.customUrl.trim() && savedListingLink
          ? { customUrl: savedListingLink }
          : {}),
        ...(type === 'open_house' && !destination.openHouseId
          ? { openHouseId: upcomingOpenHouses[0]?.id ?? null }
          : {}),
      },
      touched,
    );
  };

  // Start on the destination that fits this ad type, until the agent picks one themselves
  const dataReady = !profileLoading && (draft.adType !== 'open_house' || !openHousesLoading);
  useEffect(() => {
    if (!dataReady || destination.touched) return;
    const recommended = recommendedDestinationType(draft.adType, {
      profileEnabled,
      hasOpenHouse: upcomingOpenHouses.length > 0,
      hasListingLink: isValidDestinationUrl(savedListingLink),
    });
    if (recommended !== destination.type) chooseDestination(recommended, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady, draft.adType, profileEnabled, upcomingOpenHouses.length, savedListingLink]);

  const customUrlInvalid =
    destination.type === 'custom' &&
    destination.customUrl.trim().length > 0 &&
    !isValidDestinationUrl(destination.customUrl);

  const destinationOptions: {
    id: AdDestinationType;
    label: string;
    description: string;
    disabled?: boolean;
  }[] = [
    {
      id: 'lead_form',
      label: 'My contact form',
      description: 'Leads go straight to your Leads inbox',
    },
    {
      id: 'custom',
      label: isListingAd ? 'Listing link' : 'My own link',
      description: isListingAd
        ? 'The listing on Zillow, Redfin, or your website'
        : 'Your website or any other link',
    },
    {
      id: 'profile',
      label: 'My agent profile',
      description: profileEnabled
        ? 'Your public Oikaro page with your contact form'
        : 'Turn on your public profile in Settings to use this',
      disabled: !profileEnabled,
    },
    ...(draft.adType === 'open_house'
      ? [
          {
            id: 'open_house' as const,
            label: 'Open house sign-in page',
            description:
              upcomingOpenHouses.length > 0
                ? 'Visitors sign in and become leads'
                : 'Create an upcoming open house first to use this',
            disabled: upcomingOpenHouses.length === 0,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-2">Platforms</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => togglePlatform('meta')}
            className={clsx(
              'rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-colors',
              draft.platforms.includes('meta')
                ? 'border-brand-400 bg-brand-50 text-gray-900'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            Meta · Facebook & Instagram
            <span className="block text-[10px] font-normal text-gray-700 mt-0.5">{metaHint}</span>
          </button>
          <button
            type="button"
            onClick={() => togglePlatform('google')}
            className={clsx(
              'rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-colors',
              draft.platforms.includes('google')
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            Google Ads
            <span className="block text-[10px] font-normal text-gray-700 mt-0.5">{googleHint}</span>
          </button>
        </div>
      </div>

      <div>
        <p className="text-label mb-2">Where clicks go</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {destinationOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              onClick={() => chooseDestination(option.id)}
              className={clsx(
                'rounded-lg border px-3 py-3 text-left transition-colors duration-150',
                destination.type === option.id
                  ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                  : 'border-gray-200 bg-[var(--surface)]',
                option.disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-300'
              )}
            >
              <p className="text-[13px] font-semibold text-gray-900">{option.label}</p>
              <p className="text-caption text-gray-700 mt-0.5">{option.description}</p>
            </button>
          ))}
        </div>

        {destination.type === 'custom' && (
          <div className="mt-3">
            <input
              type="url"
              inputMode="url"
              value={destination.customUrl}
              onChange={(e) => setDestination({ type: 'custom', customUrl: e.target.value })}
              placeholder={
                isListingAd
                  ? 'https://www.zillow.com/homedetails/…'
                  : 'https://www.yourwebsite.com'
              }
              className="w-full rounded-lg border border-gray-200 bg-[var(--surface)] px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {customUrlInvalid ? (
              <p className="mt-1.5 text-[12px] text-rose-600">
                Enter a full web address starting with https://
              </p>
            ) : isThirdPartyListingSite(destination.customUrl) ? (
              <p className="mt-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                Heads up: sites like Zillow and Redfin may show buyers other agents on this page, and
                leads from there won’t appear in your Leads inbox.
              </p>
            ) : (
              <p className="mt-1.5 text-[12px] text-gray-600">
                Clicks are still counted, but leads from this link won’t appear in your Leads inbox.
                {isListingAd && draft.projectId ? ' We’ll remember this link for the listing.' : ''}
              </p>
            )}
          </div>
        )}

        {destination.type === 'open_house' && upcomingOpenHouses.length > 0 && (
          <div className="mt-3">
            <select
              value={destination.openHouseId ?? ''}
              onChange={(e) => setDestination({ openHouseId: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-[var(--surface)] px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {upcomingOpenHouses.map((oh) => (
                <option key={oh.id} value={oh.id}>
                  {oh.property_address} · {formatOpenHouseDate(oh.date)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <p className="text-label mb-2">Ad style</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {AD_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange({ templateId: template.id })}
              className={clsx(
                'rounded-lg border px-3 py-3 text-left transition-colors duration-150',
                draft.templateId === template.id
                  ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                  : 'border-gray-200 hover:border-gray-300 bg-[var(--surface)]'
              )}
            >
              <p className="text-[13px] font-semibold text-gray-900">{template.label}</p>
              <p className="text-caption text-gray-700 mt-0.5">{template.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
