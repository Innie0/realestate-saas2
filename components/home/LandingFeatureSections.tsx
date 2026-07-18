'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { LANDING_FEATURES } from '@/lib/landing-features';
import ProductScreenshotFrame from '@/components/home/ProductScreenshotFrame';
import { useMotionReduced } from '@/lib/motion';

const copyVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const copyVariantsFlipped = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function LandingFeatureSections() {
  const reduced = useMotionReduced();

  return (
    <section className="relative z-10 py-24 lg:py-32 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20 lg:mb-28"
        >
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600 mb-4">
            Platform
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900">
            Everything you need to run your business
          </h2>
          <p className="mt-4 text-lg text-gray-700 leading-relaxed">
            One product for listings, leads, clients, deals, research, ads, and AI — built for real estate agents.
          </p>
        </motion.div>

        <div className="space-y-28 lg:space-y-36">
          {LANDING_FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            const flipped = Boolean(feature.flip);
            const copyMotion = flipped ? copyVariantsFlipped : copyVariants;

            return (
              <div
                key={feature.id}
                className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                  flipped ? '' : ''
                }`}
              >
                <motion.div
                  initial={reduced ? false : 'hidden'}
                  whileInView={reduced ? undefined : 'visible'}
                  viewport={{ once: true, margin: '-80px' }}
                  variants={copyMotion}
                  className={flipped ? 'lg:order-2' : ''}
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-300 text-label mb-6">
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                    {feature.tag}
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900 mb-5 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight, j) => (
                      <motion.li
                        key={highlight}
                        initial={reduced ? false : { opacity: 0, x: flipped ? 12 : -12 }}
                        whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.15 + j * 0.08 }}
                        className="flex items-start gap-3 text-gray-700 text-[15px]"
                      >
                        <CheckCircle className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                        {highlight}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                <div className={flipped ? 'lg:order-1' : ''}>
                  <ProductScreenshotFrame
                    src={feature.imageSrc}
                    alt={feature.imageAlt}
                    label={feature.tag}
                    animationDelay={0.08}
                    priority={i === 0}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
