'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState } from 'react';
import BrowserWindowFrame from '@/components/home/BrowserWindowFrame';
import { mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

type ProductScreenshotFrameProps = {
  src: string;
  alt: string;
  label?: string;
  priority?: boolean;
  animationDelay?: number;
};

function PlaceholderPanel({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-mkt-background p-8 text-center">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary">
        Screenshot
      </p>
      <p className="max-w-[220px] text-sm font-medium text-mkt-foreground">{label}</p>
      <p className="mt-2 text-[11px] text-mkt-muted">Replace PNG in public/landing/</p>
    </div>
  );
}

export default function ProductScreenshotFrame({
  src,
  alt,
  label,
  priority = false,
  animationDelay = 0.1,
}: ProductScreenshotFrameProps) {
  const reduced = useMotionReduced();
  const [failed, setFailed] = useState(false);
  const displayLabel = label ?? alt;

  const frame = (
    <BrowserWindowFrame>
      <div className="relative aspect-[16/10] w-full bg-[var(--surface)]">
        {!failed ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-top"
            sizes="(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 100vw"
            priority={priority}
            onError={() => setFailed(true)}
          />
        ) : (
          <PlaceholderPanel label={displayLabel} />
        )}
      </div>
    </BrowserWindowFrame>
  );

  if (reduced) {
    return <div className="relative w-full">{frame}</div>;
  }

  return (
    <motion.div {...mktEnterReveal(reduced, animationDelay)} className="relative w-full">
      {frame}
    </motion.div>
  );
}
