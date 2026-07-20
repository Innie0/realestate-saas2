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
      className="py-24 sm:py-28 lg:py-36"
      style={{ backgroundColor: MKT.background }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <motion.div {...mktEnterReveal(reduced)}>
          <p className="text-xl font-medium leading-[1.35] tracking-[-0.02em] sm:text-2xl lg:text-[2.25rem] lg:leading-[1.3]">
            {MANIFESTO_LINES.map((line) => (
              <span
                key={line.text}
                className="block"
                style={{ color: line.opacity < 1 ? MKT.textSecondary : MKT.textPrimary }}
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
