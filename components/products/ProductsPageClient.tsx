'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import ProductMediaPanel from '@/components/home/ProductMediaPanel';
import { LANDING_FEATURES, type LandingFeature } from '@/lib/landing-features';
import { PRODUCT_CATEGORIES } from '@/lib/product-categories';
import { useMotionReduced } from '@/lib/motion';

const FEATURES_BY_ID = Object.fromEntries(LANDING_FEATURES.map((f) => [f.id, f])) as Record<
  string,
  LandingFeature
>;

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

function ProductFeatureRow({ feature, index }: { feature: LandingFeature; index: number }) {
  const reduced = useMotionReduced();
  const Icon = feature.icon;
  const flipped = Boolean(feature.flip);
  const copyMotion = flipped ? copyVariantsFlipped : copyVariants;

  return (
    <article
      id={feature.id}
      className="scroll-mt-28 grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
    >
      <motion.div
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, margin: '-80px' }}
        variants={copyMotion}
        className={flipped ? 'lg:order-2' : ''}
      >
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-label">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
          {feature.tag}
        </span>
        <h3 className="mb-5 text-2xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
          {feature.title}
        </h3>
        <p className="mb-8 max-w-lg text-base leading-relaxed text-gray-700 sm:text-lg">
          {feature.description}
        </p>
        <ul className="mb-10 space-y-3">
          {feature.highlights.map((highlight, j) => (
            <motion.li
              key={highlight}
              initial={reduced ? false : { opacity: 0, x: flipped ? 12 : -12 }}
              whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 + j * 0.08 }}
              className="flex items-start gap-3 text-[15px] text-gray-700"
            >
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" strokeWidth={1.8} />
              {highlight}
            </motion.li>
          ))}
        </ul>

        <div>
          <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            How it works
          </p>
          <ol className="space-y-4">
            {feature.howItWorks.map((step, stepIndex) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[12px] font-semibold text-white">
                  {stepIndex + 1}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-gray-900">{step.title}</p>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-gray-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </motion.div>

      <div className={flipped ? 'lg:order-1' : ''}>
        <ProductMediaPanel feature={feature} priority={index === 0} />
      </div>
    </article>
  );
}

export default function ProductsPageClient() {
  const reduced = useMotionReduced();

  return (
    <div className="marketing-root min-h-screen bg-[#F4F4F5] font-sans">
      <MarketingSubpageHeader />

      <main>
        <section className="border-b border-gray-200 bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                Products
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                Everything in Oikaro, one product at a time
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-gray-700">
                Listings, leads, CRM, transactions, research, ads, and AI — built for real estate agents who
                want one workspace instead of five disconnected tools.
              </p>
              <Link href="/auth/signup" className="mt-8 inline-block">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(252,92,3,0.2)] transition-colors hover:bg-brand-600"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </section>

        {PRODUCT_CATEGORIES.map((category, categoryIndex) => {
          const features = category.featureIds
            .map((id) => FEATURES_BY_ID[id])
            .filter(Boolean) as LandingFeature[];

          return (
            <section
              key={category.id}
              id={category.id}
              className={`scroll-mt-28 border-b border-gray-200 py-20 lg:py-28 ${
                categoryIndex % 2 === 0 ? 'bg-[#fafafa]' : 'bg-white'
              }`}
            >
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5 }}
                  className="mb-16 max-w-2xl lg:mb-20"
                >
                  <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                    {category.label}
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                    {category.label}
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed text-gray-700">{category.description}</p>
                </motion.div>

                <div className="space-y-28 lg:space-y-36">
                  {features.map((feature, i) => (
                    <ProductFeatureRow key={feature.id} feature={feature} index={categoryIndex === 0 ? i : -1} />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        <section className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Ready to replace your patchwork stack?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-700">
              Start free, connect your calendar and ad accounts when you are ready, and run your whole business
              from one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/signup">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  Get started free
                </motion.span>
              </Link>
              <Link href="/pricing">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-gray-400"
                >
                  View pricing
                </motion.span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingSubpageFooter />
    </div>
  );
}
