'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState } from 'react';
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
    <div className="absolute inset-0 flex flex-col bg-[#fafafa]">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="ml-3 h-2 flex-1 max-w-[140px] rounded bg-gray-200" />
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-[22%] border-r border-gray-200 bg-[#f5f5f4] p-3 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-2 rounded bg-gray-200/90" style={{ width: `${55 + (i % 3) * 12}%` }} />
          ))}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-gray-500 mb-2">Screenshot</p>
          <p className="text-sm font-medium text-gray-700 max-w-[220px]">{label}</p>
          <p className="mt-2 text-[11px] text-gray-500">Replace PNG in public/landing/</p>
        </div>
      </div>
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
    <div className="overflow-hidden rounded-2xl border border-gray-300/90 bg-white shadow-[0_24px_64px_-28px_rgba(24,24,27,0.2),0_0_0_1px_rgba(24,24,27,0.04)] ring-1 ring-gray-900/[0.05]">
      <div className="relative aspect-[16/10] w-full bg-gray-100">
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
    </div>
  );

  if (reduced) {
    return <div className="relative w-full">{frame}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, delay: animationDelay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="relative w-full will-change-transform"
    >
      {frame}
    </motion.div>
  );
}
