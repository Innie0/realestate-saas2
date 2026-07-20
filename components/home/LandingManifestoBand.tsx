'use client';

import { motion } from 'framer-motion';
import { useMotionReduced } from '@/lib/motion';

const MANIFESTO_LINES = [
  { text: 'Agents use Oikaro to win more listings,', tone: 'text-gray-900' },
  { text: 'capture every lead, and close with confidence —', tone: 'text-gray-500' },
  { text: 'all from one AI-powered workspace.', tone: 'text-gray-300' },
] as const;

export default function LandingManifestoBand() {
  const reduced = useMotionReduced();

  return (
    <div className="mkt-manifesto-bg border-t border-gray-200/60 py-24 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="font-display text-[1.75rem] font-normal leading-[1.28] tracking-[-0.02em] sm:text-[2.25rem] lg:text-[2.75rem] lg:leading-[1.22]">
            {MANIFESTO_LINES.map((line) => (
              <span key={line.text} className={`block ${line.tone}`}>
                {line.text}
              </span>
            ))}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
