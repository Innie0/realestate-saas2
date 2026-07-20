'use client';

import { useState } from 'react';
import BrowserWindowFrame from '@/components/home/BrowserWindowFrame';
import ProductScreenshotFrame from '@/components/home/ProductScreenshotFrame';
import { MKT } from '@/lib/marketing-design';
import type { LandingFeature } from '@/lib/landing-features';

type ProductMediaPanelProps = {
  feature: LandingFeature;
  priority?: boolean;
};

export default function ProductMediaPanel({ feature, priority = false }: ProductMediaPanelProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = Boolean(feature.videoSrc) && !videoFailed;

  if (showVideo) {
    return (
      <BrowserWindowFrame>
        <div className="relative aspect-[16/10] w-full bg-[var(--surface)]">
          <video
            src={feature.videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover object-top"
            aria-label={`${feature.tag} demo video`}
            onError={() => setVideoFailed(true)}
          />
        </div>
        <p
          className="border-t px-4 py-2 text-center text-[11px]"
          style={{ borderColor: MKT.border, color: MKT.textSecondary }}
        >
          Screen recording — {feature.tag}
        </p>
      </BrowserWindowFrame>
    );
  }

  return (
    <ProductScreenshotFrame
      src={feature.imageSrc}
      alt={feature.imageAlt}
      label={feature.tag}
      animationDelay={0.08}
      priority={priority}
    />
  );
}
