'use client';

import { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { MKT } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

const MANIFESTO =
  'Agents use Oikaro to win more listings, capture every lead, and close with confidence — all from one AI-powered workspace.';

function ManifestoWord({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // Each word lights up across a short window of scroll progress
  const start = index / total;
  const end = Math.min(1, (index + 2.5) / total);
  const color = useTransform(
    progress,
    [start, end],
    [MKT.textSecondary, MKT.textPrimary],
  );

  return (
    <motion.span style={{ color }} className="inline">
      {word}
      {index < total - 1 ? ' ' : ''}
    </motion.span>
  );
}

export default function LandingManifestoBand() {
  const reduced = useMotionReduced();
  const sectionRef = useRef<HTMLDivElement>(null);
  const words = useMemo(() => MANIFESTO.split(/\s+/), []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.75', 'end 0.45'],
  });

  if (reduced) {
    return (
      <div className="py-24 sm:py-28 lg:py-36" style={{ backgroundColor: MKT.background }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
          <p
            className="max-w-4xl text-xl font-medium leading-[1.35] tracking-[-0.02em] sm:text-2xl lg:text-[2.25rem] lg:leading-[1.3]"
            style={{ color: MKT.textPrimary }}
          >
            {MANIFESTO}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className="relative py-28 sm:py-36 lg:py-44"
      style={{ backgroundColor: MKT.background }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <p className="max-w-4xl text-xl font-medium leading-[1.35] tracking-[-0.02em] sm:text-2xl lg:text-[2.25rem] lg:leading-[1.3]">
          {words.map((word, index) => (
            <ManifestoWord
              key={`${word}-${index}`}
              word={word}
              index={index}
              total={words.length}
              progress={scrollYProgress}
            />
          ))}
        </p>
      </div>
    </div>
  );
}
