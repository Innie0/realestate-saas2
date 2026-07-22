'use client';

import { Card } from '@/components/ui/Card';
import AdPreviewMockup, { type AdPreviewPlatform } from '@/components/ads/AdPreviewMockup';
import GooglePreviewCard from '@/components/ads/GooglePreviewCard';
import type { AdDraft } from '@/lib/ads/ad-draft-types';
import { getEffectiveCopy, getPrimaryImage } from '@/lib/ads/ad-draft-types';
import type { AdPlatform } from '@/lib/ads/types';
import clsx from 'clsx';

interface AdPreviewPaneProps {
  draft: AdDraft;
  advertiserName: string;
  advertiserAvatar?: string | null;
  previewPlatform: AdPreviewPlatform;
  onPreviewPlatformChange: (p: AdPreviewPlatform) => void;
  className?: string;
  compact?: boolean;
}

export default function AdPreviewPane({
  draft,
  advertiserName,
  advertiserAvatar,
  previewPlatform,
  onPreviewPlatformChange,
  className,
  compact,
}: AdPreviewPaneProps) {
  const { headline, body } = getEffectiveCopy(draft);
  const imageUrl = getPrimaryImage(draft);
  const showMeta = draft.platforms.includes('meta');
  const showGoogle = draft.platforms.includes('google');

  if (compact) {
    return (
      <Card className={clsx('p-5 sm:p-6', className)}>
        <p className="text-label mb-3">Preview</p>
        {showMeta && (
          <AdPreviewMockup
            platform={previewPlatform}
            onPlatformChange={onPreviewPlatformChange}
            imageUrl={imageUrl}
            headline={headline}
            primaryText={body}
            cta={draft.cta}
            advertiserName={advertiserName}
            advertiserAvatar={advertiserAvatar}
          />
        )}
        {showGoogle && !showMeta && (
          <GooglePreviewCard headline={headline} description={body} />
        )}
      </Card>
    );
  }

  return (
    <div className={clsx('space-y-4 lg:sticky lg:top-20', className)}>
      {showMeta && (
        <AdPreviewMockup
          platform={previewPlatform}
          onPlatformChange={onPreviewPlatformChange}
          imageUrl={imageUrl}
          headline={headline}
          primaryText={body}
          cta={draft.cta}
          advertiserName={advertiserName}
          advertiserAvatar={advertiserAvatar}
          emptyHint={!draft.adType ? 'Choose an ad type to start' : undefined}
        />
      )}
      {showGoogle && (
        <GooglePreviewCard headline={headline} description={body} />
      )}
      {!showMeta && !showGoogle && (
        <Card className="p-5 sm:p-6">
          <p className="text-caption text-gray-700 text-center py-8">
            Select a platform in step 4 to preview your ad.
          </p>
        </Card>
      )}
    </div>
  );
}

export function platformLabel(p: AdPlatform): string {
  return p === 'meta' ? 'Meta' : 'Google';
}
