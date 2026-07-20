'use client';

import { motion } from 'framer-motion';
import { INTEGRATIONS } from '@/lib/landing-showcase';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

export default function LandingIntegrationsStrip() {
  const reduced = useMotionReduced();

  return (
    <section
      className="relative z-10 border-t py-8 sm:py-10"
      style={{ borderColor: MKT.border, backgroundColor: MKT.surface }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <motion.div
          {...mktEnterReveal(reduced)}
          className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between"
        >
          <p
            className="shrink-0 text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: MKT.textSecondary }}
          >
            Works with your stack
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-6 sm:justify-end sm:gap-8">
            {INTEGRATIONS.map((item) => (
              <li key={item.id} className="flex items-center gap-2.5">
                <IntegrationLogo id={item.id} className="h-5 w-5 opacity-80" />
                <span className="text-sm font-medium" style={{ color: MKT.textPrimary }}>
                  {item.name}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
