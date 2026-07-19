'use client';

import { motion } from 'framer-motion';
import { PERSONA_CARDS, PERSONA_ICONS } from '@/lib/landing-showcase';
import { useMotionReduced } from '@/lib/motion';

export default function LandingPersonaSection() {
  const reduced = useMotionReduced();

  return (
    <section className="relative z-10 border-t border-gray-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
            Built for every agent
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            One workspace, your way
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">
            Whether you&apos;re winning listings, nurturing buyers, or running a team — Oikaro adapts to how you work.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {PERSONA_CARDS.map((persona, i) => {
            const Icon = PERSONA_ICONS[persona.id];
            return (
              <motion.div
                key={persona.id}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="rounded-2xl border border-gray-200 bg-[#fafafa] p-6 sm:p-7"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
                  {persona.label}
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-gray-900">{persona.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-700">{persona.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
