'use client';

import { motion } from 'framer-motion';
import { PLATFORM_HEADLINE, PLATFORM_TOOLS } from '@/lib/landing-showcase';
import { useMotionReduced } from '@/lib/motion';

export default function LandingPlatformSection() {
  const reduced = useMotionReduced();

  return (
    <section className="relative z-10 border-t border-gray-200 bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-3xl text-center lg:mb-20"
        >
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
            {PLATFORM_HEADLINE.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {PLATFORM_HEADLINE.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-700">{PLATFORM_HEADLINE.description}</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PLATFORM_TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.35) }}
                className="group rounded-2xl border border-gray-200 bg-[#fafafa] p-5 transition-colors hover:border-gray-300 hover:bg-white"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900 transition-colors group-hover:border-gray-300">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">{tool.name}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-700">{tool.summary}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
