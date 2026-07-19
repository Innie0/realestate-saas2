'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import {
  PRODUCT_CATEGORIES,
  getProductCardSummary,
  getProductHref,
  getPublishedProducts,
  PRODUCTS_BY_ID,
} from '@/lib/products';
import { useMotionReduced } from '@/lib/motion';

export default function ProductsIndexClient() {
  const reduced = useMotionReduced();
  const router = useRouter();
  const publishedIds = new Set(getPublishedProducts().map((p) => p.id));

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && PRODUCTS_BY_ID[hash]) {
      router.replace(getProductHref(hash));
    }
  }, [router]);

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
                Everything in Oikaro
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-gray-700">
                Pick a product to learn how it fits your workflow — listings, leads, CRM, deals, and more.
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
            .map((id) => PRODUCTS_BY_ID[id])
            .filter((f) => f && publishedIds.has(f.id));

          if (features.length === 0) return null;

          return (
            <section
              key={category.id}
              className={`border-b border-gray-200 py-16 lg:py-20 ${
                categoryIndex % 2 === 0 ? 'bg-[#fafafa]' : 'bg-white'
              }`}
            >
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mb-10 max-w-2xl">
                  <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                    {category.label}
                  </p>
                  <p className="text-lg text-gray-700">{category.description}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {features.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.id}
                        initial={reduced ? false : { opacity: 0, y: 16 }}
                        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                      >
                        <Link
                          href={getProductHref(feature.id)}
                          className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300 hover:shadow-sm"
                        >
                          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-[#fafafa] text-gray-700">
                            <Icon className="h-5 w-5" strokeWidth={1.75} />
                          </div>
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-600">
                            {feature.tag}
                          </p>
                          <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-900 group-hover:text-brand-600">
                            {feature.title}
                          </h2>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                            {getProductCardSummary(feature)}
                          </p>
                          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 group-hover:text-brand-600">
                            Learn more
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
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
              Start free and run your whole business from one workspace.
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
