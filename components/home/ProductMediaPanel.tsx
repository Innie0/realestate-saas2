'use client';

import { useState } from 'react';
import ProductScreenshotFrame from '@/components/home/ProductScreenshotFrame';
import type { LandingFeature } from '@/lib/landing-features';

type ProductMediaPanelProps = {
  feature: LandingFeature;
  priority?: boolean;
};

export default function ProductMediaPanel({ feature, priority = false }: ProductMediaPanelProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = Boolean(feature.videoSrc) && !videoFailed;

  return (
    <div className="space-y-4">
      {showVideo ? (
        <div className="overflow-hidden rounded-2xl border border-gray-300/90 bg-white shadow-[0_24px_64px_-28px_rgba(24,24,27,0.2),0_0_0_1px_rgba(24,24,27,0.04)] ring-1 ring-gray-900/[0.05]">
          <div className="relative aspect-[16/10] w-full bg-gray-100">
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
          <p className="border-t border-gray-100 px-4 py-2 text-center text-[11px] text-gray-500">
            Screen recording — {feature.tag}
          </p>
        </div>
      ) : (
        <ProductScreenshotFrame
          src={feature.imageSrc}
          alt={feature.imageAlt}
          label={feature.tag}
          animationDelay={0.08}
          priority={priority}
        />
      )}
    </div>
  );
}
