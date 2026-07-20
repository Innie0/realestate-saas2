'use client';

import { motion } from 'framer-motion';
import { useMotionReduced } from '@/lib/motion';

const MANIFESTO =
  'Agents use Oikaro to win more listings, capture every lead, and close with confidence — all from one AI-powered workspace.';

export default function LandingManifestoBand() {
  const reduced = useMotionReduced();

  return (
    <div className="border-t border-gray-200/80 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center text-xl font-medium leading-relaxed tracking-tight text-gray-800 sm:text-2xl lg:text-[1.75rem] lg:leading-[1.45]"
        >
          {MANIFESTO}
        </motion.p>
      </div>
    </div>
  );
}
