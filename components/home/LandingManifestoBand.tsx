'use client';

import { motion } from 'framer-motion';
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

const MANIFESTO_LINES = [
  { text: 'Agents use Oikaro to win more listings,', opacity: 1 },
  { text: 'capture every lead, and close with confidence —', opacity: 0.55 },
  { text: 'all from one AI-powered workspace.', opacity: 0.3 },
] as const;

export default function LandingManifestoBand() {
  const reduced = useMotionReduced();

  return (
    <div
      className="border-t py-24 sm:py-28 lg:py-36"
      style={{ borderColor: MKT.border, backgroundColor: MKT.background }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <motion.div {...mktEnterReveal(reduced)}>
          <p className="font-display text-[1.75rem] font-normal leading-[1.28] tracking-[-0.02em] sm:text-[2.25rem] lg:text-[2.75rem] lg:leading-[1.22]">
            {MANIFESTO_LINES.map((line) => (
              <span
                key={line.text}
                className="block"
                style={{ color: MKT.textPrimary, opacity: line.opacity }}
              >
                {line.text}
              </span>
            ))}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
